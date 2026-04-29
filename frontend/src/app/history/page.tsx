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
            <p className={styles.eyebrow}>기록 보관함</p>
            <h1 className={styles.title}>사건 기록</h1>
            <p className={styles.lead}>
              Before에서 확인한 상황과 After로 이어볼 연결 후보를 사건별로 모아 확인합니다.
            </p>
          </div>
        </section>

        <section className={styles.historySection} aria-label="사건 기록 목록">
          <div className={styles.historySurface}>
            <Scn001HistoryManager />
          </div>
        </section>
      </main>
    </>
  );
}
