'use client';

import Link from 'next/link';
import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  FileSearch,
  Gavel,
  History as HistoryIcon,
  Menu,
  Search,
  X,
} from 'lucide-react';

import { LoginButton } from '@/components/auth/LoginButton';
import { useAuth } from '@/context/AuthContext';

import styles from './page.module.css';

const BEFORE_GATE_LOGIN_MESSAGE =
  '계약서 분석은 Google 로그인 후 사용할 수 있습니다. 먼저 로그인해 주세요.';
const BEFORE_GATE_AUTH_CHECKING_MESSAGE = '로그인 상태를 확인하는 중입니다.';
const BEFORE_GATE_FIREBASE_CONFIG_MESSAGE =
  '계약서 분석을 사용하려면 Firebase public env 설정이 필요합니다.';
const BEFORE_GATE_BACKEND_AUTH_MESSAGE =
  '서버 인증 확인이 완료되지 않았습니다. 인증 확인 또는 다시 로그인 후 이용해 주세요.';

type BeforeGateHandler = () => void;

interface BeforeGateButtonProps {
  children: ReactNode;
  className?: string;
  onBeforeGate: BeforeGateHandler;
}

function BeforeGateButton({ children, className, onBeforeGate }: BeforeGateButtonProps) {
  return (
    <button
      type="button"
      className={[styles.beforeGateAction, className].filter(Boolean).join(' ')}
      onClick={onBeforeGate}
    >
      {children}
    </button>
  );
}

interface NavbarProps {
  onBeforeGate: BeforeGateHandler;
  showHistoryLink: boolean;
}

