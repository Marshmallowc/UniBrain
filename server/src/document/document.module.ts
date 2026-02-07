import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { AiModule } from 'src/ai/ai.module';
import { VectorModule } from 'src/vector/vector.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { extname, join } from 'path'
import { diskStorage } from 'multer';

@Module({
  imports: [
    AiModule,
    VectorModule,
    PrismaModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          // 生成一个唯一的文件名：时间戳 + 随机数 + 后缀
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
          const etx = extname(file.originalname)
          const filename = `${uniqueSuffix}${etx}`
          callback(null, filename)
        }

      })
    })
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule { }
