# Brewing Methods Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kalita 102 드리퍼와 7개 신규 브루잉 메서드를 플러그인 레지스트리에 추가하고, Kasuya 4:6의 부정확한 파라미터를 리서치 기준으로 보정한다. 총 드리퍼 3종 / 메서드 9종.

**Architecture:** 도메인 플러그인 레지스트리 구조 유지. 각 메서드는 `src/domain/methods/*.ts`에 순수 compute 함수로 정의되고 `index.ts`에서 id로 registry 등록. 각 서브태스크는 `BrewMethodId` 유니언 확장 + compute + registry + 스냅샷을 함께 커밋해 스텁 없이 타입 정합성을 유지한다.

**Tech Stack:** TypeScript (strict, `noUncheckedIndexedAccess`), Vitest 2 inline snapshots, Tailwind.

**Spec:** `docs/superpowers/specs/2026-04-21-brewing-methods-expansion-design.md`
**Branch:** `feat/brewing-methods-expansion` (already created)

---

## File Structure Overview

**Create:**
- `src/domain/methods/scott-rao.ts` + `.test.ts`
- `src/domain/methods/april.ts` + `.test.ts`
- `src/domain/methods/kurasu-kyoto.ts` + `.test.ts`
- `src/domain/methods/frothy-monkey.ts` + `.test.ts`
- `src/domain/methods/standard-3-stage.ts` + `.test.ts`
- `src/domain/methods/caffe-luxxe.ts` + `.test.ts`
- `src/domain/methods/fuglen-tokyo.ts` + `.test.ts`
- `src/domain/methods/invariants.test.ts` — shared invariant sweep over `methodList`

**Modify:**
- `src/domain/types.ts` — `DripperId`, `BrewMethodId` 유니언 확장 (+`kalita_102`, +7 메서드 id, `-kalita_pulse` 마지막 제거)
- `src/domain/drippers.ts` — `kalita_102` 엔트리 (Task 7에서)
- `src/domain/methods/index.ts` — 신규 메서드 등록, `kalita_pulse` 제거 (Task 10)
- `src/domain/methods/kasuya-4-6.ts` — 온도 `{94,88,83}`, grind `coarse`
- `src/domain/methods/kasuya-4-6.test.ts` — 스냅샷 재생성, 메타데이터 값 갱신
- `src/ui/DripperIcon.tsx` — `kalita_102` SVG 분기 (Task 7)
- `src/features/share/urlCodec.ts` — `BREW_METHOD_IDS` · `DRIPPER_IDS` 갱신 (Task 11)
- `src/features/share/urlCodec.test.ts` — fixture에서 `kalita_pulse` 대신 다른 id 사용 (Task 10/11)
- `docs/design.md` — v1 scope 드리퍼·메서드 개수 갱신
- `CLAUDE.md` — § Testing 문구 완화, 스냅샷 기준 예시 갱신

**Delete:**
- `src/domain/methods/kalita-pulse.ts`
- `src/domain/methods/kalita-pulse.test.ts`

---

## Task 1: Kasuya 4:6 파라미터 보정

**Files:**
- Modify: `src/domain/methods/kasuya-4-6.ts`
- Modify: `src/domain/methods/kasuya-4-6.test.ts`

**Context:** 현재 Kasuya 온도가 리서치(Light 94 / Medium 88 / Dark 83) 대비 전반적으로 높게 설정돼 있고, grindHint도 리서치의 "Coarse" 대비 한 단계 가늚(`medium-coarse`). 리서치 값으로 교정한다.

- [ ] **Step 1: 온도 테이블과 grindHint 수정**

`src/domain/methods/kasuya-4-6.ts` 안의 `temperatureByRoast` 객체와 return 값의 `grindHint`를 수정:

```ts
const temperatureByRoast: Record<RoastLevel, number> = {
  light: 94,
  medium: 88,
  dark: 83,
};
```

반환 객체 안에서 `grindHint: "medium-coarse"` 를 `grindHint: "coarse"` 로 변경.

- [ ] **Step 2: 메타데이터 테스트의 하드코딩 값 갱신**

`src/domain/methods/kasuya-4-6.test.ts` line ~217의 `metadata` describe 블록:

```ts
it("temperature by roast: light=94, medium=88, dark=83", () => {
  expect(kasuya46.compute(baseInput({ roast: "light" })).temperature).toBe(
    94,
  );
  expect(kasuya46.compute(baseInput({ roast: "medium" })).temperature).toBe(
    88,
  );
  expect(kasuya46.compute(baseInput({ roast: "dark" })).temperature).toBe(
    83,
  );
});
```

- [ ] **Step 3: 인라인 스냅샷 재생성**

```bash
bun run test:run src/domain/methods/kasuya-4-6.test.ts -u
```

Expected: 3 snapshot tests 업데이트 + metadata test 통과.

- [ ] **Step 4: 스냅샷 diff 육안 확인**

`git diff src/domain/methods/kasuya-4-6.test.ts` — 각 인라인 스냅샷의 `"grindHint": "coarse"`와 `"temperature": 88` 반영 확인.

- [ ] **Step 5: 타입체크 + 전체 테스트**

```bash
bun run typecheck && bun run test:run
```

Expected: 모두 통과.

- [ ] **Step 6: 커밋**

```bash
git add src/domain/methods/kasuya-4-6.ts src/domain/methods/kasuya-4-6.test.ts
git commit -m "fix(kasuya): correct temperature curve and grind to research baseline

Light/medium/dark temps 93/90/87 → 94/88/83, grindHint medium-coarse → coarse.
Matches brewing-research.md Kasuya 4:6 reference.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Scott Rao (V60) 메서드 추가

**Files:**
- Create: `src/domain/methods/scott-rao.ts`
- Create: `src/domain/methods/scott-rao.test.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/methods/index.ts`

**Context:** Scott Rao V60 Standard — 20g / 330ml (1:16.5) / 97°C / medium-fine / 50g bloom + 단일 연속 푸어. taste 매핑: strength→grind, sweetness→뜸 지속(20/30/45s).

- [ ] **Step 1: `BrewMethodId` 유니언에 id 추가**

`src/domain/types.ts`:

```ts
export type BrewMethodId =
  | "kasuya_4_6"
  | "hoffmann_v60"
  | "kalita_pulse"
  | "scott_rao";
```

- [ ] **Step 2: compute 파일 작성**

`src/domain/methods/scott-rao.ts`:

```ts
import { c, g, ratio, s } from "../units";
import type {
  BrewMethod,
  GrindHint,
  Pour,
  Recipe,
  RecipeInput,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
} from "../types";

const METHOD_RATIO = 16.5;
const BLOOM_RATIO_TO_COFFEE = 2.5;
const DRAWDOWN_SEC = 90;

const temperatureByRoast: Record<RoastLevel, number> = {
  light: 97,
  medium: 94,
  dark: 91,
};

const bloomDurationBySweetness: Record<SweetnessProfile, number> = {
  sweet: 45,
  balanced: 30,
  bright: 20,
};

const grindByStrength: Record<StrengthProfile, GrindHint> = {
  light: "medium",
  medium: "medium-fine",
  strong: "fine",
};

const compute = (input: RecipeInput): Recipe => {
  const { coffee, roast, taste } = input;
  const totalWater = Math.round(coffee * METHOD_RATIO);
  const bloom = Math.round(coffee * BLOOM_RATIO_TO_COFFEE);
  const mainPour = totalWater - bloom;
  const bloomSec = bloomDurationBySweetness[taste.sweetness];

  const pours: readonly Pour[] = [
    {
      index: 0,
      atSec: s(0),
      pourAmount: g(bloom),
      cumulativeWater: g(bloom),
      label: "bloom",
    },
    {
      index: 1,
      atSec: s(bloomSec),
      pourAmount: g(mainPour),
      cumulativeWater: g(totalWater),
    },
  ];

  return {
    method: "scott_rao",
    dripper: "v60",
    coffee,
    totalWater: g(totalWater),
    ratio: ratio(METHOD_RATIO),
    temperature: c(temperatureByRoast[roast]),
    pours,
    totalTimeSec: s(bloomSec + DRAWDOWN_SEC),
    grindHint: grindByStrength[taste.strength],
    notes: [
      "뜸 직후 Bird's Nest 구멍 만들기 + 강한 스월.",
      "메인은 끊지 말고 단일 연속 푸어. 맛 조정은 분쇄도(strength)와 뜸 시간(sweetness)으로.",
    ],
  };
};

