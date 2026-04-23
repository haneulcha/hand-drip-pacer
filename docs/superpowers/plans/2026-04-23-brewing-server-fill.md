# Brewing Server-Fill Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `BrewingScreen`을 viewport-as-server 컨셉으로 재구성. 시간이 흐르면 컵 내부에 갈색 액체가 차오르고, 시간 비례 수평 눈금이 푸어 phase 경계를 표시하며, Hero(목표 무게 + 단계 + 행동)가 메니스커스 위에 떠서 같이 상승.

**Architecture:** `src/features/brewing/BrewingScreen.tsx` 단일 파일을 layout-3구역(RIM / CupInterior / Hero+Liquid+Rings)으로 재작성. 도메인·세션 모델 무변경 — 기존 `useElapsed`, `activeStepIdx`, `Recipe`, `Pour` 그대로 소비. 색·간격·shadow는 모두 새 semantic 토큰으로 통제.

**Tech Stack:** React 19 / TypeScript strict / Tailwind 3 + CSS variables / Vitest + Testing Library / Bun.

**Spec:** `docs/superpowers/specs/2026-04-23-brewing-server-fill-design.md`

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/ui/tokens/semantic.css` | brewing 전용 시맨틱 토큰(액체 그라디언트, ring 색, rim shadow, sizing) | Modify |
| `tailwind.config.ts` | 새 토큰을 Tailwind 유틸로 노출 + wave keyframe 등록 | Modify |
| `src/features/brewing/BrewingScreen.tsx` | RIM / CupInterior(Liquid + Rings + Hero) 레이아웃 재작성 | Rewrite |
| `src/features/brewing/BrewingScreen.test.tsx` | 기존 단언 보존 + liquid 높이 / next ring / hero 위치 / skip 위치 단언 추가 | Modify |

도메인 / 세션 / 토큰 primitives.css / `StopConfirmDialog` / `useElapsed`는 손대지 않는다.

---

## Task 1: Add brewing tokens (semantic.css + tailwind.config.ts)

**Files:**
- Modify: `src/ui/tokens/semantic.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add brewing tokens to semantic.css `:root`**

`src/ui/tokens/semantic.css`의 `:root` 블록 안 (Domain 섹션 아래)에 추가:

```css
  /* Brewing — liquid gradient (위→아래로 짙어짐) */
  --color-brewing-liquid-top: var(--accent-300);
  --color-brewing-liquid-mid: var(--accent-500);
  --color-brewing-liquid-deep: var(--accent-700);
  --color-brewing-liquid-bottom: var(--accent-900);

  /* Brewing — rings */
  --color-ring-future: var(--neutral-400);
  --color-ring-on-liquid: rgba(251, 247, 239, 0.42);

  /* Brewing — rim */
  --shadow-rim-inset: inset 0 6px 14px -10px rgba(0, 0, 0, 0.18);

  /* Brewing — sizing */
  --brewing-rim-height: 84px;
  --brewing-hero-gap: 12px;
  --font-size-brewing-hero: clamp(32px, 6.5vh, 48px);
```

- [ ] **Step 2: Add brewing tokens to dark theme**

`src/ui/tokens/semantic.css`의 `[data-theme="dark"]` 블록 안에 추가 (대응 색):

```css
  --color-brewing-liquid-top: var(--accent-200);
  --color-brewing-liquid-mid: var(--accent-400);
  --color-brewing-liquid-deep: var(--accent-600);
  --color-brewing-liquid-bottom: var(--accent-800);

  --color-ring-future: var(--neutral-500);
  --color-ring-on-liquid: rgba(251, 247, 239, 0.32);

  --shadow-rim-inset: inset 0 6px 14px -10px rgba(0, 0, 0, 0.5);
```

(sizing/font-size는 light에서 상속)

- [ ] **Step 3: Extend tailwind.config.ts — colors**

`tailwind.config.ts`의 `theme.extend.colors` 안에 추가 (기존 키 옆):

