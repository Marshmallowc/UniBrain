import { useNavigate } from "react-router-dom";
import { SwipeAction, Toast } from "antd-mobile";
import { showDeleteConfirm } from "../components/NiceConfirm";
import { UnorderedListOutline, AddOutline } from "antd-mobile-icons";
import { useState, useEffect, useRef } from "react";
import type { DocumentItem } from "./types";
import request from "../utils/request";
import './LibraryPage.css'

const LibraryPage: React.FC = () => {
  const navigate = useNavigate()
  const [list, setList] = useState<DocumentItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 获取列表数据
  const fetchList = async () => {
    const res = await request<{ list: DocumentItem[] }>({ url: '/document/list' })
    setList(res.list || [])
  }

  // 加载页面的时候自动获取
  useEffect(() => {
    fetchList()

    // 只有当列表里存在 status 为 processing 的文档时，才开启定时轮询
    const hasProcessing = list.some(item => item.status === 'processing')

    let timer: number | null = null
    if (hasProcessing) {
      timer = setInterval(() => {
        console.log('监测到有处理中的文档，正在自动刷新...')
        fetchList()
      }, 3000)
    }

    // 清理定时器
    return () => {
      if (timer) clearInterval(timer)
    }


  }, [list.length, list.map(i => i.status).join(',')])

  // 处理删除
  const handleDelete = async (id: string) => {
    await request({ url: `/document/${id}`, method: 'DELETE' })
    fetchList()
  }

  // 处理上传
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 目前仅支持pdf
    if (file.type !== 'application/pdf') {
      Toast.show({ content: '目前仅支持 PDF 文件' })
    }

    const formData = new FormData()
    formData.append('file', file)

    Toast.show({
      icon: 'loading',
      content: '在上传并解析...',
      // duration: 0, // 持续显示，知道手动删除
    })

    try {
      await request({
        url: 'document/upload',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      Toast.clear()
      Toast.show({ content: '入库成功', icon: 'success' })
      await fetchList()
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 触发隐藏的 file input 点击
  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="library-container">
      {/* 顶部自定义悬浮操作栏 */}
      <div className="header-actions">
        <div className="action-btn" onClick={() => Toast.show('后续此处可唤起管理菜单')}>
          <UnorderedListOutline fontSize={20} />
        </div>

        <div className="header-title">知识库 ({list ? list.length : 0})</div>

        <div className="action-btn" onClick={triggerFileSelect}>
          <AddOutline fontSize={20} />
        </div>
      </div>

      <input
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleUpload}
      />

      <div className="library-list">
        {list?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <div>暂无文档内容，请点击右上角上传</div>
          </div>
        ) : (
          list?.map(item => (
            <SwipeAction
              key={item.id}
              rightActions={[
                {
                  key: 'delete',
                  text: '删除',
                  color: 'danger',
                  onClick: async () => {
                    showDeleteConfirm(
                      '确认要删除这个文档吗？删除后将无法找回。',
                      () => handleDelete(item.id)
                    )
                  }
                },
              ]}>
              <div className="doc-card" onClick={() => {
                if (item.status === 'success') {
                  const { protocol, hostname } = window.location;
                  const BASE_URL = `${protocol}//${hostname}:3000`;
                  const fullUrl = `${BASE_URL}/${item.fileUrl}`;
                  navigate('/reader', {
                    state: {
                      fileUrl: fullUrl,
                      fileName: item.fileName,
                      initialPage: 1
                    }
                  })
                } else if (item.status === 'processing') {
                  Toast.show({ content: '文档解析中，请稍后' })
                }
              }}>
                <div className="doc-icon">
                  {item.status === 'processing' ? (
                    <div style={{ animation: 'rotating 2s linear infinite' }}>⏳</div>
                  ) : item.status === 'failed' ? (
                    '❌'
                  ) : (
                    '📄'
                  )}
                </div>
                <div className="doc-content">
                  <div className="doc-name">{item.fileName}</div>
                  <div className="doc-meta">
                    {item.status === 'processing' ? (
                      <span className="status-tag status-processing">解析中...</span>
                    ) : (
                      <>
                        <span className="status-tag status-success">已就绪</span>
                        <span>·</span>
                        <span>{new Date(item.createAt).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{item._count.chunks} 片段</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </SwipeAction>
          ))
        )}
      </div>
    </div>
  )
}

export default LibraryPage