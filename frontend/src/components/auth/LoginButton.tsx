'use client';

import { AlertCircle, CheckCircle2, LogIn, LogOut, RefreshCw } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

import styles from './LoginButton.module.css';

export function LoginButton() {
  const {
    firebaseConfigured,
    missingFirebaseConfig,
    firebaseUser,
    backendUser,
    isInitializing,
    isSigningIn,
    isCheckingBackend,
    errorMessage,
    signInWithGoogle,
    signOut,
    refreshBackendAuth,
    clearError,
  } = useAuth();
  const isBusy = isInitializing || isSigningIn || isCheckingBackend;
  const accountLabel = getAccountLabel(
    backendUser.display_name ?? firebaseUser?.display_name,
    backendUser.email ?? firebaseUser?.email,
  );

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>SCN-001 account readiness</p>
          <h2 className={styles.title}>Google 로그인 확인</h2>
        </div>
        <StatusPill loggedIn={backendUser.logged_in} isBusy={isBusy} />
      </div>

      <div className={styles.statusGrid} aria-label="인증 상태">
        <StatusItem
          label="Firebase"
          value={firebaseConfigured ? (firebaseUser ? 'signed_in' : 'signed_out') : 'config_missing'}
        />
        <StatusItem
          label="Backend"
          value={backendUser.logged_in ? 'logged_in=true' : 'logged_in=false'}
        />
        <StatusItem
          label="users row"
          value={backendUser.logged_in && backendUser.user_id ? 'upsert ready' : 'not confirmed'}
        />
      </div>

      {accountLabel ? <p className={styles.accountLine}>{accountLabel}</p> : null}

      {!firebaseConfigured ? (
        <div className={styles.configNotice} role="status">
          <AlertCircle size={18} aria-hidden="true" />
          <span>Firebase public env 설정 필요: {missingFirebaseConfig.join(', ')}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className={styles.error} role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{errorMessage}</span>
          <button type="button" onClick={clearError} aria-label="오류 메시지 닫기">
            ×
          </button>
        </div>
      ) : null}

      <div className={styles.actions}>
        {!firebaseConfigured ? (
          <button
            className={styles.primaryAction}
            type="button"
            disabled
            title="NEXT_PUBLIC_FIREBASE_* 환경변수를 설정해야 합니다."
          >
            <LogIn size={18} aria-hidden="true" />
            Firebase 설정 필요
          </button>
        ) : firebaseUser ? (
          <>
            <button
              className={styles.secondaryAction}
              type="button"
              disabled={isBusy}
              onClick={() => void refreshBackendAuth({ forceRefresh: true })}
            >
              <RefreshCw size={18} aria-hidden="true" />
              인증 확인
            </button>
            <button
              className={styles.secondaryAction}
              type="button"
              disabled={isBusy}
              onClick={() => void signOut()}
            >
              <LogOut size={18} aria-hidden="true" />
              로그아웃
            </button>
          </>
        ) : (
          <button
            className={styles.primaryAction}
            type="button"
            disabled={isBusy}
            onClick={() => void signInWithGoogle()}
          >
            <LogIn size={18} aria-hidden="true" />
            {isSigningIn ? '로그인 중...' : 'Google로 로그인'}
          </button>
        )}
      </div>
    </div>
  );
}

interface StatusPillProps {
  loggedIn: boolean;
  isBusy: boolean;
}

function StatusPill({ loggedIn, isBusy }: StatusPillProps) {
  if (isBusy) {
    return <span className={styles.pendingPill}>확인 중</span>;
  }

  if (loggedIn) {
    return (
      <span className={styles.successPill}>
        <CheckCircle2 size={16} aria-hidden="true" />
        backend verified
      </span>
    );
  }

  return <span className={styles.neutralPill}>signed out</span>;
}

interface StatusItemProps {
  label: string;
  value: string;
}

function StatusItem({ label, value }: StatusItemProps) {
  return (
    <div className={styles.statusItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getAccountLabel(
  displayName?: string | null,
  email?: string | null,
): string | null {
  const maskedDisplayName = maskDisplayName(displayName);
  const maskedEmail = maskEmail(email);

  if (maskedDisplayName && maskedEmail) {
    return `${maskedDisplayName} · ${maskedEmail}`;
  }

  return maskedDisplayName ?? maskedEmail;
}

function maskDisplayName(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length <= 2) {
    return `${trimmed[0]}*`;
  }

  return `${trimmed.slice(0, 1)}${'*'.repeat(Math.min(trimmed.length - 1, 4))}`;
}

function maskEmail(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const [localPart, domain] = trimmed.split('@');
  if (!localPart || !domain) {
    return null;
  }

  const visibleLocal = localPart.slice(0, Math.min(2, localPart.length));
  return `${visibleLocal}${'*'.repeat(Math.max(2, Math.min(localPart.length, 4)))}@${domain}`;
}
