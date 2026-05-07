# 테스트 전략

## 목표 (Goals)

Testing은 demo stability, public contract safety, privacy boundary preservation에
초점을 둡니다.

## 집중 확인 명령 (Focused Checks)

```bash
python -c "from backend.main import app; print('import_ok')"
python backend/verify/check_document_draft.py
cd frontend
npm run build
```

## 데모 사전 점검 (Demo Preflight)

```bash
bash scripts/demo_preflight.sh
```

retrieval, answer-generation, embedding, DB, API contract behavior가 바뀌지 않은
current QA/doc tasks에는 이 command를 사용합니다.

## 전체 Retrieval / Answer 평가

broad answer evidence eval은 다음 중 하나가 바뀐 경우에만 실행합니다.

- retrieval behavior
- answer generation behavior
- embedding behavior
- DB contents
- public API response contract

PASS / PARTIAL / FAIL evidence가 필요할 때는 item-level evidence tooling을
사용합니다. full 60-answer evidence report를 `scripts/demo_preflight.sh`에
추가하지 않습니다.

## 수동 브라우저 확인

권장 manual checks:

- SCN-004 exact preset answer -> intake -> draft
- SCN-004 copy and browser print
- SCN-001 login, Before review, Bridge handoff, protected answer
- `/history` visible records and MVP soft-delete
- `/after` saved history selector
- logout memory reset

## 문서만 변경한 경우

Wiki-only update의 expected verification은 documentation-focused입니다.

- file list and link existence check
- public forbidden wording scan
- GitHub Wiki link syntax scan
- `git diff` review scoped to `docs/github`
- backend, frontend, schema, API, Terraform, infra edits 없음

## 알려진 런타임 리스크

- provider timeout은 transient일 수 있습니다.
- OCR/live provider paths에는 retry가 필요할 수 있습니다.
- cloud migration은 dev-first validation 상태로 유지합니다.

## 함께 보기

- [[트러블슈팅 런북|Runbook-Troubleshooting]]
- [[프로젝트 수행 및 완성|Project-Execution-and-Completion]]
- [[E2E 데모 검증|E2E-Demo-Verification]]
