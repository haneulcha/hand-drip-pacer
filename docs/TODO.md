# TODO

다음 세션에서 고를 작업 메뉴. 현재 상태와 배경을 여기에 담음.

## 현재 지점

- **v1 완료** + **브랜드 '뜸' 1차 (비주얼) + 2차 (카피) 반영됨**
- 커밋 3개:
  - `feat: Hand Drip Calculator v1` — 도메인 + UI + share, 테스트 75개
  - `style: 브랜드 '뜸' 1차 토큰 반영 (팔레트·폰트·모션)`
  - `feat: UI 라벨 한국 커피 씬 톤으로 로컬라이즈 (브랜드 2차)`
- 빌드·테스트 green, 데스크톱/모바일 visual QA 통과
- 관련 문서: `CLAUDE.md`(규약), `docs/design.md`(스펙), `docs/brand.md`(브랜드), `docs/design-tokens.md`(토큰 구현)

## 보류 결정 (기록용)

- **브랜드 3차 마감 (타이틀 `뜸` 교체 / Segmented shadow 제거 / 초기화 버튼 숨김)** — 불필요로 판단, 스킵. 현재 `핸드드립 계산기` 타이틀과 현재 시각 상태로 충분.
- 메서드 설명/노트는 brand.md 버전(짧고 단정)이 아니라 현재(더 정확함) 유지.
- bloom 배지·고유명사(Kasuya/Hoffmann/Kalita Wave)는 원어 유지 — 브랜드 과잉 푸시 회피.

---

## 옵션 메뉴

### B. 운영 / 배포

**B1. README** — 외부인용 최소 설명.

**B2. 배포 (Vercel / Cloudflare Pages)** — 공유 URL이 실제 공유되려면 필요.

**B3. PWA / 오프라인** — `vite-plugin-pwa` + manifest + 앱 아이콘. 부엌 wifi 불안정 시나리오와 브랜드 침묵 원칙에 맞음. 작업량: 중.

### C. 기술 부채 / 품질

**C1. Dark mode 값 확정** — 현재 skeleton만 (brand가 light만 정의). 디자인 결정 필요.

**C2. Hoffmann grind 규칙 리서치** — 현재 boolean OR 해석(주석에 명시). Hoffmann 원전 재확인 후 필요 시 가산 방식으로 교체. 컴포넌트 변경 없음, `grindFor` 함수만 수정.

**C3. Kalita sweet/strong rounding 비대칭** — `[3,5,5,3]` 패턴 + drift-to-last-pulse가 `[53, 88, 88, 51]` 생성. 대칭 유지하는 정수 재분배 알고리즘으로 교체 가능 (방법: cumulative-target rounding — 누적 목표값을 round한 뒤 delta로 pulse 계산).

**C4. E2E 테스트 (Playwright)** — URL 복원, 드리퍼 자동 스위치 등 상호작용 회귀 방지.

### D. v2 기능 (design.md § v2 확장 지점)

**D1. 실시간 타이머 (`<BrewTimer recipe={recipe} />`)** — `Pour.atSec` 덕분에 Recipe를 그대로 소비 가능한 구조로 설계됨. 이름 "뜸"과 철학적으로 가장 부합 (실제 뜸 시간을 지켜주는 앱).

**D2. Approach B (파라미터 직접 조절)** — 고수용 toggle. `InputPanel`에 `PourEditor` 추가 + 도메인에 직접 빌드 경로 추가.

**D3. 프리셋 저장 / 원두 라이브러리** — 서버 필요. 스코프 큼.

---

## 추천 조합

- **실사용 겨냥**: B2 (배포) → B1 (README) → B3 (PWA)
- **제품 확장 겨냥**: D1 (타이머) — 철학적으로 가장 부합
- **품질 다지기**: C4 (E2E) → C2 / C3 (알고리즘 정밀화)

## 다음 세션 시작 시

1. 이 문서 읽기
2. `CLAUDE.md` + `docs/brand.md` 재확인
3. 옵션 선택 후 시작
