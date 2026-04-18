# Hand Drip Calculator — Design Doc

핸드드립 레시피 계산기 웹 앱. 파라미터 입력 → 레시피(물량/온도/푸어 스케줄) 출력.
v1은 순수 계산기, v2에서 타이머/가이드/공유로 확장.

## Design Principles

- **Domain / UI 완전 분리**: `domain/`은 React 의존성 제로, 순수 함수만.
- **Recipe methodology = plugin**: registry 기반으로 메서드 추가가 앱 확장의 주축. 메서드 추가 시 UI 변경 없음.
- **Branded types로 단위 안전성**: `Grams`, `Celsius`, `Seconds` 섞임 방지.
- **v2를 염두에 둔 데이터 모델**: `Recipe`를 그대로 v2 타이머가 소비할 수 있게 설계.
- **순수 함수 계산**: 전역 상태 불필요, 입력 변경 시 즉시 재계산.

## Scope

### v1 (이 문서가 정의하는 범위)

- 계산기: 입력 → 레시피 출력
- 드리퍼 2종: **V60**, **Kalita Wave**
- 메서드 3종: **Kasuya 4:6**, **Hoffmann V60**, **Kalita Wave 펄스**
- 타겟 맛 프로파일 입력 (Approach A)
- 입력 모드: 커피 그램수 기반 / 인원수 기반 전환
- URL 쿼리스트링 공유 (링크만 있으면 동일 레시피 재현)
- localStorage 기반 마지막 레시피 복원

### 명시적으로 v2+ (지금 구현하지 않음)

- 실시간 타이머 / 브루잉 가이드 모드
- 파라미터 직접 조절 (Approach B, advanced)
- 회원가입, 프리셋 저장, 레시피 공유/대결
- 원두 라이브러리, 브루잉 노트 기록

---

## Domain Model

### Branded Primitives

```ts
// src/domain/types.ts
type Grams = number & { readonly __brand: 'Grams' }
type Celsius = number & { readonly __brand: 'Celsius' }
type Seconds = number & { readonly __brand: 'Seconds' }
type Ratio = number & { readonly __brand: 'Ratio' }
```

생성자는 `domain/units.ts`에 모음:

```ts
export const g = (n: number): Grams => n as Grams
export const c = (n: number): Celsius => n as Celsius
export const s = (n: number): Seconds => n as Seconds
export const ratio = (n: number): Ratio => n as Ratio
```

### Core Types

```ts
type DripperId = 'v60' | 'kalita_wave'
type BrewMethodId = 'kasuya_4_6' | 'hoffmann_v60' | 'kalita_pulse'
type RoastLevel = 'light' | 'medium' | 'dark'

type GrindHint =
  | 'fine'
  | 'medium-fine'
  | 'medium'
  | 'medium-coarse'
  | 'coarse'

// 맛 프로파일 (Approach A)
type SweetnessProfile = 'sweet' | 'balanced' | 'bright'
type StrengthProfile = 'light' | 'medium' | 'strong'

type TasteProfile = {
  sweetness: SweetnessProfile  // first 40% 분배에 영향 (4:6 중심)
  strength: StrengthProfile    // last 60% 분할 수에 영향
}

// 단일 푸어
type Pour = {
  readonly index: number
  readonly atSec: Seconds          // 이 시점에 붓기 시작
  readonly pourAmount: Grams       // 이번에 붓는 양
  readonly cumulativeWater: Grams  // 누적 물량
  readonly label?: 'bloom'         // 확장 여지: 'main' | 'finish' 등
}

// 계산 결과
type Recipe = {
  readonly method: BrewMethodId
  readonly dripper: DripperId
  readonly coffee: Grams
  readonly totalWater: Grams
  readonly ratio: Ratio            // 1:ratio
  readonly temperature: Celsius
  readonly pours: readonly Pour[]
  readonly totalTimeSec: Seconds   // 마지막 drawdown 포함
  readonly grindHint: GrindHint
  readonly notes: readonly string[]
}

// 계산 입력
type RecipeInput = {
  readonly method: BrewMethodId
  readonly dripper: DripperId
  readonly coffee: Grams
  readonly roast: RoastLevel
  readonly taste: TasteProfile
}

// UI 레이어의 입력 모드 (도메인 계산 전에 coffee로 변환됨)
type InputMode =
  | { kind: 'by-coffee'; coffee: Grams }
  | { kind: 'by-servings'; servings: number }
```

