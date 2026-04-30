'use client';

import { useEffect, useRef } from 'react';

import { Scn001HistoryManager } from '@/components/history/Scn001HistoryManager';
import { Masthead } from '@/components/layout/Masthead';
import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar';
import { SkipLink } from '@/components/ui/SkipLink';

import styles from './page.module.css';

export default function HistoryPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      headingRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  return (
    <>
      <SkipLink links={[{ href: '#history-main', label: '본문으로 건너뛰기' }]} />
      <Masthead />
      <main id="history-main" className={styles.main} tabIndex={-1}>
        <div className={styles.workspaceShell}>
          <WorkspaceSidebar
            activeItem="history"
            ariaLabel="사건 기록 메뉴"
            summary={
              <>
                <span>Case workspace</span>
                <strong>사건 기록</strong>
                <p>완료된 검토와 상담 연결 후보만 안전한 표시 범위로 확인합니다.</p>
              </>
            }
          />

          <section className={styles.historyWorkspace} aria-labelledby="history-title">
            <header className={styles.workspaceHeader}>
              <div className={styles.workspaceHeaderCopy}>
                <h1 id="history-title" ref={headingRef} tabIndex={-1} className={styles.title}>
                  사건 기록
                </h1>
                <p className={styles.lead}>
                  계약서 검토와 AI 법률 상담 기록을 확인합니다.
                </p>
              </div>
            </header>

            <div className={styles.historyContent}>
              <Scn001HistoryManager />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
