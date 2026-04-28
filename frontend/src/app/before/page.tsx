'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AccessibilityPanel } from '@/components/before/AccessibilityPanel';
import { LoadingPanel } from '@/components/before/LoadingPanel';
import { ResultPanel } from '@/components/before/ResultPanel';
import { UploadPanel } from '@/components/before/UploadPanel';
import { Masthead } from '@/components/layout/Masthead';
import { Button } from '@/components/ui/Button';
import { DisclaimerBanner } from '@/components/ui/DisclaimerBanner';
import { Notification } from '@/components/ui/Notification';
import { SkipLink } from '@/components/ui/SkipLink';
import { useAuth } from '@/context/AuthContext';
import { useFlow } from '@/context/FlowContext';
import {
  BeforeApiError,
  fetchBeforeAccessibility,
  getBeforeReviewJob,
  loadBeforeMockAccessibility,
  loadBeforeMockReview,
  startBeforeReviewJob,
} from '@/lib/before-api';
import { BridgeApiError, bridgeRunToHandoffItem, createBridgeRun } from '@/lib/bridge-api';
import { getFirebaseAuth } from '@/lib/firebase';
import type {
  BeforeAccessibilityRecommendation,
  BeforeDisabilityType,
  BeforeMockScenario,
  BeforeReviewJob,
  BeforeReviewResult,
  BeforeScreenState,
} from '@/types/before';

import styles from './page.module.css';

const mockLoadingSteps = [
  { key: 'file_validation', label: '파일 확인', message: '업로드 형식과 페이지 구성을 확인합니다.' },
  { key: 'ocr', label: 'OCR 추출', message: '계약서 본문을 구조화합니다.' },
  { key: 'section_compare', label: '계약 항목 비교', message: '표준 항목과 실제 조항을 대조합니다.' },
  { key: 'rule_validation', label: '수치 검증', message: '임금, 시간, 휴게 조건을 검토합니다.' },
  { key: 'explanation', label: '설명 생성', message: '사용자용 설명과 결과 요약을 만듭니다.' },
] as const;

type BridgeActionStatus = 'idle' | 'loading' | 'success' | 'error';

const BEFORE_ANALYZE_LOGIN_REQUIRED_MESSAGE =
  'Before 계약서 분석은 Google 로그인이 필요합니다. 로그인 후 다시 시도해주세요.';
const BEFORE_ANALYZE_AUTH_CHECKING_MESSAGE =
  '로그인 상태를 확인하는 중입니다. 잠시 후 다시 시도해주세요.';
const BEFORE_ANALYZE_FIREBASE_CONFIG_MESSAGE =
  'Before 계약서 분석에는 Firebase 설정이 필요합니다. Firebase public web config 설정 후 다시 시도해주세요.';
const BEFORE_ANALYZE_BACKEND_AUTH_MESSAGE =
  '서버 인증 확인이 완료되지 않았습니다. 인증 확인 또는 다시 로그인 후 분석을 시작해주세요.';
const BRIDGE_BACKEND_AUTH_MESSAGE =
  '서버 인증 확인이 완료되지 않아 After 연결을 만들 수 없습니다. 인증 확인 또는 다시 로그인 후 시도해주세요.';
const BEFORE_JOB_GENERAL_FAILURE_MESSAGE =
  '계약서 분석 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
const BEFORE_JOB_OCR_QUOTA_FAILURE_MESSAGE =
  'OCR 요청 한도가 일시적으로 초과되었습니다. 잠시 후 다시 시도해주세요.';
const BEFORE_JOB_OCR_TIMEOUT_FAILURE_MESSAGE =
  'OCR 응답 시간이 초과되어 분석을 중단했습니다. 잠시 후 다시 시도해주세요.';
const OCR_QUOTA_ERROR_PATTERNS = [/429/i, /resource exhausted/i, /quota/i, /rate limit/i];
const OCR_TIMEOUT_ERROR_PATTERNS = [
  /timeout/i,
  /timed out/i,
  /hard wall-clock timeout/i,
  /응답 시간이 초과/i,
  /시간이 초과/i,
];

