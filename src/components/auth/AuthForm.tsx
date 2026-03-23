'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import styles from './AuthForm.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('登录过程中发生错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          邮箱地址
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          placeholder="请输入工作邮箱"
          required
          disabled={isLoading}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          密码
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          placeholder="请输入密码"
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className={styles.spinner} size={18} />
            登录中...
          </>
        ) : (
          '登录'
        )}
      </button>
    </form>
  );
}
