'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, RefreshCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Masthead } from '@/components/layout/Masthead';
import { Button } from '@/components/ui/Button';
import { DisclaimerBanner } from '@/components/ui/DisclaimerBanner';
import { Notification } from '@/components/ui/Notification';
import { SkipLink } from '@/components/ui/SkipLink';
import { useAuth } from '@/context/AuthContext';
import { useFlow } from '@/context/FlowContext';
import { ApiError, fetchAnswer } from '@/lib/api';
import { BridgeApiError, fetchBridgeAnswer } from '@/lib/bridge-api';
import {
  buildBridgeContextQuery,
  getBridgeHandoffDisplayFields,
} from '@/lib/bridge-handoff';
import { getFirebaseAuth } from '@/lib/firebase';
import { filterVisibleScn001History } from '@/lib/scn001-history-display';
import {
  SCENARIO_PRESETS,
  getScenarioPreset,
  type ScenarioPresetId,
} from '@/lib/scenarioPresets';
import {
  deleteBeforeReviewJobHistory,
  deleteBridgeRunHistory,
  fetchBeforeReviewHistory,
  fetchBridgeRunHistory,
  Scn001HistoryApiError,
} from '@/lib/scn001-history-api';
import type { AnswerRequest } from '@/types/api';
import type { BridgeHandoffItem } from '@/types/bridge-handoff';
import type { AnswerOrigin } from '@/types/flow';
import type {
  BeforeReviewJobHistoryItem,
  BridgeRunHistoryItem,
  Scn001HistoryOverallResult,
  Scn001HistorySeverity,
} from '@/types/scn001-history';

import styles from './page.module.css';

interface AnswerErrorState {
  message: string;
  retryable: boolean;
  submission: AnswerSubmission;
}

interface AnswerSubmission {
  payload: AnswerRequest;
  selectedPresetId: ScenarioPresetId | null;
  useFixedAnswer: boolean;
  statementForState: string;
  answerOrigin: AnswerOrigin;
  primaryBridgeRunId: string | null;
}

type Scn001AfterHistoryStatus = 'idle' | 'loading' | 'success' | 'error';
type HistoryDeleteKind = 'before' | 'bridge';
type HistoryDeleteTarget = { kind: HistoryDeleteKind; id: string };
type HistoryMutationMessage = { kind: 'notice' | 'error'; message: string };
type AfterHistoryGroup =
  | {
      kind: 'before';
      beforeJob: BeforeReviewJobHistoryItem;
      bridgeRuns: BridgeRunHistoryItem[];
    }
  | {
      kind: 'bridge-only';
      bridgeRun: BridgeRunHistoryItem;
    };

const SCN001_AFTER_HISTORY_LIMIT = 10;
const SCN001_AFTER_HISTORY_BACKEND_AUTH_MESSAGE =
  '서버 인증 확인이 완료되지 않아 기록을 불러올 수 없습니다. 인증 확인 또는 다시 로그인 후 시도해주세요.';

