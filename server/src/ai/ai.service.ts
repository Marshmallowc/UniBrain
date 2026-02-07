import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';


@Injectable()
export class AiService implements OnModuleInit {
  private openai: OpenAI
  constructor(private configService: ConfigService) { }

  // 程序开始运行的时候，这里的代码就可以运行
  onModuleInit() {
    console.log('我是AI service的代码，我启动了')

    const apiKey = this.configService.get<string>('SILICONFLOW_API_KEY')
    this.openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.siliconflow.cn/v1'
    })
  }

  // 封装向量化方法
  async getEmbedding(text: string) {
    const response = await this.openai.embeddings.create({
      model: 'BAAI/bge-m3',
      input: text
    })

    return response.data[0].embedding
  }

  // 3-1. 标准生成回答方法（非流式，给老接口用）
  async generateAnswer(question: string, context: string) {
    const response = await this.openai.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3',
      messages: [
        {
          role: 'system',
          content: `你是个专业、亲和的XX理工大学助手。请根据参考资料回答：${context}`
        },
        { role: 'user', content: question }
      ],
      temperature: 0.3
    })
    return response.choices[0].message.content
  }

  // 3-2. 流式生成回答方法（给全新型 SSE 接口用）
  async generateAnswerStream(question: string, context: string) {
    return await this.openai.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3',
      stream: true, // 👈 开启流式
      messages: [
        {
          role: 'system',
          content: `
            你是个专业、亲和的XX理工大学助手。
            你的任务是：根据提供的【参考资料】回答用户的问题。
            
            规则：
            1. 只能根据资料内容回答，不要瞎编。
            2. 如果资料里没写，就直说“抱歉，官方文档暂未收录此信息”。
            3. 你的回答要条理清晰，可以使用 Markdown 格式。
          【参考资料开始】
            ${context}
          【参考资料结束】
          `
        },
        { role: 'user', content: question }
      ],
      temperature: 0.3
    })
  }


}
