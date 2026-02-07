
import React from 'react';
import { Dialog } from 'antd-mobile';
import './index.css';

interface NiceConfirmProps {
  title?: string;
  content: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'danger';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * 风格的高级确认弹窗
 * @param props 
 * @returns 
 */
export const showNiceConfirm = (props: NiceConfirmProps) => {
  const {
    title = '演示确认',
    content,
    confirmText = '确定',
    cancelText = '取消',
    type = 'primary',
    onConfirm,
    onCancel,
  } = props;

  const handler = Dialog.show({
    className: 'nice-confirm-dialog',
    content: (
      <div className="nice-confirm-content">
        {title && <div className="nice-confirm-title">{title}</div>}
        <div className="nice-confirm-message">{content}</div>
        <div className="nice-confirm-footer">
          <button
            className="nice-confirm-btn nice-confirm-btn-cancel"
            onClick={() => {
              onCancel?.();
              handler.close();
            }}
          >
            {cancelText}
          </button>
          <button
            className={`nice-confirm-btn nice-confirm-btn-confirm type-${type}`}
            onClick={async () => {
              await onConfirm?.();
              handler.close();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    ),
    // 禁用 antd-mobile 默认的点击遮罩层关闭，增加仪式感
    closeOnMaskClick: false,
    actions: [], // 禁用默认 actions
  });

  return handler;
};

// 专门为删除场景封装一个快捷方法
export const showDeleteConfirm = (content: string, onConfirm: () => void | Promise<void>) => {
  return showNiceConfirm({
    title: '确认删除',
    content,
    confirmText: '删除',
    cancelText: '取消',
    type: 'danger',
    onConfirm,
  });
};