export const scottRao: BrewMethod = {
  id: "scott_rao",
  name: "Scott Rao",
  description:
    "뜸 후 단일 연속 푸어로 추출 효율을 극대화하는 V60 스탠다드. 분쇄도와 뜸 시간으로 맛 조정.",
  supportedDrippers: ["v60"],
  defaultRatio: ratio(METHOD_RATIO),
  compute,
};
```

- [ ] **Step 3: registry 등록**

`src/domain/methods/index.ts`:

```ts
import type { BrewMethod, BrewMethodId, DripperId } from "../types";
import { hoffmannV60 } from "./hoffmann-v60";
import { kalitaPulse } from "./kalita-pulse";
import { kasuya46 } from "./kasuya-4-6";
import { scottRao } from "./scott-rao";

export const brewMethods: Record<BrewMethodId, BrewMethod> = {
  kasuya_4_6: kasuya46,
  hoffmann_v60: hoffmannV60,
  kalita_pulse: kalitaPulse,
  scott_rao: scottRao,
};

export const methodList: readonly BrewMethod[] = Object.values(brewMethods);

export const methodsForDripper = (dripper: DripperId): readonly BrewMethod[] =>
  methodList.filter((m) => m.supportedDrippers.includes(dripper));
```

- [ ] **Step 4: 타입체크**

```bash
bun run typecheck
```

Expected: 통과.

- [ ] **Step 5: 스냅샷 테스트 파일 작성 (빈 스냅샷)**

`src/domain/methods/scott-rao.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { g } from "../units";
import type { RecipeInput } from "../types";
import { scottRao } from "./scott-rao";

const baseInput = (overrides: Partial<RecipeInput> = {}): RecipeInput => ({
  method: "scott_rao",
  dripper: "v60",
  coffee: g(20),
  roast: "medium",
  taste: { sweetness: "balanced", strength: "medium" },
  ...overrides,
});

describe("Scott Rao", () => {
  it("20g / balanced / medium / roast=medium — research reference (50g bloom + 280g main)", () => {
    expect(scottRao.compute(baseInput())).toMatchInlineSnapshot();
  });

  it("supports only v60", () => {
    expect(scottRao.supportedDrippers).toEqual(["v60"]);
  });

  it("defaultRatio is 16.5", () => {
    expect(scottRao.defaultRatio).toBe(16.5);
  });
});
```

- [ ] **Step 6: 스냅샷 생성**

```bash
bun run test:run src/domain/methods/scott-rao.test.ts -u
```

- [ ] **Step 7: 스냅샷 리서치 대조**

생성된 스냅샷이 아래 불변 속성을 만족하는지 `src/domain/methods/scott-rao.test.ts`를 열어 확인:
- `coffee: 20`, `totalWater: 330`, `ratio: 16.5`, `temperature: 94`, `grindHint: "medium-fine"`
- pour 0: `atSec: 0`, `pourAmount: 50`, `label: "bloom"`
- pour 1: `atSec: 30`, `pourAmount: 280`, `cumulativeWater: 330`
- `totalTimeSec: 120`

리서치 기본 값과 일치해야 통과. 어긋나면 compute를 조정하고 `-u` 재실행.

- [ ] **Step 8: 커밋**

```bash
git add src/domain/types.ts src/domain/methods/scott-rao.ts src/domain/methods/scott-rao.test.ts src/domain/methods/index.ts
git commit -m "feat(methods): add Scott Rao V60 method

50g bloom + single continuous pour. Taste→grind/bloom duration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: April (Kalita Wave) 메서드 추가

**Files:**
- Create: `src/domain/methods/april.ts`
- Create: `src/domain/methods/april.test.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/methods/index.ts`

**Context:** April Coffee (Patrik Rolf) — 13g / 200g (1:15.4) / 90-92°C / medium-coarse / 50g×4 at 30s intervals. taste 매핑: strength→grind, sweetness→푸어 간격(25/30/35s).

- [ ] **Step 1: `BrewMethodId` 유니언에 id 추가**

`src/domain/types.ts`:

```ts
export type BrewMethodId =
  | "kasuya_4_6"
  | "hoffmann_v60"
  | "kalita_pulse"
  | "scott_rao"
  | "april";
```

- [ ] **Step 2: compute 파일 작성**

`src/domain/methods/april.ts`:

```ts
import { c, g, ratio, s } from "../units";
import type {
  BrewMethod,
  GrindHint,
  Pour,
  Recipe,
  RecipeInput,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
} from "../types";

const METHOD_RATIO = 15.4;
const POUR_COUNT = 4;
const DRAWDOWN_SEC = 60;

const temperatureByRoast: Record<RoastLevel, number> = {
  light: 92,
  medium: 91,
  dark: 90,
};

const intervalBySweetness: Record<SweetnessProfile, number> = {
  sweet: 35,
  balanced: 30,
  bright: 25,
};

const grindByStrength: Record<StrengthProfile, GrindHint> = {
  light: "coarse",
  medium: "medium-coarse",
  strong: "medium",
};

const compute = (input: RecipeInput): Recipe => {
  const { coffee, roast, taste } = input;
  const totalWater = Math.round(coffee * METHOD_RATIO);
  const perPour = Math.round(totalWater / POUR_COUNT);
  const interval = intervalBySweetness[taste.sweetness];

  const amounts = Array.from({ length: POUR_COUNT }, () => perPour);
  const sum = amounts.reduce((a, b) => a + b, 0);
  const lastIdx = amounts.length - 1;
  amounts[lastIdx] = amounts[lastIdx]! + (totalWater - sum);

  let cumulative = 0;
  const pours: readonly Pour[] = amounts.map((amt, i) => {
    cumulative += amt;
    return {
      index: i,
      atSec: s(i * interval),
      pourAmount: g(amt),
      cumulativeWater: g(cumulative),
    };
  });

  return {
    method: "april",
    dripper: "kalita_wave",
    coffee,
    totalWater: g(totalWater),
    ratio: ratio(METHOD_RATIO),
    temperature: c(temperatureByRoast[roast]),
    pours,
    totalTimeSec: s((POUR_COUNT - 1) * interval + DRAWDOWN_SEC),
    grindHint: grindByStrength[taste.strength],
    notes: [
      "첫 푸어는 서클로 전면 적시기, 나머지는 센터 푸어로 난류 생성.",
      "맛 조정은 분쇄도(strength)와 푸어 간격(sweetness)으로.",
    ],
  };
};

export const april: BrewMethod = {
  id: "april",
  name: "April",
  description:
    "Kalita Wave에 서클+센터 푸어를 결합한 4분할 추출. 유속과 클린 컵을 살림.",
  supportedDrippers: ["kalita_wave"],
  defaultRatio: ratio(METHOD_RATIO),
  compute,
};
```

- [ ] **Step 3: registry 등록**

`src/domain/methods/index.ts`의 import 블록과 `brewMethods` 객체에 `april`을 추가 (Task 2와 동일 패턴).

- [ ] **Step 4: 타입체크**

```bash
bun run typecheck
```

- [ ] **Step 5: 스냅샷 테스트 작성 + 생성**

