import { Scn001HistoryManager } from '@/components/history/Scn001HistoryManager';
import { Masthead } from '@/components/layout/Masthead';
import { SkipLink } from '@/components/ui/SkipLink';

import styles from './page.module.css';

export default function HistoryPage() {
  return (
    <>
      <SkipLink links={[{ href: '#history-main', label: '본문으로 건너뛰기' }]} />
      <Masthead />
      <main id="history-main" className={styles.main} tabIndex={-1}>
        <section className={styles.heroSection}>
          <div className={styles.sectionInner}>
            <p className={styles.eyebrow}>History</p>
            <h1 className={styles.title}>Before / Bridge 기록</h1>
            <p className={styles.lead}>
              로그인한 계정에 연결된 SCN-001 기록을 완료/표시 가능한 항목 중심으로 확인합니다.
            </p>
          </div>
        </section>

        <section className={styles.historySection} aria-label="SCN-001 기록 목록">
          <div className={styles.historySurface}>
            <Scn001HistoryManager />
          </div>
        </section>
      </main>
    </>
  );
}