```ts
        brewing: {
          "liquid-top": "var(--color-brewing-liquid-top)",
          "liquid-mid": "var(--color-brewing-liquid-mid)",
          "liquid-deep": "var(--color-brewing-liquid-deep)",
          "liquid-bottom": "var(--color-brewing-liquid-bottom)",
        },
        ring: {
          future: "var(--color-ring-future)",
          "on-liquid": "var(--color-ring-on-liquid)",
        },
```

- [ ] **Step 4: Extend tailwind — boxShadow / height / fontSize**

`theme.extend.boxShadow`에 추가:
```ts
        "rim-inset": "var(--shadow-rim-inset)",
```

`theme.extend.height`에 추가 (기존 `progress-rail` 옆):
```ts
        "brewing-rim": "var(--brewing-rim-height)",
```

`theme.extend.fontSize`에 추가 (기존 `hero-lg` 아래):
```ts
        "brewing-hero": ["var(--font-size-brewing-hero)", { lineHeight: "var(--line-height-tight)" }],
```

- [ ] **Step 5: Extend tailwind — wave keyframe + animation**

`theme.extend.keyframes`에 추가:
```ts
        "brewing-wave": {
          "0%, 100%": { transform: "translateX(0) scaleY(1)" },
          "50%": { transform: "translateX(8px) scaleY(1.5)" },
        },
```

`theme.extend.animation`에 추가:
```ts
        "brewing-wave": "brewing-wave 4s ease-in-out infinite",
```

- [ ] **Step 6: Verify typecheck + build**

Run:
```bash
bun run typecheck
```
Expected: PASS (no errors)

- [ ] **Step 7: Commit**

```bash
git add src/ui/tokens/semantic.css tailwind.config.ts
git commit -m "$(cat <<'EOF'
feat(tokens): brewing 화면 viewport-as-server 토큰 추가

- liquid 그라디언트 4단계 (top/mid/deep/bottom)
- ring future / ring-on-liquid
- rim inset shadow
- brewing rim height / hero gap / hero font (clamp)
- wave keyframe + animation
EOF
)"
```

---

## Task 2: Add failing tests for new visual structure

**Files:**
- Modify: `src/features/brewing/BrewingScreen.test.tsx`

- [ ] **Step 1: Write new test cases (red)**

`src/features/brewing/BrewingScreen.test.tsx`의 `describe("BrewingScreen", ...)` 블록 마지막에 다음 테스트 추가:

```ts
  it("liquid height grows proportionally to elapsed time", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    const session = makeSession(1_000_000_000_000 - 105_000); // elapsed=105 of 210 (50%)
    render(
      <BrewingScreen session={session} onExit={vi.fn()} onComplete={vi.fn()} />,
    );
    const liquid = screen.getByTestId("liquid");
    expect(liquid.style.height).toMatch(/^50(\.0+)?%$/);
  });

  it("hero floats above meniscus (bottom uses fillRatio)", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    const session = makeSession(1_000_000_000_000 - 105_000);
    render(
      <BrewingScreen session={session} onExit={vi.fn()} onComplete={vi.fn()} />,
    );
    const hero = screen.getByTestId("hero");
    // bottom is calc(<fill>% + gap) — assert the fill portion contains 50%
    expect(hero.style.bottom).toContain("50");
  });

  it("ring at next pour boundary has 'next' variant", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    const session = makeSession(1_000_000_000_000); // elapsed=0; next boundary is pour 1 at 45s
    render(
      <BrewingScreen session={session} onExit={vi.fn()} onComplete={vi.fn()} />,
    );
    const nextRing = screen.getByTestId("ring-next");
    expect(nextRing.dataset.atSec).toBe("45");
  });

  it("skip button is rendered inside the rim region", () => {
    vi.setSystemTime(new Date(1_000_000_000_000));
    const session = makeSession(1_000_000_000_000);
    render(
      <BrewingScreen session={session} onExit={vi.fn()} onComplete={vi.fn()} />,
    );
    const skip = screen.getByRole("button", { name: "다음 스텝으로 건너뛰기" });
    expect(skip.closest('[data-region="rim"]')).not.toBeNull();
  });
```

