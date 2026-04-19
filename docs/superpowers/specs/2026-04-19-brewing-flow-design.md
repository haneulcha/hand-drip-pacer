# Brewing Flow — Design Spec

4-스크린 리추얼 플로우 전환 + 실시간 타이머 (D1). 핸드오프: `docs/design_handoff/README.md`.

현재 단일 `CalculatorPage`에서 **Wall → Recipe → Brewing → Complete** 선형 플로우로 재편. 기존 도메인 계층은 유지.

## Context

- v1(계산기) + 브랜드 1차(비주얼 토큰) + 브랜드 2차(카피 로컬라이즈) 완료.
- TODO.md의 **D1 실시간 타이머**가 본 스펙의 직접 동기. 핸드오프가 타이머를 4-스크린 리추얼 안에 배치하기 때문에 단독 구현 불가.
- 브랜드 철학(숫자는 디딤돌 / 침묵 / 느린 움직임)은 이 스펙의 모든 UI 결정의 준거.

## Goals

- 사용자가 앱을 열면 Wall(선반)에서 드리퍼를 집어들고, Recipe에서 레시피를 다듬고, Brewing에서 타이머를 따라 내리고, Complete에서 조용히 마무리하는 리추얼 경험.
- 기존 도메인(`BrewMethod` 플러그인 구조, `Recipe` 타입)은 변경 없이 그대로 소비.
- 타이머는 백그라운드/재로드에 resumable (epoch-timestamp 기반).
- Recipe URL 공유는 기존 쿼리스트링 방식 유지.

## Non-Goals (이 스펙 범위 밖)

- **Share cards (PNG 공유)** — Square/Story 카드 렌더링 + 네이티브 공유. 후속 마일스톤.
- **View Transitions API** — Wall ↔ Recipe morph 등 정교한 전이. 후속. 지금은 단순 slide-up.
- **고급 설정 화면** — `고급 ›` 링크 뒤. Hoffmann 같은 서브 메서드 조정, 커스텀 pour schedule 등. 범위 밖.
- **레시피 히스토리** — Complete에서 저장은 하되 과거 세션 열람 UI 없음.
- **저울 BT 연동** — 별도 프로젝트.
- **회원/서버/프리셋 라이브러리** — v2+ 아닌 이유는 design.md § Scope와 동일.

## Architecture

### Screen state machine

라우터 라이브러리 없이 `AppState.screen` 단일 유니온 필드로 관리. 각 화면은 자체 컴포넌트, 전환은 `screen` 값 교체.

```
wall ──탭 드리퍼──▶ recipe ──탭 시작──▶ brewing ─┬─완료──▶ complete ──처음으로──▶ wall
                    ▲                            │
                    └─── 중단(Stop confirm) ─────┘
```

- `wall`: 드리퍼 2개 중 하나 탭 → `recipe` (탭된 드리퍼 상태 반영).
- `recipe`: `시작` 탭 → `brewing` (현재 recipe snapshot + `startedAt = Date.now()`).
- `brewing`: 모든 step 완료 → `complete`. `중단` + `처음으로` → `wall` (세션 폐기).
- `complete`: `처음으로` → `wall`. `공유` → placeholder (후속).

### Brewing substate

Brewing 화면 내부 상태:
```ts
type BrewingState =
  | { kind: 'running'; session: BrewSession }
  | { kind: 'confirm-stop'; session: BrewSession }
  | { kind: 'done'; session: BrewSession }  // 'complete' 화면 전환 직전 잠깐
```

> **구현 주석 (Phase 2)**: `BrewingState` union은 개념 모델 — 실제 구현은 `stopDialogOpen: boolean` 로컬 상태 + `done = elapsed >= totalTimeSec` 파생값으로 간소화. `running`/`done` 상태는 `done` 플래그로, `confirm-stop`는 `stopDialogOpen`으로 표현.

현재 step 인덱스·elapsed는 `Date.now() - session.startedAt`에서 계산 (파생값, 저장 X). `requestAnimationFrame` 루프로 초당 ~1회 리렌더.

### URL sync

