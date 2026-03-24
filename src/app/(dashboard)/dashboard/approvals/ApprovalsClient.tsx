'use client';

import { useState } from 'react';
import DashboardCard from '@/components/dashboard/DashboardCard';
import styles from './page.module.css';

interface PendingRequest {
  id: string;
  type: 'overtime' | 'leave';
  employee_id: string;
  employee_name?: string;
  date: string;
  hours?: number;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  total_days?: number;
  reason: string | null;
  status: string;
  created_at: string;
}

interface ApprovalsClientProps {
  initialRequests: PendingRequest[];
  managerName: string;
}

const leaveTypeLabels: Record<string, string> = {
  annual: '年假',
  sick: '病假',
  personal: '事假',
  marriage: '婚假',
  maternity: '产假',
  paternity: '陪产假',
  bereavement: '丧假',
  other: '其他',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ApprovalsClient({ initialRequests, managerName }: ApprovalsClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApprove = async (id: string, type: 'overtime' | 'leave') => {
    setLoading(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          comment: comments[id] || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || '操作失败' });
        return;
      }

      setMessage({ type: 'success', text: '已批准申请' });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      delete comments[id];
      setComments({ ...comments });
    } catch (error) {
      setMessage({ type: 'error', text: '操作失败，请稍后重试' });
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (id: string, type: 'overtime' | 'leave') => {
    if (!comments[id]?.trim()) {
      setMessage({ type: 'error', text: '请输入拒绝原因' });
      return;
    }

    setLoading(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          comment: comments[id],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || '操作失败' });
        return;
      }

      setMessage({ type: 'success', text: '已拒绝申请' });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      delete comments[id];
      setComments({ ...comments });
    } catch (error) {
      setMessage({ type: 'error', text: '操作失败，请稍后重试' });
    } finally {
      setLoading(null);
    }
  };

  const pendingOvertime = requests.filter((r) => r.type === 'overtime');
  const pendingLeave = requests.filter((r) => r.type === 'leave');

  return (
    <div className={styles.approvals}>
      <section className={styles.headerSection}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>审批管理</h1>
          <p className={styles.subtitle}>{managerName}</p>
        </div>
      </section>

      {message && (
        <div className={`${styles.message} ${message.type === 'error' ? styles.messageError : styles.messageSuccess}`}>
          {message.text}
        </div>
      )}

      {requests.length === 0 ? (
        <DashboardCard title="暂无待审批申请">
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✓</div>
            <p>暂无待审批的申请</p>
          </div>
        </DashboardCard>
      ) : (
        <>
          {pendingOvertime.length > 0 && (
            <DashboardCard title="加班申请">
              <div className={styles.requestList}>
                {pendingOvertime.map((request) => (
                  <div key={`overtime-${request.id}`} className={styles.requestCard}>
                    <div className={styles.requestHeader}>
                      <div className={styles.requestEmployee}>
                        <span className={styles.employeeName}>{request.employee_name}</span>
                        <span className={styles.requestType}>加班申请</span>
                      </div>
                      <span className={styles.requestTime}>{formatDateTime(request.created_at)}</span>
                    </div>

                    <div className={styles.requestBody}>
                      <div className={styles.requestRow}>
                        <span className={styles.requestLabel}>加班日期</span>
                        <span className={styles.requestValue}>{formatDate(request.date)}</span>
                      </div>
                      <div className={styles.requestRow}>
                        <span className={styles.requestLabel}>加班时长</span>
                        <span className={styles.requestValueHighlight}>{request.hours}小时</span>
                      </div>
                      {request.reason && (
                        <div className={styles.requestRow}>
                          <span className={styles.requestLabel}>加班理由</span>
                          <span className={styles.requestValue}>{request.reason}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.requestActions}>
                      <div className={styles.commentInput}>
                        <input
                          type="text"
                          placeholder="审批意见（拒绝时必填）"
                          value={comments[request.id] || ''}
                          onChange={(e) => setComments({ ...comments, [request.id]: e.target.value })}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.buttonGroup}>
                        <button
                          className={styles.approveButton}
                          onClick={() => handleApprove(request.id, 'overtime')}
                          disabled={loading === request.id}
                        >
                          {loading === request.id ? '处理中...' : '批准'}
                        </button>
                        <button
                          className={styles.rejectButton}
                          onClick={() => handleReject(request.id, 'overtime')}
                          disabled={loading === request.id}
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          {pendingLeave.length > 0 && (
            <DashboardCard title="请假申请">
              <div className={styles.requestList}>
                {pendingLeave.map((request) => (
                  <div key={`leave-${request.id}`} className={styles.requestCard}>
                    <div className={styles.requestHeader}>
                      <div className={styles.requestEmployee}>
                        <span className={styles.employeeName}>{request.employee_name}</span>
                        <span className={styles.requestType}>
                          {leaveTypeLabels[request.leave_type || ''] || request.leave_type}申请
                        </span>
                      </div>
                      <span className={styles.requestTime}>{formatDateTime(request.created_at)}</span>
                    </div>

                    <div className={styles.requestBody}>
                      <div className={styles.requestRow}>
                        <span className={styles.requestLabel}>请假日期</span>
                        <span className={styles.requestValue}>
                          {formatDate(request.start_date || '')} - {formatDate(request.end_date || '')}
                        </span>
                      </div>
                      <div className={styles.requestRow}>
                        <span className={styles.requestLabel}>请假天数</span>
                        <span className={styles.requestValueHighlight}>{request.total_days}天</span>
                      </div>
                      {request.reason && (
                        <div className={styles.requestRow}>
                          <span className={styles.requestLabel}>请假理由</span>
                          <span className={styles.requestValue}>{request.reason}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.requestActions}>
                      <div className={styles.commentInput}>
                        <input
                          type="text"
                          placeholder="审批意见（拒绝时必填）"
                          value={comments[request.id] || ''}
                          onChange={(e) => setComments({ ...comments, [request.id]: e.target.value })}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.buttonGroup}>
                        <button
                          className={styles.approveButton}
                          onClick={() => handleApprove(request.id, 'leave')}
                          disabled={loading === request.id}
                        >
                          {loading === request.id ? '处理中...' : '批准'}
                        </button>
                        <button
                          className={styles.rejectButton}
                          onClick={() => handleReject(request.id, 'leave')}
                          disabled={loading === request.id}
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}
        </>
      )}
    </div>
  );
}