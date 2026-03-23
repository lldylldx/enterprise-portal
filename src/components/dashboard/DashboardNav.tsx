'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Menu, X, LogOut } from 'lucide-react';
import styles from './DashboardNav.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const navLinks = [
  { href: '/dashboard', label: '首页' },
  { href: '/dashboard/attendance', label: '考勤' },
  { href: '/dashboard/leave', label: '请假' },
  { href: '/dashboard/salary', label: '工资' },
];

export default function DashboardNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
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
