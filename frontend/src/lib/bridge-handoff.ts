import type {
  BridgeHandoffItem,
  BridgeHandoffState,
} from '@/types/bridge-handoff';

const MAX_ITEM_CONTEXT_CHARS = 900;
const MAX_TOTAL_BRIDGE_CONTEXT_CHARS = 2500;
const MAX_FINAL_QUERY_CHARS = 3500;

export function buildBridgeContextQuery(
  bridgeHandoffItems: BridgeHandoffItem[],
  userAdditionalQuestion: string,
): string {
  const question = optionalText(userAdditionalQuestion) ?? '';
  const includedItems = bridgeHandoffItems.filter((item) => item.include_in_query);

  if (includedItems.length === 0) {
    return question;
  }

  const bridgeContext = joinClippedSections(
    includedItems
      .map((item, index) => buildBridgeItemContext(item, index + 1))
      .filter((section) => section.length > 0),
    '\n\n',
    MAX_TOTAL_BRIDGE_CONTEXT_CHARS,
  );
  const sections = [
    bridgeContext,
    question.length > 0 ? `[사용자 추가 질문]\n${question}` : '',
  ].filter((section) => section.length > 0);

  return clipText(sections.join('\n\n'), MAX_FINAL_QUERY_CHARS);
}

export function hasIncludedBridgeContext(state: BridgeHandoffState): boolean {
  return state.items.some((item) => item.include_in_query);
}

function buildBridgeItemContext(item: BridgeHandoffItem, position: number): string {
  const seed = optionalText(item.after_query_seed);

  if (seed) {
    return clipText(`[Before 검토 요약 ${position}]\n${seed}`, MAX_ITEM_CONTEXT_CHARS);
  }

  return joinClippedSections(
    [
      formatTextSection(`[Before 검토 요약 ${position}]`, item.user_visible_summary),
      formatListSection('[주요 쟁점]', item.issue_categories),
      formatListSection('[위험 태그]', item.risk_tags),
      formatListSection('[관련 법령 후보]', item.law_refs),
      formatListSection('[권장 다음 조치]', item.recommended_next_actions),
    ].filter((section) => section.length > 0),
    '\n\n',
    MAX_ITEM_CONTEXT_CHARS,
  );
}

function formatTextSection(title: string, value: string): string {
  const text = optionalText(value);
  return text ? `${title}\n${text}` : '';
}

function formatListSection(title: string, values: string[]): string {
  const items = values.flatMap((value) => {
    const text = optionalInlineText(value);
    return text ? [`- ${text}`] : [];
  });

  return items.length > 0 ? `${title}\n${items.join('\n')}` : '';
}

function joinClippedSections(
  sections: string[],
  separator: string,
  maxLength: number,
): string {
  let output = '';

  for (const section of sections) {
    const nextOutput = output ? `${output}${separator}${section}` : section;

    if (nextOutput.length <= maxLength) {
      output = nextOutput;
      continue;
    }

    const remainingLength = maxLength - output.length - (output ? separator.length : 0);
    const clippedSection = clipText(section, remainingLength);

    if (clippedSection.length > 0) {
      output = output ? `${output}${separator}${clippedSection}` : clippedSection;
    }

    break;
  }

  return output.trim();
}

function clipText(value: string, maxLength: number): string {
  if (maxLength <= 0) {
    return '';
  }

  if (value.length <= maxLength) {
    return value;
  }

  if (maxLength <= 3) {
    return value.slice(0, maxLength);
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.replace(/\r\n?/g, '\n').trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function optionalInlineText(value: string | null | undefined): string | undefined {
  return optionalText(value)?.replace(/\s+/g, ' ');
}
