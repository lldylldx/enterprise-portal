'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './Navigation.module.css';

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/about', label: '关于我们' },
  { href: '/services', label: '服务' },
  { href: '/news', label: '新闻' },
  { href: '/contact', label: '联系我们' },
];

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoText}>万观科技</span>
          </Link>

          <nav className={styles.desktopNav}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <Link href="/login" className={styles.loginButton}>
              员工登录
            </Link>
            <Link href="/contact" className={styles.desktopCta}>
              <Button variant="primary" size="sm">
                开始咨询
              </Button>
            </Link>
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

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.mobileMenuHeader}>
              <span className={styles.logoText}>万观科技</span>
              <button
                className={styles.closeButton}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="关闭菜单"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            <nav className={styles.mobileNav}>
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className={styles.mobileNavLink}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.1 }}
              >
                <Link
                  href="/login"
                  className={styles.mobileNavLink}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  员工登录
                </Link>
              </motion.div>
            </nav>

            <motion.div
              className={styles.mobileCta}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" size="lg">
                  开始咨询
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
