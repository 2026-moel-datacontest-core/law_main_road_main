'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Masthead } from '@/components/layout/Masthead';
import { Button } from '@/components/ui/Button';
import { DisclaimerBanner } from '@/components/ui/DisclaimerBanner';
import { Notification } from '@/components/ui/Notification';
import { SkipLink } from '@/components/ui/SkipLink';
import { useFlow } from '@/context/FlowContext';
import { ApiError, fetchAnswer } from '@/lib/api';
import {
  buildBridgeContextQuery,
  getBridgeHandoffDisplayFields,
} from '@/lib/bridge-handoff';
import {
  SCENARIO_PRESETS,
  getScenarioPreset,
  type ScenarioPresetId,
} from '@/lib/scenarioPresets';
import type { AnswerRequest } from '@/types/api';
import type { BridgeHandoffItem } from '@/types/bridge-handoff';
import type { AnswerOrigin } from '@/types/flow';

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
}

export default function AfterPage() {
  const router = useRouter();
  const { state, dispatch } = useFlow();
  const mainRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerSubmittingRef = useRef(false);
  const hasInitialBridgeHandoff = state.bridge_handoff.items.length > 0;
  const [statement, setStatement] = useState(
    hasInitialBridgeHandoff ? '' : state.user_statement,
  );
  const [selectedPresetId, setSelectedPresetId] = useState<ScenarioPresetId | null>(
    hasInitialBridgeHandoff ? null : state.selected_preset_id,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<AnswerErrorState | null>(null);

  const bridgeItems = state.bridge_handoff.items;
  const hasBridgeHandoffItems = bridgeItems.length > 0;
  const includedBridgeItemCount = bridgeItems.filter(
    (item) => item.include_in_query,
  ).length;
  const hasIncludedBridgeItems = includedBridgeItemCount > 0;
  const bridgeContextQuery = useMemo(
    () => buildBridgeContextQuery(bridgeItems, statement).trim(),
    [bridgeItems, statement],
  );
  const trimmedStatement = statement.trim();
  const characterCount = trimmedStatement.length;
  const isShort = characterCount > 0 && characterCount < 10;
  const helperTextClassName =
    !hasIncludedBridgeItems && isShort ? styles.warningText : styles.helperText;
  const canSubmit = hasIncludedBridgeItems
    ? bridgeContextQuery.length > 0 && !isLoading
    : characterCount >= 10 && !isLoading;
  const selectedPreset = hasBridgeHandoffItems
    ? null
    : getScenarioPreset(selectedPresetId);
  const isPresetQueryMatched =
    selectedPreset !== null && trimmedStatement === selectedPreset.query;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const focusTarget = textareaRef.current ?? mainRef.current;
      focusTarget?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const helperText = useMemo(() => {
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

    if (selectedPreset) {
      return isPresetQueryMatched
        ? `${selectedPreset.label} 프리셋이 입력되었습니다.`
        : `${selectedPreset.label} 프리셋을 바탕으로 수정 중입니다.`;
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
        selectedPresetId: null,
        useFixedAnswer: false,
        statementForState:
          trimmedStatement.length > 0
            ? trimmedStatement
            : 'Before/Bridge 검토 요약 기반 질문',
        answerOrigin: 'bridge_handoff',
      };
    }

    if (trimmedStatement.length < 10) {
      return null;
    }

    const preset = hasBridgeHandoffItems ? null : getScenarioPreset(selectedPresetId);

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
          : await fetchAnswer(submission.payload);

      dispatch({ type: 'SET_ANSWER', payload: answer });
      router.push('/after/result');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '연결을 확인하고 다시 시도해주세요.';
      const retryable = error instanceof ApiError ? error.retryable : true;

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

  function handlePresetClick(presetId: ScenarioPresetId) {
    if (hasBridgeHandoffItems) {
      return;
    }

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
                      이전 검토 요약
                    </h2>
                  </div>
                  <span className={styles.handoffCount}>
                    {includedBridgeItemCount}/{bridgeItems.length} 포함
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

              {!hasBridgeHandoffItems ? (
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
              ) : null}

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
                  {hasBridgeHandoffItems ? '이 내용으로 조문 찾기 →' : '법 조문 찾기 →'}
                </Button>
              </div>
            </form>
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
  onIncludedChange: (item: BridgeHandoffItem, includeInQuery: boolean) => void;
  onExclude: (item: BridgeHandoffItem) => void;
}

function BridgeHandoffCard({
  item,
  index,
  itemCount,
  disabled,
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
          <p className={styles.handoffCardEyebrow}>Read-only summary</p>
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
          disabled={disabled}
          onChange={(event) => onIncludedChange(item, event.target.checked)}
        />
        <span>이 검토 요약을 이번 질문에 포함</span>
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

      <p className={styles.handoffNote}>현재 질문에서만 제외됩니다.</p>
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