`src/domain/methods/april.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { g } from "../units";
import type { RecipeInput } from "../types";
import { april } from "./april";

const baseInput = (overrides: Partial<RecipeInput> = {}): RecipeInput => ({
  method: "april",
  dripper: "kalita_wave",
  coffee: g(13),
  roast: "medium",
  taste: { sweetness: "balanced", strength: "medium" },
  ...overrides,
});

describe("April", () => {
  it("13g / balanced / medium — research reference (200g, 4× ~50g)", () => {
    expect(april.compute(baseInput())).toMatchInlineSnapshot();
  });

  it("supports only kalita_wave", () => {
    expect(april.supportedDrippers).toEqual(["kalita_wave"]);
  });

  it("defaultRatio is 15.4", () => {
    expect(april.defaultRatio).toBe(15.4);
  });
});
```

```bash
bun run test:run src/domain/methods/april.test.ts -u
```

- [ ] **Step 6: 스냅샷 리서치 대조**

확인 포인트:
- `totalWater: 200`, `ratio: 15.4`, `temperature: 91`, `grindHint: "medium-coarse"`
- 4개 pours, 각 50g 내외 (라운딩 drift는 마지막에 흡수)
- atSec: 0/30/60/90

- [ ] **Step 7: 커밋**

```bash
git add src/domain/types.ts src/domain/methods/april.ts src/domain/methods/april.test.ts src/domain/methods/index.ts
git commit -m "feat(methods): add April Coffee method for Kalita Wave

4×50g pours @30s. Taste→grind/pour interval.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Kurasu Kyoto (Kalita Wave) 메서드 추가

**Files:**
- Create: `src/domain/methods/kurasu-kyoto.ts`
- Create: `src/domain/methods/kurasu-kyoto.test.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/methods/index.ts`

**Context:** Kurasu Kyoto 2023 — 14g / 200g (1:14.3) / 92°C / coarse / 30g 뜸 @0, 30g @40s, 140g @70s. 누적: 30/60/200. taste 매핑: strength→grind, sweetness→뜸 시간(30/40/50s).

- [ ] **Step 1: `BrewMethodId` 유니언 확장**

`src/domain/types.ts` 유니언에 `"kurasu_kyoto"` 추가.

- [ ] **Step 2: compute 파일 작성**

`src/domain/methods/kurasu-kyoto.ts`:

```ts
import { c, g, ratio, s } from "../units";
import type {
  BrewMethod,
  GrindHint,
  Pour,
  Recipe,
  RecipeInput,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
} from "../types";

const METHOD_RATIO = 14.3;
const POUR_INTERVAL_SEC = 30;
const DRAWDOWN_SEC = 60;

// Reference fractions: 30/30/140 out of 200
const POUR_1_FRAC = 30 / 200;
const POUR_2_FRAC = 30 / 200;

const temperatureByRoast: Record<RoastLevel, number> = {
  light: 92,
  medium: 90,
  dark: 88,
};

const bloomDurationBySweetness: Record<SweetnessProfile, number> = {
  sweet: 50,
  balanced: 40,
  bright: 30,
};

const grindByStrength: Record<StrengthProfile, GrindHint> = {
  light: "coarse",
  medium: "coarse",
  strong: "medium-coarse",
};

const compute = (input: RecipeInput): Recipe => {
  const { coffee, roast, taste } = input;
  const totalWater = Math.round(coffee * METHOD_RATIO);
  const pour1 = Math.round(totalWater * POUR_1_FRAC);
  const pour2 = Math.round(totalWater * POUR_2_FRAC);
  const pour3 = totalWater - pour1 - pour2;
  const bloomSec = bloomDurationBySweetness[taste.sweetness];

  const pours: readonly Pour[] = [
    {
      index: 0,
      atSec: s(0),
      pourAmount: g(pour1),
      cumulativeWater: g(pour1),
      label: "bloom",
    },
    {
      index: 1,
      atSec: s(bloomSec),
      pourAmount: g(pour2),
      cumulativeWater: g(pour1 + pour2),
    },
    {
      index: 2,
      atSec: s(bloomSec + POUR_INTERVAL_SEC),
      pourAmount: g(pour3),
      cumulativeWater: g(totalWater),
    },
  ];

  return {
    method: "kurasu_kyoto",
    dripper: "kalita_wave",
    coffee,
    totalWater: g(totalWater),
    ratio: ratio(METHOD_RATIO),
    temperature: c(temperatureByRoast[roast]),
    pours,
    totalTimeSec: s(bloomSec + POUR_INTERVAL_SEC + DRAWDOWN_SEC),
    grindHint: grindByStrength[taste.strength],
    notes: [
      "2차 푸어는 강하게, 3차는 가는 물줄기로 센터만.",
      "맛 조정은 분쇄도(strength)와 뜸 시간(sweetness)으로.",
    ],
  };
};

export const kurasuKyoto: BrewMethod = {
  id: "kurasu_kyoto",
  name: "Kurasu Kyoto",
  description:
    "클린 컵과 단맛을 강조하는 Kalita Wave 3분할 추출. 두 번째 푸어가 핵심.",
  supportedDrippers: ["kalita_wave"],
  defaultRatio: ratio(METHOD_RATIO),
  compute,
};
```

- [ ] **Step 3: registry 등록**

`src/domain/methods/index.ts`에 `kurasuKyoto` 추가.

- [ ] **Step 4: 타입체크**

```bash
bun run typecheck
```

- [ ] **Step 5: 스냅샷 테스트 작성 + 생성**

`src/domain/methods/kurasu-kyoto.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { g } from "../units";
import type { RecipeInput } from "../types";
import { kurasuKyoto } from "./kurasu-kyoto";

const baseInput = (overrides: Partial<RecipeInput> = {}): RecipeInput => ({
  method: "kurasu_kyoto",
  dripper: "kalita_wave",
  coffee: g(14),
  roast: "medium",
  taste: { sweetness: "balanced", strength: "medium" },
  ...overrides,
});

describe("Kurasu Kyoto", () => {
  it("14g / balanced / medium — research reference (30/30/140)", () => {
    expect(kurasuKyoto.compute(baseInput())).toMatchInlineSnapshot();
  });

  it("supports only kalita_wave", () => {
    expect(kurasuKyoto.supportedDrippers).toEqual(["kalita_wave"]);
  });

  it("defaultRatio is 14.3", () => {
    expect(kurasuKyoto.defaultRatio).toBe(14.3);
  });
});
```

```bash
bun run test:run src/domain/methods/kurasu-kyoto.test.ts -u
```

- [ ] **Step 6: 스냅샷 리서치 대조**

확인 포인트: `totalWater: 200`, pours 30/30/140, atSec 0/40/70, `temperature: 90`, `grindHint: "coarse"`.

- [ ] **Step 7: 커밋**

```bash
git add src/domain/types.ts src/domain/methods/kurasu-kyoto.ts src/domain/methods/kurasu-kyoto.test.ts src/domain/methods/index.ts
git commit -m "feat(methods): add Kurasu Kyoto method for Kalita Wave

Fixed 30/30/140 pour structure. Taste→grind/bloom duration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Frothy Monkey (Kalita Wave) 메서드 추가

**Files:**
- Create: `src/domain/methods/frothy-monkey.ts`
- Create: `src/domain/methods/frothy-monkey.test.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/methods/index.ts`

**Context:** Frothy Monkey — 25g / 400g (1:16) / 90.5-96°C / medium-fine / 50g bloom + 150g main (누적 50%) + 50g pulses 15s 간격. taste: strength→pulse 수(3/4/5), sweetness→뜸 시간(25/30/40s).

- [ ] **Step 1: `BrewMethodId` 유니언 확장**

`"frothy_monkey"` 추가.

- [ ] **Step 2: compute 파일 작성**

`src/domain/methods/frothy-monkey.ts`:

