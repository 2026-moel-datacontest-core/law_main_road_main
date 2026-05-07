# 보안 모델

## 위협 경계 (Threat Boundary)

MVP는 민감한 labor-case context를 다룹니다. security model은 다음에 초점을 둡니다.

- 수집·저장하는 personal data 최소화
- browser storage에 tokens를 저장하지 않기
- protected SCN-001 actions에 backend-verified auth 요구
- public docs와 public mirror repositories에서 secrets 노출 방지
- Bridge를 사건 맥락 연결/참고용으로만 유지하고 법적 근거(legal grounding)로 쓰지 않기

## 인증 (Authentication)

SCN-001 protected paths는 Firebase Google Sign-In을 사용합니다.

```text
Firebase Web SDK
  -> Firebase ID token
  -> backend Firebase Admin verification
  -> backend-owned project account linkage
```

Frontend protected gates는 backend `/api/v1/auth/me` verification을 사용합니다.
Firebase signed-in state만으로는 충분하지 않습니다.

## 인가 (Authorization)

Protected SCN-001 APIs는 Firebase bearer token을 요구합니다. 존재하지 않거나
소유하지 않은 Bridge records는 not found로 masked됩니다.

## 비밀값 관리

다음 항목은 commit하지 않습니다.

- `.env*`
- Firebase Admin credential JSON
- cloud IAM key JSON
- infrastructure state files
- cloud secret values
- credential-bearing database URLs
- Firebase ID tokens or Google OAuth tokens

## 공개 미러 규칙

public mirror는 curated submission surface입니다. deploy authority, keyless
deploy trust details, cloud IAM key files, infrastructure state files, private
runbooks, raw user/case data를 public mirror에 넣지 않습니다.

## 로그와 증거 기록 규칙

Public evidence는 PASS/PRESENT/ABSENT/NO 스타일의 signals를 사용합니다. live
credential values, raw case text, full answer bodies, full draft bodies, internal
account identifiers, private cloud inventory는 기록하지 않습니다.

## 함께 보기

- [[데이터 모델과 개인정보 경계|Data-Model-and-Privacy]]
- [[클라우드 전환과 공개 미러 정책|Cloud-Migration-and-Public-Mirror-Policy]]