- Recipe 파라미터는 기존대로 쿼리스트링 sync — 브라우저에서 URL 복사로 공유 가능.
- `screen` / `brewing` 상태는 URL에 반영하지 않음.
- 초기 진입 시: 쿼리스트링 있으면 `recipe`로 바로 진입 (공유 의도 존중), 없으면 `wall`.
- Recipe 화면에 명시적 "링크 복사" 버튼은 없음 (핸드오프에 없음, URL 자체가 공유 메커니즘).

## Domain Model

### 변경 없음
`BrewMethod`, `Recipe`, `Pour`, `TasteProfile`, `DripperId`, `BrewMethodId`, 분쇄 `grindHint` 출력 — 전부 그대로.

### 추가

```ts
// src/domain/session.ts (새 파일)
export type Feeling = 'calm' | 'neutral' | 'wave'

export type BrewSession = {
  readonly recipe: Recipe
  readonly startedAt: number  // epoch ms
  readonly completedAt?: number
  readonly feeling?: Feeling
}
```

순수 데이터. 계산 헬퍼(`activeStepIdx(session, now)`, `elapsedSec(session, now)` 등)는 같은 파일에 순수 함수로.

### localStorage

- 기존 `bloom-coffee:v1` (Recipe 파라미터 쿼리스트링) — 유지.
- 신규 `bloom-coffee:session:v1` — 마지막 완료 세션 snapshot. **Phase 4에선 저장만, 읽지 않음** (미래 히스토리 확장 훅).

## Screen Specs

핸드오프 문서가 레이아웃/위계/카피의 진실. 여기는 **핸드오프와 달라지는 지점**과 **도메인 연결 지점**만 서술.

### Wall

- 핸드오프대로. `레시피 먼저 보기 ›`는 히스토리 화면 없으므로 **숨김** (Phase 5 이후 재도입 검토).
- 드리퍼 탭 → `AppState.dripper = tapped`, `screen = 'recipe'`. 방식은 드리퍼 변경 시 `methodsForDripper(dripper)[0]`으로 자동 스위치 (기존 로직 유지).

### Recipe

핸드오프와 **다른 지점**:

1. **4번째 컨트롤 행은 "분쇄"가 아닌 "방식"**. 핸드오프 저자가 라벨을 혼동한 것으로 확인. `방식` segmented는 현재 드리퍼의 메서드로 채움 (`methodsForDripper(dripper)`). **Kalita Wave 드리퍼의 경우 segment 1개라도 표시** (숨기지 않음).
2. **권장 행에 분쇄도 출력 표시 추가**: `권장 90° · 1:15 · 3:30 · 굵은 소금` (기존 grindHint 시각 비유 문자열 재사용 — `ui/format.ts`의 `formatGrindHint`).
3. **세로 PourVerticalPreview는 신규 컴포넌트** — 기존 `PourTimeline`(가로)는 제거. 시간이 위→아래, 각 step이 `시간 | ● | 가로 막대(∝ Δg) | +Δg 라벨`. Bloom은 ochre + 우측 `bloom` 마커.
4. **상단 바의 `바꾸기 ›`** — popover 트리거. V60 / Kalita Wave 2행. 핸드오프대로.

카피: 핸드오프대로 (`커피`, `맛`, `강도`, `방식`, `권장`, `푸어 스케줄`, `시작`, `바꾸기 ›`, `고급 ›`).

### Brewing (D1 타이머)

- 상단: `경과` 라벨 + `mm:ss` (26pt). 우측 `중단` 텍스트 버튼.
- 진행 레일: `pours.length`개 bar. 완료(ink) / 현재(ochre) / 예정(faint). 라벨은 `pour.label === 'bloom' ? '뜸' : '${i}차'`.
- Hero: `지금` + `저울 목표` + `{active.cumulativeWater}` (96pt) + `g`. 아래 `+{active.pourAmount}g 붓기` 필기체 → **브랜드 2차 원칙에 따라 필기체는 프로덕션에 반영하지 않음, soft italic 혹은 일반 soft 톤으로 대체.**
- 시점: `시점` + `active.atSec` (mm:ss).
- 다음 미리보기: 하단, `다음` + `next.atSec` + `next.cumulativeWater` + `g`.