```ts
import { c, g, ratio, s } from "../units";
import type {
  BrewMethod,
  Pour,
  Recipe,
  RecipeInput,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
} from "../types";

const METHOD_RATIO = 16;
const BLOOM_RATIO_TO_COFFEE = 2;
const HALFWAY_FRACTION = 0.5;
const PULSE_INTERVAL_SEC = 15;
const DRAWDOWN_SEC = 30;

const temperatureByRoast: Record<RoastLevel, number> = {
  light: 96,
  medium: 93,
  dark: 90,
};

const bloomDurationBySweetness: Record<SweetnessProfile, number> = {
  sweet: 40,
  balanced: 30,
  bright: 25,
};

const pulseCountByStrength: Record<StrengthProfile, number> = {
  light: 3,
  medium: 4,
  strong: 5,
};

const compute = (input: RecipeInput): Recipe => {
  const { coffee, roast, taste } = input;
  const totalWater = Math.round(coffee * METHOD_RATIO);
  const bloom = Math.round(coffee * BLOOM_RATIO_TO_COFFEE);
  const halfway = Math.round(totalWater * HALFWAY_FRACTION);
  const main = halfway - bloom;
  const pulseCount = pulseCountByStrength[taste.strength];
  const remaining = totalWater - halfway;
  const pulseAmt = Math.round(remaining / pulseCount);
  const bloomSec = bloomDurationBySweetness[taste.sweetness];
  const mainSec = bloomSec + PULSE_INTERVAL_SEC;

  const pulses = Array.from({ length: pulseCount }, () => pulseAmt);
  const pulseSum = pulses.reduce((a, b) => a + b, 0);
  const lastIdx = pulses.length - 1;
  pulses[lastIdx] = pulses[lastIdx]! + (remaining - pulseSum);

  const amounts = [bloom, main, ...pulses];

  let cumulative = 0;
  const pours: readonly Pour[] = amounts.map((amt, i) => {
    cumulative += amt;
    const atSec =
      i === 0
        ? 0
        : i === 1
          ? mainSec
          : mainSec + (i - 1) * PULSE_INTERVAL_SEC;
    const base = {
      index: i,
      atSec: s(atSec),
      pourAmount: g(amt),
      cumulativeWater: g(cumulative),
    };
    return i === 0 ? { ...base, label: "bloom" as const } : base;
  });

  const lastAtSec = pours[pours.length - 1]!.atSec;

  return {
    method: "frothy_monkey",
    dripper: "kalita_wave",
    coffee,
    totalWater: g(totalWater),
    ratio: ratio(METHOD_RATIO),
    temperature: c(temperatureByRoast[roast]),
    pours,
    totalTimeSec: s(lastAtSec + DRAWDOWN_SEC),
    grindHint: "medium-fine",
    notes: [
      "뜸 후 한 번 큰 푸어로 절반까지 채우고, 이후 짧은 펄스를 반복.",
      "맛 조정은 펄스 수(strength)와 뜸 시간(sweetness)으로.",
    ],
  };
};

export const frothyMonkey: BrewMethod = {
  id: "frothy_monkey",
  name: "Frothy Monkey",
  description:
    "바디감을 강조하는 펄스 푸어 방식. 절반까지 한 번에 채우고 짧은 펄스로 마무리.",
  supportedDrippers: ["kalita_wave"],
  defaultRatio: ratio(METHOD_RATIO),
  compute,
};
```

- [ ] **Step 3: registry 등록**

- [ ] **Step 4: 타입체크**

```bash
bun run typecheck
```

- [ ] **Step 5: 스냅샷 테스트 작성 + 생성**

`src/domain/methods/frothy-monkey.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { g } from "../units";
import type { RecipeInput } from "../types";
import { frothyMonkey } from "./frothy-monkey";

const baseInput = (overrides: Partial<RecipeInput> = {}): RecipeInput => ({
  method: "frothy_monkey",
  dripper: "kalita_wave",
  coffee: g(25),
  roast: "medium",
  taste: { sweetness: "balanced", strength: "medium" },
  ...overrides,
});

describe("Frothy Monkey", () => {
  it("25g / balanced / medium — research reference (50 bloom + 150 main + 4×50 pulses)", () => {
    expect(frothyMonkey.compute(baseInput())).toMatchInlineSnapshot();
  });

  it("supports only kalita_wave", () => {
    expect(frothyMonkey.supportedDrippers).toEqual(["kalita_wave"]);
  });

  it("defaultRatio is 16", () => {
    expect(frothyMonkey.defaultRatio).toBe(16);
  });
});
```

```bash
bun run test:run src/domain/methods/frothy-monkey.test.ts -u
```

- [ ] **Step 6: 스냅샷 리서치 대조**

확인 포인트: `totalWater: 400`, bloom=50, main=150, 4 pulses=50 each, atSec 0/45/60/75/90/105, `temperature: 93`.

- [ ] **Step 7: 커밋**

```bash
git add src/domain/types.ts src/domain/methods/frothy-monkey.ts src/domain/methods/frothy-monkey.test.ts src/domain/methods/index.ts
git commit -m "feat(methods): add Frothy Monkey pulse-pour method for Kalita Wave

50g bloom + 150g main + N×50g pulses. Taste→pulse count/bloom duration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Kalita 102 드리퍼 신설 + DripperIcon SVG + Standard 3-Stage 메서드

**Files:**
- Modify: `src/domain/types.ts` — `DripperId`에 `"kalita_102"` 추가, `BrewMethodId`에 `"standard_3_stage"` 추가
- Modify: `src/domain/drippers.ts` — `kalita_102` 엔트리
- Modify: `src/ui/DripperIcon.tsx` — `kalita_102` SVG 분기
- Create: `src/domain/methods/standard-3-stage.ts`
- Create: `src/domain/methods/standard-3-stage.test.ts`
- Modify: `src/domain/methods/index.ts`

**Context:** Kalita 102 드리퍼를 도입하면서 동시에 첫 메서드(Standard 3-Stage)를 붙여 "드리퍼만 있고 메서드 없는" 창을 없앤다. Standard 3-Stage: 20g / 300ml (1:15) / 92-96°C / medium / 40/80/80/100. taste: strength→마지막 푸어 비중(80/80/[100/110/120]), sweetness→뜸 시간(25/30/40s).

- [ ] **Step 1: `DripperId` 확장**

`src/domain/types.ts`:

```ts
export type DripperId = "v60" | "kalita_wave" | "kalita_102";
```

그리고 `BrewMethodId`에 `"standard_3_stage"` 추가.

- [ ] **Step 2: `drippers.ts` 엔트리 추가**

```ts
import type { DripperId } from "./types";

export type Dripper = {
  readonly id: DripperId;
  readonly name: string;
};

export const drippers: Record<DripperId, Dripper> = {
  v60: { id: "v60", name: "V60" },
  kalita_wave: { id: "kalita_wave", name: "Kalita Wave" },
  kalita_102: { id: "kalita_102", name: "Kalita 102" },
};

export const dripperList: readonly Dripper[] = Object.values(drippers);
```

- [ ] **Step 3: DripperIcon SVG 분기 추가**

`src/ui/DripperIcon.tsx` — 기존 `if (type === "v60")` 블록과 기본 분기(`kalita_wave`) 사이에 `kalita_102` 분기를 추가하고, 기본 분기는 `kalita_wave`로 명시:

```tsx
if (type === "v60") {
  // ...existing V60 block
}

if (type === "kalita_102") {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 90 90"
      className={cx("text-text-primary", className)}
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity={opacity}
        fill="none"
        strokeLinejoin="round"
      >
        <path d="M 14 20 L 76 20 L 58 68 L 32 68 Z" />
        <line x1={36} y1={68} x2={36} y2={75} />
        <line x1={45} y1={68} x2={45} y2={75} />
        <line x1={54} y1={68} x2={54} y2={75} />
      </g>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={22 + i * 15}
          y1={28}
          x2={34 + i * 8}
          y2={62}
          stroke="currentColor"
          strokeWidth={STROKE.hairline}
          opacity={opacity * 0.5}
        />
      ))}
    </svg>
  );
}

