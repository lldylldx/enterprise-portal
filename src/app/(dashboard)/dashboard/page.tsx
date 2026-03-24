import { createClient } from '@/lib/supabase/server';
import DashboardCard from '@/components/dashboard/DashboardCard';
import styles from './page.module.css';

async function getWeather() {
  try {
    // wttr.in auto-detects location based on request IP
    const res = await fetch('https://wttr.in/?format=j1', {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current_condition?.[0];
    const nearestArea = data.nearest_area?.[0];

    // Get city name from nearest area
    const city =
      nearestArea?.region?.[0]?.value ||
      nearestArea?.areaName?.[0]?.value ||
      nearestArea?.country?.[0]?.value ||
      '未知';

    return {
      city,
      temperature: current?.temp_C + '°C',
      humidity: current?.humidity + '%',
    };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let employeeName = user?.email?.split('@')[0] || '员工';

  if (user) {
    const { data: employee } = await supabase
      .from('employees')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (employee?.full_name) {
      employeeName = employee.full_name;
    }
  }

  const weather = await getWeather();

  const today = new Date();
  const dateString = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const quickActions = [
    { id: 'attendance', label: '考勤打卡', icon: 'clock', href: '/dashboard/attendance' },
    { id: 'overtime', label: '加班申请', icon: 'clock', href: '/dashboard/overtime' },
    { id: 'leave', label: '请假申请', icon: 'calendar', href: '/dashboard/leave' },
    { id: 'salary', label: '查看工资', icon: 'wallet', href: '/dashboard/salary' },
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
            欢迎回来，{employeeName}
          </h1>
          <div className={styles.welcomeInfo}>
            <p className={styles.date}>{dateString}</p>
            {weather && (
              <p className={styles.weather}>
                {weather.city} | {weather.temperature} | 湿度 {weather.humidity}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>快捷操作</h2>
        <div className={styles.quickActions}>
          {quickActions.map((action) => (
            <DashboardCard key={action.id} variant="action" title={action.label} href={action.href} />
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
