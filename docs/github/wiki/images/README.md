# Wiki 이미지

이 폴더는 GitHub Wiki에 사용할 공개 이미지, 다이어그램, 스크린샷의 staging
위치입니다.

## 현재 포함된 이미지

| File | 용도 | 공개 기준 |
|---|---|---|
| `cloud-migration-overview.png` | cloud migration overview | 내부 drawio export에서 프로젝트명과 공개 경계에 맞게 정리한 public-safe copy |
| `cloud-migration-detail.png` | cloud migration detail | 내부 drawio export에서 비공개 식별자와 raw payload 관련 경계를 제거한 public-safe copy |

이미지를 추가하기 전에 다음 항목을 제거합니다.

- real user/case facts
- credential values and email values
- auth-provider subject identifiers and database account identifiers
- cloud identity emails
- private cloud resource identifiers
- private runtime endpoints
- cloud secret values or names that reveal private architecture

권장 public assets:

- high-level architecture diagram
- Before/After/History user-facing screenshots with sample data only
- demo flow diagram
- cloud migration posture diagram without private identifiers
