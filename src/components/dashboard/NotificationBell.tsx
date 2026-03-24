'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import styles from './NotificationBell.module.css';

interface Message {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: string;
  title: string;
  content: string;
  reference_id: string | null;
  reference_type: 'overtime' | 'leave' | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = messages.filter((m) => !m.is_read).length;

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  async function fetchMessages() {
    setLoading(true);
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(messageId: string) {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
        );
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const res = await fetch('/api/messages/read-all', {
        method: 'POST',
      });
      if (res.ok) {
        setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }

  function getTypeIcon(type: string): string {
    if (type.includes('approved')) return '✓';
    if (type.includes('rejected')) return '✕';
    if (type.includes('submitted')) return '○';
    if (type.includes('cancelled')) return '↩';
    return '•';
  }

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="通知"
      >
        <Bell size={20} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>消息通知</h3>
            {unreadCount > 0 && (
              <button
                className={styles.markAllRead}
                onClick={markAllAsRead}
                title="全部已读"
              >
                <CheckCheck size={16} />
              </button>
            )}
          </div>

          <div className={styles.messageList}>
            {loading ? (
              <div className={styles.loading}>加载中...</div>
            ) : messages.length === 0 ? (
              <div className={styles.empty}>暂无消息</div>
            ) : (
              messages.slice(0, 10).map((message) => (
                <div
                  key={message.id}
                  className={`${styles.messageItem} ${!message.is_read ? styles.unread : ''}`}
                  onClick={() => !message.is_read && markAsRead(message.id)}
                >
                  <div className={styles.messageIcon}>{getTypeIcon(message.type)}</div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageTitle}>{message.title}</div>
                    <div className={styles.messageText}>{message.content}</div>
                    <div className={styles.messageTime}>{formatTime(message.created_at)}</div>
                  </div>
                  {!message.is_read && <div className={styles.unreadDot} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}