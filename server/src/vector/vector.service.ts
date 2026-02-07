import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';

@Injectable()
export class VectorService implements OnModuleInit {
  private client: ChromaClient
  private collection: Collection

  async onModuleInit() {
    this.client = new ChromaClient({
      path: 'http://localhost:8000'
    })

    this.collection = await this.client.getOrCreateCollection({
      name: 'campus_knowledge'
    })
  }

  // 存入数据库的方法
  async addVector(id: string, vector: number[], metadata: any, content: string) {
    await this.collection.add({
      ids: [id],
      embeddings: [vector],
      metadatas: [metadata],
      documents: [content]
    })
  }

  // 搜索向量的方法
  async queryVecotr(vector: number[], limit: number = 3) {
    return await this.collection.query({
      queryEmbeddings: [vector],
      nResults: limit,
      include: ['documents', 'distances', 'metadatas']
    })
  }

  // 删除向量
  async deleteVectors(filename: string) {
    await this.collection.delete({
      where: {
        fileName: filename
      }
    })

    console.log(`成功删除${filename}部分的所有数据`)
  }

}
