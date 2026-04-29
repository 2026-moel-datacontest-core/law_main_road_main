'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import type { BeforeReviewEvidence, BeforeReviewResult } from '@/types/before';

import styles from './ResultPanel.module.css';

type EvidenceCopyScenario = 'foreignWorker' | 'partTime' | 'disabledWorker';

const MOCK_REVIEW_EVIDENCE_SCENARIOS: Record<string, EvidenceCopyScenario> = {
  '5f0d77f5-foreign-worker-demo': 'foreignWorker',
  'e4a0fb62-cbb4-4136-ac6a-8a96fb66050f': 'partTime',
  '54a00490-5cfc-4371-87d1-00985108ceb7': 'disabledWorker',
};

const SCENARIO_EVIDENCE_COPY: Record<
  EvidenceCopyScenario,
  Array<{ title: string; excerpt: string }>
> = {
  foreignWorker: [
    {
      title: '표준근로계약서와 핵심 조건 확인',
      excerpt:
        '표준근로계약서 여부와 계약 언어, 임금·근로시간·숙소 조건이 서면에 적혀 있는지 확인합니다.',
    },
    {
      title: '권리 제한으로 이어질 수 있는 조항 확인',
      excerpt:
        '숙소비 공제, 여권 보관, 사업장 이동 제한처럼 실제 근무 중 권리 제한으로 이어질 수 있는 조항을 확인합니다.',
    },
    {
      title: '빠진 근로조건 확인',
      excerpt:
        '계약기간, 근로장소, 업무내용, 휴게시간, 휴일처럼 계약서에서 빠진 항목이 있는지 확인합니다.',
    },
  ],
  partTime: [
    {
      title: '임금 산정에 필요한 항목 확인',
      excerpt:
        '시급, 근로시간, 휴게시간, 주휴수당 등 임금 산정에 필요한 항목이 계약서에 적혀 있는지 확인합니다.',
    },
    {
      title: '실제 근무와 수당 조건 확인',
      excerpt:
        '수습 기간, 공제 항목, 연장·야간·휴일근로 수당 조건이 실제 근무와 맞는지 확인합니다.',
    },
    {
      title: '계약 기간 표시 확인',
      excerpt:
        '근로 시작일과 종료일 또는 기간의 정함이 없는 계약인지가 문서에서 분명하게 확인되는지 살펴봅니다.',
    },
  ],
  disabledWorker: [
    {
      title: '직무·시간·임금 조건 확인',
      excerpt:
        '직무, 근로시간, 임금 조건이 장애를 이유로 불리하게 정해진 부분이 없는지 확인합니다.',
    },
    {
      title: '편의 제공과 근무환경 확인',
      excerpt:
        '필요한 편의 제공, 안전한 근무환경, 의사소통 지원이 계약·근무 조건에서 빠져 있지 않은지 확인합니다.',
    },
  ],
};

interface ResultPanelProps {
  review: BeforeReviewResult;
  overviewCards: Array<{ label: string; value: string }>;
  onReset: () => void;
  resetDisabled?: boolean;
  bridgeAction?: ReactNode;
  accessibilityPanel?: ReactNode;
  onAccessibilityCtaClick?: () => void;
}