### Method Registry

```ts
// src/domain/methods/index.ts
type BrewMethod = {
  readonly id: BrewMethodId
  readonly name: string
  readonly description: string
  readonly supportedDrippers: readonly DripperId[]
  readonly defaultRatio: Ratio
  readonly compute: (input: RecipeInput) => Recipe
}

export const brewMethods: Record<BrewMethodId, BrewMethod> = {
  kasuya_4_6: kasuya46,
  hoffmann_v60: hoffmannV60,
  kalita_pulse: kalitaPulse,
}

// 드리퍼에 호환되는 메서드만 추리는 헬퍼
export const methodsForDripper = (d: DripperId): BrewMethod[] =>
  Object.values(brewMethods).filter(m => m.supportedDrippers.includes(d))
```

**메서드 추가 프로세스** (v2 이후에도 동일):

1. `src/domain/methods/` 에 새 파일 추가하고 `BrewMethod` 구현
2. `BrewMethodId` 유니온 타입 확장
3. registry에 엔트리 추가
4. UI 변경 불필요

---

## Recipe Methodologies (v1)

### 1. Kasuya 4:6 (V60)

레퍼런스: Tetsu Kasuya, 2016 WBrC 챔피언 메서드. taste profile → 파라미터 매핑이 가장 잘 정의된 메서드이므로 **Approach A의 주력**.

- **Ratio**: 1:15
- **Supported**: `v60`
- **Structure**: 5푸어 (sweetness 기본값 기준)
  - 첫 **40%** = sweetness 결정 (2 pours)
  - 나머지 **60%** = strength 결정 (1–3 pours)

**Sweetness 매핑** (예: 20g / 300g → 첫 40% = 120g):

| sweetness | pour 1 | pour 2 |
|-----------|--------|--------|
| sweet     | 70g    | 50g    |
| balanced  | 60g    | 60g    |
| bright    | 50g    | 70g    |

**Strength 매핑** (예: 60% = 180g):

| strength | pour 수 | per pour |
|----------|---------|----------|
| light    | 1       | 180g     |
| medium   | 2       | 90g × 2  |
| strong   | 3       | 60g × 3  |

**Timing**: 45초 간격 고정. 마지막 푸어 후 drawdown ~30–45초.

**Temperature**:
- light roast: 93°C
- medium: 90°C
- dark: 87°C

**Grind**: `medium-coarse`

**Notes** (UI에 출력):
- "주전자를 천천히, 중심부터 나선형으로"
- "총 추출 시간 3:30 ± 15초를 목표로. 더 오래 걸리면 분쇄도를 약간 굵게."

### 2. James Hoffmann V60

레퍼런스: "The Ultimate V60 Technique" (Hoffmann, 2022). "하나의 레시피로 모두 대응" 철학이라 **taste profile은 분쇄도/온도 힌트로만 반영**.

- **Ratio**: 1:16.67 (e.g., 15g → 250g)
- **Supported**: `v60`
- **Structure**: bloom + 2 메인 푸어 = 3푸어

**예시 (15g / 250g)**:

| # | time | pour | cumulative | label |
|---|------|------|------------|-------|
| 1 | 0:00 | 30g  | 30g        | bloom |
| 2 | 0:45 | 120g | 150g       |       |
| 3 | 1:15 | 100g | 250g       |       |

Total drawdown target: ~3:30

**Temperature**: light 96°C / medium 93°C / dark 90°C

**Grind**: base `medium-fine`
- `strong` 또는 `sweet` → 한 단계 더 가늘게
- `light` 또는 `bright` → 한 단계 더 굵게

**Notes**:
- "블룸 직후 스월. 본 푸어 종료 후 한 번 더 스월."
- "이 메서드는 맛 조정을 분쇄도로 함. 비율/시간은 고정."

### 3. Kalita Wave 펄스

레퍼런스: Kalita 공식 가이드 + Scott Rao 펄스 스타일. 평평한 바닥 때문에 **연속 푸어가 아니라 펄스(짧게 끊어 붓기)** 가 특징.

- **Ratio**: 1:16
- **Supported**: `kalita_wave`
- **Structure**: bloom + 3 또는 4 펄스

