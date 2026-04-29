'use client';

import type {
  BeforeAccessibilityRecommendation,
  BeforeDisabilityType,
} from '@/types/before';

import styles from './AccessibilityPanel.module.css';

const OPTIONS: Array<{ key: BeforeDisabilityType; label: string }> = [
  { key: 'visual', label: '시각' },
  { key: 'hearing', label: '청각' },
  { key: 'mobility', label: '지체/뇌병변' },
  { key: 'cognitive', label: '발달/인지' },
  { key: 'mental', label: '정신' },
  { key: 'complex', label: '기타/복합' },
];

const DEFAULT_DISABILITY: BeforeDisabilityType = 'visual';

const DEFAULT_RECOMMENDATION: BeforeAccessibilityRecommendation = {
  disability_type: 'visual',
  disability_label: '시각',
  overview:
    '문서 형식, 핵심 조항 설명, 확인 방식이 본인에게 맞는지 먼저 살펴볼 수 있습니다.',
  cards: [
    {
      id: 'default-visual-format',
      kind: 'support',
      title: '문서 형식 확인',
      description:
        '계약서를 확대 문서, 텍스트 파일, 스크린리더 호환 문서처럼 확인 가능한 형식으로 받을 수 있는지 확인합니다.',
      law_refs: ['장애인차별금지법 제21조'],
      action_hint: '원문 이미지나 PDF만 이해하기 어렵다면 읽기 가능한 형식 제공을 요청할 수 있습니다.',
    },
    {
      id: 'default-visual-explanation',
      kind: 'question',
      title: '핵심 조건 설명 확인',
      description:
        '임금, 근로시간, 휴게시간, 계약 변경 조건을 본인이 이해할 수 있는 방식으로 다시 설명받았는지 확인합니다.',
      law_refs: ['근로기준법 제17조'],
    },
    {
      id: 'default-visual-support',
      kind: 'right',
      title: '지원 요청 가능성 확인',
      description:
        '문서 이해나 근무 조건 확인에 추가 도움이 필요하다면 어떤 방식의 지원이 필요한지 정리해 요청할 수 있습니다.',
      law_refs: ['장애인차별금지법 제20조'],
    },
  ],
  legal_basis: ['장애인차별금지법 제20조', '장애인차별금지법 제21조'],
};

interface AccessibilityPanelProps {
  selectedDisability: BeforeDisabilityType | null;
  recommendation: BeforeAccessibilityRecommendation | null;
  isLoading: boolean;
  errorMessage: string | null;
  onSelectDisability: (disabilityType: BeforeDisabilityType) => void;
}

export function AccessibilityPanel({
  selectedDisability,
  recommendation,
  isLoading,
  errorMessage,
  onSelectDisability,
}: AccessibilityPanelProps) {
  const activeDisability = selectedDisability ?? DEFAULT_DISABILITY;
  const shouldShowDefaultRecommendation =
    !recommendation && (!selectedDisability || selectedDisability === DEFAULT_DISABILITY);
  const visibleRecommendation =
    recommendation ?? (shouldShowDefaultRecommendation ? DEFAULT_RECOMMENDATION : null);

  return (
    <section className={styles.panel} aria-labelledby="before-accessibility-title">
      <div className={styles.header}>
        <span className={styles.badge}>Accessibility extension</span>
        <h2 id="before-accessibility-title" className={styles.title}>
          장애 관련 권리·지원 안내
        </h2>
        <p className={styles.description}>
          장애 특성으로 근무 조건 확인이나 문서 이해에 추가 지원이 필요한 경우 함께
          확인할 수 있는 항목입니다.
        </p>
      </div>

      <div className={styles.selectorBlock}>
        <p className={styles.selectorLabel}>지원 유형 선택</p>
        <div className={styles.optionRow}>
          {OPTIONS.map((option) => {
            const active = activeDisability === option.key;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelectDisability(option.key)}
                aria-pressed={active}
                className={[styles.optionChip, active ? styles.optionChipActive : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.infoBox}>선택한 유형에 맞는 확인 항목을 불러오는 중입니다.</div>
      ) : null}

      {errorMessage ? <div className={styles.warningBox}>{errorMessage}</div> : null}

      {visibleRecommendation ? (
        <div className={styles.cardStack}>
          <div className={styles.overviewCard}>
            <p className={styles.overviewEyebrow}>
              {visibleRecommendation.disability_label} 확인 항목
            </p>
            <p className={styles.overviewText}>{visibleRecommendation.overview}</p>
          </div>

          {visibleRecommendation.cards.map((card) => (
            <div
              key={card.id}
              className={[
                styles.recommendationCard,
                card.kind === 'right'
                  ? styles.recommendationRight
                  : card.kind === 'support'
                    ? styles.recommendationSupport
                    : card.kind === 'question'
                      ? styles.recommendationQuestion
                      : styles.recommendationLaw,
              ].join(' ')}
            >
              <div className={styles.recommendationHeader}>
                <div>
                  <p className={styles.cardKind}>{card.kind}</p>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                </div>
                <span className={styles.cardArrow}>›</span>
              </div>
              <p className={styles.cardDescription}>{card.description}</p>
              {card.action_hint ? <p className={styles.cardHint}>{card.action_hint}</p> : null}
              <div className={styles.lawRefRow}>
                {card.law_refs.map((lawRef) => (
                  <span key={`${card.id}-${lawRef}`} className={styles.lawRef}>
                    {lawRef}
                  </span>
                ))}
              </div>
            </div>
          ))}

          <div className={styles.nextStepCard}>
            <p className={styles.overviewEyebrow}>다음 단계</p>
            <p className={styles.overviewText}>
              필요한 지원 방식이 정리되면 계약서 확인 요청, 근무환경 조정 요청, 상담기관 문의
              준비에 활용할 수 있습니다.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          선택한 유형의 확인 항목을 준비하지 못했습니다. 다른 유형을 선택하거나 잠시 후 다시
          시도해 주세요.
        </div>
      )}
    </section>
  );
}
