# E2E 데모 검증

이 문서는 공개 가능한 end-to-end 검증 상태를 요약합니다. 실제 private evidence,
raw case text, full response body, credential values, private cloud inventory는
포함하지 않습니다.

## 검증 범위

| 영역 | Public-safe status |
|---|---|
| SCN-004 exact preset | PASS: fixed answer path, result, intake, draft |
| SCN-004 draft actions | PASS: rendered text, copy, browser print |
| SCN-004 modified/free input | PASS in recorded browser/network checks |
| SCN-001 login and backend verification | PASS in actual browser smoke |
| SCN-001 protected Bridge answer | PASS in live browser/network/DB smoke |
| SCN-001 all-unchecked Bridge fallback | PASS, answer-only guard preserved |
| `/history` archive | PASS for visible records and no-record state |
| MVP soft-delete | PASS for confirm/cancel, protected delete, visible removal |
| `/after` saved history selector | PASS for safe subset selection and local cleanup |

## Main Demo Path / 메인 데모 경로

```text
/after
  -> SCN-004-DEMO-FREEZE exact preset
  -> /after/result
  -> document type selection
  -> /after/intake
  -> /after/draft
  -> copy or browser print
```

exact preset path는 의도적으로 안정화되어 있습니다. frontend fixture를 사용하며
live answer generation에 의존하지 않습니다.

## Protected Connected Flow / 보호 연결 흐름

```text
/before
  -> frontend login-required analysis UX
  -> protected Bridge run
  -> /after Bridge handoff
  -> protected Bridge answer
  -> /after/result answer-only
```

SCN-001 protected UI는 frontend Firebase signed-in state만이 아니라 backend
`/api/v1/auth/me` verification을 기준으로 열립니다.

이는 frontend `/before` UX gate를 설명합니다. mounted Before API surface에는
[[API 엔드포인트와 스키마|API-Endpoints-and-Schemas]]에 요약된 public과
optional-auth endpoints가 그대로 포함됩니다.

## 공개 검증 명령

Focused smoke checks / 집중 smoke 확인:

```bash
python -c "from backend.main import app; print('import_ok')"
python backend/verify/check_document_draft.py
```

Frontend build / frontend build:

```bash
cd frontend
npm run build
```

현재 demo bundle:

```bash
bash scripts/demo_preflight.sh
```

documentation-only changes에는 broad retrieval/answer eval이 필요하지 않습니다.

## 증거 기록 위생

공개 reports에는 다음 수준만 기록합니다.

- PASS / PARTIAL / FAIL
- PRESENT / ABSENT
- YES / NO
- route and endpoint names
- sanitized screenshots with sample data

공개 reports에는 raw uploaded files, raw user statements, full answer/draft
payloads, credential values, private cloud inventory, private runtime endpoints를
기록하지 않습니다.

## 알려진 런타임 리스크

- live provider timeout은 transient일 수 있습니다.
- OCR/live provider paths에는 retry가 필요할 수 있습니다.
- cloud migration은 dev-first로 유지합니다. demo/contest posture는 production
  opening이 아닙니다.

## 함께 보기

- [[테스트 전략|Testing-Strategy]]
- [[사용자 흐름|User-Flows]]
- [[트러블슈팅 런북|Runbook-Troubleshooting]]