**예시 (20g / 320g, strength=medium/strong → 5푸어)**:

| # | time | pour | cumulative | label |
|---|------|------|------------|-------|
| 1 | 0:00 | 40g  | 40g        | bloom |
| 2 | 0:45 | 60g  | 100g       |       |
| 3 | 1:15 | 80g  | 180g       |       |
| 4 | 1:45 | 80g  | 260g       |       |
| 5 | 2:15 | 60g  | 320g       |       |

**Strength 매핑**:
- `light`: 4푸어 (bloom + 3)
- `medium` / `strong`: 5푸어 (bloom + 4)

**Sweetness**: bloom 시간으로 반영
- `sweet`: bloom 60초
- `balanced`: bloom 45초
- `bright`: bloom 30초

**Temperature**: Hoffmann과 동일

**Grind**: `medium`

**Notes**:
- "각 푸어는 물이 거의 다 빠지기 전에 시작. 수위를 일정하게 유지."
- "중심만 좁게 붓고 외곽은 건드리지 않기."

---

## Input Conversion

### 인원수 → 그램수

단순화를 위해 **1인당 15g 고정**. 최대 인원 6명.

```ts
// src/domain/servings.ts
export const COFFEE_PER_SERVING = g(15)
export const MAX_SERVINGS = 6

export const toCoffeeGrams = (mode: InputMode): Grams => {
  switch (mode.kind) {
    case 'by-coffee':   return mode.coffee
    case 'by-servings': return g(mode.servings * COFFEE_PER_SERVING)
  }
}
```

서빙 사이즈(대/중/소) 같은 옵션은 v2에서 추가. v1에서는 그램수 모드로 전환하면 자유롭게 조정 가능하므로 충분.

### 계산 파이프라인

```
InputMode
  ↓ toCoffeeGrams
RecipeInput { method, dripper, coffee, roast, taste }
  ↓ brewMethods[methodId].compute
Recipe
  ↓ render
UI
```

---

## Architecture

### Stack

- **Vite + React + TypeScript**
- **Styling**: CSS Modules 또는 Tailwind (재량)
- **State**: `useState` / `useReducer`. 전역 상태 불필요.
- **URL sync**: `URLSearchParams` + 커스텀 codec
- **Persistence**: localStorage (마지막 `RecipeInput` 1건)
- **Test**: Vitest. 도메인 레이어는 순수 함수라 테스트 저렴. 각 메서드 standard case 스냅샷 + 엣지 케이스.

### File Structure

```
src/
├── domain/
│   ├── types.ts                  # branded types, core types
│   ├── units.ts                  # constructors (g, c, s, ratio)
│   ├── drippers.ts               # Dripper catalog
│   ├── servings.ts               # 인원수 ↔ 그램수
│   └── methods/
│       ├── index.ts              # registry + methodsForDripper
│       ├── kasuya-4-6.ts
│       ├── hoffmann-v60.ts
│       └── kalita-pulse.ts
├── features/
│   ├── calculator/
│   │   ├── CalculatorPage.tsx
│   │   ├── InputPanel.tsx
│   │   ├── RecipeView.tsx
│   │   └── PourTimeline.tsx
│   └── share/
│       ├── urlCodec.ts           # RecipeInput ↔ URLSearchParams
│       └── storage.ts            # localStorage wrapper
├── ui/                           # 공용 primitives
│   ├── Segmented.tsx
│   ├── Stepper.tsx
│   └── Slider.tsx
├── App.tsx
└── main.tsx
```

### v2 확장 지점 (지금은 구현하지 않지만 구조가 이를 지원해야 함)

- **타이머**: 현 `Recipe`를 그대로 입력으로 받는 `<BrewTimer recipe={recipe} />`. 상태는 XState 또는 `useReducer`. `Pour.atSec` 덕분에 별도 변환 없이 동작 가능.
- **Advanced B**: `InputPanel`에 toggle. ON이면 taste profile 대신 `PourEditor` 노출 (pour count, 각 pour 양, 간격). 도메인 계층의 `compute` 대신 `RecipeInput`을 직접 `Recipe`로 빌드하는 경로 추가.
- **공유/프리셋**: `urlCodec`이 이미 공유 인프라. `RecipeInput`에 `id`, `authorId`, `name?`, `createdAt?` 추가하고 서버 연동.
- **대결**: 두 `Recipe`를 비교하는 `compareRecipes(a, b): RecipeDiff` 순수 함수 + 나란히 보여주는 뷰.