// kalita_wave (default)
return (
  // ...existing kalita_wave block unchanged
);
```

Rationale: 사다리꼴은 V60보다 완만한 각도, Wave보다 좁은 하단. 리브는 수직에 가깝게.

- [ ] **Step 4: Standard 3-Stage compute 파일**

`src/domain/methods/standard-3-stage.ts`:

```ts
import { c, g, ratio, s } from "../units";
import type {
  BrewMethod,
  Pour,
  Recipe,
  RecipeInput,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
} from "../types";

const METHOD_RATIO = 15;
const BLOOM_RATIO_TO_COFFEE = 2;
const POUR_INTERVAL_SEC = 30;
const DRAWDOWN_SEC = 60;

const temperatureByRoast: Record<RoastLevel, number> = {
  light: 96,
  medium: 93,
  dark: 90,
};

const bloomDurationBySweetness: Record<SweetnessProfile, number> = {
  sweet: 40,
  balanced: 30,
  bright: 25,
};

// Last pour weight (baseline 100 = research reference)
const lastWeightByStrength: Record<StrengthProfile, number> = {
  light: 100,
  medium: 110,
  strong: 120,
};

const compute = (input: RecipeInput): Recipe => {
  const { coffee, roast, taste } = input;
  const totalWater = Math.round(coffee * METHOD_RATIO);
  const bloom = Math.round(coffee * BLOOM_RATIO_TO_COFFEE);
  const rest = totalWater - bloom;

  // weights for [pour 1, pour 2, pour 3]; first two fixed at 80, last varies
  const w1 = 80;
  const w2 = 80;
  const w3 = lastWeightByStrength[taste.strength];
  const wSum = w1 + w2 + w3;
  const pour1 = Math.round((rest * w1) / wSum);
  const pour2 = Math.round((rest * w2) / wSum);
  const pour3 = rest - pour1 - pour2;
  const bloomSec = bloomDurationBySweetness[taste.sweetness];

  const pours: readonly Pour[] = [
    {
      index: 0,
      atSec: s(0),
      pourAmount: g(bloom),
      cumulativeWater: g(bloom),
      label: "bloom",
    },
    {
      index: 1,
      atSec: s(bloomSec),
      pourAmount: g(pour1),
      cumulativeWater: g(bloom + pour1),
    },
    {
      index: 2,
      atSec: s(bloomSec + POUR_INTERVAL_SEC),
      pourAmount: g(pour2),
      cumulativeWater: g(bloom + pour1 + pour2),
    },
    {
      index: 3,
      atSec: s(bloomSec + POUR_INTERVAL_SEC * 2),
      pourAmount: g(pour3),
      cumulativeWater: g(totalWater),
    },
  ];

  return {
    method: "standard_3_stage",
    dripper: "kalita_102",
    coffee,
    totalWater: g(totalWater),
    ratio: ratio(METHOD_RATIO),
    temperature: c(temperatureByRoast[roast]),
    pours,
    totalTimeSec: s(bloomSec + POUR_INTERVAL_SEC * 2 + DRAWDOWN_SEC),
    grindHint: "medium",
    notes: [
      "일본 정통 사다리꼴 3단 분할. 수위를 끊지 않고 일정하게 유지.",
      "맛 조정은 마지막 푸어 비중(strength)과 뜸 시간(sweetness)으로.",
    ],
  };
};

export const standard3Stage: BrewMethod = {
  id: "standard_3_stage",
  name: "Standard 3-Stage",
  description:
    "Kalita 102의 정통 3단 분할 추출. 바디감과 밸런스를 동시에 확보.",
  supportedDrippers: ["kalita_102"],
  defaultRatio: ratio(METHOD_RATIO),
  compute,
};
```

- [ ] **Step 5: registry 등록**

`src/domain/methods/index.ts`에 `standard3Stage` 추가.

- [ ] **Step 6: 타입체크 + 기존 테스트**

```bash
bun run typecheck && bun run test:run
```

Expected: DripperIcon 분기·drippers.ts 확장이 기존 테스트 영향 없음.

- [ ] **Step 7: 스냅샷 테스트 작성 + 생성**

`src/domain/methods/standard-3-stage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { g } from "../units";
import type { RecipeInput } from "../types";
import { standard3Stage } from "./standard-3-stage";

const baseInput = (overrides: Partial<RecipeInput> = {}): RecipeInput => ({
  method: "standard_3_stage",
  dripper: "kalita_102",
  coffee: g(20),
  roast: "medium",
  taste: { sweetness: "balanced", strength: "medium" },
  ...overrides,
});

describe("Standard 3-Stage", () => {
  it("20g / balanced / medium — research reference (40/80/80/100 scaled)", () => {
    expect(standard3Stage.compute(baseInput())).toMatchInlineSnapshot();
  });

  it("supports only kalita_102", () => {
    expect(standard3Stage.supportedDrippers).toEqual(["kalita_102"]);
  });

  it("defaultRatio is 15", () => {
    expect(standard3Stage.defaultRatio).toBe(15);
  });
});
```

```bash
bun run test:run src/domain/methods/standard-3-stage.test.ts -u
```

- [ ] **Step 8: 스냅샷 리서치 대조**

확인 포인트: `totalWater: 300`, bloom=40, `grindHint: "medium"`, `temperature: 93`. 기본(medium strength) 기준 pour weights: 80/80/110이지만 연산 후 `rest=260`이 비율 배분됨 → 80/80/110 비율 → 약 77/77/106 정도 (라운딩 drift는 마지막에 흡수).

- [ ] **Step 9: UI 수동 시각 확인**

```bash
bun run dev
```

브라우저에서 드리퍼 셀렉터 열어 `Kalita 102` 옵션과 아이콘이 렌더되는지, Standard 3-Stage 메서드가 선택 가능한지 확인. 아이콘 비율이 이상하면 step 3으로 돌아가 좌표 조정.

- [ ] **Step 10: 커밋**

```bash
git add src/domain/types.ts src/domain/drippers.ts src/ui/DripperIcon.tsx src/domain/methods/standard-3-stage.ts src/domain/methods/standard-3-stage.test.ts src/domain/methods/index.ts
git commit -m "feat(dripper): add Kalita 102 dripper with Standard 3-Stage method

Trapezoid SVG icon, bloom + 3-stage pour (40/80/80/100 scaled).
Taste→last pour weight/bloom duration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Caffe Luxxe (Kalita 102) 메서드 추가

**Files:**
- Create: `src/domain/methods/caffe-luxxe.ts`
- Create: `src/domain/methods/caffe-luxxe.test.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/methods/index.ts`

**Context:** Caffe Luxxe — 30g / 400g (1:13.3) / 90-96°C / medium / 100g 지그재그 뜸 + 300g 연속 푸어. taste: strength→grind, sweetness→뜸 지속(25/30/40s).

- [ ] **Step 1: `BrewMethodId` 유니언 확장**

`"caffe_luxxe"` 추가.

- [ ] **Step 2: compute 파일 작성**

`src/domain/methods/caffe-luxxe.ts`:

```ts
import { c, g, ratio, s } from "../units";
import type {
  BrewMethod,
  GrindHint,
  Pour,
  Recipe,
  RecipeInput,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
} from "../types";

const METHOD_RATIO = 13.3;
const BLOOM_FRACTION = 0.25;
const DRAWDOWN_SEC = 120;

const temperatureByRoast: Record<RoastLevel, number> = {
  light: 96,
  medium: 93,
  dark: 90,
};

const bloomDurationBySweetness: Record<SweetnessProfile, number> = {
  sweet: 40,
  balanced: 30,
  bright: 25,
};

const grindByStrength: Record<StrengthProfile, GrindHint> = {
  light: "medium-coarse",
  medium: "medium",
  strong: "medium-fine",
};

const compute = (input: RecipeInput): Recipe => {
  const { coffee, roast, taste } = input;
  const totalWater = Math.round(coffee * METHOD_RATIO);
  const bloom = Math.round(totalWater * BLOOM_FRACTION);
  const mainPour = totalWater - bloom;
  const bloomSec = bloomDurationBySweetness[taste.sweetness];

  const pours: readonly Pour[] = [
    {
      index: 0,
      atSec: s(0),
      pourAmount: g(bloom),
      cumulativeWater: g(bloom),
      label: "bloom",
    },
    {
      index: 1,
      atSec: s(bloomSec),
      pourAmount: g(mainPour),
      cumulativeWater: g(totalWater),
    },
  ];

  return {
    method: "caffe_luxxe",
    dripper: "kalita_102",
    coffee,
    totalWater: g(totalWater),
    ratio: ratio(METHOD_RATIO),
    temperature: c(temperatureByRoast[roast]),
    pours,
    totalTimeSec: s(bloomSec + DRAWDOWN_SEC),
    grindHint: grindByStrength[taste.strength],
    notes: [
      "지그재그로 넓게 뜸, 이후 안팎 회전으로 연속 푸어.",
      "맛 조정은 분쇄도(strength)와 뜸 지속(sweetness)으로.",
    ],
  };
};

export const caffeLuxxe: BrewMethod = {
  id: "caffe_luxxe",
  name: "Caffe Luxxe",
  description:
    "고농도 추출을 노리는 Kalita 102 연속 푸어. 1:13.3 저비율로 바디감 극대화.",
  supportedDrippers: ["kalita_102"],
  defaultRatio: ratio(METHOD_RATIO),
  compute,
};
```

- [ ] **Step 3: registry 등록**

- [ ] **Step 4: 타입체크**

```bash
bun run typecheck
```

- [ ] **Step 5: 스냅샷 테스트 작성 + 생성**

`src/domain/methods/caffe-luxxe.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { g } from "../units";
import type { RecipeInput } from "../types";
import { caffeLuxxe } from "./caffe-luxxe";

const baseInput = (overrides: Partial<RecipeInput> = {}): RecipeInput => ({
  method: "caffe_luxxe",
  dripper: "kalita_102",
  coffee: g(30),
  roast: "medium",
  taste: { sweetness: "balanced", strength: "medium" },
  ...overrides,
});

describe("Caffe Luxxe", () => {
  it("30g / balanced / medium — research reference (100 bloom + 300 main)", () => {
    expect(caffeLuxxe.compute(baseInput())).toMatchInlineSnapshot();
  });

  it("supports only kalita_102", () => {
    expect(caffeLuxxe.supportedDrippers).toEqual(["kalita_102"]);
  });

  it("defaultRatio is 13.3", () => {
    expect(caffeLuxxe.defaultRatio).toBe(13.3);
  });
});
```

```bash
bun run test:run src/domain/methods/caffe-luxxe.test.ts -u
```

- [ ] **Step 6: 스냅샷 리서치 대조**

확인 포인트: `totalWater: 399` (30 × 13.3 라운딩), bloom≈100, main≈299, atSec 0/30, `temperature: 93`, `grindHint: "medium"`.

- [ ] **Step 7: 커밋**

```bash
git add src/domain/types.ts src/domain/methods/caffe-luxxe.ts src/domain/methods/caffe-luxxe.test.ts src/domain/methods/index.ts
git commit -m "feat(methods): add Caffe Luxxe method for Kalita 102

Big 25% bloom + single continuous pour at 1:13.3. Taste→grind/bloom duration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Fuglen Tokyo (Kalita 102) 메서드 추가

**Files:**
- Create: `src/domain/methods/fuglen-tokyo.ts`
- Create: `src/domain/methods/fuglen-tokyo.test.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/methods/index.ts`

**Context:** Fuglen Tokyo — 16g / 250g (1:15.6) / 92-93°C / slightly coarse / 40g 뜸 + 40g 회전 푸어 + 170g 센터 푸어. taste: strength→grind, sweetness→뜸 지속(30/40/50s).

- [ ] **Step 1: `BrewMethodId` 유니언 확장**

`"fuglen_tokyo"` 추가.

- [ ] **Step 2: compute 파일 작성**

`src/domain/methods/fuglen-tokyo.ts`:

```ts
import { c, g, ratio, s } from "../units";
import type {
  BrewMethod,
  GrindHint,
  Pour,
  Recipe,
  RecipeInput,
  RoastLevel,
  StrengthProfile,
  SweetnessProfile,
} from "../types";

const METHOD_RATIO = 15.6;
const BLOOM_RATIO_TO_COFFEE = 2.5;
const GAP_AFTER_SECOND_POUR_SEC = 15;
const DRAWDOWN_SEC = 60;

const temperatureByRoast: Record<RoastLevel, number> = {
  light: 93,
  medium: 92,
  dark: 90,
};

const bloomDurationBySweetness: Record<SweetnessProfile, number> = {
  sweet: 50,
  balanced: 40,
  bright: 30,
};

const grindByStrength: Record<StrengthProfile, GrindHint> = {
  light: "coarse",
  medium: "medium-coarse",
  strong: "medium",
};

const compute = (input: RecipeInput): Recipe => {
  const { coffee, roast, taste } = input;
  const totalWater = Math.round(coffee * METHOD_RATIO);
  const bloom = Math.round(coffee * BLOOM_RATIO_TO_COFFEE);
  const pour2 = bloom;
  const pour3 = totalWater - bloom - pour2;
  const bloomSec = bloomDurationBySweetness[taste.sweetness];
  const pour3Sec = bloomSec + GAP_AFTER_SECOND_POUR_SEC;

  const pours: readonly Pour[] = [
    {
      index: 0,
      atSec: s(0),
      pourAmount: g(bloom),
      cumulativeWater: g(bloom),
      label: "bloom",
    },
    {
      index: 1,
      atSec: s(bloomSec),
      pourAmount: g(pour2),
      cumulativeWater: g(bloom + pour2),
    },
    {
      index: 2,
      atSec: s(pour3Sec),
      pourAmount: g(pour3),
      cumulativeWater: g(totalWater),
    },
  ];

  return {
    method: "fuglen_tokyo",
    dripper: "kalita_102",
    coffee,
    totalWater: g(totalWater),
    ratio: ratio(METHOD_RATIO),
    temperature: c(temperatureByRoast[roast]),
    pours,
    totalTimeSec: s(pour3Sec + DRAWDOWN_SEC),
    grindHint: grindByStrength[taste.strength],
    notes: [
      "2차 푸어는 회전, 3차는 센터로 빠르게 전량 투입.",
      "맛 조정은 분쇄도(strength)와 뜸 지속(sweetness)으로.",
    ],
  };
};

export const fuglenTokyo: BrewMethod = {
  id: "fuglen_tokyo",
  name: "Fuglen Tokyo",
  description:
    "빠른 연속 푸어로 마무리하는 Kalita 102 방식. 클린하고 균형 잡힌 컵.",
  supportedDrippers: ["kalita_102"],
  defaultRatio: ratio(METHOD_RATIO),
  compute,
};
```

- [ ] **Step 3: registry 등록**

- [ ] **Step 4: 타입체크**

```bash
bun run typecheck
```

- [ ] **Step 5: 스냅샷 테스트 작성 + 생성**

`src/domain/methods/fuglen-tokyo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { g } from "../units";
import type { RecipeInput } from "../types";
import { fuglenTokyo } from "./fuglen-tokyo";

const baseInput = (overrides: Partial<RecipeInput> = {}): RecipeInput => ({
  method: "fuglen_tokyo",
  dripper: "kalita_102",
  coffee: g(16),
  roast: "medium",
  taste: { sweetness: "balanced", strength: "medium" },
  ...overrides,
});

