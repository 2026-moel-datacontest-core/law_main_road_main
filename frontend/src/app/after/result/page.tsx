'use client';

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Scn001ContinuityPanel } from '@/components/continuity/Scn001ContinuityPanel';
import { Masthead } from '@/components/layout/Masthead';
import { Button } from '@/components/ui/Button';
import { CitationPill } from '@/components/ui/CitationPill';
import { DisclaimerBanner } from '@/components/ui/DisclaimerBanner';
import { Notification } from '@/components/ui/Notification';
import { SkipLink } from '@/components/ui/SkipLink';
import { useFlow } from '@/context/FlowContext';
import { buildLegalBasis, hasDraftGrounding } from '@/lib/api';
import { getBridgeHandoffDisplayFields } from '@/lib/bridge-handoff';
import { getScn004DraftEligibility } from '@/lib/scn004DraftEligibility';
import { shouldShowScn001FixedPresetResultContinuityPanel } from '@/lib/scn001ContinuityPanel';
import {
  SCN001_FROZEN_DRAFT_DOCUMENT_TYPE,
  isScn001FrozenDraftPath,
} from '@/lib/scenarioPresetDrafts';
import { getScenarioPreset } from '@/lib/scenarioPresets';
import type { BridgeHandoffItem } from '@/types/bridge-handoff';
import type { DocumentType } from '@/types/api';

import styles from './page.module.css';

const DOCUMENT_TYPES: Array<{
  value: DocumentType;
  title: string;
  subtitle: string;
  body: string;
}> = [
  {
    value: 'labor_office_wage_complaint',
    title: '고용노동청 임금체불 진정서 초안',
    subtitle: 'Labor office wage complaint',
    body: '퇴사 후 임금, 퇴직금, 금품청산 지연을 중심으로 정리합니다.',
  },
  {
    value: 'labor_commission_unfair_dismissal_brief',
    title: '노동위원회 부당해고 구제신청 이유서 초안',
    subtitle: 'Labor commission unfair dismissal brief',
    body: '해고 서면통지, 30일 전 예고, 구제신청 쟁점을 중심으로 정리합니다.',
  },
];

const SCN001_DOCUMENT_TYPES: typeof DOCUMENT_TYPES = [
  {
    value: SCN001_FROZEN_DRAFT_DOCUMENT_TYPE,
    title: '사업장 변경 사유 정리서 초안',
    subtitle: 'Workplace change reason summary',
    body: '계약서 검토 결과와 실제 근무 중 발생한 숙소비 공제, 기숙사 환경, 차별·폭언 등 사업장 변경 사유를 정리합니다.',
  },
];

type ContinuityPanelModel = {
  strength: 'strong' | 'weak';
  issueLabels: string[];
  lawRefs: string[];
  recommendedNextActions: string[];
};

