import type React from "react";
import { ErrorBlock, Loading, FloatingBubble } from "antd-mobile";
import { useLocation, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from 'react-pdf'
import { useState } from "react";
import { MinusOutline, AddOutline, LeftOutline, RightOutline } from "antd-mobile-icons";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './PDFReaderPage.css';

// 设置 PDF 渲染引擎的 Worker 路径
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFReaderPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // 从路由 state 中拿到参数
  const { fileUrl, initialPage, fileName } = location.state || {}

  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(initialPage || 1)
  const [scale, setScale] = useState(1.0)

  const [loadError, setLoadError] = useState<string | null>(null)

  // PDF 成功加载之后的回调
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoadError(null)
    if (initialPage) {
      setCurrentPage(initialPage)
    }
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF Load Error:', error)
    setLoadError(error.message)
  }

  const handlePrevPage = () => {
    setCurrentPage((p: number) => Math.max(1, p - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((p: number) => Math.min(numPages || 1, p + 1))
  }

  return (
    <div className="pdf-reader-container">
      {/* 沉浸式透明 Header */}
      <header className="pdf-header">
        <div className="pdf-header-content">
          <div className="pdf-back-btn" onClick={() => navigate(-1)}>
            <LeftOutline fontSize={18} />
          </div>
          <h1 className="pdf-title">{fileName || '文档预览'}</h1>
          <div style={{ width: 40 }} /> {/* 保持平衡的占位符 */}
        </div>
      </header>

      <main className="pdf-viewport">
        {fileUrl && (
          <div className="pdf-document-wrapper">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="pdf-loading">
                  <Loading color="primary" />
                  <span>正在渲染高品质预览...</span>
                </div>
              }
              error={
                <ErrorBlock
                  status="default"
                  title="加载失败"
                  description={loadError || '请检查文件名或网络连接'}
                />
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                width={window.innerWidth - 32} // 留出一点边距
              />
            </Document>
          </div>
        )}
      </main>

      {/* 极简玻璃拟态控制栏 */}
      <div className="pdf-controls">
        <div className="pdf-control-btn" onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>
          <MinusOutline fontSize={18} />
        </div>

        <div className="pdf-page-info">
          {currentPage} / {numPages || '--'}
        </div>

        <div className="pdf-control-btn" onClick={() => setScale(s => Math.min(3.0, s + 0.2))}>
          <AddOutline fontSize={18} />
        </div>
      </div>

      {/* 高级翻页浮窗 - 下一页 */}
      <FloatingBubble
        axis="y"
        className="page-turner-bubble"
        style={{
          '--initial-position-bottom': '120px',
          '--initial-position-right': '24px',
        }}
        onClick={handleNextPage}
      >
        <div className="page-turner-content">
          <RightOutline fontSize={20} className="page-turner-icon" />
          <span className="page-turner-text">Next</span>
        </div>
      </FloatingBubble>

      {/* 翻页浮窗 - 上一页 (位置略低) */}
      {currentPage > 1 && (
        <FloatingBubble
          axis="y"
          className="page-turner-bubble"
          style={{
            '--initial-position-bottom': '48px',
            '--initial-position-right': '24px',
            '--background': 'rgba(255, 255, 255, 0.9)',
            '--size': '44px'
          }}
          onClick={handlePrevPage}
        >
          <div className="page-turner-content" style={{ color: 'var(--text-main)' }}>
            <LeftOutline fontSize={16} />
          </div>
        </FloatingBubble>
      )}
    </div>
  )
}

export default PDFReaderPage