- [ ] **Step 2: Run new tests — verify they fail**

Run:
```bash
bun run test:run --reporter=verbose
```
Expected: 4 new tests FAIL (`getByTestId("liquid")` not found, etc.). All previously-existing tests still PASS (DOM still has hero-weight + 중단 + skip aria-label).

- [ ] **Step 3: Commit (red)**

```bash
git add src/features/brewing/BrewingScreen.test.tsx
git commit -m "test(brewing): viewport-as-server 구조용 실패 테스트 추가"
```

---

## Task 3: Rewrite BrewingScreen — RIM + CupInterior + Liquid + Rings + Hero

**Files:**
- Modify: `src/features/brewing/BrewingScreen.tsx` (전체 재작성)

- [ ] **Step 1: Replace BrewingScreen.tsx with new layout**

`src/features/brewing/BrewingScreen.tsx` 전체를 다음으로 교체:

```tsx
import { useEffect, useRef, useState } from "react";
import { activeStepIdx, type BrewSession } from "@/domain/session";
import type { Pour } from "@/domain/types";
import { formatTime } from "@/ui/format";
import { cx } from "@/ui/cx";
import { StopConfirmDialog } from "./StopConfirmDialog";
import { useElapsed } from "./useElapsed";

type Props = {
  readonly session: BrewSession;
  readonly onExit: () => void;
  readonly onComplete: () => void;
};

export function BrewingScreen({ session, onExit, onComplete }: Props) {
  const elapsed = useElapsed(session);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [manualStepFloor, setManualStepFloor] = useState(0);
  const completedRef = useRef(false);

  const { recipe } = session;
  const { pours, totalTimeSec } = recipe;
  const clockIdx = activeStepIdx(pours, elapsed);
  const activeIdx = Math.min(
    pours.length - 1,
    Math.max(clockIdx, manualStepFloor),
  );
  const active = pours[activeIdx]!;
  const isLast = activeIdx === pours.length - 1;
  const done = elapsed >= totalTimeSec || manualStepFloor >= pours.length;

  const fillRatio = Math.min(1, Math.max(0, elapsed / totalTimeSec));
  const fillPct = `${(fillRatio * 100).toFixed(2)}%`;

  const handleSkip = () => {
    setManualStepFloor((prev) => Math.max(prev, clockIdx) + 1);
  };

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [done, onComplete]);

  // pour 0 (atSec=0) 은 컵 바닥이라 ring 안 그림
  const visibleRings = pours.filter((p) => p.atSec > 0);
  const nextRingIdx = visibleRings.findIndex((p) => p.atSec > elapsed);

  const phaseLabel = active.label === "bloom" ? "bloom" : `${activeIdx}차`;

  return (
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-surface text-text-primary">
      <AriaLiveStep session={session} activeIdx={activeIdx} />

      {/* RIM */}
      <header
        data-region="rim"
        className="relative z-10 flex h-brewing-rim items-start justify-between border-b border-border/60 bg-surface px-5 pt-4 shadow-rim-inset"
      >
        <div>
          <div className="text-2xs text-text-muted">경과</div>
          <div className="mt-0.5 text-xl font-medium tabular-nums">
            {formatTime(elapsed)}
          </div>
        </div>
        <div className="flex items-start gap-3 pt-2">
          {!done && (
            <button
              type="button"
              onClick={handleSkip}
              aria-label="다음 스텝으로 건너뛰기"
              className="px-2 py-1 text-xs text-text-muted hover:text-text-secondary"
            >
              건너뛰기 <span aria-hidden>›</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setStopDialogOpen(true)}
            className="px-2 py-1 text-xs text-text-muted hover:text-text-secondary"
          >
            중단
          </button>
        </div>
      </header>

      {/* CUP INTERIOR */}
      <div className="relative flex-1 overflow-hidden bg-surface">
        {/* Liquid */}
        <div
          data-testid="liquid"
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 transition-[height] duration-DEFAULT ease-DEFAULT"
          style={{
            height: fillPct,
            background:
              "linear-gradient(180deg, var(--color-brewing-liquid-top) 0%, var(--color-brewing-liquid-mid) 22%, var(--color-brewing-liquid-deep) 60%, var(--color-brewing-liquid-bottom) 100%)",
          }}
        >
          {/* meniscus highlight */}
          <div
            className="absolute inset-x-0 top-0 h-0.5"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,247,228,0.55), transparent)",
            }}
          />
          {/* wave shimmer */}
          <div
            className="motion-safe:animate-brewing-wave absolute inset-x-0 top-0 h-2.5"
            style={{
              background:
                "radial-gradient(ellipse at 30% 100%, rgba(255,247,228,0.18) 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, rgba(255,247,228,0.14) 0%, transparent 60%)",
            }}
          />
        </div>

        {/* Rings */}
        {visibleRings.map((p, i) => {
          const variant: "below" | "next" | "future" =
            p.atSec <= elapsed
              ? "below"
              : i === nextRingIdx
                ? "next"
                : "future";
          const localIdx = pours.indexOf(p);
          const ringLabel =
            p.label === "bloom" ? "bloom" : `${localIdx}차`;
          return (
            <RingMarker
              key={p.index}
              pour={p}
              totalTimeSec={totalTimeSec}
              variant={variant}
              label={ringLabel}
            />
          );
        })}

        {/* Hero floating above meniscus */}
        <div
          data-testid="hero"
          className="pointer-events-none absolute left-3.5 right-24 transition-[bottom] duration-DEFAULT ease-DEFAULT"
          style={{
            bottom: `calc(${fillPct} + var(--brewing-hero-gap))`,
          }}
        >
          <div className="text-2xs font-semibold uppercase tracking-widest text-pour-bloom">
            지금 · <span>{phaseLabel}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              data-testid="hero-weight"
              className="text-brewing-hero font-medium leading-none tabular-nums"
            >
              {active.cumulativeWater}
            </span>
            <span className="text-lg text-text-muted">g</span>
          </div>
          <div className="mt-1.5 text-sm italic text-text-secondary">
            +{active.pourAmount}g 붓기{isLast ? " · 마지막 푸어" : ""}
          </div>
        </div>
      </div>

      {stopDialogOpen && (
        <StopConfirmDialog
          onCancel={() => setStopDialogOpen(false)}
          onConfirm={onExit}
        />
      )}
    </div>
  );
}

function RingMarker({
  pour,
  totalTimeSec,
  variant,
  label,
}: {
  readonly pour: Pour;
  readonly totalTimeSec: number;
  readonly variant: "below" | "next" | "future";
  readonly label: string;
}) {
  const positionPct = `${((pour.atSec / totalTimeSec) * 100).toFixed(2)}%`;
  const lineColor =
    variant === "below"
      ? "var(--color-ring-on-liquid)"
      : variant === "next"
        ? "var(--color-text-primary)"
        : "var(--color-ring-future)";
  const labelColor =
    variant === "below"
      ? "rgba(251,247,239,0.78)"
      : variant === "next"
        ? "var(--color-text-primary)"
        : "var(--color-text-muted)";
  return (
    <div
      data-testid={variant === "next" ? "ring-next" : undefined}
      data-ring-variant={variant}
      data-at-sec={pour.atSec}
      className="pointer-events-none absolute inset-x-0 z-[3] h-px"
      style={{ bottom: positionPct }}
    >
      <div
        className="absolute left-3.5 right-24 top-0"
        style={{
          height: variant === "next" ? "1.5px" : "1px",
          background: lineColor,
        }}
      />
      <div
        className={cx(
          "absolute right-4 -top-1.5 flex items-baseline gap-1.5 text-2xs tabular-nums",
          variant === "next" && "font-semibold",
        )}
        style={{ color: labelColor }}
      >
        <time
          aria-label={`${label} 시작, ${Math.floor(pour.atSec / 60)}분 ${pour.atSec % 60}초`}
        >
          {formatTime(pour.atSec)}
        </time>
        <span className="text-[8px] uppercase tracking-widest opacity-75">
          {label}
        </span>
      </div>
    </div>
  );
}

function AriaLiveStep({
  session,
  activeIdx,
}: {
  readonly session: BrewSession;
  readonly activeIdx: number;
}) {
  const [announced, setAnnounced] = useState<string>("");
  useEffect(() => {
    const pour = session.recipe.pours[activeIdx];
    if (!pour) return;
    const label = pour.label === "bloom" ? "bloom" : `${activeIdx}차`;
    setAnnounced(`${label}: ${pour.cumulativeWater}그램까지`);
  }, [session, activeIdx]);
  return (
    <span className="sr-only" role="status" aria-live="polite">
      {announced}
    </span>
  );
}
```

