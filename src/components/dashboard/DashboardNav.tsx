'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Menu, X, LogOut, Clock } from 'lucide-react';
import styles from './DashboardNav.module.css';

const navLinks = [
  { href: '/dashboard', label: '首页' },
  { href: '/dashboard/attendance', label: '考勤' },
  { href: '/dashboard/leave', label: '请假' },
  { href: '/dashboard/salary', label: '工资' },
];

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before timeout

export default function DashboardNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = '/';
  }, [supabase]);

  const resetTimer = useCallback(() => {
    setShowTimeoutWarning(false);
    setRemainingTime(0);
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  const checkTimeout = useCallback(() => {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return;

    const elapsed = Date.now() - parseInt(lastActivity, 10);
    const remaining = SESSION_TIMEOUT - elapsed;

    if (elapsed >= SESSION_TIMEOUT) {
      handleLogout();
    } else if (remaining <= WARNING_TIME && remaining > 0) {
      setShowTimeoutWarning(true);
      setRemainingTime(Math.ceil(remaining / 1000));
    } else {
      setShowTimeoutWarning(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    resetTimer();

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetTimer();

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    const scrollHandler = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', scrollHandler, { passive: true });

    const interval = setInterval(checkTimeout, 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('scroll', scrollHandler);
      clearInterval(interval);
    };
  }, [resetTimer, checkTimeout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStayLoggedIn = () => {
    resetTimer();
  };

  return (
    <>
      {showTimeoutWarning && (
        <div className={styles.timeoutWarning}>
          <div className={styles.timeoutContent}>
            <Clock size={20} />
            <span>由于您长时间未操作，将在 {formatTime(remainingTime)} 后自动退出登录</span>
            <button onClick={handleStayLoggedIn} className={styles.stayLoggedIn}>
              继续操作
            </button>
          </div>
        </div>
      )}

      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.container}>
          <Link href="/dashboard" className={styles.logo}>
            <span className={styles.logoText}>万观科技</span>
            <span className={styles.logoBadge}>员工Portal</span>
          </Link>

          <nav className={styles.desktopNav}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <button
              onClick={handleLogout}
              className={styles.logoutButton}
              disabled={isLoggingOut}
            >
              <LogOut size={18} />
              <span className={styles.logoutText}>退出登录</span>
            </button>
            <button
              className={styles.menuButton}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="打开菜单"
            >
              <Menu size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)}>
          <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileMenuHeader}>
              <span className={styles.logoText}>菜单</span>
              <button
                className={styles.closeButton}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="关闭菜单"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            <nav className={styles.mobileNav}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.mobileNavLink}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className={styles.mobileLogout}>
              <button
                onClick={handleLogout}
                className={styles.logoutButton}
                disabled={isLoggingOut}
              >
                <LogOut size={18} />
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
