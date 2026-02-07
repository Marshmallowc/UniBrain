import React from 'react';
import { Button, Toast } from 'antd-mobile';
import {
  SetOutline,
  MessageOutline,
  StarOutline,
  ClockCircleOutline,
  RightOutline,
  AppOutline,
  QuestionCircleOutline
} from 'antd-mobile-icons';
import './MePage.css';

const MePage: React.FC = () => {
  const menuItems = [
    { icon: <MessageOutline />, title: '对话记录', count: '12' },
    { icon: <StarOutline />, title: '我的收藏', count: '5' },
    { icon: <ClockCircleOutline />, title: '阅读历史', count: '28' },
    { icon: <AppOutline />, title: '隐私与安全' },
    { icon: <QuestionCircleOutline />, title: '帮助与反馈' },
    { icon: <SetOutline />, title: '设置' },
  ];

  const handleLogout = () => {
    Toast.show({
      content: '模拟退出登录',
      icon: 'loading',
    });
  };

  return (
    <div className="me-container">
      {/* 用户基础信息 */}
      <div className="me-profile">
        <div className="me-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
        </div>
        <h2 className="me-name">UniBrain Explorer</h2>
        <p className="me-id">ID: 88886666</p>
      </div>

      {/* 统计数据 */}
      <div className="me-stats">
        <div className="stat-item">
          <span className="stat-value">124</span>
          <span className="stat-label">知识片段</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">12</span>
          <span className="stat-label">关联文档</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">4.8h</span>
          <span className="stat-label">学习时长</span>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="me-menu">
        {menuItems.map((item, index) => (
          <div key={index} className="menu-item" onClick={() => Toast.show(item.title)}>
            <div className="menu-icon">{item.icon}</div>
            <div className="menu-title">{item.title}</div>
            {item.count && <span style={{ marginRight: 8, fontSize: 13, color: '#94a3b8' }}>{item.count}</span>}
            <RightOutline className="menu-arrow" />
          </div>
        ))}
      </div>

      <Button className="logout-btn" block onClick={handleLogout}>
        退出登录
      </Button>
    </div>
  );
};

export default MePage;