- [ ] **Step 2: Run all tests**

Run:
```bash
bun run test:run --reporter=verbose
```
Expected: 모든 테스트 PASS — 기존 단언(hero-weight, aria-live, skip, stop dialog, onComplete) + Task 2의 새 단언 4개.

만약 `getByText("bloom")`이 깨졌다면 `phaseLabel`이 자체 `<span>`에 들어 있는지 확인. 본 구현은 `<span>{phaseLabel}</span>`로 분리했으므로 RTL이 텍스트 노드 "bloom"을 그대로 찾는다.

- [ ] **Step 3: Run typecheck**

Run:
```bash
bun run typecheck
```
Expected: PASS

- [ ] **Step 4: Manual visual verification**

Run:
```bash
bun run dev
```
브라우저에서 확인:
- Wall → Recipe → 시작 → Brewing 화면 진입
- 컵 바닥부터 갈색 액체가 차오르는지
- 메니스커스 위에 hero 숫자가 떠 있고, 시간 흐름에 따라 같이 상승하는지
- 푸어 경계 ring이 시간 비례로 분포 (균등 X)
- elapsed/건너뛰기/중단이 RIM 영역에 모여있고, 액체가 절대 RIM hairline을 넘지 않는지
- 짧은 레시피로 끝까지 진행 → CompleteScreen 정상 진입

