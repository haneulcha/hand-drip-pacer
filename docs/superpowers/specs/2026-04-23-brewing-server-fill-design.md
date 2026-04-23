# Brewing Screen — Viewport-as-Server Fill

**Date:** 2026-04-23
**Status:** Design
**Scope:** `src/features/brewing/BrewingScreen.tsx` + 관련 토큰. 도메인 레이어·세션 모델 무변경.

## Context

현재 `BrewingScreen`은 데이터 표시형 — 상단 progress rail은 푸어 단계만(균등 분절) 표현하고, hero/next preview/skip 등이 조각조각 배치돼 있다. 시간의 흐름과 추출 진행이 **이산적인 숫자/단계 표시**로만 전달돼서, 사용자가 화면을 보면서 "다음 푸어까지 얼마나 남았는가"를 한눈에 가늠하기 어렵다.

브루잉 화면은 사용자가 실제로 물을 따르는 동안 **가이드 역할**이 본 목적. 정보 분산보다는 **단일한 시간 지표**가 메인 모멘텀이 되어야 한다.

## Goal

뷰포트 자체가 서버(추출 결과를 받는 잔) 내부가 되어, 시간이 흐르면 아래에서 위로 갈색 액체가 차오른다. 컵 안의 수평 눈금이 푸어 phase 경계를 표시하고, 메니스커스가 다음 눈금에 가까워지는 거리감으로 **다음 푸어까지 남은 시간을 직관적으로 읽게** 한다. Hero(목표 무게 + 단계 + 행동 지시)는 메니스커스 바로 위에 떠서 같이 상승.

## Non-Goals

- **도메인 변경 없음** — `Recipe`, `Pour`, `BrewSession`, `activeStepIdx`, `useElapsed` 모두 그대로 소비.
- **새 푸어 메서드/파라미터** — 시각화만 바뀜.
- **건너뛰기(skip) 동작 변경** — 위치/스타일은 재배치되지만 로직(2026-04-19-brewing-skip-design.md)은 동일.
- **중단(stop) 다이얼로그 변경 없음**.
- **세션 저장/완료 화면(`CompleteScreen`) 변경 없음**.
- **저울 BT 연동, 실측 무게 입력** — 별도 프로젝트.
- **다국어/단위 토글** — 범위 밖.

## Design

### 시각 컨셉

- 뷰포트 = 서버 내부. 상단은 컵 입구(rim), 하단은 컵 바닥. 액체가 아래에서 차오름.
- 액체는 **시간 비례로 일정 속도** 상승. 푸어할 때만 솟는 stepped 모델 아님 — 사용자가 다음 눈금까지 거리감으로 시간을 읽기 때문에 일정 속도여야 한다.
- 컵 안 수평 눈금 = 푸어 **phase 경계** (= 다음 phase가 시작되는 시각). 위치는 `pour.atSec / totalTimeSec`.
- Hero(목표 무게 + 단계 라벨 + +Xg 붓기)는 메니스커스 위에 떠서 같이 상승. 항상 cream 배경 위에 위치 → 색·위계 고정.

### 화면 영역 (위→아래)

```
┌─────────────────────────────────────┐
│  RIM (height = --rim-height)        │  ← 경과, 중단. 액체 절대 미도달.
│  [경과 / mm:ss]            [중단]   │
├─ hairline ──────────────────────────┤
│  CUP INTERIOR                       │
│                                     │
│  ── 3:30 · drip ─────────── 87.5%   │
│  (headroom for hero)                │
│                                     │
│  ── 2:30 · 3차 ──────────── 62.5%   │  ← next ring (강조)
│      [Hero floating just above      │
│       meniscus]                     │
│  ◢◢◢◢◢◢◢◢◢◢◢◢◢◢◢◢◢◢◢◢◢ meniscus    │  ← 동적
│  ░░░░░░░░░░░░░░░░░░░░░░ liquid    │
│  ── 1:30 · 2차 ──────────── 37.5%   │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│  ── 0:45 · 1차 ──────────── 18.75%  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│  ── 0:00 ───────────────── 0%       │
└─────────────────────────────────────┘
```

