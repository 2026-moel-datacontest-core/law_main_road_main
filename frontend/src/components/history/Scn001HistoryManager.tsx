'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useFlow } from '@/context/FlowContext';
import { getFirebaseAuth } from '@/lib/firebase';
import { filterVisibleScn001History } from '@/lib/scn001-history-display';
import {
  deleteBeforeReviewJobHistory,
  deleteBridgeRunHistory,
  fetchBeforeReviewHistory,
  fetchBridgeRunHistory,
  Scn001HistoryApiError,
} from '@/lib/scn001-history-api';
import type {
  BeforeReviewJobHistoryItem,
  BridgeRunHistoryItem,
  Scn001HistoryOverallResult,
  Scn001HistorySeverity,
} from '@/types/scn001-history';

import styles from './Scn001HistoryManager.module.css';

type Scn001HistoryStatus = 'idle' | 'loading' | 'success' | 'error';
type HistoryDeleteKind = 'before' | 'bridge';
type HistoryDeleteTarget = { kind: HistoryDeleteKind; id: string };
type HistoryMutationMessage = { kind: 'notice' | 'error'; message: string };

const SCN001_HISTORY_LIMIT = 30;
const SCN001_HISTORY_BACKEND_AUTH_MESSAGE =
  '서버 인증 확인이 완료되지 않아 기록을 불러올 수 없습니다. 인증 확인 또는 다시 로그인 후 시도해주세요.';