**타이머 동작**:
- step 전이: `elapsed >= pours[i+1].atSec`이면 active를 i+1로.
- 완료: `elapsed >= totalTimeSec` → `screen = 'complete'`, `session.completedAt = Date.now()`.
- 백그라운드 복구: 마운트 시 `session.startedAt`으로 현재 step 재계산. 타이머 누적값이 아닌 절대 시각 기반이라 탭 전환에도 정확.
- `중단` 탭 → `BrewingState.kind = 'confirm-stop'`.
- Stop dialog 라벨 **재고** (핸드오프 주석 반영): 좌(보조) `계속하기`, 우(강조) `처음으로`. 핸드오프의 `중단`/`처음으로` 조합은 버튼 2개가 둘 다 종료를 의미해서 혼동. **수정**: 좌 `계속하기` = 취소(다이얼로그만 닫힘), 우 `처음으로` = 세션 폐기 후 Wall.

**접근성**: 현재 step 변경 시 `aria-live="polite"`로 `"{n}차: {cumulativeWater}그램까지"` 형태로 announce.

### Complete

- 핸드오프대로.
- 감정 버튼 3-way (`calm` / `neutral` / `wave`). 단일 선택, 재탭 시 해제. 선택 시 `session.feeling` 업데이트.
- `처음으로` → `wall`. `공유` 버튼은 **disabled** 상태로 표시 (Phase 5 전까지).
- 세션 저장: `처음으로` 탭 시점에 `localStorage['bloom-coffee:session:v1']`에 `JSON.stringify(session)`. 읽는 곳은 Phase 4엔 없음 (미래 히스토리 훅).

## Testing

도메인 순수 함수는 Vitest (기존 관행).
- `activeStepIdx(session, now)`: 각 step 경계에서 올바르게 증가. elapsed < 0, elapsed > totalTime, bloom step 등 엣지.
- `elapsedSec(session, now)`: 음수 안 나오게 clamp.

UI 컴포넌트는 스냅샷·단위 테스트 최소로. E2E(Playwright)로 플로우 회귀 방지는 **Phase 3 이후** TODO의 C4로 남김 (이 스펙 범위 밖).

## Phases

| # | 제목 | 내용 | Shippable |
|---|---|---|---|
| 0 | Screen state foundation | `AppState.screen` 추가, `CalculatorPage` → `AppRoot` 재명명 + screen 기반 분기. 화면은 기존 Recipe 단일만 `recipe`로 라우팅. | X (뼈대) |
| 1 | Recipe redesign | 핸드오프 Recipe 레이아웃, 방식 segmented(항상 표시), 권장 행 분쇄도 추가, 세로 `PourVerticalPreview` 신규, 바꾸기 popover, 시작 버튼 스텁. 기존 가로 `PourTimeline` 제거. | ✓ 기존 앱 대체 |
| 2 | Brewing + Timer (D1) | `BrewSession` 도메인 타입 + 순수 헬퍼, `BrewingScreen` 컴포넌트, Stop confirm dialog, 시작 → brewing 전이 연결. | ✓ D1 목표 달성 |
| 3 | Wall screen | `WallScreen` + 초기 진입 로직(쿼리 있으면 recipe, 없으면 wall), 드리퍼 shelf, slide-up 전이. | ✓ 풀 진입 플로우 |
| 4 | Complete screen | `CompleteScreen` + 감정 3-way + 레시피 요약 카드. 공유 버튼은 placeholder. 세션 localStorage 저장(읽기 미구현). | ✓ 풀 리추얼 |
| 5 (defer) | Share + View Transitions | Square/Story PNG 렌더링, Web Share API, View Transitions API로 Wall↔Recipe morph. | 별도 마일스톤 |

각 Phase는 별도 PR / 커밋 단위.

## Open Decisions

없음. D1~D4는 결정 완료.

## References

- 핸드오프: `docs/design_handoff/README.md`, `reference/wall-flow.jsx`
- 브랜드: `docs/brand.md`
- 도메인 스펙: `docs/design.md`
- 토큰: `docs/design-tokens.md`
- 현재 상태: `docs/TODO.md`
