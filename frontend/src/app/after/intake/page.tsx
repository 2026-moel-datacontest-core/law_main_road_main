'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Masthead } from '@/components/layout/Masthead';
import {
  EvidenceSection,
  ensureEvidenceRowIds,
  ensureTimelineRowIds,
  type EvidenceItemRow,
  type TimelineRow,
} from '@/components/intake/EvidenceSection';
import { UnfairDismissalForm } from '@/components/intake/UnfairDismissalForm';
import { WageComplaintForm } from '@/components/intake/WageComplaintForm';
import { WorkplaceChangeReasonForm } from '@/components/intake/WorkplaceChangeReasonForm';
import { Button } from '@/components/ui/Button';
import { DisclaimerBanner } from '@/components/ui/DisclaimerBanner';
import { Notification } from '@/components/ui/Notification';
import { SkipLink } from '@/components/ui/SkipLink';
import { useFlow } from '@/context/FlowContext';
import {
  ApiError,
  buildCaseIntake,
  buildLegalBasis,
  fetchDraft,
  hasDraftGrounding,
} from '@/lib/api';
import { getScn004DraftEligibility } from '@/lib/scn004DraftEligibility';
import {
  SCN001_FROZEN_DRAFT_DOCUMENT_TYPE,
  SCN001_FROZEN_DRAFT_PRESET_ID,
  buildScn001CaseIntakeSnapshot,
  buildScn001FrozenDraftFromIntake,
  getScenarioPresetDraft,
  isScn001FrozenDraftPath,
} from '@/lib/scenarioPresetDrafts';
import { getScenarioPreset } from '@/lib/scenarioPresets';
import type { CaseIntakeFormValues, DocumentType } from '@/types/api';

import styles from './page.module.css';

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  labor_office_wage_complaint: '고용노동청 임금체불 진정서 초안',
  labor_commission_unfair_dismissal_brief: '노동위원회 부당해고 구제신청 이유서 초안',
  workplace_change_reason_summary: '사업장 변경 사유 정리서 초안',
};

interface DraftErrorState {
  message: string;
  retryable: boolean;
}

