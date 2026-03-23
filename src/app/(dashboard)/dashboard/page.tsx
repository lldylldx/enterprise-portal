import { createClient } from '@/lib/supabase/server';
import DashboardCard from '@/components/dashboard/DashboardCard';
import styles from './page.module.css';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date();
  const dateString = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const quickActions = [
    { id: 'attendance', label: '考勤打卡', icon: 'clock' },
    { id: 'leave', label: '请假申请', icon: 'calendar' },
    { id: 'salary', label: '查看工资', icon: 'wallet' },
  ];

  const announcements = [
    { id: 1, title: '关于2026年度员工体检的通知', date: '2026-03-20' },
    { id: 2, title: '清明节放假安排', date: '2026-03-18' },
    { id: 3, title: '季度销售会议延期通知', date: '2026-03-15' },
  ];

  const pendingTasks = [
    { id: 1, title: '报销单据审批', status: '待审批' },
    { id: 2, title: '设备采购申请', status: '待审批' },
    { id: 3, title: '年假调休申请', status: '待审批' },
  ];

  return (
    <div className={styles.dashboard}>
      <section className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            欢迎回来，{user?.email?.split('@')[0] || '员工'}
          </h1>
          <p className={styles.date}>{dateString}</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>快捷操作</h2>
        <div className={styles.quickActions}>
          {quickActions.map((action) => (
            <DashboardCard key={action.id} variant="action" title={action.label} />
          ))}
        </div>
      </section>

      <div className={styles.gridTwo}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>公告通知</h2>
          <DashboardCard variant="list" title="公告列表">
            <ul className={styles.list}>
              {announcements.map((item) => (
                <li key={item.id} className={styles.listItem}>
                  <span className={styles.listTitle}>{item.title}</span>
                  <span className={styles.listDate}>{item.date}</span>
                </li>
              ))}
            </ul>
          </DashboardCard>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>待办事项</h2>
          <DashboardCard variant="list" title="待处理任务">
            <ul className={styles.list}>
              {pendingTasks.map((task) => (
                <li key={task.id} className={styles.listItem}>
                  <span className={styles.listTitle}>{task.title}</span>
                  <span className={styles.badge}>{task.status}</span>
                </li>
              ))}
            </ul>
          </DashboardCard>
        </section>
      </div>
    </div>
  );
}
