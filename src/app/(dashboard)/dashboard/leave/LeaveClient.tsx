'use client';

import { useState } from 'react';
import DashboardCard from '@/components/dashboard/DashboardCard';
import styles from './page.module.css';

interface LeaveRequest {
  id: string;
  employee_id: string;
  manager_id: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'marriage' | 'maternity' | 'paternity' | 'bereavement' | 'other';
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  manager_comment: string | null;
  created_at: string;
  updated_at: string;
}

interface LeaveClientProps {
  requests: LeaveRequest[];
  employeeName: string;
  yearTotalDays: number;
}

const leaveTypeOptions = [
  { value: 'annual', label: '年假' },
  { value: 'sick', label: '病假' },
  { value: 'personal', label: '事假' },
  { value: 'marriage', label: '婚假' },
  { value: 'maternity', label: '产假' },
  { value: 'paternity', label: '陪产假' },
  { value: 'bereavement', label: '丧假' },
  { value: 'other', label: '其他' },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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

function getLeaveTypeLabel(type: string): string {
  const option = leaveTypeOptions.find((o) => o.value === type);
  return option?.label || type;
}

function calculateDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

export default function LeaveClient({ requests, employeeName, yearTotalDays }: LeaveClientProps) {
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [localRequests, setLocalRequests] = useState(requests);

  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-calculate total days if both dates are set
    if (newFormData.start_date && newFormData.end_date) {
      const days = calculateDays(newFormData.start_date, newFormData.end_date);
      if (days > 0 && newFormData.start_date > newFormData.end_date) {
        setMessage({ type: 'error', text: '结束日期不能早于开始日期' });
        return;
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.leave_type || !formData.start_date || !formData.end_date) {
      setMessage({ type: 'error', text: '请填写请假类型、开始日期和结束日期' });
      return;
    }

    if (formData.start_date > formData.end_date) {
      setMessage({ type: 'error', text: '结束日期不能早于开始日期' });
      return;
    }

    const totalDays = calculateDays(formData.start_date, formData.end_date);

    setLoading(true);

    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          total_days: totalDays,
          reason: formData.reason || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || '提交失败' });
        return;
      }

      setMessage({ type: 'success', text: '请假申请提交成功' });
      setFormData({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });

      // Refresh the list
      const refreshRes = await fetch('/api/leave');
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
    if (!confirm('确定要取消这个请假申请吗？')) return;

    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || '取消失败' });
        return;
      }

      setMessage({ type: 'success', text: '请假申请已取消' });

      // Refresh the list
      const refreshRes = await fetch('/api/leave');
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

  // Calculate current year total days dynamically
  const currentYear = new Date().getFullYear();
  const currentYearDays = localRequests
    .filter((r) => {
      const requestYear = new Date(r.start_date).getFullYear();
      return requestYear === currentYear && r.status === 'approved';
    })
    .reduce((sum, r) => sum + r.total_days, 0);

  return (
    <div className={styles.leave}>
      <section className={styles.headerSection}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>请假申请</h1>
          <p className={styles.subtitle}>{employeeName}</p>
        </div>
      </section>

      <div className={styles.gridTwo}>
        <DashboardCard title="本年度请假统计">
          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{currentYearDays}</div>
              <div className={styles.statLabel}>天</div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="申请请假">
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>请假类型</label>
              <select
                className={styles.select}
                value={formData.leave_type}
                onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              >
                {leaveTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.dateRange}>
              <div className={styles.formGroup}>
                <label className={styles.label}>开始日期</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.start_date}
                  onChange={(e) => handleDateChange('start_date', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>结束日期</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.end_date}
                  onChange={(e) => handleDateChange('end_date', e.target.value)}
                />
              </div>
            </div>

            {formData.start_date && formData.end_date && formData.start_date <= formData.end_date && (
              <div className={styles.daysPreview}>
                共 {calculateDays(formData.start_date, formData.end_date)} 天
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>请假理由</label>
              <textarea
                className={styles.textarea}
                placeholder="请输入你的请假理由"
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
                  <div className={styles.requestType}>{getLeaveTypeLabel(request.leave_type)}</div>
                  <div className={styles.requestDate}>
                    {formatDate(request.start_date)} - {formatDate(request.end_date)}
                  </div>
                  <div className={styles.requestDays}>{request.total_days}天</div>
                  {request.reason && <div className={styles.requestReason}>{request.reason}</div>}
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
                  <th>类型</th>
                  <th>日期范围</th>
                  <th>天数</th>
                  <th>理由</th>
                  <th>状态</th>
                  <th>审批意见</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {historyRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{getLeaveTypeLabel(request.leave_type)}</td>
                    <td>{request.start_date} 至 {request.end_date}</td>
                    <td>{request.total_days}天</td>
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