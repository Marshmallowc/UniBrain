import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { VectorModule } from 'src/vector/vector.module';
import { PrismaModule } from 'src/prisma/prisma.module'

@Module({
  imports: [VectorModule, PrismaModule],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService]
})
export class AiModule { }
