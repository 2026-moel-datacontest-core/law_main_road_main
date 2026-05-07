# 트러블슈팅 런북

이 문서는 public-safe runbook입니다. private cloud resource identifiers, secret
values, raw case data를 포함하지 않습니다.

Canonical owner: 이 Wiki page는 troubleshooting 판단과 증거 기록 위생을
관리합니다. setup, server run, verification command의 canonical owner는
[[배포와 실행 가이드|Deployment-and-Setup-Guide]]입니다. `docs/github/runbook.md`는
public mirror용 concise quick reference로 유지합니다.

## Backend import 실패

실행:

```bash
conda activate law_main_road
python -c "from backend.main import app; print('import_ok')"
```

확인:

- Python environment가 `base`가 아닌지
- dependencies가 project environment에 설치되어 있는지
- 필요한 위치에 local `.env`가 있는지

## Frontend build 실패

실행:

```bash
cd frontend
npm run build
```

확인:

- Node dependencies가 설치되어 있는지
- local testing 기준 `NEXT_PUBLIC_API_BASE_URL`이 올바른지
- route code가 contract에 없는 backend fields를 가정하지 않는지

## 로그인처럼 보이지만 보호 UI가 닫힌 경우

SCN-001 protected gates는 Firebase signed-in state만이 아니라 backend
verification을 요구합니다.

확인:

- frontend에 Firebase user가 있는지
- request에 Firebase-issued bearer credential이 포함되는지
- `/api/v1/auth/me`가 logged-in backend user status를 반환하는지

## OCR 또는 provider timeout

앱은 raw job id, provider status, internal error details를 user-facing UI에서
숨겨야 합니다. user-facing guidance는 document quality와 length에 따라 OCR이
약 1~2분 걸릴 수 있음을 설명해야 합니다.

live provider calls가 실패하면 local/private environment에서 credentials와
provider availability를 확인한 뒤 retry합니다.

## 문서 초안 흐름이 비활성화된 경우

Draft flow는 의도적으로 guard되어 있습니다. answer에 다음 항목이 있는지 확인합니다.

- cited articles
- grounded context ids
- supported scenario/document type

Bridge-origin/live modified SCN-001 paths는 exact frontend-local frozen draft
preset을 쓰는 경우를 제외하고 answer-only입니다.

## 공개 증거 기록 위생

issues, screenshots, Wiki updates를 작성할 때는 summarized status signals를
사용합니다. raw uploaded documents, raw case statements, full response payloads,
credential values, private cloud inventory, private runtime endpoints를 붙여 넣지
않습니다.

## 함께 보기

- [[테스트 전략|Testing-Strategy]]
- [[API 엔드포인트와 스키마|API-Endpoints-and-Schemas]]
- [[E2E 데모 검증|E2E-Demo-Verification]]