export default function AfterPage() {
  const router = useRouter();
  const { state, dispatch } = useFlow();
  const {
    firebaseConfigured,
    firebaseUser,
    backendUser,
    isInitializing,
    isCheckingBackend,
    isSigningIn,
    refreshBackendAuth,
  } = useAuth();
  const mainRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerSubmittingRef = useRef(false);
  const [statement, setStatement] = useState(state.user_statement);
  const [selectedPresetId, setSelectedPresetId] = useState<ScenarioPresetId | null>(
    state.selected_preset_id,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<AnswerErrorState | null>(null);
  const [historyStatus, setHistoryStatus] = useState<Scn001AfterHistoryStatus>('idle');
  const [historyErrorMessage, setHistoryErrorMessage] = useState<string | null>(null);
  const [beforeHistory, setBeforeHistory] = useState<BeforeReviewJobHistoryItem[]>([]);
  const [bridgeHistory, setBridgeHistory] = useState<BridgeRunHistoryItem[]>([]);
  const [historyRefreshNonce, setHistoryRefreshNonce] = useState(0);
  const [historyDeleteTarget, setHistoryDeleteTarget] =
    useState<HistoryDeleteTarget | null>(null);
  const [historyMutationMessage, setHistoryMutationMessage] =
    useState<HistoryMutationMessage | null>(null);

  const bridgeItems = state.bridge_handoff.items;
  const hasBridgeHandoffItems = bridgeItems.length > 0;
  const includedBridgeItems = bridgeItems.filter(
    (item) => item.include_in_query,
  );
  const includedBridgeItemCount = includedBridgeItems.length;
  const hasIncludedBridgeItems = includedBridgeItemCount > 0;
  const bridgeContextQuery = useMemo(
    () => buildBridgeContextQuery(bridgeItems, statement).trim(),
    [bridgeItems, statement],
  );
  const authBusy = isInitializing || isSigningIn || isCheckingBackend;
  const isBackendAuthenticated = backendUser.logged_in;
  const trimmedStatement = statement.trim();
  const characterCount = trimmedStatement.length;
  const selectedPreset = getScenarioPreset(selectedPresetId);
  const isPresetQueryMatched =
    selectedPreset !== null && trimmedStatement === selectedPreset.query;
  const isExactPresetSubmission = selectedPreset !== null && isPresetQueryMatched;
  const isShort =
    !isExactPresetSubmission && characterCount > 0 && characterCount < 10;
  const helperTextClassName =
    !hasIncludedBridgeItems && isShort ? styles.warningText : styles.helperText;
  const canSubmit =
    !isLoading &&
    (isExactPresetSubmission ||
      (hasIncludedBridgeItems
        ? bridgeContextQuery.length > 0
        : characterCount >= 10));
  const selectedBridgeRunIds = useMemo(
    () => new Set(bridgeItems.map((item) => item.bridge_run_id)),
    [bridgeItems],
  );
  const bridgeRunsByBeforeId = useMemo(() => {
    const byBeforeId = new Map<string, BridgeRunHistoryItem[]>();

    bridgeHistory.forEach((bridgeRun) => {
      if (!bridgeRun.before_review_job_id) {
        return;
      }

      const currentRuns = byBeforeId.get(bridgeRun.before_review_job_id) ?? [];
      currentRuns.push(bridgeRun);
      byBeforeId.set(bridgeRun.before_review_job_id, currentRuns);
    });

    return byBeforeId;
  }, [bridgeHistory]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const focusTarget = textareaRef.current ?? mainRef.current;
      focusTarget?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!firebaseConfigured || authBusy || !firebaseUser || !isBackendAuthenticated) {
      setHistoryStatus('idle');
      setHistoryErrorMessage(null);
      setBeforeHistory([]);
      setBridgeHistory([]);
      setHistoryMutationMessage(null);
      return;
    }

    let cancelled = false;

    async function fetchCurrentHistory(forceRefresh: boolean): Promise<{
      beforeJobs: BeforeReviewJobHistoryItem[];
      bridgeRuns: BridgeRunHistoryItem[];
    }> {
      const idToken = await getCurrentScn001HistoryIdToken(forceRefresh);

      try {
        const [beforeJobs, bridgeRuns] = await Promise.all([
          fetchBeforeReviewHistory({ idToken, limit: SCN001_AFTER_HISTORY_LIMIT }),
          fetchBridgeRunHistory({ idToken, limit: SCN001_AFTER_HISTORY_LIMIT }),
        ]);

        return { beforeJobs, bridgeRuns };
      } catch (error) {
        if (
          error instanceof Scn001HistoryApiError &&
          error.status === 401 &&
          !forceRefresh
        ) {
          return fetchCurrentHistory(true);
        }

        throw error;
      }
    }

    setHistoryStatus('loading');
    setHistoryErrorMessage(null);

    void fetchCurrentHistory(false)
      .then(({ beforeJobs, bridgeRuns }) => {
        if (cancelled) {
          return;
        }

        const visibleHistory = filterVisibleScn001History({ beforeJobs, bridgeRuns });
        setBeforeHistory(visibleHistory.beforeJobs);
        setBridgeHistory(visibleHistory.bridgeRuns);
        setHistoryStatus('success');
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        if (error instanceof Scn001HistoryApiError && error.status === 401) {
          void refreshBackendAuth({ forceRefresh: true });
        }

        setBeforeHistory([]);
        setBridgeHistory([]);
        setHistoryErrorMessage(getScn001HistoryErrorMessage(error));
        setHistoryStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [
    authBusy,
    firebaseConfigured,
    firebaseUser,
    historyRefreshNonce,
    isBackendAuthenticated,
    refreshBackendAuth,
  ]);

  const helperText = useMemo(() => {
    if (selectedPreset) {
      if (isPresetQueryMatched) {
        return `${selectedPreset.label} 프리셋이 입력되었습니다. 그대로 제출하면 고정 데모 답변을 사용합니다.`;
      }

      return hasIncludedBridgeItems
        ? `${selectedPreset.label} 프리셋을 바탕으로 수정 중입니다. 체크된 이전 검토 요약도 함께 사용합니다.`
        : `${selectedPreset.label} 프리셋을 바탕으로 수정 중입니다.`;
    }

    if (hasIncludedBridgeItems) {
      return characterCount === 0
        ? '체크된 검토 요약을 바탕으로 조문을 찾을 수 있습니다. 필요한 내용을 추가로 적어도 됩니다.'
        : '체크된 검토 요약과 추가 질문을 함께 사용합니다.';
    }

    if (hasBridgeHandoffItems && characterCount === 0) {
      return '검토 요약을 포함하지 않으려면 추가 질문을 10자 이상 입력해주세요.';
    }

    if (isShort) {
      return '상황을 10자 이상 입력하면 법 조문 찾기를 시작할 수 있습니다.';
    }

    return '해고, 임금, 퇴직금, 사업장 변경, 육아휴직처럼 핵심 사실을 함께 적어주세요.';
  }, [
    characterCount,
    hasBridgeHandoffItems,
    hasIncludedBridgeItems,
    isPresetQueryMatched,
    isShort,
    selectedPreset,
  ]);

  function buildAnswerSubmission(): AnswerSubmission | null {
    const preset = getScenarioPreset(selectedPresetId);
    const usesExactPreset = preset !== null && trimmedStatement === preset.query;

    if (usesExactPreset) {
      return {
        payload: {
          query: trimmedStatement,
          top_k: preset.recommendedTopK,
          ef_search: 100,
        },
        selectedPresetId: preset.id,
        useFixedAnswer: true,
        statementForState: trimmedStatement,
        answerOrigin: 'regular_after',
        primaryBridgeRunId: null,
      };
    }

    if (hasBridgeHandoffItems) {
      if (hasIncludedBridgeItems && bridgeContextQuery.length === 0) {
        return null;
      }

      if (!hasIncludedBridgeItems && trimmedStatement.length < 10) {
        return null;
      }

      return {
        payload: {
          query: hasIncludedBridgeItems ? bridgeContextQuery : trimmedStatement,
          top_k: 10,
          ef_search: 100,
        },
        selectedPresetId: preset?.id ?? null,
        useFixedAnswer: false,
        statementForState:
          trimmedStatement.length > 0
            ? trimmedStatement
            : 'Before/Bridge 검토 요약 기반 질문',
        answerOrigin: 'bridge_handoff',
        primaryBridgeRunId: hasIncludedBridgeItems
          ? includedBridgeItems[0]?.bridge_run_id ?? ''
          : null,
      };
    }

    if (trimmedStatement.length < 10) {
      return null;
    }

    return {
      payload: {
        query: trimmedStatement,
        top_k: preset ? preset.recommendedTopK : 5,
        ef_search: 100,
      },
      selectedPresetId: preset?.id ?? null,
      useFixedAnswer: preset !== null && trimmedStatement === preset.query,
      statementForState: trimmedStatement,
      answerOrigin: 'regular_after',
      primaryBridgeRunId: null,
    };
  }

  async function submitStatement(submission = buildAnswerSubmission()) {
    if (!submission || answerSubmittingRef.current) {
      return;
    }

    answerSubmittingRef.current = true;
    setIsLoading(true);
    setErrorState(null);
    const preset = getScenarioPreset(submission.selectedPresetId);
    dispatch({
      type: 'SET_STATEMENT',
      payload: {
        statement: submission.statementForState,
        selected_preset_id: submission.selectedPresetId,
        answer_origin: submission.answerOrigin,
      },
    });

    try {
      const answer =
        preset && submission.useFixedAnswer
          ? preset.fixedAnswer
          : await fetchAnswerForSubmission(submission);

      dispatch({ type: 'SET_ANSWER', payload: answer });
      router.push('/after/result');
    } catch (error) {
      const { message, retryable } = getAnswerSubmissionError(error);

      setErrorState({ message, retryable, submission });
    } finally {
      setIsLoading(false);
      answerSubmittingRef.current = false;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitStatement();
  }

  function handleStatementChange(value: string) {
    setStatement(value);
    setErrorState(null);
  }

  async function fetchAnswerForSubmission(submission: AnswerSubmission) {
    if (submission.primaryBridgeRunId !== null) {
      return fetchProtectedBridgeAnswer(
        submission.primaryBridgeRunId,
        submission.payload,
      );
    }

    return fetchAnswer(submission.payload);
  }

  async function fetchProtectedBridgeAnswer(
    bridgeRunId: string,
    request: AnswerRequest,
  ) {
    const idToken = await getCurrentBridgeAnswerIdToken(false);

    try {
      return await fetchBridgeAnswer({
        bridge_run_id: bridgeRunId,
        idToken,
        request,
      });
    } catch (error) {
      if (error instanceof BridgeApiError && error.status === 401) {
        const refreshedIdToken = await getCurrentBridgeAnswerIdToken(true);

        return fetchBridgeAnswer({
          bridge_run_id: bridgeRunId,
          idToken: refreshedIdToken,
          request,
        });
      }

      throw error;
    }
  }

  async function getCurrentBridgeAnswerIdToken(forceRefresh: boolean): Promise<string> {
    const idTokenRequest = getFirebaseAuth()?.currentUser?.getIdToken(forceRefresh);

    if (!idTokenRequest) {
      throw new BridgeApiError(
        401,
        'Bridge 답변 생성에는 로그인이 필요합니다. 다시 로그인한 뒤 시도해주세요.',
        false,
      );
    }

    try {
      return await idTokenRequest;
    } catch {
      throw new BridgeApiError(
        401,
        '로그인 인증을 확인하지 못했습니다. 다시 로그인한 뒤 시도해주세요.',
        false,
      );
    }
  }

  function handlePresetClick(presetId: ScenarioPresetId) {
    const preset = getScenarioPreset(presetId);

    if (!preset) {
      return;
    }

    setStatement(preset.query);
    setSelectedPresetId(preset.id);
    setErrorState(null);
    dispatch({
      type: 'SET_STATEMENT',
      payload: {
        statement: preset.query,
        selected_preset_id: preset.id,
        answer_origin: 'regular_after',
      },
    });
  }

  function handleBridgeIncludedChange(
    item: BridgeHandoffItem,
    includeInQuery: boolean,
  ) {
    dispatch({
      type: 'SET_BRIDGE_HANDOFF_ITEM_INCLUDED',
      payload: {
        bridge_run_id: item.bridge_run_id,
        include_in_query: includeInQuery,
      },
    });
    setErrorState(null);
  }

  function handleBridgeExclude(item: BridgeHandoffItem) {
    dispatch({
      type: 'REMOVE_BRIDGE_HANDOFF_ITEM',
      payload: { bridge_run_id: item.bridge_run_id },
    });
    setErrorState(null);
  }

  function handleSelectBridgeHistory(bridgeRun: BridgeRunHistoryItem) {
    dispatch({
      type: 'ADD_BRIDGE_HANDOFF_ITEM',
      payload: bridgeHistoryItemToHandoffItem(bridgeRun),
    });
    setHistoryMutationMessage({
      kind: 'notice',
      message: 'Bridge 기록을 이번 질문에 포함했습니다. 위 체크박스에서 포함 여부를 조정할 수 있습니다.',
    });
    setErrorState(null);
  }

  async function handleDeleteHistoryRecord(target: HistoryDeleteTarget) {
    if (historyDeleteTarget) {
      return;
    }

    if (!window.confirm(getHistoryDeleteConfirmMessage(target.kind))) {
      return;
    }

    if (!isBackendAuthenticated) {
      setHistoryMutationMessage({
        kind: 'error',
        message: SCN001_AFTER_HISTORY_BACKEND_AUTH_MESSAGE,
      });
      void refreshBackendAuth({ forceRefresh: true });
      return;
    }

    setHistoryDeleteTarget(target);
    setHistoryMutationMessage(null);

    try {
      await deleteHistoryRecordWithCurrentToken(target, false);
      applyLocalHistoryDeletion(target);
      setHistoryMutationMessage({
        kind: 'notice',
        message: '기록을 삭제하고 목록에서 숨겼습니다.',
      });
      setHistoryRefreshNonce((current) => current + 1);
    } catch (error) {
      if (error instanceof Scn001HistoryApiError && error.status === 401) {
        void refreshBackendAuth({ forceRefresh: true });
      }

      setHistoryMutationMessage({
        kind: 'error',
        message: getScn001HistoryDeleteErrorMessage(error),
      });
    } finally {
      setHistoryDeleteTarget(null);
    }
  }

  async function deleteHistoryRecordWithCurrentToken(
    target: HistoryDeleteTarget,
    forceRefresh: boolean,
  ): Promise<void> {
    const idToken = await getCurrentScn001HistoryIdToken(forceRefresh);

    try {
      if (target.kind === 'before') {
        await deleteBeforeReviewJobHistory({
          idToken,
          beforeReviewJobId: target.id,
        });
        return;
      }

      await deleteBridgeRunHistory({
        idToken,
        bridgeRunId: target.id,
      });
    } catch (error) {
      if (
        error instanceof Scn001HistoryApiError &&
        error.status === 401 &&
        !forceRefresh
      ) {
        return deleteHistoryRecordWithCurrentToken(target, true);
      }

      throw error;
    }
  }

  async function getCurrentScn001HistoryIdToken(forceRefresh: boolean): Promise<string> {
    const currentUser = getFirebaseAuth()?.currentUser ?? null;

    if (!currentUser) {
      throw new Scn001HistoryApiError(
        401,
        '로그인 후 기록을 관리할 수 있습니다. 다시 로그인한 뒤 시도해주세요.',
        false,
      );
    }

    try {
      return await currentUser.getIdToken(forceRefresh);
    } catch {
      throw new Scn001HistoryApiError(
        401,
        '로그인 인증을 확인하지 못했습니다. 다시 로그인한 뒤 시도해주세요.',
        false,
      );
    }
  }

  function applyLocalHistoryDeletion(target: HistoryDeleteTarget) {
    if (target.kind === 'before') {
      const linkedBridgeRunIds = bridgeHistory
        .filter((bridgeRun) => bridgeRun.before_review_job_id === target.id)
        .map((bridgeRun) => bridgeRun.bridge_run_id);

      setBeforeHistory((current) =>
        current.filter((job) => job.before_review_job_id !== target.id),
      );
      setBridgeHistory((current) =>
        current.filter((bridgeRun) => bridgeRun.before_review_job_id !== target.id),
      );
      // Only remove Bridge handoff items linked to the delete target.
      linkedBridgeRunIds.forEach((bridgeRunId) => {
        dispatch({
          type: 'REMOVE_BRIDGE_HANDOFF_ITEM',
          payload: { bridge_run_id: bridgeRunId },
        });
      });
      return;
    }

    setBridgeHistory((current) =>
      current.filter((bridgeRun) => bridgeRun.bridge_run_id !== target.id),
    );
    dispatch({
      type: 'REMOVE_BRIDGE_HANDOFF_ITEM',
      payload: { bridge_run_id: target.id },
    });
  }

  function retryHistoryLoad() {
    setHistoryMutationMessage(null);
    void refreshBackendAuth({ forceRefresh: true });
    setHistoryRefreshNonce((current) => current + 1);
  }

  function goToBefore() {
    router.push('/before');
  }

  return (
    <>
      <SkipLink />
      <Masthead isLoading={isLoading} />
      <main id="main-content" ref={mainRef} tabIndex={-1} className={styles.main}>
        <section className={styles.intro} aria-labelledby="after-title">
          <div className={styles.introInner}>
            <p className={styles.eyebrow}>
              {hasBridgeHandoffItems
                ? 'After flow · Bridge handoff'
                : 'After flow · Scenario presets'}
            </p>
            <h1 id="after-title" className={styles.title}>
              상황에 맞는 노동권 조문 찾기
            </h1>
            <p className={styles.lead}>
              현재 상황을 적으면 관련 조문과 주의사항을 먼저 확인합니다.
            </p>
          </div>
        </section>

        <section className={styles.formBand} aria-labelledby="statement-title">
          <div className={styles.formShell}>
            {hasBridgeHandoffItems ? (
              <section
                className={styles.handoffPanel}
                aria-labelledby="bridge-handoff-title"
              >
                <div className={styles.handoffHeader}>
                  <div>
                    <p className={styles.eyebrow}>Bridge handoff</p>
                    <h2 id="bridge-handoff-title" className={styles.sectionTitle}>
                      이번 질문에 포함할 이전 기록
                    </h2>
                  </div>
                  <span className={styles.handoffCount}>
                    {isExactPresetSubmission
                      ? '고정 프리셋 우선'
                      : `${includedBridgeItemCount}/${bridgeItems.length} 포함`}
                  </span>
                </div>

                <div className={styles.handoffList}>
                  {bridgeItems.map((item, index) => (
                    <BridgeHandoffCard
                      key={item.bridge_run_id}
                      item={item}
                      index={index}
                      itemCount={bridgeItems.length}
                      disabled={isLoading}
                      fixedPresetMode={isExactPresetSubmission}
                      onIncludedChange={handleBridgeIncludedChange}
                      onExclude={handleBridgeExclude}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <form
              className={styles.form}
              onSubmit={handleSubmit}
              aria-busy={isLoading || undefined}
            >
              <div className={styles.formHeader}>
                <div>
                  <p className={styles.eyebrow}>Step 1</p>
                  <h2 id="statement-title" className={styles.sectionTitle}>
                    상황 입력
                  </h2>
                </div>
                <span className={styles.counter}>{characterCount}자</span>
              </div>

              <label className={styles.label} htmlFor="statement">
                {hasBridgeHandoffItems ? '추가 질문' : '한국어 진술'}
              </label>
              <textarea
                id="statement"
                ref={textareaRef}
                className={styles.textarea}
                value={statement}
                onChange={(event) => handleStatementChange(event.target.value)}
                disabled={isLoading}
                aria-label="노동권 상황 진술"
                aria-describedby="statement-helper"
                placeholder={
                  hasBridgeHandoffItems
                    ? '추가로 묻고 싶은 내용을 입력하세요.'
                    : '예: 회사에서 갑자기 그만 나오라고 했고 서면통지는 받지 못했습니다. 마지막 임금과 퇴직금도 아직 받지 못했습니다.'
                }
              />
              <p
                id="statement-helper"
                className={helperTextClassName}
              >
                {helperText}
              </p>

              <div className={styles.presetRow}>
                {SCENARIO_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={selectedPresetId === preset.id ? 'secondary' : 'ghost'}
                    onClick={() => handlePresetClick(preset.id)}
                    disabled={isLoading}
                    aria-pressed={selectedPresetId === preset.id}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {errorState ? (
                <Notification
                  variant="error"
                  title="법 조문 검색 실패"
                  actionLabel={errorState.retryable ? '다시 시도하기' : undefined}
                  onAction={
                    errorState.retryable
                      ? () => void submitStatement(errorState.submission)
                      : undefined
                  }
                  onClose={() => setErrorState(null)}
                >
                  <p>{errorState.message}</p>
                </Notification>
              ) : null}

              <div className={styles.actionRow}>
                <Button type="submit" isLoading={isLoading} disabled={!canSubmit}>
                  {hasBridgeHandoffItems && !isExactPresetSubmission
                    ? '이 내용으로 조문 찾기 →'
                    : '법 조문 찾기 →'}
                </Button>
              </div>
            </form>

            <AfterHistorySelector
              firebaseConfigured={firebaseConfigured}
              isAuthBusy={authBusy}
              hasFirebaseSession={Boolean(firebaseUser)}
              isAuthenticated={isBackendAuthenticated}
              status={historyStatus}
              errorMessage={historyErrorMessage}
              mutationMessage={historyMutationMessage}
              beforeJobs={beforeHistory}
              bridgeRuns={bridgeHistory}
              bridgeRunsByBeforeId={bridgeRunsByBeforeId}
              selectedBridgeRunIds={selectedBridgeRunIds}
              deletingTarget={historyDeleteTarget}
              disabled={isLoading}
              onRetry={retryHistoryLoad}
              onSelectBridge={handleSelectBridgeHistory}
              onDelete={(target) => void handleDeleteHistoryRecord(target)}
              onGoToBefore={goToBefore}
            />
          </div>
        </section>

        <section className={styles.disclaimerBand}>
          <div className={styles.formShell}>
            <DisclaimerBanner />
          </div>
        </section>
      </main>
    </>
  );
}

interface BridgeHandoffCardProps {
  item: BridgeHandoffItem;
  index: number;
  itemCount: number;
  disabled: boolean;
  fixedPresetMode: boolean;
  onIncludedChange: (item: BridgeHandoffItem, includeInQuery: boolean) => void;
  onExclude: (item: BridgeHandoffItem) => void;
}

function BridgeHandoffCard({
  item,
  index,
  itemCount,
  disabled,
  fixedPresetMode,
  onIncludedChange,
  onExclude,
}: BridgeHandoffCardProps) {
  const checkboxId = `bridge-handoff-include-${index}`;
  const titleId = `bridge-handoff-card-title-${index}`;
  const displayFields = getBridgeHandoffDisplayFields(item);
  const title =
    itemCount > 1 ? `Before/Bridge 검토 요약 ${index + 1}` : 'Before/Bridge 검토 요약';

  return (
    <article className={styles.handoffCard} aria-labelledby={titleId}>
      <div className={styles.handoffCardTop}>
        <div className={styles.handoffCardTitleGroup}>
          <p className={styles.handoffCardEyebrow}>
            이전 상황 요약 + Bridge 법 조항/위험 설명
          </p>
          <h3 id={titleId} className={styles.handoffCardTitle}>
            {title}
          </h3>
        </div>

        <button
          type="button"
          className={styles.excludeButton}
          onClick={() => onExclude(item)}
          disabled={disabled}
        >
          이번 질문에서 제외
        </button>
      </div>

      <label className={styles.includeControl} htmlFor={checkboxId}>
        <input
          id={checkboxId}
          type="checkbox"
          checked={item.include_in_query}
          disabled={disabled || fixedPresetMode}
          onChange={(event) => onIncludedChange(item, event.target.checked)}
        />
        <span>
          {fixedPresetMode
            ? '고정 프리셋 제출에서는 이 요약을 질문에 넣지 않음'
            : '이 검토 요약을 이번 질문에 포함'}
        </span>
      </label>

      <p className={styles.handoffSummary}>{displayFields.userVisibleSummary}</p>

      <div className={styles.handoffMetaGrid}>
        <HandoffMetaList title="주요 쟁점" values={displayFields.issueLabels} />
        <HandoffMetaList title="관련 법령 후보" values={displayFields.lawRefs} />
        <HandoffMetaList
          title="권장 다음 행동"
          values={displayFields.recommendedNextActions}
        />
      </div>

      <p className={styles.handoffNote}>
        {fixedPresetMode
          ? '프리셋 문장을 수정하거나 프리셋 선택을 바꾸면 체크된 요약을 다시 질문에 사용할 수 있습니다.'
          : '현재 질문에서만 제외됩니다.'}
      </p>
    </article>
  );
}

interface HandoffMetaListProps {
  title: string;
  values: string[];
}

function HandoffMetaList({ title, values }: HandoffMetaListProps) {
  const displayValues = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (displayValues.length === 0) {
    return null;
  }

  return (
    <div className={styles.handoffMetaGroup}>
      <h4 className={styles.handoffMetaTitle}>{title}</h4>
      <ul className={styles.handoffPillList}>
        {displayValues.map((value, index) => (
          <li key={`${value}-${index}`}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

interface AfterHistorySelectorProps {
  firebaseConfigured: boolean;
  isAuthBusy: boolean;
  hasFirebaseSession: boolean;
  isAuthenticated: boolean;
  status: Scn001AfterHistoryStatus;
  errorMessage: string | null;
  mutationMessage: HistoryMutationMessage | null;
  beforeJobs: BeforeReviewJobHistoryItem[];
  bridgeRuns: BridgeRunHistoryItem[];
  bridgeRunsByBeforeId: Map<string, BridgeRunHistoryItem[]>;
  selectedBridgeRunIds: Set<string>;
  deletingTarget: HistoryDeleteTarget | null;
  disabled: boolean;
  onRetry: () => void;
  onSelectBridge: (bridgeRun: BridgeRunHistoryItem) => void;
  onDelete: (target: HistoryDeleteTarget) => void;
  onGoToBefore: () => void;
}

function AfterHistorySelector({
  firebaseConfigured,
  isAuthBusy,
  hasFirebaseSession,
  isAuthenticated,
  status,
  errorMessage,
  mutationMessage,
  beforeJobs,
  bridgeRuns,
  bridgeRunsByBeforeId,
  selectedBridgeRunIds,
  deletingTarget,
  disabled,
  onRetry,
  onSelectBridge,
  onDelete,
  onGoToBefore,
}: AfterHistorySelectorProps) {
  const historyGroups = useMemo(
    () => buildAfterHistoryGroups(beforeJobs, bridgeRuns, bridgeRunsByBeforeId),
    [beforeJobs, bridgeRuns, bridgeRunsByBeforeId],
  );
  const notice = getAfterHistoryNotice({
    firebaseConfigured,
    isAuthBusy,
    hasFirebaseSession,
    isAuthenticated,
    status,
    errorMessage,
    mutationMessage,
    beforeJobs,
    bridgeRuns,
  });
  const totalCount = beforeJobs.length + bridgeRuns.length;

  if (!isAuthenticated) {
    return (
      <section className={styles.historyGatePanel} aria-labelledby="after-history-gate-title">
        <div>
          <p className={styles.historyEyebrow}>Saved history</p>
          <h2 id="after-history-gate-title" className={styles.historyTitle}>
            이전 Before/Bridge 기록
          </h2>
          <p className={styles.historyDescription}>
            {getAfterHistoryGateMessage({
              firebaseConfigured,
              isAuthBusy,
              hasFirebaseSession,
            })}
          </p>
        </div>
      </section>
    );
  }

  return (
    <details className={styles.historyPanel}>
      <summary className={styles.historySummary}>
        <span className={styles.historySummaryText}>
          <span className={styles.historyEyebrow}>Saved history</span>
          <span id="after-history-title" className={styles.historyTitle}>
            이전 Before/Bridge 기록
          </span>
          <span className={styles.historyDescription}>
            Before 상황별로 묶어 Bridge 요약을 이번 질문에 포함할 수 있습니다.
          </span>
        </span>
        <span className={styles.historySummaryMeta}>
          <span className={styles.historyCount}>{totalCount}건</span>
          <ChevronDown size={18} aria-hidden="true" />
        </span>
      </summary>

      <div className={styles.historyBody}>
        {notice ? (
          <HistoryNotice
            notice={notice}
            onRetry={onRetry}
          />
        ) : null}

        {status === 'success' ? (
          <AfterHistoryGroupedList
            groups={historyGroups}
            selectedBridgeRunIds={selectedBridgeRunIds}
            deletingTarget={deletingTarget}
            disabled={disabled}
            onSelectBridge={onSelectBridge}
            onDelete={onDelete}
            onGoToBefore={onGoToBefore}
          />
        ) : null}
      </div>
    </details>
  );
}

function HistoryNotice({
  notice,
  onRetry,
}: {
  notice: { kind: 'notice' | 'error'; message: string; canRetry: boolean };
  onRetry: () => void;
}) {
  return (
    <div
      className={notice.kind === 'error' ? styles.historyError : styles.historyNotice}
      role={notice.kind === 'error' ? 'alert' : 'status'}
    >
      <span>{notice.message}</span>
      {notice.canRetry ? (
        <button className={styles.historyRetryButton} type="button" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" />
          다시 시도
        </button>
      ) : null}
    </div>
  );
}

function AfterHistoryGroupedList({
  groups,
  selectedBridgeRunIds,
  deletingTarget,
  disabled,
  onSelectBridge,
  onDelete,
  onGoToBefore,
}: {
  groups: AfterHistoryGroup[];
  selectedBridgeRunIds: Set<string>;
  deletingTarget: HistoryDeleteTarget | null;
  disabled: boolean;
  onSelectBridge: (bridgeRun: BridgeRunHistoryItem) => void;
  onDelete: (target: HistoryDeleteTarget) => void;
  onGoToBefore: () => void;
}) {
  return (
    <section className={styles.historyGroupedSection} aria-label="Before 중심 저장 기록">
      <div className={styles.historyGroupedHeader}>
        <div>
          <h3 className={styles.historyColumnTitle}>Before 중심 기록</h3>
          <p className={styles.historyGroupedDescription}>
            Before 상황 요약 아래에 연결된 Bridge 법·위험 설명을 함께 표시합니다.
          </p>
        </div>
        <span className={styles.historyColumnCount}>{groups.length}묶음</span>
      </div>

      {groups.length === 0 ? (
        <p className={styles.historyEmpty}>최근 표시 가능한 Before/Bridge 기록이 없습니다.</p>
      ) : (
        <ol className={styles.historyGroupedList}>
          {groups.map((group) =>
            group.kind === 'before' ? (
              <BeforeHistoryGroupCard
                key={group.beforeJob.before_review_job_id}
                job={group.beforeJob}
                bridgeRuns={group.bridgeRuns}
                selectedBridgeRunIds={selectedBridgeRunIds}
                deletingTarget={deletingTarget}
                disabled={disabled}
                onSelectBridge={onSelectBridge}
                onDelete={onDelete}
                onGoToBefore={onGoToBefore}
              />
            ) : (
              <BridgeOnlyHistoryGroupCard
                key={group.bridgeRun.bridge_run_id}
                bridgeRun={group.bridgeRun}
                selectedBridgeRunIds={selectedBridgeRunIds}
                deletingTarget={deletingTarget}
                disabled={disabled}
                onSelectBridge={onSelectBridge}
                onDelete={onDelete}
              />
            ),
          )}
        </ol>
      )}
    </section>
  );
}

function BeforeHistoryGroupCard({
  job,
  bridgeRuns,
  selectedBridgeRunIds,
  deletingTarget,
  disabled,
  onSelectBridge,
  onDelete,
  onGoToBefore,
}: {
  job: BeforeReviewJobHistoryItem;
  bridgeRuns: BridgeRunHistoryItem[];
  selectedBridgeRunIds: Set<string>;
  deletingTarget: HistoryDeleteTarget | null;
  disabled: boolean;
  onSelectBridge: (bridgeRun: BridgeRunHistoryItem) => void;
  onDelete: (target: HistoryDeleteTarget) => void;
  onGoToBefore: () => void;
}) {
  return (
    <li className={styles.historyItem}>
      <article className={styles.historyGroupedCard}>
        <div className={styles.historyCardTop}>
          <div className={styles.historyCardTitleGroup}>
            <p className={styles.historyCardEyebrow}>Before situation summary</p>
            <h4 className={styles.historyCardTitle}>Before 상황 요약</h4>
          </div>
          <HistoryDeleteButton
            label={`Before 기록 삭제: ${formatInlineText(
              job.summary,
              formatHistoryDateTime(job.created_at),
            )}`}
            isDeleting={isHistoryDeletePending(
              deletingTarget,
              'before',
              job.before_review_job_id,
            )}
            disabled={disabled || Boolean(deletingTarget)}
            onDelete={() => onDelete({ kind: 'before', id: job.before_review_job_id })}
          />
        </div>

        <HistorySummaryBlock
          title="검토된 상황"
          body={job.summary}
          fallback="요약이 없는 Before 검토입니다."
        />

        <dl className={styles.historyMetaGrid}>
          <HistoryMeta label="검토 상태" value={formatBeforeJobStatus(job.status)} />
          <HistoryMeta label="검토 판정" value={formatOverallResult(job.overall_result)} />
          <HistoryMeta label="심각도" value={formatSeverity(job.overall_severity)} />
          <HistoryMeta label="업데이트" value={formatHistoryDateTime(job.updated_at)} />
          <HistoryMeta
            label="Bridge"
            value={bridgeRuns.length > 0 || job.has_bridge_run ? '있음' : '없음'}
          />
        </dl>

        <section className={styles.historyBridgeSection} aria-label="연결된 Bridge 기록">
          <div className={styles.historyBridgeSectionHeader}>
            <div>
              <p className={styles.historyCardEyebrow}>Bridge law/risk explanation</p>
              <h5 className={styles.historyBridgeSectionTitle}>연결된 Bridge 기록</h5>
            </div>
            <span className={styles.historyColumnCount}>{bridgeRuns.length}건</span>
          </div>

          {bridgeRuns.length === 0 ? (
            <>
              <p className={styles.historyBridgeEmpty}>연결된 Bridge 기록 없음</p>
              <p className={styles.beforeBridgeHint}>
                {getBeforeBridgeHint(job, bridgeRuns.length)}
              </p>
              {job.status === 'completed' ? (
                <button
                  className={styles.beforeBridgeLinkButton}
                  type="button"
                  onClick={onGoToBefore}
                  disabled={disabled || Boolean(deletingTarget)}
                >
                  Before에서 Bridge 연결
                </button>
              ) : null}
            </>
          ) : (
            <ol className={styles.historyBridgeList}>
              {bridgeRuns.map((bridgeRun) => (
                <li className={styles.historyBridgeItem} key={bridgeRun.bridge_run_id}>
                  <HistoryBridgeSummary
                    bridgeRun={bridgeRun}
                    selectedBridgeRunIds={selectedBridgeRunIds}
                    deletingTarget={deletingTarget}
                    disabled={disabled}
                    onSelectBridge={onSelectBridge}
                    onDelete={onDelete}
                  />
                </li>
              ))}
            </ol>
          )}
        </section>
      </article>
    </li>
  );
}

function BridgeOnlyHistoryGroupCard({
  bridgeRun,
  selectedBridgeRunIds,
  deletingTarget,
  disabled,
  onSelectBridge,
  onDelete,
}: {
  bridgeRun: BridgeRunHistoryItem;
  selectedBridgeRunIds: Set<string>;
  deletingTarget: HistoryDeleteTarget | null;
  disabled: boolean;
  onSelectBridge: (bridgeRun: BridgeRunHistoryItem) => void;
  onDelete: (target: HistoryDeleteTarget) => void;
}) {
  return (
    <li className={styles.historyItem}>
      <article className={styles.historyGroupedCard}>
        <div className={styles.historyCardTop}>
          <div className={styles.historyCardTitleGroup}>
            <p className={styles.historyCardEyebrow}>Before-linked Bridge</p>
            <h4 className={styles.historyCardTitle}>Before 기록 범위 밖 Bridge 요약</h4>
          </div>
        </div>

        <p className={styles.beforeBridgeHint}>
          연결된 Before 상황 요약은 현재 목록에서 표시할 수 없습니다. 아래 Bridge 요약만 참고 맥락으로 사용합니다.
        </p>

        <section className={styles.historyBridgeSection} aria-label="표시 가능한 Bridge 기록">
          <HistoryBridgeSummary
            bridgeRun={bridgeRun}
            selectedBridgeRunIds={selectedBridgeRunIds}
            deletingTarget={deletingTarget}
            disabled={disabled}
            onSelectBridge={onSelectBridge}
            onDelete={onDelete}
          />
        </section>
      </article>
    </li>
  );
}

function HistoryBridgeSummary({
  bridgeRun,
  selectedBridgeRunIds,
  deletingTarget,
  disabled,
  onSelectBridge,
  onDelete,
}: {
  bridgeRun: BridgeRunHistoryItem;
  selectedBridgeRunIds: Set<string>;
  deletingTarget: HistoryDeleteTarget | null;
  disabled: boolean;
  onSelectBridge: (bridgeRun: BridgeRunHistoryItem) => void;
  onDelete: (target: HistoryDeleteTarget) => void;
}) {
  const displayFields = getBridgeHistoryDisplayFields(bridgeRun);
  const isSelected = selectedBridgeRunIds.has(bridgeRun.bridge_run_id);

  return (
    <article
      className={
        isSelected
          ? `${styles.historyBridgeSummary} ${styles.historyBridgeSummarySelected}`
          : styles.historyBridgeSummary
      }
      aria-label={isSelected ? '이번 질문에 포함된 Bridge 기록' : '선택 가능한 Bridge 기록'}
    >
      <div className={styles.historyCardTop}>
        <div className={styles.historyCardTitleGroup}>
          <p className={styles.historyCardEyebrow}>Bridge summary</p>
          <h5 className={styles.historyCardTitle}>Bridge 요약</h5>
        </div>
        {isSelected ? (
          <span className={styles.historySelectedPill}>이번 질문에 포함됨</span>
        ) : null}
        <HistoryDeleteButton
          label={`Bridge 기록 삭제: ${formatInlineText(
            displayFields.userVisibleSummary,
            formatHistoryDateTime(bridgeRun.created_at),
          )}`}
          isDeleting={isHistoryDeletePending(
            deletingTarget,
            'bridge',
            bridgeRun.bridge_run_id,
          )}
          disabled={disabled || Boolean(deletingTarget)}
          onDelete={() => onDelete({ kind: 'bridge', id: bridgeRun.bridge_run_id })}
        />
      </div>

      <HistorySummaryBlock
        title="Bridge 요약"
        body={displayFields.userVisibleSummary}
        fallback="Bridge 요약이 없습니다."
      />

      <div className={styles.historyBridgeInsight}>
        <p className={styles.historyBridgeInsightTitle}>
          Bridge가 정리한 법 조항 / 위험 설명
        </p>
        <div className={styles.historyMetaStack}>
          <HistoryTagList title="위험·쟁점" values={displayFields.issueLabels} />
          <HistoryTagList title="법 조항 후보" values={displayFields.lawRefs} />
          <HistoryActionList values={displayFields.recommendedNextActions} />
        </div>
      </div>

      <dl className={styles.historyMetaGrid}>
        <HistoryMeta label="저장 시각" value={formatHistoryDateTime(bridgeRun.created_at)} />
        <HistoryMeta label="최근 갱신" value={formatHistoryDateTime(bridgeRun.updated_at)} />
      </dl>

      <div className={styles.historyCardFooter}>
        <span className={styles.historyDate}>표시된 요약만 포함</span>
        <button
          className={isSelected ? styles.historySelectButtonSelected : styles.historySelectButton}
          type="button"
          aria-pressed={isSelected}
          onClick={() => onSelectBridge(bridgeRun)}
          disabled={disabled || Boolean(deletingTarget) || isSelected}
        >
          {isSelected ? '이미 포함됨' : '이번 질문에 포함'}
        </button>
      </div>
    </article>
  );
}

function HistorySummaryBlock({
  title,
  body,
  fallback,
}: {
  title: string;
  body: string | null | undefined;
  fallback: string;
}) {
  return (
    <div className={styles.historySummaryBlock}>
      <p className={styles.historySummaryLabel}>{title}</p>
      <p className={styles.historySummaryBody}>
        {formatInlineText(body, fallback)}
      </p>
    </div>
  );
}

function HistoryDeleteButton({
  label,
  isDeleting,
  disabled,
  onDelete,
}: {
  label: string;
  isDeleting: boolean;
  disabled: boolean;
  onDelete: () => void;
}) {
  return (
    <button
      className={styles.historyDeleteButton}
      type="button"
      onClick={onDelete}
      disabled={disabled}
      aria-label={label}
    >
      <Trash2 size={15} aria-hidden="true" />
      {isDeleting ? '처리 중' : '목록에서 삭제'}
    </button>
  );
}

function HistoryTagList({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className={styles.historyTagGroup}>
      <p className={styles.historyTagTitle}>{title}</p>
      <ul className={styles.historyTagList}>
        {values.map((value, index) => (
          <li className={styles.historyTag} key={`${title}-${value}-${index}`}>
            {formatInlineText(value, '확인 필요')}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HistoryActionList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className={styles.historyActionGroup}>
      <p className={styles.historyTagTitle}>권장 다음 행동</p>
      <ul className={styles.historyActionList}>
        {values.map((value, index) => (
          <li key={`${value}-${index}`}>{formatInlineText(value, '확인 필요')}</li>
        ))}
      </ul>
    </div>
  );
}

function HistoryMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.historyMetaItem}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function buildAfterHistoryGroups(
  beforeJobs: BeforeReviewJobHistoryItem[],
  bridgeRuns: BridgeRunHistoryItem[],
  bridgeRunsByBeforeId: Map<string, BridgeRunHistoryItem[]>,
): AfterHistoryGroup[] {
  const visibleBeforeIds = new Set(
    beforeJobs.map((job) => job.before_review_job_id),
  );
  const beforeGroups: AfterHistoryGroup[] = beforeJobs.map((beforeJob) => ({
    kind: 'before',
    beforeJob,
    bridgeRuns: bridgeRunsByBeforeId.get(beforeJob.before_review_job_id) ?? [],
  }));
  const bridgeOnlyGroups: AfterHistoryGroup[] = bridgeRuns
    .filter(
      (bridgeRun) =>
        !bridgeRun.before_review_job_id ||
        !visibleBeforeIds.has(bridgeRun.before_review_job_id),
    )
    .map((bridgeRun) => ({
      kind: 'bridge-only',
      bridgeRun,
    }));

  return [...beforeGroups, ...bridgeOnlyGroups];
}

function getAfterHistoryNotice(input: {
  firebaseConfigured: boolean;
  isAuthBusy: boolean;
  hasFirebaseSession: boolean;
  isAuthenticated: boolean;
  status: Scn001AfterHistoryStatus;
  errorMessage: string | null;
  mutationMessage: HistoryMutationMessage | null;
  beforeJobs: BeforeReviewJobHistoryItem[];
  bridgeRuns: BridgeRunHistoryItem[];
}): { kind: 'notice' | 'error'; message: string; canRetry: boolean } | null {
  if (!input.firebaseConfigured) {
    return {
      kind: 'notice',
      message: 'Firebase 설정 후 로그인하면 이전 Before/Bridge 기록을 사용할 수 있습니다.',
      canRetry: false,
    };
  }

  if (input.isAuthBusy) {
    return {
      kind: 'notice',
      message: '로그인 상태를 확인하는 중입니다.',
      canRetry: false,
    };
  }

  if (!input.isAuthenticated) {
    if (input.hasFirebaseSession) {
      return {
        kind: 'error',
        message: SCN001_AFTER_HISTORY_BACKEND_AUTH_MESSAGE,
        canRetry: true,
      };
    }

    return {
      kind: 'notice',
      message: 'Google 로그인 후 이전 Before/Bridge 기록을 선택할 수 있습니다.',
      canRetry: false,
    };
  }

  if (input.status === 'loading') {
    return {
      kind: 'notice',
      message: '기록을 불러오는 중입니다.',
      canRetry: false,
    };
  }

  if (input.status === 'error') {
    return {
      kind: 'error',
      message: input.errorMessage ?? '기록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      canRetry: true,
    };
  }

  if (input.status === 'success' && input.mutationMessage) {
    return {
      kind: input.mutationMessage.kind,
      message: input.mutationMessage.message,
      canRetry: false,
    };
  }

  if (
    input.status === 'success' &&
    input.beforeJobs.length === 0 &&
    input.bridgeRuns.length === 0
  ) {
    return {
      kind: 'notice',
      message: '아직 이 계정에 저장된 Before 또는 Bridge 기록이 없습니다.',
      canRetry: true,
    };
  }

  return null;
}

function getAfterHistoryGateMessage(input: {
  firebaseConfigured: boolean;
  isAuthBusy: boolean;
  hasFirebaseSession: boolean;
}): string {
  if (!input.firebaseConfigured) {
    return 'Firebase 설정 후 로그인하면 이전 기록을 불러올 수 있습니다.';
  }

  if (input.isAuthBusy) {
    return '로그인 상태를 확인하는 중입니다.';
  }

  if (input.hasFirebaseSession) {
    return SCN001_AFTER_HISTORY_BACKEND_AUTH_MESSAGE;
  }

  return '로그인하지 않아도 SCN-004 질문과 프리셋은 그대로 사용할 수 있습니다.';
}

function bridgeHistoryItemToHandoffItem(
  bridgeRun: BridgeRunHistoryItem,
): BridgeHandoffItem {
  return {
    bridge_run_id: bridgeRun.bridge_run_id,
    scenario_id: 'SCN-001',
    user_visible_summary:
      optionalText(bridgeRun.user_visible_summary) ?? 'Before 검토 요약이 제공되지 않았습니다.',
    issue_categories: normalizeVisibleValues(bridgeRun.issue_categories),
    risk_tags: normalizeVisibleValues(bridgeRun.risk_tags),
    law_refs: normalizeVisibleValues(bridgeRun.law_refs),
    recommended_next_actions: normalizeVisibleValues(
      bridgeRun.recommended_next_actions,
    ),
    after_query_seed: null,
    include_in_query: true,
  };
}

function getBridgeHistoryDisplayFields(bridgeRun: BridgeRunHistoryItem) {
  return getBridgeHandoffDisplayFields(bridgeHistoryItemToHandoffItem(bridgeRun));
}

function getBeforeBridgeHint(
  job: BeforeReviewJobHistoryItem,
  linkedBridgeRunCount: number,
): string {
  if (linkedBridgeRunCount > 0) {
    return '연결된 Bridge 기록은 이 카드에서 바로 선택할 수 있습니다.';
  }

  if (job.has_bridge_run) {
    return '연결된 Bridge 기록이 최근 목록에 보이지 않으면 Before 화면에서 다시 확인해주세요.';
  }

  if (job.status === 'completed') {
    return 'Bridge 기록이 아직 없습니다. 이번 slice에서는 Before 화면에서 Bridge 연결을 만든 뒤 사용할 수 있습니다.';
  }

  return '완료된 Before 기록만 Bridge 연결 후보가 됩니다.';
}

function getScn001HistoryErrorMessage(error: unknown): string {
  if (error instanceof Scn001HistoryApiError) {
    if (error.status === 401) {
      return '로그인 후 기록을 볼 수 있습니다. 다시 로그인한 뒤 시도해주세요.';
    }

    if (error.status === 0 || error.status >= 500) {
      return '기록 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.';
    }

    return error.message;
  }

  return '기록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
}

function getScn001HistoryDeleteErrorMessage(error: unknown): string {
  if (error instanceof Scn001HistoryApiError && error.status === 401) {
    return '로그인 후 기록을 삭제할 수 있습니다. 다시 로그인한 뒤 시도해주세요.';
  }

  return '기록 삭제 요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.';
}

function getHistoryDeleteConfirmMessage(kind: HistoryDeleteKind): string {
  if (kind === 'before') {
    return '이 Before 기록을 목록에서 삭제할까요? 삭제 후 연결된 Bridge 후보도 보이지 않습니다.';
  }

  return '이 Bridge 기록을 목록에서 삭제할까요? 삭제 후 After 연결 후보에서 보이지 않습니다.';
}

function isHistoryDeletePending(
  target: HistoryDeleteTarget | null,
  kind: HistoryDeleteKind,
  id: string,
): boolean {
  return target?.kind === kind && target.id === id;
}

function formatBeforeJobStatus(status: string): string {
  switch (status) {
    case 'queued':
      return '대기';
    case 'running':
      return '분석 중';
    case 'completed':
      return '완료';
    case 'failed':
      return '실패';
    default:
      return formatInlineText(status, '확인 필요');
  }
}

function formatOverallResult(value: Scn001HistoryOverallResult | null): string {
  switch (value) {
    case 'PASS':
      return '문제 없음';
    case 'WARNING':
      return '주의';
    case 'VIOLATION':
      return '위반 가능';
    default:
      return '미정';
  }
}

function formatSeverity(value: Scn001HistorySeverity | null): string {
  switch (value) {
    case 'NONE':
      return '없음';
    case 'LOW':
      return '낮음';
    case 'MEDIUM':
      return '중간';
    case 'HIGH':
      return '높음';
    case 'CRITICAL':
      return '매우 높음';
    default:
      return '미정';
  }
}

function formatHistoryDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '확인 불가';
  }

  return date.toLocaleString('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatInlineText(value: string | null | undefined, fallback: string): string {
  return optionalInlineText(value) ?? fallback;
}

function normalizeVisibleValues(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.flatMap((value) => {
    const text = optionalInlineText(value);
    return text ? [text] : [];
  });
}

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.replace(/\r\n?/g, '\n').trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function optionalInlineText(value: string | null | undefined): string | undefined {
  return optionalText(value)?.replace(/\s+/g, ' ');
}

function getAnswerSubmissionError(error: unknown): {
  message: string;
  retryable: boolean;
} {
  if (error instanceof ApiError || error instanceof BridgeApiError) {
    return {
      message: error.message,
      retryable: error.retryable,
    };
  }

  return {
    message: '연결을 확인하고 다시 시도해주세요.',
    retryable: true,
  };
}
