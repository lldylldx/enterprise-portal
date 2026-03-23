import DashboardNav from '@/components/dashboard/DashboardNav';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.dashboardLayout}>
      <DashboardNav />
      <main className={styles.dashboardMain}>
        {children}
      </main>
    </div>
  );
}