export default function AfterIntakePage() {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const draftSubmittingRef = useRef(false);
  const { state, dispatch } = useFlow();
  const answer = state.answer_response;
  const selectedDocumentType = state.selected_document_type;
  const activePreset = getScenarioPreset(state.selected_preset_id);
  const isBridgeHandoffAnswer = state.answer_origin === 'bridge_handoff';
  const supportsDraft = !isBridgeHandoffAnswer && (activePreset?.supportsDraft ?? true);
  const hasGrounding = answer ? hasDraftGrounding(answer) : false;
  const eligibility = answer && supportsDraft ? getScn004DraftEligibility(answer) : null;
  const selectedDocumentTypeIsEligible =
    supportsDraft && selectedDocumentType !== null && eligibility !== null
      ? eligibility.documentTypes[selectedDocumentType]
      : false;
  const canUseScn004DraftFlow =
    supportsDraft && hasGrounding && selectedDocumentTypeIsEligible;
  const canUseScn001FrozenDraftPath = isScn001FrozenDraftPath({
    answer,
    selectedPresetId: state.selected_preset_id,
    userStatement: state.user_statement,
    answerOrigin: state.answer_origin,
    selectedDocumentType,
  });
  const scn001FrozenDraft = canUseScn001FrozenDraftPath
    ? getScenarioPresetDraft(SCN001_FROZEN_DRAFT_PRESET_ID)
    : null;
  const canUseScn001FrozenDraftFlow = scn001FrozenDraft !== null;
  const canUseDraftFlow = canUseScn004DraftFlow || canUseScn001FrozenDraftFlow;
  const [formValues, setFormValues] = useState<CaseIntakeFormValues>(
    () => state.case_intake_form ?? {},
  );
  const [incidentTimeline, setIncidentTimeline] = useState<TimelineRow[]>(() =>
    ensureTimelineRowIds(
      state.case_intake?.incident_timeline.length
        ? state.case_intake.incident_timeline
        : [],
    ),
  );
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItemRow[]>(() =>
    ensureEvidenceRowIds(
      state.case_intake?.evidence_items.length ? state.case_intake.evidence_items : [],
    ),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorState, setErrorState] = useState<DraftErrorState | null>(null);

  useEffect(() => {
    if (!answer) {
      router.replace('/after');
      return;
    }

    if (!hasGrounding || !selectedDocumentType || !canUseDraftFlow) {
      router.replace('/after/result');
      return;
    }
  }, [
    answer,
    canUseDraftFlow,
    hasGrounding,
    router,
    selectedDocumentType,
  ]);

  useEffect(() => {
    if (answer && selectedDocumentType && canUseDraftFlow) {
      const frameId = window.requestAnimationFrame(() => {
        headingRef.current?.focus();
      });

      return () => window.cancelAnimationFrame(frameId);
    }
  }, [answer, canUseDraftFlow, selectedDocumentType]);

  if (!answer || !selectedDocumentType || !canUseDraftFlow) {
    return (
      <>
        <SkipLink />
        <Masthead />
        <main id="main-content" tabIndex={-1} className={styles.main}>
          <p className={styles.redirectMessage}>이전 단계로 이동합니다.</p>
        </main>
      </>
    );
  }

  const documentTypeLabel = DOCUMENT_TYPE_LABELS[selectedDocumentType];
  const pageEyebrow = 'Step 3 · 사건 정보 입력';
  const pageTitle = canUseScn001FrozenDraftFlow
    ? '사업장 변경 사유 초안에 반영할 정보를 입력하세요'
    : '초안에 반영할 정보를 선택적으로 입력하세요';
  const pageLead =
    '빈 항목은 제출을 막지 않습니다. 확인이 필요한 부분은 초안 결과에서 따로 표시됩니다.';

  async function submitDraft() {
    if (!answer || !selectedDocumentType || draftSubmittingRef.current) {
      return;
    }

    if (canUseScn001FrozenDraftFlow) {
      submitScn001FrozenDraft();
      return;
    }

    if (!hasDraftGrounding(answer)) {
      setErrorState({
        message:
          '인용된 법 조문 또는 근거 컨텍스트가 확인되지 않아 문서 초안을 만들 수 없습니다.',
        retryable: false,
      });
      return;
    }

    if (!supportsDraft) {
      setErrorState({
        message: isBridgeHandoffAnswer
          ? '이 답변은 Before/Bridge 검토에서 이어진 조문 확인용이라 문서 초안을 만들 수 없습니다.'
          : '이 경로에서는 문서 초안을 만들 수 없습니다. 고정 초안은 결과 화면에서 고정 입력과 고정 답변이 그대로 일치할 때만 열 수 있습니다.',
        retryable: false,
      });
      return;
    }

    const selectedEligibility = getScn004DraftEligibility(answer);

    if (!selectedEligibility.documentTypes[selectedDocumentType]) {
      setErrorState({
        message:
          '선택한 문서 타입을 뒷받침하는 SCN-004 근거가 없어 문서 초안을 만들 수 없습니다.',
        retryable: false,
      });
      return;
    }

    draftSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorState(null);

    const legalBasis = buildLegalBasis(answer);
    const caseIntake = buildCaseIntake({
      selected_document_type: selectedDocumentType,
      form_values: formValues,
      evidence_items: evidenceItems,
      incident_timeline: incidentTimeline,
    });

    dispatch({ type: 'SET_LEGAL_BASIS', payload: legalBasis });
    dispatch({ type: 'SET_CASE_INTAKE_FORM', payload: formValues });
    dispatch({ type: 'SET_CASE_INTAKE', payload: caseIntake });

    try {
      const draft = await fetchDraft({
        case_intake: caseIntake,
        legal_basis: legalBasis,
      });

      dispatch({ type: 'SET_DRAFT', payload: draft });
      router.push('/after/draft');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '연결을 확인하고 다시 시도해주세요.';
      const retryable = error instanceof ApiError ? error.retryable : true;

      setErrorState({ message, retryable });
    } finally {
      setIsSubmitting(false);
      draftSubmittingRef.current = false;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitDraft();
  }

  function submitScn001FrozenDraft() {
    if (!answer || !scn001FrozenDraft || draftSubmittingRef.current) {
      return;
    }

    draftSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorState(null);

    const legalBasis = buildLegalBasis(answer);
    const caseIntake = buildScn001CaseIntakeSnapshot({
      baseDraft: scn001FrozenDraft,
      selectedDocumentType: SCN001_FROZEN_DRAFT_DOCUMENT_TYPE,
      formValues,
      evidenceItems,
      incidentTimeline,
    });
    const draft = buildScn001FrozenDraftFromIntake({
      baseDraft: scn001FrozenDraft,
      formValues,
      evidenceItems,
      incidentTimeline,
      legalBasis,
    });

    dispatch({ type: 'SET_LEGAL_BASIS', payload: legalBasis });
    dispatch({ type: 'SET_CASE_INTAKE_FORM', payload: formValues });
    dispatch({ type: 'SET_CASE_INTAKE', payload: caseIntake });
    dispatch({ type: 'SET_DRAFT', payload: draft });
    router.push('/after/draft');

    setIsSubmitting(false);
    draftSubmittingRef.current = false;
  }

  function handleFormValuesChange(values: CaseIntakeFormValues) {
    setFormValues(values);
    setErrorState(null);
  }

  function handleEvidenceItemsChange(items: EvidenceItemRow[]) {
    setEvidenceItems(ensureEvidenceRowIds(items));
    setErrorState(null);
  }

  function handleIncidentTimelineChange(items: TimelineRow[]) {
    setIncidentTimeline(ensureTimelineRowIds(items));
    setErrorState(null);
  }

  function resetFlow() {
    dispatch({ type: 'RESET' });
    router.push('/after');
  }

  return (
    <>
      <SkipLink />
      <Masthead isLoading={isSubmitting} />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section className={styles.headerBand} aria-labelledby="intake-title">
          <div className={styles.shell}>
            <p className={styles.eyebrow}>{pageEyebrow}</p>
            <h1 id="intake-title" ref={headingRef} tabIndex={-1} className={styles.title}>
              {pageTitle}
            </h1>
            <div className={styles.badgeRow}>
              <span className={styles.documentBadge}>{documentTypeLabel}</span>
            </div>
            <p className={styles.lead}>{pageLead}</p>
          </div>
        </section>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
          aria-busy={isSubmitting || undefined}
        >
          <div className={isSubmitting ? styles.formContentDisabled : styles.formContent}>
            {canUseScn001FrozenDraftFlow ? (
              <>
                <WorkplaceChangeReasonForm
                  values={formValues}
                  disabled={isSubmitting}
                  onChange={handleFormValuesChange}
                />

                <EvidenceSection
                  evidenceItems={evidenceItems}
                  incidentTimeline={incidentTimeline}
                  disabled={isSubmitting}
                  onEvidenceItemsChange={handleEvidenceItemsChange}
                  onIncidentTimelineChange={handleIncidentTimelineChange}
                />
              </>
            ) : (
              <>
                {selectedDocumentType === 'labor_office_wage_complaint' ? (
                  <WageComplaintForm
                    values={formValues}
                    disabled={isSubmitting}
                    onChange={handleFormValuesChange}
                  />
                ) : (
                  <UnfairDismissalForm
                    values={formValues}
                    disabled={isSubmitting}
                    onChange={handleFormValuesChange}
                  />
                )}

                <EvidenceSection
                  evidenceItems={evidenceItems}
                  incidentTimeline={incidentTimeline}
                  disabled={isSubmitting}
                  onEvidenceItemsChange={handleEvidenceItemsChange}
                  onIncidentTimelineChange={handleIncidentTimelineChange}
                />
              </>
            )}

            <DisclaimerBanner>
              {canUseScn001FrozenDraftFlow ? (
                <p>
                  이 고정 데모 초안은 제출 전 검토용입니다. Bridge/계약서 분석 내용은 사건
                  경위 설명으로만 사용하고 법적 근거로 승격하지 않습니다.
                </p>
              ) : (
                <p>
                  이 문서 초안은 제출 전 검토용입니다. 입력하지 않은 사실은 확정하지 않고
                  확인 필요 항목으로 남깁니다.
                </p>
              )}
            </DisclaimerBanner>
          </div>

          <div className={styles.stickyBar}>
            <div className={styles.stickyInner}>
              <div className={styles.stickyMessage}>
                {errorState ? (
                  <Notification
                    variant="error"
                    title="문서 초안 생성 실패"
                    actionLabel={errorState.retryable ? '다시 시도하기' : undefined}
                    onAction={errorState.retryable ? () => void submitDraft() : undefined}
                    onClose={() => setErrorState(null)}
                  >
                    <p>{errorState.message}</p>
                  </Notification>
                ) : null}
              </div>
              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting}
                  onClick={resetFlow}
                >
                  처음으로 돌아가기
                </Button>
                <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
                  {canUseScn001FrozenDraftFlow
                    ? '사업장 변경 사유 정리서 초안 생성하기 →'
                    : '문서 초안 생성하기 →'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