function createMockJob(): BeforeReviewJob {
  const now = new Date().toISOString();

  return {
    job_id: 'before-mock-job',
    status: 'running',
    created_at: now,
    updated_at: now,
    steps: mockLoadingSteps.map((step, index) => ({
      key: step.key,
      label: step.label,
      order: index + 1,
      status: index === 0 ? 'running' : 'pending',
      message: index === 0 ? step.message : null,
    })),
    error: null,
  };
}

function advanceMockJob(job: BeforeReviewJob): BeforeReviewJob {
  const currentIndex = job.steps.findIndex((step) => step.status === 'running');

  if (currentIndex === -1) {
    return job;
  }

  return {
    ...job,
    updated_at: new Date().toISOString(),
    steps: job.steps.map((step, index) => {
      if (index < currentIndex) {
        return { ...step, status: 'completed', message: step.message ?? null };
      }

      if (index === currentIndex) {
        return { ...step, status: 'completed', message: step.message ?? null };
      }

      if (index === currentIndex + 1) {
        return { ...step, status: 'running', message: mockLoadingSteps[index].message };
      }

      return step;
    }),
  };
}

export default function BeforePage() {
  const router = useRouter();
  const { dispatch } = useFlow();
  const {
    firebaseConfigured,
    firebaseUser,
    backendUser,
    isInitializing,
    isSigningIn,
    isCheckingBackend,
    errorMessage: authErrorMessage,
    signInWithGoogle,
    refreshBackendAuth,
  } = useAuth();
  const uploadRef = useRef<HTMLElement | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const [screenState, setScreenState] = useState<BeforeScreenState>('home');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loadingJob, setLoadingJob] = useState<BeforeReviewJob | null>(null);
  const [completedReviewJobId, setCompletedReviewJobId] = useState<string | null>(null);
  const [review, setReview] = useState<BeforeReviewResult | null>(null);
  const [selectedDisability, setSelectedDisability] = useState<BeforeDisabilityType | null>(null);
  const [accessibility, setAccessibility] = useState<BeforeAccessibilityRecommendation | null>(null);
  const [accessibilityError, setAccessibilityError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccessibilityLoading, setIsAccessibilityLoading] = useState(false);
  const [isBridgeSubmitting, setIsBridgeSubmitting] = useState(false);
  const [bridgeActionStatus, setBridgeActionStatus] = useState<BridgeActionStatus>('idle');
  const [bridgeActionMessage, setBridgeActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [beforeAnalyzeAuthMessage, setBeforeAnalyzeAuthMessage] = useState<string | null>(null);
  const authBusy = isInitializing || isSigningIn || isCheckingBackend;
  const hasBridgeJobId = Boolean(completedReviewJobId);
  const isBackendAuthenticated = backendUser.logged_in;
  const isBridgeAuthenticated = isBackendAuthenticated;
  const shouldShowBeforeAuthSignInAction =
    (beforeAnalyzeAuthMessage === BEFORE_ANALYZE_LOGIN_REQUIRED_MESSAGE ||
      beforeAnalyzeAuthMessage === BEFORE_ANALYZE_BACKEND_AUTH_MESSAGE) &&
    firebaseConfigured &&
    !authBusy;

  const overviewCards = useMemo(() => {
    if (!review) {
      return [];
    }

    return [
      { label: '판정', value: review.overall_result },
      { label: '심각도', value: review.overall_severity },
      { label: '계약 유형', value: review.contract_info.type },
      { label: '검토 시각', value: new Date(review.reviewed_at).toLocaleString('ko-KR') },
    ];
  }, [review]);

  useEffect(() => {
    if (screenState === 'loading') {
      uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (screenState === 'result') {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [screenState]);

  useEffect(() => {
    if (!loadingJob) {
      return;
    }

    if (loadingJob.job_id === 'before-mock-job') {
      return;
    }

    if (loadingJob.status === 'completed') {
      if (loadingJob.result) {
        setReview(loadingJob.result);
        setCompletedReviewJobId(loadingJob.job_id);
        setScreenState('result');
      } else {
        setErrorMessage('분석은 완료되었지만 결과를 불러오지 못했습니다.');
        setCompletedReviewJobId(null);
        setScreenState('home');
      }
      setLoadingJob(null);
      setIsSubmitting(false);
      return;
    }

    if (loadingJob.status === 'failed') {
      finishFailedBeforeJob(loadingJob);
      return;
    }

    let cancelled = false;
    const timerId = window.setTimeout(async () => {
      try {
        const nextJob = await getBeforeReviewJob(loadingJob.job_id);
        if (!cancelled) {
          if (nextJob.status === 'failed') {
            finishFailedBeforeJob(nextJob);
            return;
          }

          setLoadingJob(nextJob);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message =
          error instanceof BeforeApiError
            ? error.message
            : '계약서 분석 상태를 불러오지 못했습니다.';
        setErrorMessage(message);
        setScreenState('home');
        setLoadingJob(null);
        setCompletedReviewJobId(null);
        setIsSubmitting(false);
      }
    }, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [loadingJob]);

  useEffect(() => {
    if (isBackendAuthenticated) {
      setBeforeAnalyzeAuthMessage(null);
    }
  }, [isBackendAuthenticated]);

  function handleFilesChange(files: File[]) {
    setSelectedFiles(files);
    setBeforeAnalyzeAuthMessage(null);
  }

  async function runMockReview(scenario: BeforeMockScenario) {
    setErrorMessage(null);
    setBeforeAnalyzeAuthMessage(null);
    clearBridgeActionFeedback();
    setCompletedReviewJobId(null);
    setIsSubmitting(true);
    setScreenState('loading');
    setAccessibility(null);
    setAccessibilityError(null);
    setSelectedDisability(null);
    const initialJob = createMockJob();
    setLoadingJob(initialJob);

    const intervalId = window.setInterval(() => {
      setLoadingJob((currentJob) => {
        if (!currentJob) {
          return currentJob;
        }

        return advanceMockJob(currentJob);
      });
    }, 220);

    try {
      const nextReview = await loadBeforeMockReview(scenario);
      window.clearInterval(intervalId);
      setReview(nextReview);
      setCompletedReviewJobId(null);
      setScreenState('result');
    } catch {
      window.clearInterval(intervalId);
      setErrorMessage('before mock 결과를 불러오지 못했습니다.');
      setCompletedReviewJobId(null);
      setScreenState('home');
    } finally {
      setLoadingJob(null);
      setIsSubmitting(false);
    }
  }

  async function handleAnalyze() {
    if (!selectedFiles.length) {
      setBeforeAnalyzeAuthMessage(null);
      setErrorMessage('먼저 분석할 파일을 추가해 주세요.');
      return;
    }

    const authGateMessage = getBeforeAnalyzeAuthGateMessage();
    if (authGateMessage) {
      setErrorMessage(null);
      setBeforeAnalyzeAuthMessage(authGateMessage);
      return;
    }

    setErrorMessage(null);
    setBeforeAnalyzeAuthMessage(null);
    clearBridgeActionFeedback();
    setIsSubmitting(true);
    setScreenState('loading');
    setAccessibility(null);
    setAccessibilityError(null);
    setSelectedDisability(null);
    setReview(null);
    setCompletedReviewJobId(null);

    try {
      const job = await startBeforeReviewJobWithOptionalAuth(selectedFiles);
      if (job.status === 'failed') {
        finishFailedBeforeJob(job);
        return;
      }

      setLoadingJob(job);
    } catch (error) {
      const message =
        error instanceof BeforeApiError
          ? error.message
          : '계약서 분석 작업 생성에 실패했습니다.';
      setErrorMessage(message);
      setScreenState('home');
      setLoadingJob(null);
      setCompletedReviewJobId(null);
      setIsSubmitting(false);
    }
  }

  async function handleLoadMock(scenario: BeforeMockScenario) {
    await runMockReview(scenario);
  }

  async function startBeforeReviewJobWithOptionalAuth(
    files: File[],
  ): Promise<BeforeReviewJob> {
    const currentUser = getFirebaseAuth()?.currentUser ?? null;

    if (!currentUser) {
      if (firebaseUser) {
        throw new BeforeApiError(
          401,
          '로그인 상태를 확인하지 못했습니다. 다시 로그인한 뒤 분석을 시작해주세요.',
        );
      }

      throw new BeforeApiError(401, BEFORE_ANALYZE_LOGIN_REQUIRED_MESSAGE);
    }

    if (!backendUser.logged_in) {
      throw new BeforeApiError(401, BEFORE_ANALYZE_BACKEND_AUTH_MESSAGE);
    }

    const idToken = await getCurrentBeforeJobIdToken(false);

    try {
      return await startBeforeReviewJob(files, idToken);
    } catch (error) {
      if (error instanceof BeforeApiError && error.status === 401) {
        const refreshedIdToken = await getCurrentBeforeJobIdToken(true);
        return startBeforeReviewJob(files, refreshedIdToken);
      }

      throw error;
    }
  }

  async function getCurrentBeforeJobIdToken(forceRefresh: boolean): Promise<string> {
    const currentUser = getFirebaseAuth()?.currentUser ?? null;

    if (!currentUser) {
      throw new BeforeApiError(
        401,
        '로그인 상태를 확인하지 못했습니다. 다시 로그인한 뒤 분석을 시작해주세요.',
      );
    }

    try {
      return await currentUser.getIdToken(forceRefresh);
    } catch {
      throw new BeforeApiError(
        401,
        '로그인 인증을 확인하지 못했습니다. 다시 로그인한 뒤 분석을 시작해주세요.',
      );
    }
  }

  async function handleSelectDisability(option: BeforeDisabilityType) {
    setSelectedDisability(option);
    setAccessibilityError(null);
    setIsAccessibilityLoading(true);

    try {
      const recommendation = review
        ? await fetchBeforeAccessibility(option, [])
        : await loadBeforeMockAccessibility(option);
      setAccessibility(recommendation);
    } catch (error) {
      if (review) {
        try {
          const fallback = await loadBeforeMockAccessibility(option);
          setAccessibility(fallback);
          setAccessibilityError(
            error instanceof BeforeApiError
              ? `${error.message} mock 안내를 대신 표시합니다.`
              : '장애 특화 안내를 불러오지 못해 mock 안내를 대신 표시합니다.',
          );
        } catch {
          setAccessibilityError('장애 특화 안내를 불러오지 못했습니다.');
        }
      } else {
        setAccessibilityError('장애 특화 안내를 불러오지 못했습니다.');
      }
    } finally {
      setIsAccessibilityLoading(false);
    }
  }

  function handleReset() {
    setScreenState('home');
    setSelectedFiles([]);
    setLoadingJob(null);
    setCompletedReviewJobId(null);
    setReview(null);
    setAccessibility(null);
    setSelectedDisability(null);
    setErrorMessage(null);
    setAccessibilityError(null);
    setIsSubmitting(false);
    setIsAccessibilityLoading(false);
    setIsBridgeSubmitting(false);
    setBeforeAnalyzeAuthMessage(null);
    clearBridgeActionFeedback();
  }

  function clearBridgeActionFeedback() {
    setBridgeActionStatus('idle');
    setBridgeActionMessage(null);
  }

  function finishFailedBeforeJob(job: BeforeReviewJob) {
    setErrorMessage(getBeforeJobFailureMessage(job));
    setScreenState('home');
    setLoadingJob(null);
    setCompletedReviewJobId(null);
    setIsSubmitting(false);
  }

  async function handleBridgeSignIn() {
    clearBridgeActionFeedback();
    await signInWithGoogle();
  }

  async function handleBeforeSignIn() {
    setErrorMessage(null);
    clearBridgeActionFeedback();
    await signInWithGoogle();
  }

  function getBeforeAnalyzeAuthGateMessage(): string | null {
    if (!firebaseConfigured) {
      return BEFORE_ANALYZE_FIREBASE_CONFIG_MESSAGE;
    }

    if (authBusy) {
      return BEFORE_ANALYZE_AUTH_CHECKING_MESSAGE;
    }

    if (!firebaseUser) {
      return BEFORE_ANALYZE_LOGIN_REQUIRED_MESSAGE;
    }

    if (!backendUser.logged_in) {
      return BEFORE_ANALYZE_BACKEND_AUTH_MESSAGE;
    }

    return null;
  }

  async function handleCreateBridgeRun() {
    if (!completedReviewJobId) {
      setBridgeActionStatus('error');
      setBridgeActionMessage(
        'Before 검토 작업 정보를 확인할 수 없습니다. 실제 검토 작업 완료 후 다시 시도해주세요.',
      );
      return;
    }

    const currentUser = getFirebaseAuth()?.currentUser ?? null;
    if (!currentUser) {
      setBridgeActionStatus('error');
      setBridgeActionMessage('After 연결에는 Google 로그인이 필요합니다.');
      return;
    }

    if (!backendUser.logged_in) {
      setBridgeActionStatus('error');
      setBridgeActionMessage(BRIDGE_BACKEND_AUTH_MESSAGE);
      return;
    }

    setIsBridgeSubmitting(true);
    setBridgeActionStatus('loading');
    setBridgeActionMessage(null);

    try {
      const response = await createBridgeRunWithCurrentToken(completedReviewJobId);
      const handoffItem = bridgeRunToHandoffItem(response);

      dispatch({ type: 'ADD_BRIDGE_HANDOFF_ITEM', payload: handoffItem });
      setBridgeActionStatus('success');
      setBridgeActionMessage('Bridge 연결을 저장했습니다. After로 이동합니다.');
      router.push('/after');
    } catch (error) {
      if (error instanceof BridgeApiError && error.status === 401) {
        void refreshBackendAuth({ forceRefresh: true });
      }

      setBridgeActionStatus('error');
      setBridgeActionMessage(getBridgeActionErrorMessage(error));
    } finally {
      setIsBridgeSubmitting(false);
    }
  }

  async function createBridgeRunWithCurrentToken(
    beforeReviewJobId: string,
  ) {
    const idToken = await getCurrentFirebaseIdToken(false);

    try {
      return await createBridgeRun({
        before_review_job_id: beforeReviewJobId,
        idToken,
      });
    } catch (error) {
      if (error instanceof BridgeApiError && error.status === 401) {
        const refreshedIdToken = await getCurrentFirebaseIdToken(true);
        return createBridgeRun({
          before_review_job_id: beforeReviewJobId,
          idToken: refreshedIdToken,
        });
      }

      throw error;
    }
  }

  async function getCurrentFirebaseIdToken(forceRefresh: boolean): Promise<string> {
    const currentUser = getFirebaseAuth()?.currentUser ?? null;

    if (!currentUser) {
      throw new BridgeApiError(
        401,
        'Bridge 연결에는 로그인이 필요합니다. 다시 로그인한 뒤 시도해주세요.',
        false,
      );
    }

    return currentUser.getIdToken(forceRefresh);
  }

  return (
    <>
      <SkipLink />
      <Masthead isLoading={isSubmitting || isBridgeSubmitting} />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section className={styles.heroSection} aria-labelledby="before-title">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Before service</p>
              <h1 id="before-title" className={styles.title}>
                근로계약서 분석 시작
              </h1>
              <p className={styles.lead}>
                계약서 파일을 추가하고 분석을 시작하면 진행 상태와 결과가 같은 흐름 안에서 이어집니다.
              </p>

              <div className={styles.badgeRow}>
                <span className={styles.documentBadge}>contract analysis</span>
                <span className={styles.metaItem}>upload first</span>
                <span className={styles.metaItem}>result on demand</span>
              </div>
            </div>
          </div>
        </section>

        <section ref={uploadRef} className={styles.uploadSection} aria-label="before 업로드 섹션">
          <div className={styles.sectionInner}>
            {errorMessage ? (
              <Notification
                variant="error"
                title="before 서비스 준비 중 오류"
                onClose={() => setErrorMessage(null)}
              >
                <p>{errorMessage}</p>
              </Notification>
            ) : null}

            <UploadPanel
              files={selectedFiles}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
              authNoticeMessage={beforeAnalyzeAuthMessage}
              showAuthSignInAction={shouldShowBeforeAuthSignInAction}
              isAuthActionDisabled={isSubmitting || authBusy}
              onFilesChange={handleFilesChange}
              onAnalyze={() => void handleAnalyze()}
              onSignIn={() => void handleBeforeSignIn()}
              onLoadMock={(scenario) => void handleLoadMock(scenario)}
            />

            <div className={styles.inlineInfoGrid}>
              <section className={styles.infoCard}>
                <p className={styles.infoEyebrow}>Upload step</p>
                <h2 className={styles.infoTitle}>처음에는 입력 패널 하나만 보입니다</h2>
                <p className={styles.infoBody}>
                  파일을 고르고 분석을 시작하기 전까지는 보조 결과 패널을 먼저 열지 않습니다.
                </p>
              </section>

              <DisclaimerBanner>
                <p>
                  현재 화면은 계약서 분석 흐름을 미리 확인하는 데모 버전입니다. 실제 계약 문서를 업로드하기
                  전에는 예시 결과와 안내 카드를 먼저 살펴보세요.
                </p>
              </DisclaimerBanner>
            </div>
          </div>
        </section>

        <section className={styles.historySection} aria-labelledby="before-history-shortcut-title">
          <div className={styles.sectionInner}>
            <div className={styles.historyShortcut}>
              <div>
                <p className={styles.historyShortcutEyebrow}>SCN-001 history</p>
                <h2 id="before-history-shortcut-title" className={styles.historyShortcutTitle}>
                  이전 기록은 History에서 확인
                </h2>
                <p className={styles.historyShortcutBody}>
                  완료된 Before 검토와 Bridge 연결 기록의 확인/삭제는 별도 History 화면에서 관리합니다.
                </p>
              </div>
              <Link className={styles.historyShortcutLink} href="/history">
                History 열기
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {screenState === 'loading' ? (
          <section className={styles.loadingSection} aria-label="before 분석 진행">
            <div className={styles.sectionInner}>
              <LoadingPanel fileCount={selectedFiles.length || 1} job={loadingJob} />
            </div>
          </section>
        ) : null}

        {screenState === 'result' && review ? (
          <section ref={resultRef} className={styles.resultSection} aria-label="before 분석 결과">
            <div className={styles.sectionInner}>
              <div className={styles.resultGrid}>
                <div className={styles.resultPrimary}>
                  <ResultPanel
                    review={review}
                    overviewCards={overviewCards}
                    onReset={handleReset}
                    resetDisabled={isBridgeSubmitting}
                    bridgeAction={
                      <BridgeHandoffCta
                        hasJobId={hasBridgeJobId}
                        hasFirebaseSession={Boolean(firebaseUser)}
                        isAuthenticated={isBridgeAuthenticated}
                        isAuthBusy={authBusy}
                        isFirebaseConfigured={firebaseConfigured}
                        isSubmitting={isBridgeSubmitting}
                        status={bridgeActionStatus}
                        message={bridgeActionMessage ?? authErrorMessage}
                        onCreate={() => void handleCreateBridgeRun()}
                        onSignIn={() => void handleBridgeSignIn()}
                      />
                    }
                  />
                </div>

                <aside className={styles.resultAside}>
                  <AccessibilityPanel
                    selectedDisability={selectedDisability}
                    recommendation={accessibility}
                    isLoading={isAccessibilityLoading}
                    errorMessage={accessibilityError}
                    onSelectDisability={(option) => void handleSelectDisability(option)}
                  />
                </aside>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}

interface BridgeHandoffCtaProps {
  hasJobId: boolean;
  hasFirebaseSession: boolean;
  isAuthenticated: boolean;
  isAuthBusy: boolean;
  isFirebaseConfigured: boolean;
  isSubmitting: boolean;
  status: BridgeActionStatus;
  message: string | null;
  onCreate: () => void;
  onSignIn: () => void;
}

function BridgeHandoffCta({
  hasJobId,
  hasFirebaseSession,
  isAuthenticated,
  isAuthBusy,
  isFirebaseConfigured,
  isSubmitting,
  status,
  message,
  onCreate,
  onSignIn,
}: BridgeHandoffCtaProps) {
  const canCreate =
    hasJobId && isAuthenticated && isFirebaseConfigured && !isAuthBusy && !isSubmitting;
  const shouldShowLogin = hasJobId && isFirebaseConfigured && !isAuthenticated;
  const statusText = getBridgeCtaStatusText({
    hasJobId,
    hasFirebaseSession,
    isAuthenticated,
    isAuthBusy,
    isFirebaseConfigured,
    status,
    message,
  });

  return (
    <div className={styles.bridgeCta}>
      <div className={styles.bridgeCtaHeader}>
        <p className={styles.bridgeCtaEyebrow}>Bridge handoff</p>
        <h3 className={styles.bridgeCtaTitle}>After에서 이어서 조문 찾기</h3>
        <p className={styles.bridgeCtaDescription}>
          이 검토 요약을 바탕으로 질문을 이어갑니다.
        </p>
      </div>

      {statusText ? (
        <p className={getBridgeCtaMessageClassName(status)} role={status === 'error' ? 'alert' : 'status'}>
          {statusText}
        </p>
      ) : null}

      <div className={styles.bridgeCtaActions}>
        {shouldShowLogin ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onSignIn}
            disabled={isAuthBusy || isSubmitting}
          >
            Google 로그인
          </Button>
        ) : null}

        <Button
          type="button"
          onClick={onCreate}
          disabled={!canCreate}
          isLoading={isSubmitting || status === 'loading'}
        >
          <span className={styles.bridgeCtaButtonLabel}>
            After에서 조문 찾기
            <ArrowRight size={18} aria-hidden="true" />
          </span>
        </Button>
      </div>
    </div>
  );
}

function getBridgeCtaStatusText(input: {
  hasJobId: boolean;
  hasFirebaseSession: boolean;
  isAuthenticated: boolean;
  isAuthBusy: boolean;
  isFirebaseConfigured: boolean;
  status: BridgeActionStatus;
  message: string | null;
}): string | null {
  if (!input.hasJobId) {
    return '실제 Before 검토 작업 완료 결과에서만 After 연결을 만들 수 있습니다.';
  }

  if (!input.isFirebaseConfigured) {
    return 'Google 로그인 설정이 필요해 현재 After 연결을 만들 수 없습니다.';
  }

  if (!input.isAuthenticated) {
    if (input.hasFirebaseSession) {
      return BRIDGE_BACKEND_AUTH_MESSAGE;
    }

    return 'After 연결에는 Google 로그인이 필요합니다. 로그인 후 이 결과 화면에서 연결을 시작할 수 있습니다.';
  }

  if (input.isAuthBusy) {
    return '로그인 상태를 확인하는 중입니다.';
  }

  if (input.status === 'loading') {
    return 'Bridge 연결을 만드는 중입니다.';
  }

  return input.message;
}

function getBridgeCtaMessageClassName(status: BridgeActionStatus): string {
  if (status === 'error') {
    return styles.bridgeCtaError;
  }

  if (status === 'success') {
    return styles.bridgeCtaSuccess;
  }

  return styles.bridgeCtaNotice;
}

function getBridgeActionErrorMessage(error: unknown): string {
  if (error instanceof BridgeApiError) {
    if (error.status === 401) {
      return '로그인 또는 인증 확인이 필요합니다. 다시 로그인한 뒤 시도해주세요.';
    }

    if (error.status === 404) {
      return '로그인 후 생성한 Before 검토 작업만 After로 연결할 수 있습니다. 비로그인 검토 결과는 로그인 후 다시 검토해주세요.';
    }

    if (error.status === 409) {
      return 'Before 검토가 아직 완료되지 않았습니다. 완료 후 다시 시도해주세요.';
    }

    if (error.status === 422 || error.status >= 500) {
      return 'Bridge 연결 요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.';
    }

    return error.message;
  }

  return 'Bridge 연결 요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.';
}

function getBeforeJobFailureMessage(job: BeforeReviewJob): string {
  const failedOcrStep = job.steps.find(isFailedOcrStep) ?? null;

  if (
    failedOcrStep &&
    hasOcrQuotaErrorMessage([job.error ?? null, failedOcrStep.message ?? null])
  ) {
    return BEFORE_JOB_OCR_QUOTA_FAILURE_MESSAGE;
  }

  if (
    failedOcrStep &&
    hasOcrTimeoutErrorMessage([job.error ?? null, failedOcrStep.message ?? null])
  ) {
    return BEFORE_JOB_OCR_TIMEOUT_FAILURE_MESSAGE;
  }

  return BEFORE_JOB_GENERAL_FAILURE_MESSAGE;
}

function isFailedOcrStep(step: BeforeReviewJob['steps'][number]): boolean {
  if (step.status !== 'failed') {
    return false;
  }

  const key = step.key.toLowerCase();
  const label = step.label.toLowerCase();

  return key.includes('ocr') || label.includes('ocr');
}

function hasOcrQuotaErrorMessage(messages: Array<string | null>): boolean {
  return messages.some((message) => {
    if (!message) {
      return false;
    }

    return OCR_QUOTA_ERROR_PATTERNS.some((pattern) => pattern.test(message));
  });
}

function hasOcrTimeoutErrorMessage(messages: Array<string | null>): boolean {
  return messages.some((message) => {
    if (!message) {
      return false;
    }

    return OCR_TIMEOUT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
  });
}
