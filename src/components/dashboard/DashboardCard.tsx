import styles from './DashboardCard.module.css';

interface DashboardCardProps {
  variant?: 'default' | 'action' | 'list';
  title?: string;
  children?: React.ReactNode;
}

export default function DashboardCard({
  variant = 'default',
  title,
  children,
}: DashboardCardProps) {
  if (variant === 'action') {
    return (
      <div className={styles.actionCard}>
        <h3 className={styles.actionTitle}>{title}</h3>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={styles.listCard}>
        <h3 className={styles.listTitle}>{title}</h3>
        <div className={styles.listContent}>{children}</div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
