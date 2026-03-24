'use client';

import { useState } from 'react';
import DashboardCard from '@/components/dashboard/DashboardCard';
import styles from './page.module.css';

interface OvertimeRequest {
  id: string;
  employee_id: string;
  manager_id: string;
  date: string;
  hours: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  manager_comment: string | null;
  created_at: string;
  updated_at: string;
}

interface OvertimeClientProps {
  requests: OvertimeRequest[];
  employeeName: string;
  yearTotalHours: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatInputDate(dateString: string): string {
  return dateString;
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已拒绝',
    cancelled: '已取消',
  };
  return statusMap[status] || status;
}

function getStatusClass(status: string): string {
  const classMap: Record<string, string> = {
    pending: styles.statusPending,
    approved: styles.statusApproved,
    rejected: styles.statusRejected,
    cancelled: styles.statusCancelled,
  };
  return classMap[status] || '';
}

export default function OvertimeClient({ requests, employeeName, yearTotalHours }: OvertimeClientProps) {
  const [formData, setFormData] = useState({
    date: '',
    hours: '',
    reason: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [localRequests, setLocalRequests] = useState(requests);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.date || !formData.hours) {
      setMessage({ type: 'error', text: '请填写加班日期和小时数' });
      return;
    }

    const hoursNum = parseFloat(formData.hours);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      setMessage({ type: 'error', text: '加班小时数必须在1-24之间' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          hours: hoursNum,
          reason: formData.reason || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || '提交失败' });
        return;
      }

      setMessage({ type: 'success', text: '加班申请提交成功' });
      setFormData({ date: '', hours: '', reason: '' });

      // Refresh the list
      const refreshRes = await fetch('/api/overtime');
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setLocalRequests(refreshData);
      }
    } catch (error) {
      setMessage({ type: 'error', text: '提交失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('确定要取消这个加班申请吗？')) return;

    try {
      const res = await fetch(`/api/overtime/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || '取消失败' });
        return;
      }

      setMessage({ type: 'success', text: '加班申请已取消' });

      // Refresh the list
      const refreshRes = await fetch('/api/overtime');
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setLocalRequests(refreshData);
      }
    } catch (error) {
      setMessage({ type: 'error', text: '取消失败，请稍后重试' });
    }
  };

  const pendingRequests = localRequests.filter((r) => r.status === 'pending');
  const historyRequests = localRequests.filter((r) => r.status !== 'pending');

  // Calculate current year total hours dynamically
  const currentYear = new Date().getFullYear();
  const currentYearHours = localRequests
    .filter((r) => {
      const requestYear = new Date(r.date).getFullYear();
      return requestYear === currentYear && r.status === 'approved';
    })
    .reduce((sum, r) => sum + Number(r.hours), 0);

  return (
    <div className={styles.overtime}>
      <section className={styles.headerSection}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>加班申请</h1>
          <p className={styles.subtitle}>{employeeName}</p>
        </div>
      </section>

      <div className={styles.gridTwo}>
        <DashboardCard title="本年度加班统计">
          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{currentYearHours}</div>
              <div className={styles.statLabel}>小时</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>{(currentYearHours / 8).toFixed(1)}</div>
              <div className={styles.statLabel}>天</div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="申请加班">
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>加班日期</label>
              <input
                type="date"
                className={styles.input}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>加班小时数</label>
              <input
                type="number"
                className={styles.input}
                placeholder="请输入1-24之间的小时数"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                min="1"
                max="24"
                step="0.5"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>加班理由</label>
              <textarea
                className={styles.textarea}
                placeholder="请输入你的加班理由"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? '提交中...' : '提交申请'}
            </button>

            {message && (
              <div className={`${styles.message} ${message.type === 'error' ? styles.messageError : styles.messageSuccess}`}>
                {message.text}
              </div>
            )}
          </form>
        </DashboardCard>
      </div>

      {pendingRequests.length > 0 && (
        <DashboardCard title="待审批申请">
          <div className={styles.requestList}>
            {pendingRequests.map((request) => (
              <div key={request.id} className={styles.requestItem}>
                <div className={styles.requestInfo}>
                  <div className={styles.requestDate}>{formatDate(request.date)}</div>
                  <div className={styles.requestDetails}>
                    <span className={styles.requestHours}>{request.hours}小时</span>
                    {request.reason && <span className={styles.requestReason}>{request.reason}</span>}
                  </div>
                </div>
                <div className={styles.requestActions}>
                  <span className={`${styles.statusBadge} ${getStatusClass(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                  <button
                    className={styles.cancelButton}
                    onClick={() => handleCancel(request.id)}
                  >
                    取消
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      <DashboardCard title="申请记录">
        <div className={styles.historyList}>
          {historyRequests.length === 0 ? (
            <p className={styles.emptyState}>暂无申请记录</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>时长</th>
                  <th>理由</th>
                  <th>状态</th>
                  <th>审批意见</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {historyRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{formatDate(request.date)}</td>
                    <td>{request.hours}小时</td>
                    <td>{request.reason || '-'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td>{request.manager_comment || '-'}</td>
                    <td>
                      {request.status === 'pending' && (
                        <button
                          className={styles.cancelButtonSmall}
                          onClick={() => handleCancel(request.id)}
                        >
                          取消
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}