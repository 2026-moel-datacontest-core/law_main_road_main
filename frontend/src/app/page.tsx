'use client';

import Link from 'next/link';
import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Cloud,
  Cpu,
  Database,
  FileSearch,
  Gavel,
  History as HistoryIcon,
  Menu,
  MessageSquare,
  PenTool,
  Search,
  ShieldCheck,
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

const categories = [
  { id: 'History', icon: HistoryIcon, label: 'History' },
  { id: 'Before', icon: Search, label: 'Before' },
  { id: 'After', icon: PenTool, label: 'After' },
];

const featuredServices = [
  {
    title: '사건 기록',
    desc: '완료된 Before 검토와 Bridge 연결 요약을 사건 단위로 다시 확인합니다.',
    icon: HistoryIcon,
    href: '/history',
  },
  {
    title: '계약서 분석',
    desc: '근로계약서 파일을 올리면 위험 조항과 권리 안내를 확인합니다.',
    icon: Search,
    href: '/before',
  },
  {
    title: 'After 문서 준비',
    desc: '상황 질문에서 조문 근거 답변과 문서 초안 흐름으로 이어집니다.',
    icon: FileSearch,
    href: '/after',
  },
];

const solutions = [
  { title: '부당 해고 대응', subtitle: '해고 예고 및 구제 신청 절차 안내', icon: AlertCircle, color: 'red' },
  { title: '임금 체불 해결', subtitle: '체불 임금 계산 및 고용노동부 진정', icon: Database, color: 'orange' },
  { title: '직장 내 괴롭힘', subtitle: '증거 수집 및 고충 처리 프로세스', icon: ShieldCheck, color: 'blue' },
  { title: '근로 시간 준수', subtitle: '연장·야간·휴일 수당 자동 계산', icon: Cpu, color: 'purple' },
  { title: '연차 유급 휴가', subtitle: '연차 발생 기준 및 사용 권리 확인', icon: Cloud, color: 'teal' },
];

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
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ''}`}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <Gavel size={18} />
          </span>
          <span className={styles.brandText}>
            법대로 <span className={styles.brandSub}>law-main-road</span>
          </span>
        </Link>

        <div className={styles.navLinks}>
          <a href="#intro">소개</a>
          <a href="#services">서비스</a>
          <a href="#solutions">솔루션</a>
          <a href="#footer">가이드센터</a>
        </div>

        <div className={styles.navActions}>
          {showHistoryLink ? (
            <Link href="/history" className={styles.historyButton}>
              History
            </Link>
          ) : null}
          <BeforeGateButton className={styles.loginButton} onBeforeGate={onBeforeGate}>
            Before
          </BeforeGateButton>
          <Link href="/after" className={styles.consoleButton}>
            After
          </Link>
        </div>

        <button className={styles.mobileMenuButton} onClick={() => setIsMenuOpen((value) => !value)} aria-label="메뉴 열기">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.mobileMenu}
          >
            <a href="#intro">소개</a>
            <a href="#services">서비스</a>
            <a href="#solutions">솔루션</a>
            {showHistoryLink ? <Link href="/history">저장 기록 보기</Link> : null}
            <BeforeGateButton
              onBeforeGate={() => {
                setIsMenuOpen(false);
                onBeforeGate();
              }}
            >
              계약서 분석 시작
            </BeforeGateButton>
            <Link href="/after">진정서 작성 시작</Link>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}

interface HeroProps {
  onBeforeGate: BeforeGateHandler;
}

function Hero({ onBeforeGate }: HeroProps) {
  return (
    <section id="intro" className={styles.hero}>
      <div className={styles.heroOverlay} />
      <div className={styles.heroOrbLeft} />
      <div className={styles.heroOrbRight} />
      <div className={styles.heroCircle} />
      <div className={styles.heroSquare} />
      <div className={styles.heroPlusOne}>+</div>
      <div className={styles.heroPlusTwo}>+</div>
      <div className={styles.heroPlusThree}>+</div>

      <div className={styles.heroContent}>
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
          <h1 className={styles.heroTitle}>
            법대로 AI <span>근로 사건 워크스페이스</span>
          </h1>
          <p className={styles.heroDescription}>
            History, Before, After를 한 흐름으로 연결합니다.
            <br />
            계약서 검토와 사후 문서 준비를 사건 단위로 이어서 확인하세요.
          </p>
          <div className={styles.heroButtons}>
            <BeforeGateButton className={styles.heroPrimary} onBeforeGate={onBeforeGate}>
              계약서 분석 시작
            </BeforeGateButton>
            <Link href="/after" className={styles.heroSecondary}>
              진정서 작성 시작
            </Link>
          </div>
        </motion.div>

        <div className={styles.heroDots}>
          <span className={styles.heroDotActive} />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}

interface AccountReadinessSectionProps {
  noticeMessage: string | null;
  onFocusLoginSection: () => void;
  sectionRef: RefObject<HTMLElement | null>;
  showHistoryEntry: boolean;
}

function AccountReadinessSection({
  noticeMessage,
  onFocusLoginSection,
  sectionRef,
  showHistoryEntry,
}: AccountReadinessSectionProps) {
  return (
    <section
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
        {showHistoryEntry ? (
          <div className={styles.historyEntryPanel}>
            <span className={styles.historyEntryIcon} aria-hidden="true">
              <HistoryIcon size={20} />
            </span>
            <div className={styles.historyEntryText}>
              <p className={styles.historyEntryEyebrow}>History</p>
              <h2 className={styles.historyEntryTitle}>저장된 Before / Bridge 기록</h2>
              <p className={styles.historyEntryDescription}>
                완료된 계약서 검토와 Bridge 연결 요약을 한 화면에서 확인합니다.
              </p>
            </div>
            <Link href="/history" className={styles.historyEntryButton}>
              <HistoryIcon size={18} aria-hidden="true" />
              기록 보기
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

interface ServiceNavProps {
  onBeforeGate: BeforeGateHandler;
}

function ServiceNav({ onBeforeGate }: ServiceNavProps) {
  const [active, setActive] = useState('History');

  return (
    <section id="services" className={styles.serviceSection}>
      <div className={styles.container}>
        <div className={styles.serviceHeader}>
          <h2>
            효율적인 근로 권익 보호를 위한
            <br />
            다양한 서비스를 제공합니다
          </h2>
        </div>

        <div className={styles.serviceTabs}>
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = active === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActive(category.id)}
                className={isActive ? styles.serviceTabActive : styles.serviceTab}
              >
                <Icon size={22} />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.serviceLayout}>
          <div className={styles.serviceFeature}>
            <div>
              <h3>{active}</h3>
              <p>
                저장 기록, 계약서 검토, 문서 초안을
                <br />
                현재 작업 흐름에 맞게 바로 이어갑니다.
              </p>
            </div>
            <div className={styles.serviceFeatureVisual}>
              <ShieldCheck size={84} />
            </div>
          </div>

          <div className={styles.serviceGrid}>
            {featuredServices.map((service) => {
              const Icon = service.icon;
              const cardContent = (
                <>
                  <div className={styles.serviceCardIcon}>
                    <Icon size={24} />
                  </div>
                  <div className={styles.serviceCardBody}>
                    <h4>{service.title}</h4>
                    <p>{service.desc}</p>
                  </div>
                </>
              );

              if (service.href === '/before') {
                return (
                  <BeforeGateButton
                    key={service.title}
                    className={styles.serviceCard}
                    onBeforeGate={onBeforeGate}
                  >
                    {cardContent}
                  </BeforeGateButton>
                );
              }

              return (
                <Link key={service.title} href={service.href} className={styles.serviceCard}>
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function SolutionCards() {
  return (
    <section id="solutions" className={styles.solutionSection}>
      <div className={styles.container}>
        <div className={styles.sectionTop}>
          <h2>
            진행 중인 근로 사건을
            <br />
            다음 단계로 정리합니다
          </h2>
          <Link href="/after" className={styles.solutionButton}>
            After에서 질문하기
          </Link>
        </div>

        <div className={styles.solutionGrid}>
          {solutions.map((solution) => {
            const Icon = solution.icon;
            return (
              <article key={solution.title} className={styles.solutionCard}>
                <div className={`${styles.solutionIcon} ${styles[`solution${solution.color}` as keyof typeof styles]}`}>
                  <Icon size={44} strokeWidth={1.6} />
                </div>
                <h3>{solution.title}</h3>
                <p>{solution.subtitle}</p>
                <span className={styles.solutionMeta}>After 연결점</span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface PromotionBannersProps {
  onBeforeGate: BeforeGateHandler;
}

function PromotionBanners({ onBeforeGate }: PromotionBannersProps) {
  return (
    <section className={styles.promotionSection}>
      <div className={styles.container}>
        <div className={styles.promotionGrid}>
          <BeforeGateButton
            className={`${styles.promoCard} ${styles.promoBlue}`}
            onBeforeGate={onBeforeGate}
          >
            <h4>계약서 분석 바로가기</h4>
            <p>
              업로드 후 분석을 시작하고
              <br />
              위험 조항과 권리 안내를 확인하세요.
            </p>
            <ArrowRight size={20} />
          </BeforeGateButton>
          <Link href="/after" className={`${styles.promoCard} ${styles.promoDark}`}>
            <h4>진정서 작성 바로가기</h4>
            <p>
              질문 입력부터 문서 초안까지
              <br />
              After 흐름으로 바로 이동합니다.
            </p>
            <ArrowRight size={20} />
          </Link>
          <Link href="/history" className={`${styles.promoCard} ${styles.promoLight}`}>
            <h4>사건 기록 확인</h4>
            <p>
              완료된 Before와 Bridge 요약을
              <br />
              사건 단위로 다시 확인합니다.
            </p>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}

interface GlobalSectionProps {
  onBeforeGate: BeforeGateHandler;
}

function GlobalSection({ onBeforeGate }: GlobalSectionProps) {
  return (
    <section className={styles.globalSection}>
      <div className={styles.container}>
        <div className={styles.globalInner}>
          <div>
            <h3>국내외 근로자가 법대로 플랫폼을 통해 자신의 권익을 보호하고 있습니다.</h3>
            <p>계약 단계의 검토와 사후 대응 흐름을 하나의 메인 페이지에서 선택할 수 있습니다.</p>
          </div>
          <div className={styles.globalActions}>
            <BeforeGateButton className={styles.globalButton} onBeforeGate={onBeforeGate}>
              Before 보기
            </BeforeGateButton>
            <div className={styles.avatarRow}>
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FooterProps {
  onBeforeGate: BeforeGateHandler;
}

function Footer({ onBeforeGate }: FooterProps) {
  return (
    <footer id="footer" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrandBlock}>
            <div className={styles.footerBrand}>
              <Gavel size={30} />
              <span>법대로</span>
            </div>
            <p>
              글로벌 근로자와 함께하며
              <br />
              정당한 권익 보호를 위해 앞장섭니다.
            </p>
            <div className={styles.footerIcons}>
              <span>
                <MessageSquare size={18} />
              </span>
              <span>
                <Search size={18} />
              </span>
              <span>
                <Bell size={18} />
              </span>
            </div>
          </div>

          <div className={styles.footerColumn}>
            <h4>Services</h4>
            <ul>
              <li>
                <BeforeGateButton onBeforeGate={onBeforeGate}>계약서 분석기</BeforeGateButton>
              </li>
              <li>
                <Link href="/after">진정서 작성기</Link>
              </li>
              <li>
                <Link href="/history">사건 기록</Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4>Company</h4>
            <ul>
              <li>
                <a href="#intro">회사소개</a>
              </li>
              <li>
                <a href="#services">서비스</a>
              </li>
              <li>
                <a href="#solutions">사건 유형</a>
              </li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4>Support</h4>
            <ul>
              <li>
                <BeforeGateButton onBeforeGate={onBeforeGate}>Before 시작</BeforeGateButton>
              </li>
              <li>
                <Link href="/after">After 시작</Link>
              </li>
              <li>
                <Link href="/history">기록 보기</Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="#footer">이용약관</a>
              </li>
              <li>
                <a href="#footer">개인정보처리방침</a>
              </li>
              <li>
                <a href="#footer">법적 고지</a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© 2024 법대로 (law-main-road) Corp. All rights reserved.</p>
          <div>
            <span>KR / EN</span>
            <span>Status</span>
          </div>
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
      <Hero onBeforeGate={handleBeforeGate} />
      <AccountReadinessSection
        noticeMessage={beforeGateMessage}
        onFocusLoginSection={focusLoginSection}
        sectionRef={accountSectionRef}
        showHistoryEntry={isBackendAuthenticated}
      />
      <ServiceNav onBeforeGate={handleBeforeGate} />
      <SolutionCards />
      <PromotionBanners onBeforeGate={handleBeforeGate} />
      <GlobalSection onBeforeGate={handleBeforeGate} />
      <Footer onBeforeGate={handleBeforeGate} />
    </div>
  );
}
