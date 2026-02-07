import React, { useEffect, useRef, useState } from "react";
import { Toast, Popup, List } from "antd-mobile";
import type { Message, SourceData } from "./types";
import remarkGfm from 'remark-gfm'
import ReactMarkdown from "react-markdown";
import { SendOutline, UnorderedListOutline, EditSOutline, ContentOutline, LikeOutline, FrownOutline, FileOutline } from "antd-mobile-icons";
import './ChatPage.css'
import { useNavigate } from "react-router-dom";

const ChatPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [isSourcePopupVisible, setIsSourcePopupVisible] = useState(false)
  const [activeSources, setActiveSources] = useState<SourceData[]>([])

  // 定义一个新的打开逻辑
  const openSourceList = (sources: SourceData[]) => {
    setActiveSources(sources)
    setIsSourcePopupVisible(true)
  }


  // 自动滚动到底部
  const scrollButtom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollButtom()
  }, [messages])

  // 发送消息逻辑
  const handleSend = async () => {
    if (!inputValue.trim() || loading) return

    const userText = inputValue.trim()
    setInputValue('')

    // 添加用户消息上屏
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // 2. 生成唯一的 AI 消息 ID 备用
    const aiId = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    try {
      // 3. fetch 调用流式接口
      const response = await fetch(`/api/ai/ask-stream?question=${encodeURIComponent(userText)}`)

      if (!response.body) throw new Error('无法连接到 AI 管道')

      // 4. 连接成功，此时添加 AI 空占位消息
      const initialAiMsg: Message = {
        id: aiId,
        role: 'assistant',
        content: '',
        loading: true,
      }
      setMessages(prev => [...prev, initialAiMsg])

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let accumulatedContent = ''

      // 4. 打字机循环读流
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data:')) continue

            try {
              const data = JSON.parse(line.slice(5))

              if (data.isDone) {
                // 说完了接收 source 并结束 loading
                setMessages(prev => prev.map(m =>
                  m.id === aiId ? { ...m, source: data.source, loading: false } : m
                ))
              } else if (data.text) {
                // 没说完拼接到内容中
                accumulatedContent += data.text
                setMessages(prev => prev.map(m =>
                  m.id === aiId ? { ...m, content: accumulatedContent } : m
                ))
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('AI 响应出错:', error)
      setMessages(prev => prev.map(m =>
        m.id === aiId ? { ...m, content: '抱歉，我的网络连接出了点问题，请稍后再试。', loading: false } : m
      ))
    } finally {
      setLoading(false)
    }
  }

  // 点击来源卡片
  const handleSourceClick = (source: SourceData) => {
    Toast.show({
      content: `即将跳转: ${source.fileName} 第 ${source.page} 页`,
    })
    // 动态获取当前访问的 IP/域名，确保真机测试时能访问到后端
    const { protocol, hostname } = window.location;
    const BASE_URL = `${protocol}//${hostname}:3000`;
    const fullUrl = `${BASE_URL}/${source.fileUrl}`;

    navigate('/reader', {
      state: {
        fileUrl: fullUrl,
        fileName: source.fileName,
        initialPage: source.page
      }
    })
  }


  return (
    <div className="chat-container">
      {/* 1. 顶部自定义悬浮操作栏 */}
      <div className="header-actions">
        <div className="action-btn" onClick={() => Toast.show('后续此处可唤起侧边栏对话管理')}>
          <UnorderedListOutline fontSize={20} />
        </div>

        <div className="header-title">UniBrain</div>

        <div className="action-btn" onClick={() => window.location.reload()}>
          <EditSOutline fontSize={20} />
        </div>
      </div>

      {/* 消息列表区域 */}
      <div className="message-list">
        {messages?.length === 0 && !loading ? (
          <div className="welcome-splash">
            <h1 className="splash-title">UniBrain</h1>
            <p className="splash-subtitle">我是长理智能学术助手，很高兴为你服务</p>
          </div>
        ) : (
          messages?.map(msg => (
            <div key={msg.id} className={`message-item ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
              <div className="bubble">
                {/* Markdown渲染 */}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>

                {/* AI 操作栏：仅在 AI 回复生成完毕后显示 */}
                {msg.role === 'assistant' && !msg.loading && msg.content && (
                  <div className="ai-action-bar">
                    <div className="action-icons-left">
                      <div className="action-item" onClick={() => {
                        window.navigator.clipboard.writeText(msg.content!);
                        Toast.show({ content: '已复制', icon: 'success' });
                      }}>
                        <ContentOutline />
                      </div>
                      <div className="action-item" onClick={() => Toast.show('感谢好评')}>
                        <LikeOutline />
                      </div>
                      <div className="action-item" onClick={() => Toast.show('我们会持续改进')}>
                        <FrownOutline />
                      </div>
                    </div>
                    {msg.source && msg.source.length > 0 && (
                      <div className="source-capsule" onClick={() => openSourceList(msg.source!)}>
                        <FileOutline />

                        <span className="source-text">
                          {/* 截断显示第一个文件名 */}
                          {msg.source[0].fileName.length > 10
                            ? msg.source[0].fileName.substring(0, 10) + '...'
                            : msg.source[0].fileName
                          }

                          {/* 如果有多个，显示 +n */}
                          {msg.source.length > 1 && (
                            <span style={{ marginLeft: '4px', opacity: 0.8 }}>
                              +{msg.source.length - 1}
                            </span>
                          )}

                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading 状态 */}
        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="message-item message-ai">
            <div className="bubble">
              <div className="typing-dot">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        {/* 锚点：用于自动滚动 */}
        <div ref={messagesEndRef}></div>
      </div>

      {/* 底部输入框 */}
      <div className="input-area">
        <input
          className="input-box"
          placeholder="问问 AI 助教..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <div
          className={`send-btn-wrapper ${loading || !inputValue.trim() ? 'loading' : ''}`}
          onClick={handleSend}
        >
          <SendOutline fontSize={20} />
        </div>
      </div>


      {/* 底部来源列表弹窗 */}
      <Popup
        visible={isSourcePopupVisible}
        onMaskClick={() => setIsSourcePopupVisible(false)}
        onClose={() => setIsSourcePopupVisible(false)}
        bodyStyle={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px', minHeight: '30vh' }}
      >
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
            引用来源 ({activeSources.length})
          </div>

          <List>
            {activeSources.map((src, index) => (
              <List.Item
                key={index}
                prefix={<FileOutline />}
                description={`内容片段: ${src.content.substring(0, 40)}...`}
                extra={`第 ${src.page} 页`}
                onClick={() => {
                  setIsSourcePopupVisible(false); // 先关弹窗
                  handleSourceClick(src);        // 再跳转
                }}
              >
                {src.fileName}
              </ List.Item>
            ))}
          </List>
        </div>

      </Popup>

    </div>
  )
}

export default ChatPage