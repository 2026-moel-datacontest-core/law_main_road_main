# 프로젝트 수행 및 완성

법대로(LawMainRoad)는 법령 검색, 근거 기반 답변, 문서 초안, 사용자별 기록
연결을 하나의 노동권 보호 MVP로 묶은 프로젝트입니다.

## 목표

외국인 근로자가 근로계약, 기숙사, 임금체불, 부당해고, 사업장 변경 같은
상황을 한국어 노동법 근거와 함께 정리하고, 다음 행동을 준비할 수 있게
돕는 것이 목표입니다.

## 현재 완료 범위

기준일: `2026-05-11`

| 트랙 | 결과 |
|---|---|
| RAG foundation | law chunk corpus, retrieval, grounded answer path 구현 |
| SCN-004 After | login-free answer -> intake -> draft flow 구현 |
| SCN-001 Before/Bridge | protected Before history, Bridge run, Bridge answer 구현 |
| Auth | Firebase Google Sign-In과 backend verification 구현 |
| History | protected record archive, saved selector, MVP soft-delete 구현 |
| Demo stability | fixed preset paths와 preflight script 구현 |
| Cloud migration | dev-first runtime smoke와 Phase 7A `www.law-main-road.cloud` public domain launch 완료 |

## 수행 요약

법대로(LawMainRoad)는 먼저 법령 코퍼스와 RAG answer path를 안정화한 뒤,
SCN-004 After 문서 초안 흐름을 main demo로 고정했습니다. 이후 SCN-001은
Firebase Google Sign-In과 backend verification을 붙여 Before 기록, Bridge 연결,
protected Bridge answer, `/history` 기록 보관함, MVP soft-delete까지 확장했습니다.

마지막 UI polish는 backend/API/schema 변경 없이 Before, After, History, Main
화면의 대비, 카드 구조, 안내 문구, 진행 상태, disclaimer를 정리한
frontend-only 작업입니다.

## 주요 사용자 가치

- 법률 질문을 단순 LLM 답변이 아니라 검색된 법령 근거와 함께 확인할 수 있습니다.
- 사용자가 입력하지 않은 사실은 단정하지 않고 missing field로 남깁니다.
- SCN-001에서는 Before에서 확인한 쟁점을 After 질문에 이어갈 수 있습니다.
- SCN-004에서는 답변 근거가 충분할 때 문서 초안까지 이어집니다.

## 검증 스냅샷

현재 프로젝트는 다음 수준의 검증을 기준으로 문서화합니다.

- backend import smoke
- document draft checker
- frontend build
- demo preflight script
- manual browser rehearsal for major demo flows

Broad retrieval/answer eval은 retrieval, answer generation, embedding
behavior, DB contents, public API contract가 바뀐 경우에만 실행합니다.

## 남은 작업

남은 작업은 기능 확장보다 공개 문서, QA evidence, demo-window monitoring,
contest/demo posture review에 초점을 둡니다.

- public README/Wiki polish
- manual visual QA and print preview evidence
- custom-domain demo-window monitoring and contest/demo posture review
- 향후 production을 열기로 결정하는 경우 production opening review

## 함께 보기

- [[최종 아키텍처|Final-Architecture]]
- [[사용자 흐름|User-Flows]]
- [[테스트 전략|Testing-Strategy]]
- [[E2E 데모 검증|E2E-Demo-Verification]]