export default function AfterResultPage() {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { state, dispatch } = useFlow();
  const answer = state.answer_response;
  const activePreset = getScenarioPreset(state.selected_preset_id);
  const isBridgeHandoffAnswer = state.answer_origin === 'bridge_handoff';
  const supportsDraft = !isBridgeHandoffAnswer && (activePreset?.supportsDraft ?? true);
  const canRenderScn004DraftCta = supportsDraft;
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(
    state.selected_document_type,
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const hasGrounding = answer ? hasDraftGrounding(answer) : false;
  const canShowScn001FrozenDraftCta = isScn001FrozenDraftPath({
    answer,
    selectedPresetId: state.selected_preset_id,
    userStatement: state.user_statement,
    answerOrigin: state.answer_origin,
  });
  const canShowScn001FixedPresetContinuityPanel =
    shouldShowScn001FixedPresetResultContinuityPanel({
      answer,
      selectedPresetId: state.selected_preset_id,
      userStatement: state.user_statement,
      answerOrigin: state.answer_origin,
    });
  const canRenderDraftCta = canRenderScn004DraftCta || canShowScn001FrozenDraftCta;
  const continuityPanel = useMemo(
    () =>
      answer
        ? getBridgeContinuityPanel({
            isBridgeHandoffAnswer,
            hasGrounding,
            citedArticles: answer.cited_articles,
            bridgeItems: state.bridge_handoff.items,
          })
        : null,
    [answer, hasGrounding, isBridgeHandoffAnswer, state.bridge_handoff.items],
  );

  useEffect(() => {
    if (!answer) {
      router.replace('/after');
    }
  }, [answer, router]);

  useEffect(() => {
    if (answer) {
      const frameId = window.requestAnimationFrame(() => {
        headingRef.current?.focus();
      });

      return () => window.cancelAnimationFrame(frameId);
    }
  }, [answer]);

  if (!answer) {
    return (
      <>
        <SkipLink />
        <Masthead />
        <main id="main-content" tabIndex={-1} className={styles.main}>
          <p className={styles.redirectMessage}>처음 단계로 이동합니다.</p>
        </main>
      </>
    );
  }

  const eligibility = supportsDraft
    ? getScn004DraftEligibility(answer)
    : {
        isEligible: false,
        documentTypes: {
          labor_office_wage_complaint: false,
          labor_commission_unfair_dismissal_brief: false,
          workplace_change_reason_summary: false,
        },
      };
  const availableDocumentTypes = canShowScn001FrozenDraftCta
    ? SCN001_DOCUMENT_TYPES
    : DOCUMENT_TYPES.filter((documentType) => eligibility.documentTypes[documentType.value]);
  const hasAvailableDocumentTypes = availableDocumentTypes.length > 0;
  const selectedDocumentTypeIsAvailable =
    selectedDocumentType !== null &&
    (canShowScn001FrozenDraftCta
      ? selectedDocumentType === SCN001_FROZEN_DRAFT_DOCUMENT_TYPE
      : supportsDraft && eligibility.documentTypes[selectedDocumentType]);
  const canProceedToDraftFlow =
    hasGrounding &&
    hasAvailableDocumentTypes &&
    (supportsDraft || canShowScn001FrozenDraftCta);
  const statementSummary = truncateText(state.user_statement || answer.query, 100);
  const canShowAnswer = hasGrounding;
  const groundedChunks = answer.retrieved_chunks.filter((chunk) =>
    answer.grounded_context_ids.includes(chunk.context_id),
  );
  const selectorPanelClassName = canShowScn001FrozenDraftCta
    ? `${styles.selectorPanel} ${styles.selectorPanelStatic}`
    : styles.selectorPanel;

  function selectDocumentType(documentType: DocumentType) {
    if (!canProceedToDraftFlow) {
      return;
    }

    if (
      canShowScn001FrozenDraftCta &&
      documentType !== SCN001_FROZEN_DRAFT_DOCUMENT_TYPE
    ) {
      return;
    }

    if (!canShowScn001FrozenDraftCta && !eligibility.documentTypes[documentType]) {
      return;
    }

    setSelectedDocumentType(documentType);
    dispatch({ type: 'SET_DOCUMENT_TYPE', payload: documentType });
  }

  function handleTileKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    documentType: DocumentType,
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectDocumentType(documentType);
    }
  }

  function handleNextClick() {
    if (
      selectedDocumentType === null ||
      !selectedDocumentTypeIsAvailable ||
      !canProceedToDraftFlow ||
      isNavigating
    ) {
      return;
    }

    setIsNavigating(true);
    dispatch({ type: 'SET_DOCUMENT_TYPE', payload: selectedDocumentType });

    if (answer && canShowScn001FrozenDraftCta) {
      dispatch({ type: 'SET_LEGAL_BASIS', payload: buildLegalBasis(answer) });
    }

    router.push('/after/intake');
  }

  function resetFlow() {
    dispatch({ type: 'RESET' });
    router.push('/after');
  }

  return (
    <>
      <SkipLink />
      <Masthead />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section className={styles.summaryBand} aria-labelledby="result-title">
          <div className={styles.shell}>
            <p className={styles.eyebrow}>Step 2 · 검색 결과</p>
            <h1 id="result-title" ref={headingRef} tabIndex={-1} className={styles.title}>
              관련 조문과 다음 문서 유형을 확인하세요
            </h1>
            <p className={styles.summaryText}>{statementSummary}</p>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.resultColumn} aria-label="법 조문 검색 결과">
            {!canShowAnswer ? (
              <Notification variant="warning" title="근거 확인 필요">
                <p>
                  인용된 법 조문 또는 근거 컨텍스트가 확인되지 않아 답변을 표시하지
                  않습니다. 입력을 보완해 다시 검색해주세요.
                </p>
              </Notification>
            ) : (
              <>
                <section className={styles.evidenceSection} aria-labelledby="evidence-title">
                  <p className={styles.evidenceEyebrow}>Legal basis</p>
                  <h2 id="evidence-title" className={styles.sectionTitle}>
                    근거 조문과 출처 컨텍스트
                  </h2>
                  <div className={styles.citationList}>
                    {answer.cited_articles.map((article) => (
                      <CitationPill key={article} label={article} />
                    ))}
                  </div>
                  {groundedChunks.length > 0 ? (
                    <ul className={styles.contextList} aria-label="출처 컨텍스트">
                      {groundedChunks.map((chunk) => (
                        <li key={chunk.chunk_id}>
                          <span className={styles.contextId}>#{chunk.context_id}</span>
                          <span>{chunk.citation_label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : answer.grounded_context_ids.length > 0 ? (
                    <ul className={styles.contextList} aria-label="출처 컨텍스트">
                      {answer.grounded_context_ids.map((contextId, index) => (
                        <li key={`${contextId}-${index}`}>
                          <span className={styles.contextId}>#{contextId}</span>
                          <span>근거 컨텍스트</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.emptyText}>근거 컨텍스트 표시 정보가 없습니다.</p>
                  )}
                </section>

                <details className={styles.answerBlock} open>
                  <summary className={styles.answerSummary}>답변 요약</summary>
                  <div className={styles.answerBody}>
                    {answer.answer.trim().length > 0 ? (
                      <p>{answer.answer}</p>
                    ) : (
                      <p>답변 본문을 생성하지 못했습니다.</p>
                    )}
                  </div>
                </details>

                <section className={styles.section} aria-labelledby="key-points-title">
                  <h2 id="key-points-title" className={styles.sectionTitle}>
                    핵심 포인트
                  </h2>
                  {answer.key_points.length > 0 ? (
                    <ul className={styles.list}>
                      {answer.key_points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.emptyText}>표시할 핵심 포인트가 없습니다.</p>
                  )}
                </section>

                <section className={styles.cautionSection} aria-labelledby="cautions-title">
                  <h2 id="cautions-title" className={styles.sectionTitle}>
                    주의사항
                  </h2>
                  {answer.cautions.length > 0 ? (
                    <ul className={styles.list}>
                      {answer.cautions.map((caution) => (
                        <li key={caution}>{caution}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.emptyText}>추가 주의사항이 없습니다.</p>
                  )}
                </section>
              </>
            )}

            {hasGrounding &&
            activePreset &&
            !activePreset.supportsDraft &&
            !canShowScn001FrozenDraftCta ? (
              <Notification variant="info" title="고정 프리셋 초안만 지원">
                <p>
                  이 프리셋의 문서 초안은 고정 입력과 고정 답변이 그대로 일치할 때만
                  표시합니다. 수정 입력 또는 live 답변 경로에서는 조문 확인만 제공합니다.
                </p>
              </Notification>
            ) : null}

            {hasGrounding && isBridgeHandoffAnswer ? (
              <Notification variant="warning" title="Bridge 검토 답변 확인 전용">
                <p>
                  이 답변은 Before/Bridge 검토에서 이어진 조문 확인용입니다. Bridge handoff
                  경로에서는 문서 초안을 열지 않습니다.
                </p>
              </Notification>
            ) : null}

            {hasGrounding && supportsDraft && !hasAvailableDocumentTypes ? (
              <Notification variant="warning" title="현재 문서 초안 지원 범위 밖">
                <p>
                  답변은 확인할 수 있지만, 현재 문서 초안은 SCN-004의 해고·서면통지·해고예고·노동위원회·임금체불·퇴직금·금품청산 범위에서만 지원합니다.
                </p>
              </Notification>
            ) : null}

            {!hasGrounding ? (
              <Notification variant="warning" title="문서 초안 진행 불가">
                <p>
                  인용된 법 조문 또는 근거 컨텍스트가 확인되지 않았습니다. 문서 초안을 만들 수
                  없습니다.
                </p>
              </Notification>
            ) : null}

            <DisclaimerBanner />
          </section>

          <aside className={styles.selectorColumn} aria-label="문서 유형 선택 및 Bridge 연속성 안내">
            <section className={selectorPanelClassName}>
              <p className={styles.eyebrow}>
                {isBridgeHandoffAnswer
                  ? 'Answer-only'
                  : canShowScn001FrozenDraftCta
                  ? '고정 초안'
                  : '문서 유형'}
              </p>
              <h2 id="document-type-title" className={styles.selectorTitle}>
                {isBridgeHandoffAnswer
                  ? '문서 초안 없이 조문만 확인합니다'
                  : canShowScn001FrozenDraftCta
                  ? '사업장 변경 사유 정리서 초안을 확인하세요'
                  : '다음 단계에서 만들 문서를 선택하세요'}
              </h2>
              {canProceedToDraftFlow ? (
                <div
                  className={styles.radioGroup}
                  role="radiogroup"
                  aria-labelledby="document-type-title"
                >
                  {availableDocumentTypes.map((documentType) => {
                    const isSelected = selectedDocumentType === documentType.value;

                    return (
                      <div
                        key={documentType.value}
                        className={isSelected ? styles.radioTileSelected : styles.radioTile}
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${documentType.title}: ${documentType.subtitle}`}
                        tabIndex={0}
                        onClick={() => selectDocumentType(documentType.value)}
                        onKeyDown={(event) => handleTileKeyDown(event, documentType.value)}
                      >
                        <span className={styles.radioMarker} aria-hidden="true" />
                        <span className={styles.radioText}>
                          <span className={styles.radioTitle}>{documentType.title}</span>
                          <span className={styles.radioSubtitle}>{documentType.subtitle}</span>
                          <span className={styles.radioBody}>{documentType.body}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Notification
                  variant="warning"
                  title={
                    isBridgeHandoffAnswer
                      ? 'Bridge 검토 답변 확인 전용'
                      : activePreset && !activePreset.supportsDraft
                      ? '고정 프리셋 초안만 지원'
                      : hasGrounding
                      ? '현재 문서 초안 지원 범위 밖'
                      : '문서 초안 진행 불가'
                  }
                >
                  <p>
                    {isBridgeHandoffAnswer
                      ? '이 답변은 Before/Bridge 검토에서 이어진 조문 확인용입니다. Bridge handoff 경로에서는 문서 초안을 열지 않습니다.'
                      : activePreset && !activePreset.supportsDraft
                      ? '고정 입력과 고정 답변이 그대로 일치할 때만 초안 보기를 표시합니다.'
                      : hasGrounding
                      ? '이 답변은 확인할 수 있지만 SCN-004 문서 초안으로 이어지지 않습니다.'
                      : '인용된 법 조문 또는 근거 컨텍스트가 확인되지 않아 문서 유형을 선택할 수 없습니다.'}
                  </p>
                </Notification>
              )}

              {canRenderDraftCta ? (
                <Button
                  type="button"
                  fullWidth
                  disabled={
                    !selectedDocumentTypeIsAvailable || !canProceedToDraftFlow || isNavigating
                  }
                  isLoading={isNavigating}
                  onClick={handleNextClick}
                >
                  사건 정보 입력하기 →
                </Button>
              ) : null}
              <Button type="button" variant="ghost" fullWidth onClick={resetFlow}>
                처음으로 돌아가기
              </Button>
            </section>

            {canShowScn001FixedPresetContinuityPanel ? (
              <Scn001ContinuityPanel titleId="scn001-result-continuity-title" />
            ) : null}

            {continuityPanel ? (
              <BridgeContinuityPanel model={continuityPanel} />
            ) : null}
          </aside>
        </div>
      </main>
    </>
  );
}

function BridgeContinuityPanel({ model }: { model: ContinuityPanelModel }) {
  const isStrong = model.strength === 'strong';

  return (
    <section className={styles.continuityPanel} aria-labelledby="bridge-continuity-title">
      <p className={styles.eyebrow}>Bridge-as-Continuity / Not Grounding</p>
      <h2 id="bridge-continuity-title" className={styles.selectorTitle}>
        이전 검토와 이번 질문이 이어질 수 있는 지점
      </h2>
      <p className={styles.continuityText}>
        {isStrong
          ? '이전 검토의 표시된 쟁점과 이번 답변의 인용 조문이 일부 이어질 수 있습니다. 아래 내용은 연결 지점 설명이며, 현재 답변의 법적 근거는 인용 조문 영역에서 확인하세요.'
          : '이전 검토의 법령 후보가 이번 답변의 인용 조문과 일부 겹칩니다. 이 Bridge 정보는 이번 답변의 법적 근거로 사용되지 않았습니다.'}
      </p>

      {model.issueLabels.length > 0 ? (
        <ContinuityList title="표시된 쟁점" values={model.issueLabels} />
      ) : null}
      {model.lawRefs.length > 0 ? (
        <ContinuityList title="현재 인용과 겹친 Bridge 법령 후보" values={model.lawRefs} />
      ) : null}
      {model.recommendedNextActions.length > 0 ? (
        <ContinuityList
          title="이어볼 수 있는 다음 행동"
          values={model.recommendedNextActions}
        />
      ) : null}

      <p className={styles.continuityBoundary}>
        Bridge 내용은 보조 설명이며 새 인용 조문이나 근거 컨텍스트를 만들지 않습니다.
      </p>
    </section>
  );
}

function ContinuityList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className={styles.continuityGroup}>
      <h3 className={styles.continuityGroupTitle}>{title}</h3>
      <ul className={styles.continuityList}>
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

function getBridgeContinuityPanel({
  isBridgeHandoffAnswer,
  hasGrounding,
  citedArticles,
  bridgeItems,
}: {
  isBridgeHandoffAnswer: boolean;
  hasGrounding: boolean;
  citedArticles: string[];
  bridgeItems: BridgeHandoffItem[];
}): ContinuityPanelModel | null {
  if (!isBridgeHandoffAnswer || !hasGrounding || citedArticles.length === 0) {
    return null;
  }

  const includedItems = bridgeItems.filter((item) => item.include_in_query);

  if (includedItems.length === 0) {
    return null;
  }

  const citedArticleKeys = citedArticles.map(normalizeContinuityText);
  const issueLabels = new UniqueTextList();
  const recommendedNextActions = new UniqueTextList();
  const overlappingLawRefs = new UniqueTextList();

  includedItems.forEach((item) => {
    const displayFields = getBridgeHandoffDisplayFields(item);

    displayFields.issueLabels.forEach((value) => issueLabels.add(value));
    displayFields.recommendedNextActions.forEach((value) =>
      recommendedNextActions.add(value),
    );
    displayFields.lawRefs
      .filter((lawRef) => hasLawRefOverlap(lawRef, citedArticleKeys))
      .forEach((lawRef) => overlappingLawRefs.add(lawRef));
  });

  const lawRefs = overlappingLawRefs.values();

  if (lawRefs.length === 0) {
    return null;
  }

  const hasContinuityContext =
    issueLabels.size > 0 || recommendedNextActions.size > 0;

  return {
    strength: hasContinuityContext ? 'strong' : 'weak',
    issueLabels: issueLabels.values(4),
    lawRefs: lawRefs.slice(0, 5),
    recommendedNextActions: recommendedNextActions.values(3),
  };
}

function hasLawRefOverlap(lawRef: string, citedArticleKeys: string[]): boolean {
  const lawRefKey = normalizeContinuityText(lawRef);

  if (lawRefKey.length < 4) {
    return false;
  }

  return citedArticleKeys.some(
    (citedArticleKey) =>
      citedArticleKey.length > 0 &&
      (citedArticleKey.includes(lawRefKey) || lawRefKey.includes(citedArticleKey)),
  );
}

function normalizeContinuityText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/[(){}\[\]〈〉《》「」『』.,·:;'"“”‘’]/g, '')
    .toLowerCase();
}

class UniqueTextList {
  private readonly seen = new Set<string>();
  private readonly items: string[] = [];

  get size() {
    return this.items.length;
  }

  add(value: string) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return;
    }

    const key = normalizeContinuityText(trimmed);

    if (this.seen.has(key)) {
      return;
    }

    this.seen.add(key);
    this.items.push(trimmed);
  }

  values(maxItems?: number) {
    return typeof maxItems === 'number' ? this.items.slice(0, maxItems) : [...this.items];
  }
}

function truncateText(value: string, maxLength: number): string {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}...`;
}