### 핵심 메커니즘

1. **Liquid fill height** = `(elapsed / totalTimeSec) * 100%` of cup-interior height. Linear, no easing during steady state. 250ms transition on each tick (`useElapsed`의 250ms tick과 동기) — 부드러운 상승.
2. **Ring 위치** = `(pour.atSec / totalTimeSec) * 100%` from cup-interior bottom. `pours[0]`는 atSec=0이라 화면에 안 그림(컵 바닥). 마지막 ring은 `totalTimeSec` 기준 마지막 pour의 atSec. drawdown 종료(=totalTimeSec)는 컵 입구이므로 별도 ring 안 그림.
3. **Ring 분류** (메니스커스 위치 기준):
   - **below**: 메니스커스보다 아래(이미 지난 phase 경계). 색을 액체 위에서 보이는 cream 톤으로.
   - **next**: 메니스커스 바로 위 첫 ring. 강조(짙은 잉크, 굵게).
   - **future**: 그 이상. 차분한 mute 톤.
4. **Hero 위치** = `bottom: calc(fillHeight + var(--hero-meniscus-gap))`. 액체와 같이 250ms transition 상승.
5. **Hero 내용**: `지금 · {phaseLabel}` / 큰 숫자 `{cumulativeWater}` `g` / 이탤릭 `+{pourAmount}g 붓기`. 마지막 푸어면 ` · 마지막 푸어` 추가.
6. **Drawdown phase** (마지막 pour 이후 ~ totalTimeSec): hero는 `드로우다운 / 기다림`으로 변형, 큰 숫자는 마지막 cumulativeWater 그대로 유지(이미 부어진 양). +Xg 라인 비표시.

### 가독성 제약: Hero clearance

상단 RIM과 **최상단 ring 사이 픽셀 간격** ≥ Hero 렌더 높이 + 안전 여백.

```
clearance(px)
  = cupInteriorHeight × (1 - lastRingPosition / totalTimeSec)

requirement
  clearance ≥ heroRenderedHeight + 16px
```

이 조건이 보장되면 메니스커스가 최상단 ring에 도달했을 때도 Hero가 RIM과 충돌하지 않는다.

**구현 정책:**
- `--brewing-rim-height: 84px` (elapsed 22px + 라벨 9px + padding ≈ 60px + 24px 여유).
- Hero 숫자 폰트 크기는 `--font-size-hero-sm`(72px)이 아닌 전용 `--font-size-brewing-hero: clamp(32px, 6.5vh, 48px)`. 단말 viewport 높이에 비례 자동 축소.
- 가산 (max 48px 기준): now-tag 12 + gap 4 + num 48 + gap 6 + delta 16 = **86px** Hero 높이 + 12px gap = 98px clearance 필요.
- 800px 단말 cup-interior = 716px. lastRingPosition 87.5% → clearance = 89.5px → **부족 5%**. → 동작 단말 대다수에서는 hero가 자동으로 7.2vh × 0.6 ≈ 35-40px로 clamp되어 fits. 작은 단말(viewport <700px) 보호용.
- **edge fallback policy**: 그래도 `clearance < heroRenderedHeight + 8px`이면 최상단 ring 라벨을 RIM 우측 보조 영역으로 이동 (`{nextLabel} {nextTime}` ghost 텍스트). 이 분기는 예외 처리이므로 컴포넌트 내부에서 `useLayoutEffect`로 측정 후 결정.

### Rim 시각 처리

- 배경: `var(--color-surface)` (cream). 아래 hairline `1px var(--color-border)` 으로 컵 입구 표현.
- Inner shadow: `inset 0 6px 14px -10px rgba(0,0,0,.18)` — 컵 안을 들여다보는 느낌. 신규 토큰 `--shadow-rim-inset` 추가.
- 좌측: 경과 시간 (label `2xs` + value `xl tabular-nums`).
- 우측: `중단` ghost 버튼 (기존과 동일 스타일).