---

## UI/UX Spec

### Layout

- **모바일 퍼스트**. 주방에서 한 손으로 보는 시나리오.
- 세로 스크롤 단일 페이지. 상단 입력, 하단 결과.
- 입력 변경 시 결과 즉시 재계산 (디바운스 불필요).

### Input Panel

순서 (중요 순):

1. **Entry mode toggle**: [커피 그램수 | 인원수]
   - 그램수 모드: 5~50g 슬라이더 + 숫자 입력 (1g 단위)
   - 인원수 모드: 1~6명 stepper. "1인당 15g" 힌트 노출
2. **Dripper**: V60 / Kalita Wave (segmented)
3. **Method**: 선택된 드리퍼에 호환되는 것만 표시 (segmented)
4. **Roast**: Light / Medium / Dark (segmented)
5. **Taste profile**:
   - Sweetness: Sweet — Balanced — Bright (3-point segmented)
   - Strength: Light — Medium — Strong (3-point segmented)

드리퍼 변경 시 현재 메서드가 호환되지 않으면 해당 드리퍼의 첫 번째 메서드로 자동 전환.

### Recipe View

1. **Summary line**: `20g × 300g · 1:15 · 90°C`
2. **Pour timeline** (핵심 시각화):
   - 가로 타임라인. X축 시간, 마커가 각 푸어.
   - Bloom은 다른 색으로 구분.
   - 마커 라벨: `0:45 · +60g (120g)` 형식.
   - 마커 위치의 Y 높이는 누적 물량 (간단한 area 차트).
3. **Pour table**: 접을 수 있는 상세 테이블. timeline의 소스 데이터.
4. **Grind hint**: 텍스트 (`medium-coarse`) + 짧은 시각 힌트 (e.g., "굵은 소금 정도").
5. **Notes**: 메서드별 팁 1–2줄.
6. **Actions**: [링크 복사] [초기화]

### Details

- **URL sync**: 모든 입력 파라미터가 쿼리스트링에 반영. 페이지 진입 시 쿼리 → 상태 복원. 복사-붙여넣기로 레시피 공유 가능.
- **localStorage**: 마지막 `RecipeInput` 저장. 다음 방문 시 쿼리가 없으면 복원.
- **단위**: g / °C 고정. 단위 토글은 v2.
- **접근성**: segmented control을 네이티브 radio group으로 구현. 키보드 탐색 지원.

---

## Implementation Order (Claude Code 전달 시 권장 순서)

각 단계는 독립적으로 완료하고 다음 단계로.

1. **도메인 타입 기반**: `domain/types.ts`, `domain/units.ts`, `domain/drippers.ts`, `domain/servings.ts`
2. **가장 복잡한 메서드 먼저**: `domain/methods/kasuya-4-6.ts` — taste profile 매핑이 가장 풍부해서 패턴 확립에 적합
3. **나머지 2 메서드 + registry**: `hoffmann-v60.ts`, `kalita-pulse.ts`, `methods/index.ts`
4. **도메인 레이어 테스트** (Vitest): 각 메서드의 standard case (roast=medium, taste=balanced/medium) 스냅샷 + `totalWater = sum(pours.pourAmount)` invariant 체크
5. **UI 뼈대**: `CalculatorPage`, `InputPanel`, `RecipeView` (일단 표 형태로)
6. **PourTimeline 시각화**: SVG 기반
7. **URL codec + localStorage 복원**
8. **마감**: 반응형 점검, 접근성, 빈 상태/에러 처리

각 메서드는 **스펙 상의 예시 케이스를 Vitest 스냅샷으로 고정**하면 리팩토링이 안전함.

---

## References

- Kasuya 4:6: Tetsu Kasuya 공식 채널 및 philocoffea 블로그
- Hoffmann Ultimate V60: James Hoffmann YouTube "The Ultimate V60 Technique" (2022)
- Kalita Wave: Kalita 공식 brewing guide, Scott Rao 블로그
- SCA Brewing Control Chart: 비율/TDS 기준 (커피:물 ratio의 일반적 범위 참고)