export function ResultPanel({
  review,
  overviewCards,
  onReset,
  resetDisabled = false,
  bridgeAction,
  accessibilityPanel,
  onAccessibilityCtaClick,
}: ResultPanelProps) {
  const [openEvidenceIndex, setOpenEvidenceIndex] = useState<number | null>(0);

  const issueCards = useMemo(() => {
    if (review.important_points.length) {
      return review.important_points;
    }

    return Object.entries(review.rule_check ?? {})
      .filter(([, value]) => value.status !== 'PASS')
      .map(([key, value]) => ({
        title: key,
        status: value.status,
        severity: value.severity,
        law_ref: value.law_ref ?? '',
        description: value.message ?? '',
      }));
  }, [review.important_points, review.rule_check]);

  return (
    <div className={styles.stack}>
      <section className={styles.heroCard} aria-labelledby="before-result-title">
        <div className={styles.heroGlow} />
        <div className={styles.heroInner}>
          <div className={styles.heroHeader}>
            <span className={styles.badge}>Review result</span>
            <div className={styles.heroStatusGroup}>
              <StatusBadge kind="status" value={review.overall_result} />
              <StatusBadge kind="severity" value={review.overall_severity} />
            </div>
          </div>

          <div className={styles.heroBody}>
            <h2 id="before-result-title" className={styles.heroTitle}>
              {review.headline}
            </h2>
            <p className={styles.heroDescription}>{review.plain_language_summary}</p>
          </div>

          <div className={styles.heroActionRow}>
            {accessibilityPanel && onAccessibilityCtaClick ? (
              <Button
                type="button"
                variant="tertiary"
                onClick={onAccessibilityCtaClick}
                className={styles.heroAccessibilityButton}
              >
                장애 관련 권리·지원 안내 보기
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={onReset}
              disabled={resetDisabled}
              className={styles.heroResetButton}
            >
              새 분석으로 돌아가기
            </Button>
          </div>
        </div>

        <div className={styles.overviewGrid}>
          {overviewCards.map((card) => (
            <div key={card.label} className={styles.overviewCard}>
              <p className={styles.overviewLabel}>{card.label}</p>
              <p className={styles.overviewValue}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className={styles.contractInfo}>
          <InfoRow label="사업주" value={review.contract_info.employer} />
          <InfoRow label="근로자" value={review.contract_info.employee} />
          <InfoRow label="시작일" value={review.contract_info.start_date} />
          <InfoRow label="요약" value={review.summary} />
        </div>

        {bridgeAction ? <div className={styles.bridgeActionSlot}>{bridgeAction}</div> : null}
      </section>

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>Issue cards</p>
            <h3 className={styles.sectionTitle}>핵심 문제 요약</h3>
          </div>

          <div className={styles.issueList}>
            {issueCards.length ? (
              issueCards.map((issue) => (
                <article key={`${issue.title}-${issue.law_ref}`} className={styles.issueCard}>
                  <div className={styles.issueHeader}>
                    <div>
                      <h4 className={styles.issueTitle}>{issue.title}</h4>
                      {issue.law_ref ? <p className={styles.issueLawRef}>{issue.law_ref}</p> : null}
                    </div>
                    <div className={styles.issueBadges}>
                      <StatusBadge kind="status" value={issue.status} />
                      <StatusBadge kind="severity" value={issue.severity} />
                    </div>
                  </div>
                  <p className={styles.issueDescription}>{issue.description}</p>
                </article>
              ))
            ) : (
              <div className={styles.emptyPositive}>
                현재 결과 기준으로 바로 수정이 필요한 핵심 이슈는 없습니다.
              </div>
            )}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>Summary notes</p>
            <h3 className={styles.sectionTitle}>전체 평가</h3>
          </div>

          <div className={styles.summaryList}>
            {review.overall_assessment.map((line) => (
              <div key={line} className={styles.summaryItem}>
                {line}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>Recommended actions</p>
            <h3 className={styles.sectionTitle}>권장 조치</h3>
          </div>

          <div className={styles.actionList}>
            {review.recommended_actions.map((action) => (
              <div key={action} className={styles.actionItem}>
                {action}
              </div>
            ))}
          </div>

        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>Evidence toggle</p>
            <h3 className={styles.sectionTitle}>근거와 확인 포인트</h3>
          </div>

          <div className={styles.evidenceList}>
            {review.evidence.map((evidence, index) => {
              const isOpen = openEvidenceIndex === index;
              const displayEvidence = getScenarioEvidenceCopy(review, evidence, index);

              return (
                <div key={evidence.title} className={styles.evidenceCard}>
                  <button
                    type="button"
                    onClick={() => setOpenEvidenceIndex(isOpen ? null : index)}
                    className={styles.evidenceButton}
                  >
                    <div>
                      <p className={styles.evidenceIndex}>Evidence {index + 1}</p>
                      <h4 className={styles.evidenceTitle}>{displayEvidence.title}</h4>
                    </div>
                    <span className={styles.evidenceToggle}>{isOpen ? '접기' : '열기'}</span>
                  </button>

                  {isOpen ? (
                    <div className={styles.evidenceBody}>
                      <p className={styles.evidenceExcerpt}>{displayEvidence.excerpt}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {accessibilityPanel ? (
          <div className={styles.accessibilityPanelSlot}>{accessibilityPanel}</div>
        ) : null}

        {review.ocr_warnings && review.ocr_warnings.length > 0 ? (
          <section className={styles.warningCard}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionEyebrow}>OCR warnings</p>
              <h3 className={styles.sectionTitle}>OCR 확인 필요</h3>
            </div>

            <div className={styles.warningList}>
              {review.ocr_warnings.map((warning) => (
                <div key={warning.field} className={styles.warningItem}>
                  <p className={styles.warningField}>{warning.field}</p>
                  <p className={styles.warningNote}>{warning.note}</p>
                  <p className={styles.warningMeta}>
                    structured: {String(warning.structured)} / corrected:{' '}
                    {String(warning.corrected)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function getScenarioEvidenceCopy(
  review: BeforeReviewResult,
  evidence: BeforeReviewEvidence,
  index: number,
): BeforeReviewEvidence {
  const scenario = getEvidenceCopyScenario(review);
  const displayCopy = scenario ? SCENARIO_EVIDENCE_COPY[scenario][index] : null;

  return displayCopy ?? evidence;
}

function getEvidenceCopyScenario(review: BeforeReviewResult): EvidenceCopyScenario | null {
  return MOCK_REVIEW_EVIDENCE_SCENARIOS[review.review_id] ?? null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <p className={styles.infoLabel}>{label}</p>
      <p className={styles.infoValue}>{value}</p>
    </div>
  );
}

function StatusBadge({
  kind,
  value,
}: {
  kind: 'status' | 'severity';
  value: string;
}) {
  const className =
    kind === 'status'
      ? value === 'PASS'
        ? styles.statusPass
        : value === 'WARNING'
          ? styles.statusWarning
          : styles.statusViolation
      : value === 'NONE'
        ? styles.severityNone
        : value === 'LOW'
          ? styles.severityLow
          : value === 'MEDIUM'
            ? styles.severityMedium
            : value === 'HIGH'
              ? styles.severityHigh
              : styles.severityCritical;

  return <span className={[styles.badgeBase, className].join(' ')}>{value}</span>;
}
