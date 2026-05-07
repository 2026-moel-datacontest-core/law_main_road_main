# 용어집

## 법대로(LawMainRoad)

외국인 근로자와 취약 노동자를 위한 한국 노동법 기반 AI 지원 MVP.

## SCN-001

외국인 근로자의 근로계약, 기숙사, 공제, 사업장 변경 관련 시나리오.
Before -> Bridge -> After 연결과 protected history가 구현되어 있습니다.

## SCN-003

법령 코퍼스 보강 과정에서 최소 추가된 시나리오 범위. 현재 공개 UI의 독립
frontend flow로 노출되는 범위는 아닙니다.

## SCN-004

임금체불과 부당해고 관련 After answer/draft 시나리오. 현재 main login-free
public demo path입니다.

## SCN-005

후속 문서 타입과 시나리오 확장 후보. 현재 frontend preset이나 문서 초안 flow로
열려 있지 않습니다.

## Recovery

취약 노동자의 후속 회복·지원 흐름 후보. 현재 본 구현 범위 밖이며 별도 단계에서
검토합니다.

## Before

근로계약서나 관련 문서를 검토하고 위험 신호를 정리하는 흐름.

## Bridge

Before에서 나온 사건 맥락을 After 질문에 이어 주는 연결 정보. Bridge는 사건
맥락 연결/참고용이며, 법적 근거(legal grounding)가 아닙니다.

## After

사용자가 노동 문제를 질문하고, 근거 기반 답변과 지원되는 문서 초안으로
이어지는 흐름.

## Grounded Answer / 근거 답변

검색된 법령 조각과 citation을 기반으로 작성된 답변.

## Legal Basis / 법적 근거 묶음

문서 초안 생성에 사용되는 법적 근거 묶음. `/api/v1/documents/draft`는 request
안의 `legal_basis`만 사용하며 직접 retrieval이나 answer generation을 실행하지
않습니다.

## MVP Soft-delete / 최소 삭제

사용자 화면에서 기록을 숨기는 최소 삭제 기능. hard delete, artifact purge,
retention lifecycle은 현재 미오픈(NOT opened) 범위입니다.

## Demo Freeze / 데모 고정

발표 안정성을 위해 exact preset path를 고정 fixture 또는 deterministic template로
처리하는 정책.

## Public Mirror / 공개 미러

공개 제출용 curated repository. 배포 권한, infrastructure state, cloud IAM key,
private runbook, raw user/case data를 포함하지 않습니다.

## RAG

Retrieval-Augmented Generation. 법대로(LawMainRoad)에서는 법령 chunk 검색 결과를
근거로 답변을 만들고, 검색 결과에 없는 조문을 citation으로 추가하지 않는
구조를 뜻합니다.

## Demo/Contest Posture / 데모·공모전 운영 자세

공모전 심사와 발표를 위한 제한된 공개 운영 상태. `prod` 운영 오픈과 다르며,
dev smoke 이후 기간과 범위를 정해 사용합니다.