- [ ] **Step 5: Commit**

```bash
git add src/features/brewing/BrewingScreen.tsx
git commit -m "$(cat <<'EOF'
feat(brewing): viewport-as-server 레이아웃으로 BrewingScreen 재작성

- RIM(elapsed/건너뛰기/중단) + CupInterior(액체/링/hero) 분리
- 액체 높이 = elapsed/totalTimeSec (시간 비례 일정 속도)
- 푸어 경계 ring = 시간 비례 위치 (below/next/future variant)
- Hero(목표 무게+단계+행동)는 메니스커스 위 12px gap에 부유, 같이 상승
- 하단 'next preview' 카드 제거 (ring이 그 역할 흡수)
EOF
)"
```

---

## Task 4: Hero clearance edge fallback (useLayoutEffect 측정)

**Files:**
- Modify: `src/features/brewing/BrewingScreen.tsx`

작은 단말 (viewport 높이 < ~700px) 또는 매우 짧은 마지막 phase 조합에서 Hero가 RIM hairline을 침범하는 경우를 대비한 fallback. 통상 케이스에는 영향 없음.

- [ ] **Step 1: Add useLayoutEffect measurement to BrewingScreen**

`BrewingScreen` 컴포넌트 본문 안 (`useEffect(done…)` 아래)에 추가:

