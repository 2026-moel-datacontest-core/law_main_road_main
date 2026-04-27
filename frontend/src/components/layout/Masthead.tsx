'use client';

import { Gavel } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './Masthead.module.css';

interface MastheadProps {
  isLoading?: boolean;
}

const navigationItems = [
  { href: '/history', label: 'History' },
  { href: '/before', label: 'Before' },
  { href: '/after', label: 'After' },
] as const;

export function Masthead({ isLoading = false }: MastheadProps) {
  const pathname = usePathname();

  return (
    <header className={styles.masthead}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          <span className={styles.mark} aria-hidden="true">
            <Gavel size={18} />
          </span>
          <span className={styles.brandText}>
            법대로 <span className={styles.brandSub}>law-main-road</span>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="주요 화면">
          {navigationItems.map((item) => {
            const isActive = isActiveRoute(pathname, item.href);

            return (
              <Link
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div
        className={isLoading ? styles.progress : styles.progressHidden}
        aria-hidden={!isLoading}
      />
    </header>
  );
}

function isActiveRoute(pathname: string | null, href: string): boolean {
  return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
}
