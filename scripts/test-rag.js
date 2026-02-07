// 测试脚本：验证想法是否可行


require('dotenv').config();
const { OpenAI } = require('openai')
const { ChromaClient } = require('chromadb')

// 初始化 AI 客户端
const client = new OpenAI({
  baseURL: 'https://api.siliconflow.cn/v1',
  apiKey: process.env.SILICONFLOW_API_KEY
})

// 初始化向量库客户端
const chromadb = new ChromaClient({
  path: 'http://localhost:8000',
})

async function main() {
  console.log("开始RAG核心链路测试")

  // 建库（有就获取，没有就建库）
  const collection = await chromadb.getOrCreateCollection({
    name: "test_campus_knowledge",
  })
  console.log('向量数据库准备就绪')

  // 模拟知识库中的一条数据
  const docText = `大学的图书馆开放时间是每天早上 8:00 到晚上 22:00。`
  const docId = 'doc_001'

  const embeddingResponse = await client.embeddings.create({
    model: 'BAAI/bge-m3',
    input: docText
  })

  const vector = embeddingResponse.data[0].embedding
  console.log('向量化完成，维度长度是：', vector.length)

  // 存入向量库
  await collection.add({
    ids: [docId],
    embeddings: [vector],
    metadatas: [{ source: "学生手册.pdf" }],
    documents: [docText]
  })

  console.log('数据存入 chromadb')

  // 模拟搜索
  const queryText = '大学图书馆几点开门，开门时间'
  console.log('正在搜索问题：', queryText)

  // 把问题变成向量 (统一使用 SiliconFlow 的客户端和模型)
  const queryEmbedding = await client.embeddings.create({
    model: 'BAAI/bge-m3',
    input: queryText
  })

  // 去数据库搜索
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding.data[0].embedding],
    nResults: 1, // 最相似的一条
    include: ['documents', 'distances']
  })

  console.log("当前的匹配距离是：", results.distances[0][0])
  console.log('最匹配的结果是：', results.documents[0][0])
}


main().catch(err => {
  console.error(err)
  process.exit(1)
})