### Cup interior

- 배경: `var(--color-surface)` (rim과 같은 cream). Inner top shadow `inset 0 8px 16px -12px rgba(0,0,0,.12)` — rim 반대편의 부드러운 음영.
- `position: absolute; top: var(--rim-height); inset-x: 0; bottom: 0; overflow: hidden;`
- Liquid, rings, hero 모두 cup-interior 좌표계 기준.

### Liquid

- `position: absolute; bottom: 0; left: 0; right: 0;`
- `height: var(--brewing-fill, 0%)` — 컴포넌트가 `elapsed/totalTimeSec` 계산해 inline style로 주입.
- Transition: `height var(--motion-duration-base) cubic-bezier(.4, 0, .2, 1)`.
- 배경 그라디언트 (위→아래로 짙어짐):
  ```css
  background: linear-gradient(180deg,
    var(--color-brewing-liquid-top) 0%,
    var(--color-brewing-liquid-mid) 22%,
    var(--color-brewing-liquid-deep) 60%,
    var(--color-brewing-liquid-bottom) 100%);
  ```
- Meniscus highlight: `::before`로 상단 2px highlight band. `linear-gradient(90deg, transparent, rgba(255,247,228,.55), transparent)`.
- Wave shimmer: `::after`로 상단 10px 영역 부드러운 oval gradient + `wave 4s ease-in-out infinite` (좌우 8px / scaleY 1.5). prefers-reduced-motion에선 미적용.

### Rings

- Wrapper: `position: absolute; left: 0; right: 0; height: 1px; bottom: var(--ring-pos);`
- Line: `position: absolute; left: 14px; right: 96px; top: 0; height: 1px; background: <variant>;`
- Label: `position: absolute; right: 16px; top: -7px; font-size: 2xs; font-variant-numeric: tabular-nums;` 우측 정렬. 형식: `{m:ss} <span class="lbl">{phaseLabel}</span>`.
- Variants:
  - `future`: line `var(--color-ring-future)` (mute), label `var(--color-text-muted)`.
  - `next`: line `var(--color-text-primary)` height 1.5px, label `var(--color-text-primary)` `font-weight: 600`.
  - `below`: line `var(--color-ring-on-liquid)` (cream tint with low alpha), label cream `opacity .78`.
- 분류는 `pour.atSec` vs `elapsed` 비교로 결정.

### Hero

- `position: absolute; left: 14px; right: 96px; bottom: calc(var(--brewing-fill) + var(--hero-meniscus-gap));`
- `--hero-meniscus-gap: 12px`.
- Transition: `bottom var(--motion-duration-base) cubic-bezier(.4, 0, .2, 1)`.
- 구조:
  ```
  <div class="hero">
    <div class="now-tag">지금 · {phaseLabel}</div>
    <div class="target-row">
      <span class="num">{cumulativeWater}</span>
      <span class="unit">g</span>
    </div>
    <div class="delta">+{pourAmount}g 붓기{isLast ? " · 마지막 푸어" : ""}</div>
  </div>
  ```
- `pointer-events: none` — 클릭 패스스루 (드로우다운 중 액체와 겹쳐도 하단 인터랙션 보존; 현재는 하단 인터랙션 없으니 안전책).
- Aria-live는 기존 `AriaLiveStep`을 재사용 (현재 BrewingScreen.tsx에 이미 있음).

### Skip 버튼

기존 위치(hero 아래 중앙)는 viewport-as-server 컨셉에서 어색. 액체와 절대 겹치지 않도록 **RIM 영역 내**로 이동.

- **위치**: RIM 우측, `중단` 좌측에 인접 배치. 두 버튼 모두 ghost 스타일.
  ```
  ┌─────────────────────────────────────┐
  │ 경과              [건너뛰기 ›] [중단] │  ← RIM
  ```
