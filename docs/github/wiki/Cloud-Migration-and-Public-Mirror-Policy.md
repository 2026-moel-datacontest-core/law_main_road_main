# 클라우드 전환과 공개 미러 정책

이 문서는 공개 가능한 수준의 cloud migration posture와 repository policy를
정리합니다.

## 환경 프로필 (Environment Profiles)

Cloud migration은 dev-first policy를 사용합니다.

| Profile | 의미 |
|---|---|
| `dev` | first Terraform apply target and smoke-test environment |
| `demo/contest` | time-bounded public presentation posture after dev smoke passes |
| `prod` | separate production-opening review 없이는 미오픈(NOT opened) |

현재 프로젝트는 full production readiness를 주장하지 않습니다.

## 저장소 역할 (Repository Ownership)

| Repository | 역할 |
|---|---|
| private source/deploy repo | development와 private deployment automation |
| public mirror repo | curated public submission surface |

public mirror는 deploy authority가 아닙니다.

## 공개 미러에 넣지 않는 것

- deploy credentials
- infrastructure state files
- cloud IAM key JSON
- cloud secret values
- private cloud inventory
- raw user/case data
- full answer/draft payloads
- auth-provider subject identifiers, email values, database account identifiers
- private runbooks

## 공개 미러에 넣을 수 있는 것

- README
- curated final code snapshot, after security review
- public Wiki docs
- redacted architecture diagrams
- safe screenshots
- contest notice and license information

## 제출 운영 자세

public demo는 contest review와 public presentation을 위한 것입니다. operational
hardening items, production opening, retention lifecycle expansion은 이후 review로
명시적으로 열기 전까지 future work로 관리합니다.

## Public Demo URL / Domain

승인된 public demo URL은 다음과 같습니다.

```text
https://www.law-main-road.cloud
```

Cloud Run managed HTTPS URL은 first migration과 rollback 확인에 충분한 기본
배포 경로로 유지합니다. Public contest/portfolio용 custom domain은 Phase 7A
optional hardening으로 열었고, 첫 경로는 Firebase Hosting custom domain입니다.

- custom domain은 `demo/contest` posture이며, 별도 승인 없이 `prod`를 의미하지
  않습니다.
- domain 구매, Gabia DNS, Firebase Authorized Domains, CORS, certificate 상태는
  `www` host 기준으로 검증 완료했습니다.
- Frontend API base는 direct backend path를 유지합니다. Same-origin `/api/**`
  rewrite와 frontend rebuild는 Phase 7A에서 하지 않았습니다.
- Gabia URL forwarding은 가장 단순한 임시 연결 방식이지만, public portfolio의 기본
  custom domain hosting 방식으로는 선호하지 않습니다.
- HTTPS Load Balancer, Cloud Armor, root apex, 별도 `api` domain은 이후 별도
  hardening 후보로 둡니다.
- direct backend Cloud Run URL과 내부 cloud inventory는 public docs/screenshots에
  노출하지 않습니다.

## 클라우드 경계 요약

- first cloud target은 `dev`입니다.
- `demo/contest`는 dev smoke 이후 time-bounded public presentation posture입니다.
- `prod`는 operating owner, cost, reliability, security, rollback, retention
  policy를 별도 review에서 승인하기 전까지 미오픈(NOT opened)입니다.
- public mirror는 curated submission surface이며 development/deployment source
  of authority가 아닙니다.

## 함께 보기

- [[보안 모델|Security-Model]]
- [[배포와 실행 가이드|Deployment-and-Setup-Guide]]
- [[범위 및 비목표|Scope-and-Non-Goals]]