describe("Fuglen Tokyo", () => {
  it("16g / balanced / medium — research reference (40/40/170)", () => {
    expect(fuglenTokyo.compute(baseInput())).toMatchInlineSnapshot();
  });

  it("supports only kalita_102", () => {
    expect(fuglenTokyo.supportedDrippers).toEqual(["kalita_102"]);
  });

  it("defaultRatio is 15.6", () => {
    expect(fuglenTokyo.defaultRatio).toBe(15.6);
  });
});
```

```bash
bun run test:run src/domain/methods/fuglen-tokyo.test.ts -u
```

- [ ] **Step 6: 스냅샷 리서치 대조**

확인 포인트: `totalWater: 250`, pours 40/40/170, atSec 0/40/55, `temperature: 92`, `grindHint: "medium-coarse"`.

- [ ] **Step 7: 커밋**

```bash
git add src/domain/types.ts src/domain/methods/fuglen-tokyo.ts src/domain/methods/fuglen-tokyo.test.ts src/domain/methods/index.ts
git commit -m "feat(methods): add Fuglen Tokyo method for Kalita 102

40/40/170 pour pattern. Taste→grind/bloom duration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: `kalita_pulse` 제거

**Files:**
- Delete: `src/domain/methods/kalita-pulse.ts`
- Delete: `src/domain/methods/kalita-pulse.test.ts`
- Modify: `src/domain/types.ts` — `"kalita_pulse"` 제거
- Modify: `src/domain/methods/index.ts` — import · registry 제거
- Modify: `src/features/share/urlCodec.ts` — `METHOD_IDS`에서 `"kalita_pulse"` 제거 (다른 신규 id 추가는 Task 11)
- Modify: `src/features/share/urlCodec.test.ts` — fixture에서 `method`를 `"frothy_monkey"`로 교체

**Context:** 기존 `kalita_pulse`는 리서치 근거 약한 generic 레시피. Frothy Monkey로 동일한 Wave 펄스 성격이 대체되었으므로 제거.

- [ ] **Step 1: 파일 삭제**

```bash
rm src/domain/methods/kalita-pulse.ts src/domain/methods/kalita-pulse.test.ts
```

- [ ] **Step 2: 타입 유니언 정리**

`src/domain/types.ts`의 `BrewMethodId`에서 `"kalita_pulse"` 제거.

- [ ] **Step 3: registry 정리**

`src/domain/methods/index.ts`:

```ts
import type { BrewMethod, BrewMethodId, DripperId } from "../types";
import { april } from "./april";
import { caffeLuxxe } from "./caffe-luxxe";
import { frothyMonkey } from "./frothy-monkey";
import { fuglenTokyo } from "./fuglen-tokyo";
import { hoffmannV60 } from "./hoffmann-v60";
import { kasuya46 } from "./kasuya-4-6";
import { kurasuKyoto } from "./kurasu-kyoto";
import { scottRao } from "./scott-rao";
import { standard3Stage } from "./standard-3-stage";

export const brewMethods: Record<BrewMethodId, BrewMethod> = {
  kasuya_4_6: kasuya46,
  hoffmann_v60: hoffmannV60,
  scott_rao: scottRao,
  april,
  kurasu_kyoto: kurasuKyoto,
  frothy_monkey: frothyMonkey,
  standard_3_stage: standard3Stage,
  caffe_luxxe: caffeLuxxe,
  fuglen_tokyo: fuglenTokyo,
};

export const methodList: readonly BrewMethod[] = Object.values(brewMethods);

export const methodsForDripper = (dripper: DripperId): readonly BrewMethod[] =>
  methodList.filter((m) => m.supportedDrippers.includes(dripper));
```

- [ ] **Step 4: urlCodec 및 테스트에서 `kalita_pulse` 제거**

`src/features/share/urlCodec.ts`의 `METHOD_IDS`에서 `"kalita_pulse"` 문자열만 제거 (추가는 Task 11).

`src/features/share/urlCodec.test.ts`의 fixture 수정:

```ts
const fullState: AppState = {
  ...DEFAULT_STATE,
  coffee: g(18),
  dripper: "kalita_wave",
  method: "frothy_monkey",
  roast: "dark",
  taste: { sweetness: "bright", strength: "light" },
};
```

그리고 `expect(p.get("m")).toBe("kalita_pulse")` → `"frothy_monkey"`.

- [ ] **Step 5: 타입체크 + 테스트**

```bash
bun run typecheck && bun run test:run
```

Expected: 모두 통과.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "refactor(methods): remove generic kalita_pulse (replaced by Frothy Monkey)

Kalita_pulse was a non-researched generic recipe. Frothy Monkey provides
the same pulse-pour character with a concrete reference.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: 공유 invariant 스위프 테스트

**Files:**
- Create: `src/domain/methods/invariants.test.ts`

**Context:** 모든 메서드가 `totalWater === sum(pourAmount)`, `cumulativeWater` 누적 정합, `pours[0].atSec === 0` 불변을 만족해야 한다. 스위프 1개가 9개 메서드를 모두 커버한다.

- [ ] **Step 1: invariant 스위프 작성**

`src/domain/methods/invariants.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { g } from "../units";
import type { RecipeInput, RoastLevel, TasteProfile } from "../types";
import { methodList } from "./index";

const sampleTastes: readonly TasteProfile[] = [
  { sweetness: "balanced", strength: "medium" },
  { sweetness: "sweet", strength: "strong" },
  { sweetness: "bright", strength: "light" },
];

const sampleRoasts: readonly RoastLevel[] = ["light", "medium", "dark"];
const sampleCoffees = [10, 20, 30];

describe("method invariants (sweep)", () => {
  for (const method of methodList) {
    describe(method.name, () => {
      for (const coffee of sampleCoffees) {
        for (const roast of sampleRoasts) {
          for (const taste of sampleTastes) {
            const label = `coffee=${coffee}g roast=${roast} sweetness=${taste.sweetness} strength=${taste.strength}`;

            it(`totalWater === sum(pourAmount) — ${label}`, () => {
              const input: RecipeInput = {
                method: method.id,
                dripper: method.supportedDrippers[0]!,
                coffee: g(coffee),
                roast,
                taste,
              };
              const r = method.compute(input);
              const sum = r.pours.reduce((acc, p) => acc + p.pourAmount, 0);
              expect(sum).toBe(r.totalWater);
            });

            it(`cumulativeWater is running sum — ${label}`, () => {
              const input: RecipeInput = {
                method: method.id,
                dripper: method.supportedDrippers[0]!,
                coffee: g(coffee),
                roast,
                taste,
              };
              const r = method.compute(input);
              let running = 0;
              for (const p of r.pours) {
                running += p.pourAmount;
                expect(p.cumulativeWater).toBe(running);
              }
            });

            it(`first pour starts at 0s — ${label}`, () => {
              const input: RecipeInput = {
                method: method.id,
                dripper: method.supportedDrippers[0]!,
                coffee: g(coffee),
                roast,
                taste,
              };
              const r = method.compute(input);
              expect(r.pours[0]!.atSec).toBe(0);
            });
          }
        }
      }
    });
  }
});
```

- [ ] **Step 2: 테스트 실행**

```bash
bun run test:run src/domain/methods/invariants.test.ts
```

Expected: 9 메서드 × 3 coffee × 3 roast × 3 taste × 3 invariants = 729 assertions 모두 통과. 실패 시 해당 메서드 compute의 rounding 처리를 점검.

- [ ] **Step 3: 커밋**

```bash
git add src/domain/methods/invariants.test.ts
git commit -m "test(methods): shared invariant sweep across all methods

Covers totalWater/cumulativeWater/first-pour-atSec for every method × sample
inputs. Replaces per-method edge case sweeps for new methods.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: urlCodec 전체 재정비

**Files:**
- Modify: `src/features/share/urlCodec.ts`
- Modify: `src/features/share/urlCodec.test.ts`

**Context:** 모든 신규 메서드 id와 `kalita_102` 드리퍼를 URL 스키마에 반영. 디코드 시 알 수 없는 id는 기존 `oneOf` 로직대로 `null` 반환 → 상위에서 `DEFAULT_STATE` fallback.

- [ ] **Step 1: `METHOD_IDS` · `DRIPPER_IDS` 확장**

`src/features/share/urlCodec.ts`:

```ts
const METHOD_IDS: readonly BrewMethodId[] = [
  "kasuya_4_6",
  "hoffmann_v60",
  "scott_rao",
  "april",
  "kurasu_kyoto",
  "frothy_monkey",
  "standard_3_stage",
  "caffe_luxxe",
  "fuglen_tokyo",
];
const DRIPPER_IDS: readonly DripperId[] = ["v60", "kalita_wave", "kalita_102"];
```

- [ ] **Step 2: 알 수 없는 id fallback 테스트 추가**

`src/features/share/urlCodec.test.ts`에 기존 테스트들 뒤에 추가:

```ts
it("ignores unknown method id (e.g. removed kalita_pulse) — caller falls back to default", () => {
  const params = new URLSearchParams();
  params.set("c", "20");
  params.set("d", "kalita_wave");
  params.set("m", "kalita_pulse"); // legacy id
  params.set("r", "medium");
  params.set("sw", "balanced");
  params.set("st", "medium");
  const decoded = decodeState(params);
  expect(decoded.method).toBeUndefined();
  expect(decoded.dripper).toBe("kalita_wave");
});