- 폰트 `xs`, color `text-text-muted`, hover `text-text-secondary`. tap target ≥ 44px.
- aria-label / 동작 / 표시 조건 (마지막 phase 도달 시 숨김)은 기존 로직 그대로.

### 하단 "다음" 카드 제거

기존 BrewingScreen의 next preview row는 cup-interior 안의 ring + label이 그 역할을 흡수. 별도 카드 불필요 → 삭제.

## Domain / Data Flow

```
BrewSession ──► useElapsed ──► elapsed (sec)
                                  │
                                  ├─► fillRatio  = elapsed / totalTimeSec
                                  ├─► activeIdx  = activeStepIdx(pours, elapsed) (+ manualStepFloor)
                                  └─► phase      = pours[activeIdx]

renderProps:
  fillRatio                 → liquid.height, hero.bottom
  pours, totalTimeSec       → ring positions
  pours, activeIdx, elapsed → ring variant 분류
  phase                     → hero 내용
  isLastPour, isDrawdown    → hero 변형
```

도메인 함수 추가 없음. 기존 `activeStepIdx`, `useElapsed`, `Pour.atSec`/`cumulativeWater`/`pourAmount`/`label`로 모두 도출.

## Component Decomposition

`BrewingScreen.tsx`만 재작성. 내부 분해:

```
BrewingScreen
├── Rim                 // elapsed + 중단 + 건너뛰기
├── CupInterior
│   ├── Liquid          // 그라디언트 + meniscus highlight + wave
│   ├── RingMarker × N  // pours[i].atSec → 위치, variant
│   ├── Hero            // floating above meniscus
│   └── AriaLiveStep    // 기존 재사용
└── StopConfirmDialog   // 기존 재사용
```

세부 컴포넌트는 BrewingScreen 내부 사적 컴포넌트(외부 export X). 파일 1개 유지.

## Tokens (additions)

`src/ui/tokens/semantic.css`에 추가 (light + dark 양쪽):

```css
/* Brewing — liquid gradient */
--color-brewing-liquid-top:    var(--accent-300);   /* 메니스커스 highlight */
--color-brewing-liquid-mid:    var(--accent-500);
--color-brewing-liquid-deep:   var(--accent-700);
--color-brewing-liquid-bottom: var(--accent-900);   /* 컵 바닥 */

/* Brewing — rings */
--color-ring-future:     var(--neutral-400);            /* cream 위 mute line */
--color-ring-on-liquid:  rgba(251, 247, 239, 0.42);    /* 액체 위 cream tint */

/* Brewing — rim */
--shadow-rim-inset: inset 0 6px 14px -10px rgba(0, 0, 0, 0.18);

/* Brewing — sizing */
--brewing-rim-height:    84px;
--brewing-hero-gap:      12px;
--font-size-brewing-hero: clamp(36px, 7.2vh, 56px);
```

Dark 변형은 동일 키에 `--accent-200/400/600/800` + `rgba(0,0,0,…)` 기반 inset shadow로 매핑.

## Animation

- Liquid `height` / Hero `bottom`: `transition: var(--motion-duration-base) cubic-bezier(.4, 0, .2, 1)`. (`--motion-duration-base: 320ms`)
- Wave shimmer: `transform: translateX 0→8px / scaleY 1→1.5` over 4s ease-in-out infinite.
- Ring transitions (next → below 변경): `color/background` 200ms ease.
- `prefers-reduced-motion: reduce` → wave 정지, height/bottom transition `0ms`(직접 jump).

## Accessibility

- `AriaLiveStep` 재사용: 단계 진입 시 `{phaseLabel}: {cumulativeWater}그램까지` 음성 알림.
- 컵·액체·메니스커스는 장식 (`aria-hidden="true"`).
- Ring label은 sr-only 보조 텍스트 동반: `<time aria-label="bloom 1차 경계, 0분 45초">0:45</time>`.
- Stop / Skip 버튼: 기존 aria-label 유지.
- Reduced motion 대응(위 참조).

