import { Controller, Get, Query, Sse } from '@nestjs/common';
import { AiService } from './ai.service';
import { VectorService } from 'src/vector/vector.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Observable } from 'rxjs';

@Controller('ai')
export class AiController {
  // 1. 注入 AiService: 告诉 NestJS 我要用这个
  constructor(
    private readonly aiService: AiService,
    private readonly vectorService: VectorService,
    private readonly prisma: PrismaService,
  ) { }



  // 2. 定义一个测试接口：Get /ai/test-embedding?text=???
  @Get('test-embedding')
  async test(@Query('text') text: string) {

    if (!text) return { error: '请在URL后面加上 ?text=你的问题' }

    // 调用Service中的方法
    const vector = await this.aiService.getEmbedding(text)

    // 返回给浏览器看
    return {
      input: text,
      vectorLength: vector.length,
      preview: vector.slice(0, 5)

    }

  }

  // 3. 添加向量的接口
  @Get('add-knowledge')
  async addKnowledge(@Query('text') text: string) {

    if (!text) return '请补充?text=知识库内容'

    // 1. 把知识库内容转换成向量
    const vector = await this.aiService.getEmbedding(text)

    // 2. 添加至向量库
    const id = `id_${Date.now()}`
    this.vectorService.addVector(id, vector, { source: 'manual_upload' }, text)

    return {
      message: '添加成功',
      id
    }

  }

  // 4. 问答接口
  @Get('ask')
  async ask(@Query('question') question: string) {

    // 1. 问题向量化
    const vector = await this.aiService.getEmbedding(question)

    // 2. 搜索向量库
    const searchResult = await this.vectorService.queryVecotr(vector, 1)
    const vectorId = searchResult.ids[0][0]
    const context = searchResult.documents[0][0] || '暂无相关资料'
    console.log('搜索到的相关资料如下：', context)

    // 3. 找到这些 document 的来源
    const chunkInfo = await this.prisma.chunk.findFirst({
      where: {
        vectorId,
      },
      include: {
        document: true
      }
    })

    // 4. 让 AI 结合资料给出最终答案
    const answer = await this.aiService.generateAnswer(question, context)

    return {
      question,
      answer,
      source: {
        fileName: chunkInfo?.document.fileName || '未知文件',
        page: chunkInfo?.pageNumber || 0,
        content: chunkInfo?.content || '内容缺失', // 以后交给前端高亮处理
      }
    }

  }

  // 5. 上传文件之类（如：学生手册.pdf）的接口
  @Get('upload-chunk-pro')
  async uploadChunkPro(
    @Query('text') text: string,
    @Query('fileName') fileName: string,
    @Query('page') page: string,
  ) {

    // 1. 在 msyql 找到这个记录
    const doc = await this.prisma.document.upsert({
      where: {
        id: fileName
      },
      update: {

      },
      create: {
        fileName: fileName,
        id: fileName,
      }
    })

    // 2. 调用 AiService 转向量
    const vector = await this.aiService.getEmbedding(text)

    // 3. 存入向量库
    const vectorId = `vec_${Date.now()}`
    await this.vectorService.addVector(vectorId, vector, { source: fileName }, text)

    // 4. 存入 Mysql 
    const chunk = await this.prisma.chunk.create({
      data: {
        content: text,
        pageNumber: parseInt(page),
        vectorId,
        documentId: doc.id,
      }
    })

    return {
      message: '工业级入库成功',
      mysqlId: chunk.id,
      vectorId: vectorId,
      loaction: `文件：${fileName}，第${page}页`
    }
  }

  // 6. 全新的流式问答接口（SSE）
  @Sse('ask-stream')
  async askStream(@Query('question') question: string) {
    // 1. 向量化问题并搜索相关资料
    const threshold = 0.82
    const vector = await this.aiService.getEmbedding(question)
    const searchResult = await this.vectorService.queryVecotr(vector, 10)

    const distances = searchResult.distances[0] || []
    const documents = searchResult.documents[0] || []
    const ids = searchResult.ids[0] || []

    const matches = distances
      .map((dist, index) => ({
        id: ids[index],
        content: documents[index],
        distance: dist
      }))
      .filter(item =>
        item.distance != null &&
        item.distance < threshold &&
        item.content !== null
      )

    // 找到真正相关联的文档索引
    const relevantDocs = matches.map(m => m.content)
    const relevantIds = matches.map(m => m.id)
    const context = matches.map(m => m.content).join('\n---\n') || '暂无相关资料'

    // 2. 详细的检索透视 (调试级打印)
    console.log(`--- 检索透视 [Q: ${question}] ---`);
    console.log(`阈值: ${threshold} | 总共召回: ${distances.length} 条 | 命中: ${relevantDocs.length} 条`);

    distances.forEach((dist, i) => {
      const isHit = dist !== null && dist < threshold;
      const status = isHit ? '✅ [命中]' : '❌ [剔除]';
      const preview = documents[i]?.substring(0, 40).replace(/\n/g, ' ') || '空内容';

      console.log(`${status} Dist: ${dist?.toFixed(4)} | Content: ${preview}...`);
    });

    if (relevantDocs.length === 0 && distances.length > 0) {
      console.log(`💡 提示：最近的一条距离为 ${distances[0]?.toFixed(4)}，如需召回可调大阈值。`);
    }

    // 3. 去数据库查这个片段来自哪本书、哪一页
    const chunksInfo = await this.prisma.chunk.findMany({
      where: { vectorId: { in: relevantIds } },
      include: { document: true }
    })

    const sources = chunksInfo.map(chunk => ({
      fileName: chunk.document.fileName,
      page: chunk.pageNumber,
      content: chunk.content,
      fileUrl: chunk.document.fileUrl || ''
    }))

    // 4. 调用 AI 的流式方法
    const stream = await this.aiService.generateAnswerStream(question, context)

    // 5. 返回 RxJS Observable 建立“持续供水”连接
    return new Observable((observer) => {
      (async () => {
        try {
          // 循环读取 AI 吐出来的每一个词
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              observer.next({ data: { text: content } })
            }
          }

          // 【关键步】AI 说完了，最后塞一个“来源大礼包”给前端
          observer.next({
            data: {
              isDone: true,
              source: sources
            }
          })

          observer.complete() // 关掉连接
        } catch (err) {
          console.error('SSE 流出错:', err)
          observer.error(err)
        }
      })()
    })
  }

}
