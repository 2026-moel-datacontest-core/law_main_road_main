'use client';

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useMemo,
  useReducer,
} from 'react';

import type { FlowAction, KLaborShieldFlowState } from '@/types/flow';
import type { BridgeHandoffItem, BridgeHandoffState } from '@/types/bridge-handoff';

export const initialFlowState: KLaborShieldFlowState = {
  user_statement: '',
  selected_preset_id: null,
  answer_response: null,
  selected_document_type: null,
  legal_basis: null,
  case_intake_form: null,
  case_intake: null,
  evidence_status_map: {},
  draft_response: null,
  bridge_handoff: { items: [] },
};

export function flowReducer(
  state: KLaborShieldFlowState,
  action: FlowAction,
): KLaborShieldFlowState {
  switch (action.type) {
    case 'SET_STATEMENT':
      return {
        ...state,
        user_statement: action.payload.statement,
        selected_preset_id: action.payload.selected_preset_id,
        answer_response: null,
        legal_basis: null,
        selected_document_type: null,
        case_intake_form: null,
        case_intake: null,
        draft_response: null,
      };
    case 'SET_ANSWER':
      return {
        ...state,
        answer_response: action.payload,
        legal_basis: null,
        selected_document_type: null,
        case_intake_form: null,
        case_intake: null,
        draft_response: null,
      };
    case 'SET_LEGAL_BASIS':
      return {
        ...state,
        legal_basis: action.payload,
      };
    case 'SET_DOCUMENT_TYPE':
      return {
        ...state,
        selected_document_type: action.payload,
        case_intake_form: null,
        case_intake: null,
        draft_response: null,
      };
    case 'SET_CASE_INTAKE_FORM':
      return {
        ...state,
        case_intake_form: action.payload,
      };
    case 'SET_CASE_INTAKE':
      return {
        ...state,
        case_intake: action.payload,
        draft_response: null,
      };
    case 'SET_EVIDENCE_STATUS':
      return {
        ...state,
        evidence_status_map: {
          ...state.evidence_status_map,
          [action.payload.key]: action.payload.status,
        },
      };
    case 'SET_DRAFT':
      return {
        ...state,
        draft_response: action.payload,
      };
    case 'CLEAR_DRAFT':
      return {
        ...state,
        draft_response: null,
      };
    case 'CLEAR_DRAFT_AND_CASE_INTAKE':
      return {
        ...state,
        case_intake_form: null,
        case_intake: null,
        draft_response: null,
      };
    case 'SET_BRIDGE_HANDOFF':
      return {
        ...state,
        bridge_handoff: cloneBridgeHandoffState(action.payload),
      };
    case 'ADD_BRIDGE_HANDOFF_ITEM': {
      const nextItem = cloneBridgeHandoffItem(action.payload);
      const existingIndex = state.bridge_handoff.items.findIndex(
        (item) => item.bridge_run_id === nextItem.bridge_run_id,
      );
      const items =
        existingIndex === -1
          ? [...state.bridge_handoff.items, nextItem]
          : state.bridge_handoff.items.map((item, index) =>
              index === existingIndex ? nextItem : item,
            );

      return {
        ...state,
        bridge_handoff: { items },
      };
    }
    case 'SET_BRIDGE_HANDOFF_ITEM_INCLUDED':
      return {
        ...state,
        bridge_handoff: {
          items: state.bridge_handoff.items.map((item) =>
            item.bridge_run_id === action.payload.bridge_run_id
              ? { ...item, include_in_query: action.payload.include_in_query }
              : item,
          ),
        },
      };
    case 'REMOVE_BRIDGE_HANDOFF_ITEM':
      return {
        ...state,
        bridge_handoff: {
          items: state.bridge_handoff.items.filter(
            (item) => item.bridge_run_id !== action.payload.bridge_run_id,
          ),
        },
      };
    case 'CLEAR_BRIDGE_HANDOFF':
      return {
        ...state,
        bridge_handoff: { items: [] },
      };
    case 'RESET':
      return initialFlowState;
    default:
      return state;
  }
}

function cloneBridgeHandoffState(state: BridgeHandoffState): BridgeHandoffState {
  return {
    items: state.items.map(cloneBridgeHandoffItem),
  };
}

function cloneBridgeHandoffItem(item: BridgeHandoffItem): BridgeHandoffItem {
  return {
    ...item,
    issue_categories: [...item.issue_categories],
    risk_tags: [...item.risk_tags],
    law_refs: [...item.law_refs],
    recommended_next_actions: [...item.recommended_next_actions],
  };
}

interface FlowContextValue {
  state: KLaborShieldFlowState;
  dispatch: Dispatch<FlowAction>;
}

const FlowContext = createContext<FlowContextValue | null>(null);

interface FlowProviderProps {
  children: ReactNode;
}

export function FlowProvider({ children }: FlowProviderProps) {
  const [state, dispatch] = useReducer(flowReducer, initialFlowState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow() {
  const context = useContext(FlowContext);

  if (context === null) {
    throw new Error('useFlow must be used within FlowProvider');
  }

  return context;
}
