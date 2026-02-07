import { BadRequestException, Injectable } from '@nestjs/common';
import { AiService } from 'src/ai/ai.service';
import { VectorService } from 'src/vector/vector.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { createWorker } from 'tesseract.js';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

@Injectable()
export class DocumentService {
  constructor(
    private readonly ai: AiService,
    private readonly vector: VectorService,
    private readonly prisma: PrismaService,
  ) { }

  // 处理 pdf 上传
  async handlePdfUpload(file: Express.Multer.File) {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

    // 0. 防重检测
    const existDoc = await this.prisma.document.findFirst({
      where: {
        fileName: file.originalname,
      }
    })

    if (existDoc) {
      throw new BadRequestException(`文件[${file.originalname}]已存在`)
    }

    // 1. 在 Mysql 中创建文档记录
    const document = await this.prisma.document.create({
      data: {
        fileName: file.originalname,
        fileUrl: file.path,
        status: 'processing' // 显式标记为处理中
      }
    })

    // 2. 异步启动解析流程 (关键：不要写 await)
    // 这样 HTTP 请求会立刻结束，解析任务在后台慢慢跑
    this.startOcrProcess(document.id, file);

    // 3. 立刻返回，前端连接 0.1s 就释放了
    return {
      message: '文件已上传，正在后台解析中...',
      document
    }
  }

  // Ocr解析逻辑（异步执行）
  async startOcrProcess(docId: string, file: Express.Multer.File) {
    console.log(`--- 启动后台 OCR 解析任务: [ID: ${docId}] ---`)

    const outputDir = path.dirname(file.path);
    const outputPrefix = path.basename(file.path, path.extname(file.path));

    try {
      // 第一步：PDF 转图片 (使用异步 exec)
      const cmd = `pdftocairo -png -r 400 "${file.path}" "${path.join(outputDir, outputPrefix)}"`;
      await execPromise(cmd);

      // 第二步：OCR 识别
      // 这里的配置修复了之前控制台报的语言包路径错误问题
      const worker = await createWorker('chi_sim+eng', 1, {
        langPath: '.', // 指定在当前工作目录下查找 .traineddata 文件
        gzip: false
      });

      const files = fs.readdirSync(outputDir)
        .filter(f => f.startsWith(outputPrefix) && f.endsWith('.png'))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      for (let i = 0; i < files.length; i++) {
        const imgPath = path.join(outputDir, files[i]);
        const pageNum = i + 1;
        const { data: { text } } = await worker.recognize(imgPath);

        const cleanText = text.trim();
        if (cleanText.length > 10) {
          const vector = await this.ai.getEmbedding(cleanText);
          const vectorId = `vec_${docId}_${i}`;

          // 同时存入向量库和 SQL
          await this.vector.addVector(vectorId, vector, { fileName: file.originalname }, cleanText);
          await this.prisma.chunk.create({
            data: {
              content: cleanText,
              pageNumber: pageNum,
              vectorId: vectorId,
              documentId: docId,
            }
          });
        }
        fs.unlinkSync(imgPath); // 识别完顺手删了临时图
      }

      await worker.terminate();

      // 第三步：【关键】解析成功，更新数据库状态
      await this.prisma.document.update({
        where: { id: docId },
        data: { status: 'success' }
      });
      console.log(`--- 文档 [ID: ${docId}] 解析成功 ---`);

    } catch (error) {
      console.error(`--- 文档 [ID: ${docId}] 解析失败 ---`, error);
      // 解析失败也要更新状态，好让前端知道
      await this.prisma.document.update({
        where: { id: docId },
        data: { status: 'failed' }
      });
    }
  }

  // 获取文档列表
  async getDocuments() {
    // 去 Mysql 查，按时间倒序，最新的在上面
    return await this.prisma.document.findMany({
      orderBy: {
        createAt: 'desc'
      },
      include: {
        _count: {
          select: {
            chunks: true
          }
        }
      }
    })
  }

  // 删除文档（级联删除）
  async deleteDocument(id: string) {
    // 1. 先查询这个文档的信息
    const doc = await this.prisma.document.findUnique({
      where: { id }
    })

    if (!doc) throw new Error('文档不存在')

    // 删硬盘中的文件
    try {
      const fileUrl = doc.fileUrl
      if (fileUrl && fs.existsSync(fileUrl)) {
        fs.unlinkSync(fileUrl)
      }
    } catch (e) {
      console.warn('物理文件不存在或删除失败，继续删除数据库记录', e)
    }

    // 删除向量库
    try {
      await this.vector.deleteVectors(doc.fileName)
    } catch (e) {
      console.error('删除向量库失败', e)
    }

    // 删除 Mysql 中的记录
    await this.prisma.chunk.deleteMany({
      where: {
        documentId: id
      }
    })

    // 删除 Document 本身
    await this.prisma.document.delete({
      where: { id }
    })


  }
}
