import { Controller, UploadedFile, UseInterceptors, Post, Get, Param, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';

@Controller('document')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService
  ) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return await this.documentService.handlePdfUpload(file)
  }

  @Get('list')
  async getList() { // 获取文档列表
    const list = await this.documentService.getDocuments()
    return { list }
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    await this.documentService.deleteDocument(id)
    return { message: '删除成功' }
  }
}