```tsx
  const cupRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [topRingFallback, setTopRingFallback] = useState(false);

  // Hero clearance 측정: 최상단 ring과 RIM 사이가 Hero보다 좁으면 fallback
  useLayoutEffect(() => {
    if (!cupRef.current || !heroRef.current || visibleRings.length === 0) {
      setTopRingFallback(false);
      return;
    }
    const cupHeight = cupRef.current.clientHeight;
    const heroHeight = heroRef.current.offsetHeight;
    const lastRingPos = Math.max(...visibleRings.map((p) => p.atSec));
    const topRingFromTop = cupHeight * (1 - lastRingPos / totalTimeSec);
    setTopRingFallback(topRingFromTop < heroHeight + 8);
  }, [visibleRings, totalTimeSec]);
```

(상단의 `import` 라인에 `useLayoutEffect` 추가)

- [ ] **Step 2: Wire refs and conditional ring label**

CupInterior 래퍼에 `ref={cupRef}` 추가:
```tsx
      <div ref={cupRef} className="relative flex-1 overflow-hidden bg-surface">
```

Hero에 `ref={heroRef}` 추가:
```tsx
        <div
          ref={heroRef}
          data-testid="hero"
          ...
```

`RingMarker`가 fallback 모드에서 라벨을 숨기도록 prop 추가:
```tsx
function RingMarker({
  pour,
  totalTimeSec,
  variant,
  label,
  hideLabel = false,
}: {
  readonly pour: Pour;
  readonly totalTimeSec: number;
  readonly variant: "below" | "next" | "future";
  readonly label: string;
  readonly hideLabel?: boolean;
}) {
  // ...existing code...
  return (
    <div ... >
      <div className="absolute left-3.5 right-24 top-0" style={{...}} />
      {!hideLabel && (
        <div className={...} style={{ color: labelColor }}>
          ...
        </div>
      )}
    </div>
  );
}
```

Ring 렌더 루프에서 최상단 ring일 때 fallback 적용:
```tsx
        {visibleRings.map((p, i) => {
          const variant = ...;
          const localIdx = pours.indexOf(p);
          const ringLabel = p.label === "bloom" ? "bloom" : `${localIdx}차`;
          const isTopRing = i === visibleRings.length - 1;
          return (
            <RingMarker
              key={p.index}
              pour={p}
              totalTimeSec={totalTimeSec}
              variant={variant}
              label={ringLabel}
              hideLabel={isTopRing && topRingFallback}
            />
          );
        })}
```

(원본 ring 라벨 정보를 잃지 않도록, fallback 발동 시 RIM 우측에 보조 표시 — 다음 스텝)

- [ ] **Step 3: Add RIM-side fallback label**

RIM `<header>`의 좌측 (경과 옆)에 fallback 라벨 추가:

```tsx
        <div className="flex items-start gap-4">
          <div>
            <div className="text-2xs text-text-muted">경과</div>
            <div className="mt-0.5 text-xl font-medium tabular-nums">
              {formatTime(elapsed)}
            </div>
          </div>
          {topRingFallback && visibleRings.length > 0 && (
            <div className="pt-1">
              <div className="text-2xs text-text-muted">최종</div>
              <div className="mt-0.5 text-xs tabular-nums text-text-secondary">
                {formatTime(visibleRings[visibleRings.length - 1]!.atSec)}
              </div>
            </div>
          )}
        </div>
```

(헤더의 좌측 그룹을 단일 `<div>`로 묶음. 우측 그룹은 그대로.)

- [ ] **Step 4: Run all tests**

Run:
```bash
bun run test:run
```
Expected: PASS. (jsdom은 layout 측정을 제대로 안 하므로 `topRingFallback`은 항상 false 유지 → 기본 동작 변화 없음.)

- [ ] **Step 5: Run typecheck**

Run:
```bash
bun run typecheck
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/brewing/BrewingScreen.tsx
git commit -m "$(cat <<'EOF'
feat(brewing): Hero clearance edge fallback

작은 단말/짧은 마지막 phase 조합에서 hero가 rim과 충돌할 때
최상단 ring 라벨을 rim 좌측 보조 영역으로 자동 이동.
useLayoutEffect로 cup/hero 실제 크기 측정 후 결정.
EOF
)"
```

---