export function Scn001HistoryManager() {
  const { dispatch } = useFlow();
  const {
    firebaseConfigured,
    firebaseUser,
    backendUser,
    isInitializing,
    isSigningIn,
    isCheckingBackend,
    signInWithGoogle,
    refreshBackendAuth,
  } = useAuth();
  const [historyStatus, setHistoryStatus] = useState<Scn001HistoryStatus>('idle');
  const [historyErrorMessage, setHistoryErrorMessage] = useState<string | null>(null);
  const [beforeHistory, setBeforeHistory] = useState<BeforeReviewJobHistoryItem[]>([]);
  const [bridgeHistory, setBridgeHistory] = useState<BridgeRunHistoryItem[]>([]);
  const [historyRefreshNonce, setHistoryRefreshNonce] = useState(0);
  const [historyDeleteTarget, setHistoryDeleteTarget] =
    useState<HistoryDeleteTarget | null>(null);
  const [historyMutationMessage, setHistoryMutationMessage] =
    useState<HistoryMutationMessage | null>(null);

  const authBusy = isInitializing || isSigningIn || isCheckingBackend;
  const isBackendAuthenticated = backendUser.logged_in;

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
          fetchBeforeReviewHistory({ idToken, limit: SCN001_HISTORY_LIMIT }),
          fetchBridgeRunHistory({ idToken, limit: SCN001_HISTORY_LIMIT }),
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

  const notice = getScn001HistoryNotice({
    firebaseConfigured,
    isAuthBusy: authBusy,
    hasFirebaseSession: Boolean(firebaseUser),
    isAuthenticated: isBackendAuthenticated,
    status: historyStatus,
    errorMessage: historyErrorMessage,
    mutationMessage: historyMutationMessage,
    beforeJobs: beforeHistory,
    bridgeRuns: bridgeHistory,
  });

  const canShowSignInAction =
    firebaseConfigured && !authBusy && !firebaseUser && !isBackendAuthenticated;

  async function handleDeleteHistoryRecord(target: HistoryDeleteTarget) {
    if (historyDeleteTarget) {
      return;
    }

    if (!window.confirm(getHistoryDeleteConfirmMessage(target.kind))) {
      return;
    }

    if (!backendUser.logged_in) {
      setHistoryMutationMessage({
        kind: 'error',
        message: SCN001_HISTORY_BACKEND_AUTH_MESSAGE,
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
        message: '기록을 삭제하고 목록을 새로고침했습니다.',
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

  return (
    <section className={styles.panel} aria-labelledby="history-page-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>SCN-001 history</p>
          <h2 id="history-page-title" className={styles.title}>
            내 Before / Bridge 기록
          </h2>
          <p className={styles.description}>
            완료되어 다시 확인할 수 있는 Before 검토와 Bridge 연결 기록만 표시합니다.
          </p>
        </div>
        <span className={styles.visibilityPill}>완료/표시 가능</span>
      </div>

      {notice ? (
        <div
          className={notice.kind === 'error' ? styles.error : styles.notice}
          role={notice.kind === 'error' ? 'alert' : 'status'}
        >
          <span>{notice.message}</span>
          <div className={styles.noticeActions}>
            {canShowSignInAction ? (
              <button
                className={styles.noticeButton}
                type="button"
                onClick={() => void signInWithGoogle()}
              >
                Google 로그인
              </button>
            ) : null}
            {notice.canRetry ? (
              <button className={styles.noticeButton} type="button" onClick={retryHistoryLoad}>
                <RefreshCw size={16} aria-hidden="true" />
                다시 시도
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {isBackendAuthenticated && historyStatus === 'success' ? (
        <div className={styles.columns}>
          <BeforeHistoryList
            jobs={beforeHistory}
            deletingTarget={historyDeleteTarget}
            onDelete={(target) => void handleDeleteHistoryRecord(target)}
          />
          <BridgeHistoryList
            bridgeRuns={bridgeHistory}
            deletingTarget={historyDeleteTarget}
            onDelete={(target) => void handleDeleteHistoryRecord(target)}
          />
        </div>
      ) : null}
    </section>
  );
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

function BeforeHistoryList({
  jobs,
  deletingTarget,
  onDelete,
}: {
  jobs: BeforeReviewJobHistoryItem[];
  deletingTarget: HistoryDeleteTarget | null;
  onDelete: (target: HistoryDeleteTarget) => void;
}) {
  return (
    <section className={styles.column} aria-label="Before review job 기록">
      <div className={styles.columnHeader}>
        <h3 className={styles.columnTitle}>Before review job</h3>
        <span className={styles.count}>{jobs.length}건</span>
      </div>

      {jobs.length === 0 ? (
        <p className={styles.empty}>표시할 완료 Before 기록이 없습니다.</p>
      ) : (
        <ol className={styles.list}>
          {jobs.map((job) => (
            <li className={styles.item} key={job.before_review_job_id}>
              <article className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardTitleGroup}>
                    <p className={styles.cardEyebrow}>Before review job</p>
                    <strong className={styles.beforeSummary}>
                      {formatInlineText(job.summary, '요약이 없는 Before 검토입니다.')}
                    </strong>
                  </div>
                  <div className={styles.cardActions}>
                    <span className={styles.statusPill}>{formatBeforeJobStatus(job.status)}</span>
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
                      disabled={Boolean(deletingTarget)}
                      onDelete={() =>
                        onDelete({ kind: 'before', id: job.before_review_job_id })
                      }
                    />
                  </div>
                </div>

                <dl className={styles.metaGrid}>
                  <HistoryMeta label="판정" value={formatOverallResult(job.overall_result)} />
                  <HistoryMeta label="심각도" value={formatSeverity(job.overall_severity)} />
                  <HistoryMeta label="Bridge 연결" value={job.has_bridge_run ? '있음' : '없음'} />
                  <HistoryMeta label="생성" value={formatHistoryDateTime(job.created_at)} />
                  <HistoryMeta label="업데이트" value={formatHistoryDateTime(job.updated_at)} />
                </dl>
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function BridgeHistoryList({
  bridgeRuns,
  deletingTarget,
  onDelete,
}: {
  bridgeRuns: BridgeRunHistoryItem[];
  deletingTarget: HistoryDeleteTarget | null;
  onDelete: (target: HistoryDeleteTarget) => void;
}) {
  return (
    <section className={styles.column} aria-label="Bridge run 기록">
      <div className={styles.columnHeader}>
        <h3 className={styles.columnTitle}>Bridge run</h3>
        <span className={styles.count}>{bridgeRuns.length}건</span>
      </div>

      {bridgeRuns.length === 0 ? (
        <p className={styles.empty}>표시할 Bridge 기록이 없습니다.</p>
      ) : (
        <ol className={styles.list}>
          {bridgeRuns.map((bridgeRun) => (
            <li className={styles.item} key={bridgeRun.bridge_run_id}>
              <article className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardTitleGroup}>
                    <p className={styles.cardEyebrow}>Bridge run</p>
                    <p className={styles.bridgeSummary}>
                      {formatInlineText(bridgeRun.user_visible_summary, 'Bridge 요약이 없습니다.')}
                    </p>
                  </div>
                  <HistoryDeleteButton
                    label={`Bridge 기록 삭제: ${formatInlineText(
                      bridgeRun.user_visible_summary,
                      formatHistoryDateTime(bridgeRun.created_at),
                    )}`}
                    isDeleting={isHistoryDeletePending(
                      deletingTarget,
                      'bridge',
                      bridgeRun.bridge_run_id,
                    )}
                    disabled={Boolean(deletingTarget)}
                    onDelete={() =>
                      onDelete({ kind: 'bridge', id: bridgeRun.bridge_run_id })
                    }
                  />
                </div>

                <HistoryTagList
                  label="이슈"
                  values={
                    bridgeRun.issue_categories.length > 0
                      ? bridgeRun.issue_categories
                      : bridgeRun.risk_tags
                  }
                />
                <HistoryTagList label="법령 근거" values={bridgeRun.law_refs} />

                {bridgeRun.recommended_next_actions.length > 0 ? (
                  <div className={styles.actionBlock}>
                    <p className={styles.metaLabel}>권장 다음 단계</p>
                    <ul className={styles.actionList}>
                      {bridgeRun.recommended_next_actions.map((action, index) => (
                        <li key={`${bridgeRun.bridge_run_id}-action-${index}`}>
                          {formatInlineText(action, '확인 필요')}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <dl className={styles.metaGrid}>
                  <HistoryMeta label="생성" value={formatHistoryDateTime(bridgeRun.created_at)} />
                  <HistoryMeta label="업데이트" value={formatHistoryDateTime(bridgeRun.updated_at)} />
                </dl>
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
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
      className={styles.deleteButton}
      type="button"
      onClick={onDelete}
      disabled={disabled}
      aria-label={label}
    >
      <Trash2 size={15} aria-hidden="true" />
      {isDeleting ? '삭제 중' : '삭제'}
    </button>
  );
}

function HistoryTagList({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className={styles.tagBlock}>
      <p className={styles.metaLabel}>{label}</p>
      <ul className={styles.tagList}>
        {values.map((value, index) => (
          <li className={styles.tag} key={`${label}-${value}-${index}`}>
            {formatInlineText(value, '확인 필요')}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HistoryMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaItem}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function getScn001HistoryNotice(input: {
  firebaseConfigured: boolean;
  isAuthBusy: boolean;
  hasFirebaseSession: boolean;
  isAuthenticated: boolean;
  status: Scn001HistoryStatus;
  errorMessage: string | null;
  mutationMessage: HistoryMutationMessage | null;
  beforeJobs: BeforeReviewJobHistoryItem[];
  bridgeRuns: BridgeRunHistoryItem[];
}): {
  kind: 'notice' | 'error';
  message: string;
  canRetry: boolean;
} | null {
  if (!input.firebaseConfigured) {
    return {
      kind: 'notice',
      message: 'Firebase 설정 후 로그인하면 이전 Before 검토와 Bridge 연결 기록을 볼 수 있습니다.',
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
        message: SCN001_HISTORY_BACKEND_AUTH_MESSAGE,
        canRetry: true,
      };
    }

    return {
      kind: 'notice',
      message: 'Google 로그인 후 이전 Before 검토와 Bridge 연결 기록을 볼 수 있습니다.',
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
      message: '표시할 완료 Before 또는 Bridge 기록이 없습니다.',
      canRetry: true,
    };
  }

  return null;
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
    return '이 Before 기록을 목록에서 삭제할까요? 삭제 후 기록 목록과 After 연결 후보에서 보이지 않습니다.';
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
  const trimmed = value?.replace(/\s+/g, ' ').trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}