it("decodes kalita_102 dripper and its methods", () => {
  const params = new URLSearchParams();
  params.set("d", "kalita_102");
  params.set("m", "standard_3_stage");
  const decoded = decodeState(params);
  expect(decoded.dripper).toBe("kalita_102");
  expect(decoded.method).toBe("standard_3_stage");
});
```

- [ ] **Step 3: 테스트 실행**

```bash
bun run test:run src/features/share/urlCodec.test.ts
```

Expected: 모두 통과.

- [ ] **Step 4: 전체 테스트 + 타입체크**

```bash
bun run typecheck && bun run test:run
```

Expected: 모두 통과.

- [ ] **Step 5: `mergeState`의 method fallback 수동 확인**

`src/features/app/state.ts`의 `mergeState`는 `methodsForDripper(merged.dripper)`에서 `compat[0]!`을 가져오므로 드리퍼 변경 시 자동으로 첫 호환 메서드로 떨어진다. 코드 변경 불필요하되, 동작을 확인하기 위해:

```bash
bun run test:run src/features/app/state.test.ts
```

Expected: 기존 테스트 그대로 통과.

- [ ] **Step 6: 커밋**

```bash
git add src/features/share/urlCodec.ts src/features/share/urlCodec.test.ts
git commit -m "feat(share): expand URL codec for kalita_102 + 9 methods

Unknown legacy ids (e.g. kalita_pulse) now silently fall back to default.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: UI 수동 검증 및 라벨 길이 대응

**Files:**
- Modify (조건부): `src/domain/types.ts` — `BrewMethod`에 `shortName?: string` 추가
- Modify (조건부): 해당 메서드 파일들 — `shortName` 설정
- Modify (조건부): `src/features/recipe/RecipeScreen.tsx` — `Segmented`에 `shortName ?? name` 전달

**Context:** 드리퍼당 3개 메서드 라벨이 Segmented 한 줄에 들어가는지 실제 앱에서 확인. 오버플로 발생 시 short name을 도입한다.

- [ ] **Step 1: 개발 서버 구동**

```bash
bun run dev
```

- [ ] **Step 2: 각 드리퍼별 메서드 세그먼트 시각 확인**

브라우저에서:
1. V60 선택 → "Kasuya 4:6 / Hoffmann V60 / Scott Rao" 한 줄에 들어가는지
2. Kalita Wave 선택 → "April / Kurasu Kyoto / Frothy Monkey"
3. Kalita 102 선택 → "Standard 3-Stage / Caffe Luxxe / Fuglen Tokyo"

모든 드리퍼에서 라벨 오버플로가 없으면 **Task 12 완료, 커밋 없이 Task 13으로**.

- [ ] **Step 3 (조건부): 오버플로 발생 시 `shortName` 도입**

오버플로가 있으면 `BrewMethod` 타입에 `shortName?: string` 추가하고 각 메서드 파일에서 오버플로 유발 항목에 `shortName` 지정 (예: `standard_3_stage` → `shortName: "Standard"`). `RecipeScreen.tsx` line 140을 수정:

```tsx
options={compatMethods.map((m) => ({ value: m.id, label: m.shortName ?? m.name }))}
```

그리고 커밋:

```bash
git add -A
git commit -m "feat(methods): add shortName for Segmented label fit

Long method names overflow the per-dripper 3-column segmented control.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: 개발 서버 종료**

Ctrl+C로 `bun run dev` 종료.

---

## Task 13: 문서 업데이트

**Files:**
- Modify: `docs/design.md`
- Modify: `CLAUDE.md`

**Context:** v1 scope 명시 문서와 testing 규약 문서를 새 현실에 맞춘다.

- [ ] **Step 1: `docs/design.md` v1 scope 갱신**

`docs/design.md` § Scope v1 블록을 다음으로 교체 (현재 "드리퍼 2종: V60, Kalita Wave"와 "메서드 3종: Kasuya 4:6, Hoffmann V60, Kalita Wave 펄스"):

```markdown
- 드리퍼 3종: **V60**, **Kalita Wave**, **Kalita 102**
- 메서드 9종:
  - V60: **Kasuya 4:6**, **Hoffmann V60**, **Scott Rao**
  - Kalita Wave: **April**, **Kurasu Kyoto**, **Frothy Monkey**
  - Kalita 102: **Standard 3-Stage**, **Caffe Luxxe**, **Fuglen Tokyo**
```

- [ ] **Step 2: `docs/design.md` 타입 예시의 `BrewMethodId`와 `DripperId` 갱신**

파일 내에서 `BrewMethodId = "kasuya_4_6" | "hoffmann_v60" | "kalita_pulse"` 표기를 실제 유니언과 일치하도록 수정. `DripperId`도 `"v60" | "kalita_wave" | "kalita_102"`로 갱신.

- [ ] **Step 3: `CLAUDE.md` § Testing 완화**

`CLAUDE.md` § Testing 섹션을 다음으로 교체:

```markdown
## Testing

- **Vitest**. 도메인 레이어 위주.
- **필수**: 메서드당 1 스냅샷 + `src/domain/methods/invariants.test.ts`의 공유 invariant 스위프.
  - 스냅샷은 각 메서드의 리서치 기본 케이스(권장 coffee/roast/balanced taste)로 고정.
  - 스위프가 `totalWater === sum(pourAmount)`, `cumulativeWater` 누적, `pours[0].atSec === 0`을 모든 메서드에 대해 커버.
- **선택**: 메서드별 엣지 케이스(5g/50g, taste 극단)는 해당 메서드 compute에 특수 분기가 있을 때만 추가.
- 기존 Kasuya/Hoffmann 테스트에 포함된 풍부한 invariants는 유지 (리팩토링 시 추가 safety net).
```

- [ ] **Step 4: `CLAUDE.md` § v1 범위 외 블록 재확인**

파일 내 "단, 이 기능들이 나중에 붙을 수 있도록 `Recipe` 타입과 registry 구조는..." 문장은 그대로. "Kasuya 4:6를 첫 메서드로 구현" 문구도 과거 기록이라 유지.

- [ ] **Step 5: 전체 테스트 + 타입체크 (최종 smoke)**

```bash
bun run typecheck && bun run test:run && bun run build
```

Expected: 전부 통과.

- [ ] **Step 6: 커밋**

```bash
git add docs/design.md CLAUDE.md
git commit -m "docs: update v1 scope and testing guidance for 9-method expansion

design.md reflects 3 drippers / 9 methods. CLAUDE.md testing section softened
to require one snapshot per method + shared invariant sweep.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Verification Checklist (최종 확인)

- [ ] `bun run typecheck` 통과
- [ ] `bun run test:run` 전부 통과
- [ ] `bun run build` 성공
- [ ] 앱을 `bun run dev`로 띄워 3드리퍼 × 3메서드 = 9조합 선택 정상 동작
- [ ] `kalita_102` 아이콘 시각적으로 자연스러움
- [ ] 기존 `?m=kalita_pulse` URL이 오류 없이 default 메서드로 fallback
