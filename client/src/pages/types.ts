export interface DocumentItem {
  id: string,
  fileName: string,
  fileUrl: string,
  createAt: string,
  status: 'processing' | 'success' | 'failed',
  _count: {
    chunks: number // 后端返回的切片数量
  }
}

export interface SourceData {
  fileName: string,
  page: number,
  content: string,
  fileUrl?: string
}

export interface Message {
  id: string,
  role: 'user' | 'assistant',
  content: string,
  source?: SourceData[],
  loading?: boolean,
}