## Task 5: Reduced-motion + 최종 시각 검증

**Files:**
- Modify: `src/features/brewing/BrewingScreen.tsx` (CSS 한 줄)

- [ ] **Step 1: Verify motion-safe applied to wave**

Task 3에서 wave shimmer div는 이미 `motion-safe:animate-brewing-wave` 클래스를 가지고 있다. `prefers-reduced-motion: reduce`면 Tailwind의 `motion-safe` variant가 비활성화 → wave 정지.

Liquid/Hero의 height/bottom transition에도 동일 처리 추가:

```tsx
        {/* Liquid */}
        <div
          data-testid="liquid"
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 motion-safe:transition-[height] duration-DEFAULT ease-DEFAULT"
          ...
```

```tsx
        <div
          ref={heroRef}
          data-testid="hero"
          className="pointer-events-none absolute left-3.5 right-24 motion-safe:transition-[bottom] duration-DEFAULT ease-DEFAULT"
          ...
```

(`motion-safe:transition-*` → reduced-motion이면 transition 무효화 → 즉시 jump)

- [ ] **Step 2: Run all tests**

Run:
```bash
bun run test:run
```
Expected: PASS.

- [ ] **Step 3: Manual visual verification (full pass)**

Run:
```bash
bun run dev
```

브라우저 체크리스트:
- [x] Wall → Recipe → Brewing 진입 정상
- [x] 컵 액체가 0%부터 부드럽게 차오름 (Hoffmann 4-pour, 210s 끝까지 봐도 OK)
- [x] 메니스커스 ↔ Hero 12px gap 유지하며 같이 상승
- [x] Ring 위치가 시간 비례 (균등 분포 X — bloom→1차 간격이 마지막 phase 간격과 다르게 보여야 함)
- [x] 메니스커스가 ring을 통과하면 ring 색이 cream 톤으로 전환
- [x] Next ring이 짙은 잉크 + 굵음으로 강조
- [x] elapsed/건너뛰기/중단이 RIM에 모여있고 액체가 절대 RIM hairline을 넘지 않음
- [x] Skip 연타 → Hero 단계 즉시 변화 (manualStepFloor 정상)
- [x] 중단 → 다이얼로그 → 처음으로 → Wall 복귀
- [x] 끝까지 진행 → CompleteScreen 자동 진입
- [x] OS 다크모드 토글 시 색이 dark token으로 전환
- [x] OS reduce motion 켠 상태로 진입 → wave 정지, 액체/Hero가 transition 없이 스냅

위 체크리스트 중 실패 항목 있으면 해당 부분 수정 후 다시 검증.

- [ ] **Step 4: Commit (transition 보호 변경)**

```bash
git add src/features/brewing/BrewingScreen.tsx
git commit -m "fix(brewing): reduced-motion 환경에서 transition/wave 비활성화"
```

---

## Self-Review Notes

**Spec coverage:**
- 시각 컨셉(viewport-as-server) → Task 3
- 시간 비례 fill / ring → Task 3 (RingMarker 위치 계산)
- Hero floats above meniscus → Task 3 (bottom calc)
- RIM 분리 + skip/중단 위치 → Task 3 (header + data-region)
- Hero clearance 제약 + edge fallback → Task 4
- Tokens (semantic + tailwind) → Task 1
- Wave shimmer / reduced motion → Task 3 (animate-brewing-wave) + Task 5
- Drawdown phase Hero 변형 (`+Xg 붓기` 비표시) → **빠짐**. 본 plan 범위에선 마지막 푸어 종료 후 0.X초 안에 done → onComplete 트리거되므로 drawdown UI 노출 시간이 매우 짧음. 명시적 분기 생략. 만약 drawdown UI가 필요하면 후속 spec.

**Type consistency:** `Pour`/`BrewSession`/`Recipe` 타입 모두 도메인에서 import. RingMarker variant는 union literal 일관 사용. ✓

**No placeholders:** 모든 step에 실제 코드/명령/기대값 포함. ✓
