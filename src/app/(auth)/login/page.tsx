'use client';

import AuthForm from '@/components/auth/AuthForm';
import styles from './page.module.css';

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>员工登录</h1>
          <p className={styles.subtitle}>欢迎回到万观科技内部系统</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