function Navbar({ onBeforeGate, showHistoryLink }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ''}`}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <Gavel size={18} />
          </span>
          <span className={styles.brandText}>
            법대로 <span className={styles.brandSub}>law-main-road</span>
          </span>
        </Link>

        <div className={styles.navLinks}>
          <a href="#intro">개요</a>
          <a href="#account">계정</a>
          <a href="#services">작업</a>
        </div>

        <div className={styles.navActions}>
          {showHistoryLink ? (
            <Link href="/history" className={styles.navTextButton}>
              History
            </Link>
          ) : null}
          <BeforeGateButton className={styles.navTextButton} onBeforeGate={onBeforeGate}>
            Before
          </BeforeGateButton>
          <Link href="/after" className={styles.navPrimaryButton}>
            After
          </Link>
        </div>

        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMenuOpen((value) => !value)}
          aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={isMenuOpen}
          type="button"
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isMenuOpen ? (
        <div className={styles.mobileMenu}>
          <a href="#intro" onClick={() => setIsMenuOpen(false)}>
            개요
          </a>
          <a href="#account" onClick={() => setIsMenuOpen(false)}>
            계정
          </a>
          <a href="#services" onClick={() => setIsMenuOpen(false)}>
            작업
          </a>
          {showHistoryLink ? <Link href="/history">History</Link> : null}
          <BeforeGateButton
            onBeforeGate={() => {
              setIsMenuOpen(false);
              onBeforeGate();
            }}
          >
            Before
          </BeforeGateButton>
          <Link href="/after">After</Link>
        </div>
      ) : null}
    </nav>
  );
}

function Hero() {
  return (
    <section id="intro" className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>K-Labor Shield</p>
          <h1 className={styles.heroTitle}>법대로 AI 근로 사건 워크스페이스</h1>
          <p className={styles.heroDescription}>
            로그인 상태를 먼저 확인하고, 저장 기록 확인과 계약서 검토, 사후 질문을 같은
            사건 흐름 안에서 이어갑니다. After 질문과 초안 흐름은 로그인 없이도 사용할 수
            있습니다.
          </p>
        </div>
      </div>
    </section>
  );
}

interface AccountReadinessSectionProps {
  noticeMessage: string | null;
  onFocusLoginSection: () => void;
  sectionRef: RefObject<HTMLElement | null>;
}

function AccountReadinessSection({
  noticeMessage,
  onFocusLoginSection,
  sectionRef,
}: AccountReadinessSectionProps) {
  return (
    <section
      id="account"
      ref={sectionRef}
      className={styles.accountSection}
      aria-label="SCN-001 계정 연결 준비"
      tabIndex={-1}
    >
      <div className={styles.container}>
        {noticeMessage ? (
          <div className={styles.beforeGateNotice} role="alert">
            <div className={styles.beforeGateNoticeContent}>
              <AlertCircle className={styles.beforeGateNoticeIcon} size={20} aria-hidden="true" />
              <p>{noticeMessage}</p>
            </div>
            <button
              className={styles.beforeGateNoticeAction}
              type="button"
              onClick={onFocusLoginSection}
            >
              로그인 섹션 보기
            </button>
          </div>
        ) : null}
        <LoginButton />
      </div>
    </section>
  );
}

interface TaskSectionProps {
  onBeforeGate: BeforeGateHandler;
  showHistoryEntry: boolean;
}

function TaskSection({ onBeforeGate, showHistoryEntry }: TaskSectionProps) {
  return (
    <section id="services" className={styles.taskSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Workspace</p>
          <h2>필요한 작업을 바로 선택하세요</h2>
          <p>
            기록 확인, 계약서 검토, 사후 질문을 분리된 기능처럼 보이게 하지 않고 같은 사건
            흐름 안에서 이어갑니다.
          </p>
        </div>

        <div className={styles.taskGrid}>
          {showHistoryEntry ? (
            <Link href="/history" className={styles.taskCard}>
              <TaskCardContent
                icon={<HistoryIcon size={24} aria-hidden="true" />}
                eyebrow="History"
                title="사건 기록"
                description="완료된 Before 검토와 Bridge 연결 후보를 사건 단위로 다시 확인합니다."
                meta="저장 기록 보기"
              />
            </Link>
          ) : (
            <article className={`${styles.taskCard} ${styles.taskCardDisabled}`}>
              <TaskCardContent
                icon={<HistoryIcon size={24} aria-hidden="true" />}
                eyebrow="History"
                title="사건 기록"
                description="Google 로그인과 서버 확인이 완료되면 저장 기록을 볼 수 있습니다."
                meta="로그인 후 표시"
              />
            </article>
          )}

          <BeforeGateButton className={styles.taskCard} onBeforeGate={onBeforeGate}>
            <TaskCardContent
              icon={<Search size={24} aria-hidden="true" />}
              eyebrow="Before"
              title="계약서 분석"
              description="근로계약서 파일을 올리고 위험 조항과 권리 안내를 확인합니다."
              meta="로그인 필요"
            />
          </BeforeGateButton>

          <Link href="/after" className={styles.taskCard}>
            <TaskCardContent
              icon={<FileSearch size={24} aria-hidden="true" />}
              eyebrow="After"
              title="질문과 문서 초안"
              description="상황 질문에서 조문 근거 답변과 문서 초안 흐름으로 이어갑니다."
              meta="로그인 없이 사용"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TaskCardContent({
  icon,
  eyebrow,
  title,
  description,
  meta,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  meta: string;
}) {
  return (
    <>
      <span className={styles.taskIcon}>{icon}</span>
      <span className={styles.taskText}>
        <span className={styles.taskEyebrow}>{eyebrow}</span>
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className={styles.taskMeta}>{meta}</span>
    </>
  );
}

interface FooterProps {
  onBeforeGate: BeforeGateHandler;
  showHistoryLink: boolean;
}

function Footer({ onBeforeGate, showHistoryLink }: FooterProps) {
  return (
    <footer id="footer" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerInner}>
          <div>
            <div className={styles.footerBrand}>
              <Gavel size={24} aria-hidden="true" />
              <span>법대로</span>
            </div>
            <p>근로 사건 기록과 문서 준비를 위한 MVP 워크스페이스</p>
          </div>
          <nav className={styles.footerLinks} aria-label="하단 주요 화면">
            {showHistoryLink ? <Link href="/history">History</Link> : null}
            <BeforeGateButton onBeforeGate={onBeforeGate}>Before</BeforeGateButton>
            <Link href="/after">After</Link>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span>KR / EN</span>
          <span>After 공개 흐름 유지</span>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const router = useRouter();
  const {
    firebaseConfigured,
    firebaseUser,
    backendUser,
    isInitializing,
    isSigningIn,
    isCheckingBackend,
  } = useAuth();
  const accountSectionRef = useRef<HTMLElement | null>(null);
  const [beforeGateMessage, setBeforeGateMessage] = useState<string | null>(null);
  const authBusy = isInitializing || isSigningIn || isCheckingBackend;
  const isBackendAuthenticated = backendUser.logged_in;

  const focusLoginSection = useCallback(() => {
    window.requestAnimationFrame(() => {
      accountSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      accountSectionRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const handleBeforeGate = useCallback(() => {
    if (!firebaseConfigured) {
      setBeforeGateMessage(BEFORE_GATE_FIREBASE_CONFIG_MESSAGE);
      focusLoginSection();
      return;
    }

    if (authBusy) {
      setBeforeGateMessage(BEFORE_GATE_AUTH_CHECKING_MESSAGE);
      focusLoginSection();
      return;
    }

    if (!firebaseUser) {
      setBeforeGateMessage(BEFORE_GATE_LOGIN_MESSAGE);
      focusLoginSection();
      return;
    }

    if (!isBackendAuthenticated) {
      setBeforeGateMessage(BEFORE_GATE_BACKEND_AUTH_MESSAGE);
      focusLoginSection();
      return;
    }

    setBeforeGateMessage(null);
    router.push('/before');
  }, [authBusy, firebaseConfigured, firebaseUser, focusLoginSection, isBackendAuthenticated, router]);

  useEffect(() => {
    if (firebaseUser && isBackendAuthenticated && !authBusy) {
      setBeforeGateMessage(null);
    }
  }, [authBusy, firebaseUser, isBackendAuthenticated]);

  return (
    <div className={styles.page}>
      <Navbar onBeforeGate={handleBeforeGate} showHistoryLink={isBackendAuthenticated} />
      <Hero />
      <AccountReadinessSection
        noticeMessage={beforeGateMessage}
        onFocusLoginSection={focusLoginSection}
        sectionRef={accountSectionRef}
      />
      <TaskSection onBeforeGate={handleBeforeGate} showHistoryEntry={isBackendAuthenticated} />
      <Footer onBeforeGate={handleBeforeGate} showHistoryLink={isBackendAuthenticated} />
    </div>
  );
}