## Edge Cases

- **레시피 pour 1개** (bloom only): ring 0개, 액체만 0→100% 상승. Hero는 전체 시간 동안 bloom 정보 유지.
- **마지막 phase가 매우 짧음** (e.g., drawdown 5s): 최상단 ring과 컵 입구 사이 거리가 작음 → Hero clearance 부족 가능. fallback 폰트 36px로도 부족하면 마지막 ring 라벨을 컵 외부 RIM 우측 보조 영역에 표시(향후 보강 지점, 본 spec에선 폰트 fallback까지만).
- **사용자가 Skip 연타** (manualStepFloor가 elapsed보다 빨리 진행): liquid는 elapsed 기준으로만 상승. Hero·ring variant 분류는 `activeIdx` 기준 단계 정보를 우선. → 액체 위치와 hero가 일시적으로 어긋남(액체 아래에 next ring이 남아있을 수 있음). 이는 의도된 표현 — "타이머상으론 아직이지만 다음 단계 안내 중".
- **세션 시작 직후** (elapsed 0): liquid 0%, hero가 컵 바닥 12px 위 (`bottom: 12px`). 시각적으로 컵 바닥에 글자가 붙어있음 → 의도된 시작 상태.
- **세션 종료** (elapsed >= totalTimeSec): `done` 분기로 `onComplete()` 즉시 호출 (기존 useEffect 동일). 시각상으론 컵이 거의 100% 찬 상태에서 화면 전환.
- **viewport 매우 작음** (e.g., 가로 모바일, 높이 < 500px): cup-interior가 좁아져 ring 라벨 겹침 가능. v1 범위 밖 — `min-h-screen`(현재) 유지하고 가로 모드는 별도 spec.

## Testing

기존 `BrewingScreen.test.tsx` 의 본질은 "active step 계산 + skip 버튼 동작 + Stop 다이얼로그 트리거". 시각 컴포넌트 변경이지만 **테스트 행위 가정은 유지**:

- `data-testid="hero-weight"` → 메니스커스 위 hero의 cumulative water 숫자에 그대로 부여.
- 단계 라벨(`"bloom"`, `"1차"`, …)은 hero의 `now-tag` 또는 ring label에서 동일 텍스트로 검색 가능.
- Skip 버튼: `aria-label="다음 스텝으로 건너뛰기"` 유지.
- 새로 추가할 단언:
  - 시간 흐름에 따라 liquid의 `style.height` (또는 CSS var)가 비례 증가.
  - 활성 ring의 variant가 `next` (DOM 클래스 또는 aria-current).
  - Hero의 `bottom` (또는 CSS var)이 fillRatio에 비례.

도메인 레이어 무변경 → invariant.test.ts 영향 없음. 기존 method snapshots 영향 없음.

## Out of Scope (재확인)

- 가로 모드 / 태블릿 레이아웃.
- 액체 색상 토글 (light/medium/dark roast 반영) — 향후 v2.
- 메니스커스 정밀 wave (실제 파동 SVG) — 현재 CSS pseudo로 충분.
- 진동 / 사운드 피드백 (다음 phase 진입 시) — 별도 spec.
- 저울 BT 실측 무게로 cumulativeWater 보정 — 별도 프로젝트.

## Implementation Order

1. **토큰 추가** (`semantic.css`) — light + dark.
2. **BrewingScreen 재작성** — Rim / CupInterior(Liquid + Rings + Hero) / Skip 재배치 / 하단 next 제거.
3. **테스트 보강** — 기존 가정 유지 + liquid height / next ring 단언 추가.
4. **시각 검증** — `bun run dev` → 실제 브라우저에서 짧은 레시피(예: Hoffmann 4-pour, 240s)로 0초 → 240초 흐름 확인. Hero/메니스커스 충돌 없음 확인.
5. **Reduced motion / dark mode 확인**.

각 단계 완료 후 `bun run typecheck && bun test:run`.
