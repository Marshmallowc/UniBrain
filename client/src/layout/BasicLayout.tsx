import React, { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FileOutline, MessageOutline, UserOutline } from 'antd-mobile-icons'
import { TabBar } from 'antd-mobile'
import './BasicLayout.css'

const BasicLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeKey, setActiveKey] = useState('/chat')

  // 定义底部的三个按钮
  const tabs = [
    {
      key: '/chat',
      title: '对话',
      icon: <MessageOutline />
    },
    {
      key: '/library',
      title: '知识库',
      icon: <FileOutline />
    },
    {
      key: '/me',
      title: '我的',
      icon: <UserOutline />
    }
  ]

  // 当路由变化时，自己让底部的图标高亮
  useEffect(() => {
    setActiveKey(location.pathname)
  }, [location.pathname])

  // 当路由变化的时候，自动让底部的图标高亮
  const switchTab = (key: string) => {
    setActiveKey(key)
    navigate(key)
  }

  return (
    <div className="app-layout">
      {/* 全局消隐护卫：所有页面自动继承沉浸感 */}
      <div className="top-mask-guard"></div>

      <div className="app-body">
        <Outlet />
      </div>

      <div className={`bottom-mask-guard ${location.pathname === '/chat' ? 'is-chat' : ''}`}></div>

      {/* 底部导航栏部分 */}
      <div className="app-tabbar">
        <TabBar activeKey={activeKey} onChange={switchTab}>
          {
            tabs.map(item => {
              return (
                <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
              )
            })
          }
        </TabBar>
      </div>

    </div>
  )
}

export default BasicLayout