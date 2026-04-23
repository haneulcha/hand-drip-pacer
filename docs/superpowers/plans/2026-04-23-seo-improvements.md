# SEO Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add static SEO meta tags, crawler assets, and dynamic title/meta updates driven by app state for share-link previews.

**Architecture:** Static meta in `index.html` (description, OG, Twitter, canonical, JSON-LD). Dynamic updates via pure `buildMeta(state, recipe)` + imperative `applyMeta(meta)` wired into the existing URL-sync `useEffect` in `AppRoot`. No new dependencies; no prerendering.

**Tech Stack:** Vite 6 + React 19 + TypeScript (strict) + Vitest + jsdom.

**Spec:** `docs/superpowers/specs/2026-04-23-seo-improvements-design.md`

**Placeholders (intentional, documented in spec TODO):**
- Domain: `https://example.com`
- OG image path: `/og-image.png` (file not created in this plan)

---

## File Structure

- `index.html` — add meta tags + JSON-LD (modify)
- `public/robots.txt` — new
- `public/sitemap.xml` — new
- `src/features/seo/documentMeta.ts` — new, pure `buildMeta` + imperative `applyMeta`
- `src/features/seo/documentMeta.test.ts` — new, tests for `buildMeta` only
- `src/features/app/AppRoot.tsx` — wire `applyMeta` into existing effect (modify)

---

## Task 1: Static meta tags in `index.html`

**Files:**
- Modify: `/Users/haneul/Projects/bloom-coffee/index.html`

- [ ] **Step 1: Replace `<head>` block**

Open `index.html`. Keep the existing `charset`, `viewport`, `favicon`, and font preconnect/stylesheet lines. Replace the `<title>` line and append additional meta tags so `<head>` contains:

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link
  rel="icon"
  type="image/svg+xml"
  href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext y='26' font-size='26'%3E%E2%98%95%3C/text%3E%3C/svg%3E"
/>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
/>
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
/>

<title>핸드드립 계산기 | V60 · Kalita · Kasuya 4:6 · Hoffmann</title>
<meta
  name="description"
  content="V60, Kalita, Kasuya 4:6 등 9가지 핸드드립 레시피를 원두량·로스팅·취향에 맞춰 자동 계산합니다."
/>
<link rel="canonical" href="https://example.com/" />
<meta name="theme-color" content="#b8843f" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="Bloom Coffee" />
<meta property="og:title" content="핸드드립 계산기 | V60 · Kalita · Kasuya 4:6 · Hoffmann" />
<meta
  property="og:description"
  content="V60, Kalita, Kasuya 4:6 등 9가지 핸드드립 레시피를 원두량·로스팅·취향에 맞춰 자동 계산합니다."
/>
<meta property="og:url" content="https://example.com/" />
<meta property="og:image" content="https://example.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="핸드드립 계산기" />
<meta property="og:locale" content="ko_KR" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="핸드드립 계산기 | V60 · Kalita · Kasuya 4:6 · Hoffmann" />
<meta
  name="twitter:description"
  content="V60, Kalita, Kasuya 4:6 등 9가지 핸드드립 레시피를 원두량·로스팅·취향에 맞춰 자동 계산합니다."
/>
<meta name="twitter:image" content="https://example.com/og-image.png" />

<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Bloom Coffee",
    "description": "V60, Kalita, Kasuya 4:6 등 9가지 핸드드립 레시피를 원두량·로스팅·취향에 맞춰 자동 계산합니다.",
    "url": "https://example.com/",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "inLanguage": "ko-KR",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" }
  }
</script>
```

- [ ] **Step 2: Verify build succeeds**

Run: `bun run build`
Expected: PASS (no TS errors, `dist/index.html` generated).

- [ ] **Step 3: Verify meta present in dist**

Run: `grep -c "og:title\|application/ld+json\|canonical" dist/index.html`
Expected: `3` or more.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(seo): add static meta tags, OG/Twitter cards, and JSON-LD"
```

---

## Task 2: Crawler assets (`robots.txt`, `sitemap.xml`)

**Files:**
- Create: `/Users/haneul/Projects/bloom-coffee/public/robots.txt`
- Create: `/Users/haneul/Projects/bloom-coffee/public/sitemap.xml`

- [ ] **Step 1: Write `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

- [ ] **Step 2: Write `public/sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 3: Verify dist contains them**

Run: `bun run build && ls dist/robots.txt dist/sitemap.xml`
Expected: both files listed.

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt public/sitemap.xml
git commit -m "feat(seo): add robots.txt and sitemap.xml (placeholder domain)"
```

---

## Task 3: `buildMeta` pure function (TDD)

**Files:**
- Create: `/Users/haneul/Projects/bloom-coffee/src/features/seo/documentMeta.ts`
- Create: `/Users/haneul/Projects/bloom-coffee/src/features/seo/documentMeta.test.ts`

Context the implementer needs:
- `AppState` is defined in `src/features/app/state.ts` with fields: `screen`, `coffee`, `dripper`, `method`, `roast`, `taste`.
- `Recipe` is defined in `src/domain/types.ts` with fields: `totalWater`, `ratio`, `pours` (readonly array of `Pour`), etc.
- `brewMethods[id].name` provides display names like `"Kasuya 4:6"`, `"Hoffmann V60"`. Import from `@/domain/methods`.
- `drippers[id].name` provides `"V60"`, `"Kalita Wave"`, `"Kalita 102"`. Import from `@/domain/drippers`.
- `encodeState(state)` → `URLSearchParams`, already in `src/features/share/urlCodec.ts`.
- `Grams`, `Ratio` are branded numbers — use `Math.round(Number(value))` or `value as number` (reading is fine, only construction needs branded constructors).

- [ ] **Step 1: Write failing tests**

Write `src/features/seo/documentMeta.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { brewMethods } from "@/domain/methods";
import type { Recipe } from "@/domain/types";
import { c, g, ratio, s } from "@/domain/units";
import { DEFAULT_STATE } from "@/features/app/state";
import type { AppState } from "@/features/app/state";
import {
  BASE_URL,
  DEFAULT_META,
  buildMeta,
} from "@/features/seo/documentMeta";

const recipeState: AppState = {
  ...DEFAULT_STATE,
  screen: "recipe",
  coffee: g(15),
  dripper: "v60",
  method: "kasuya_4_6",
  roast: "medium",
  taste: { sweetness: "balanced", strength: "medium" },
};

const makeRecipe = (): Recipe => ({
  method: "kasuya_4_6",
  dripper: "v60",
  coffee: g(15),
  totalWater: g(225),
  ratio: ratio(15),
  temperature: c(92),
  pours: [
    { index: 0, atSec: s(0), pourAmount: g(45), cumulativeWater: g(45), label: "bloom" },
    { index: 1, atSec: s(45), pourAmount: g(45), cumulativeWater: g(90) },
    { index: 2, atSec: s(90), pourAmount: g(135), cumulativeWater: g(225) },
  ],
  totalTimeSec: s(210),
  grindHint: "medium",
  notes: [],
});

describe("buildMeta", () => {
  it("returns DEFAULT_META for wall screen", () => {
    const wallState: AppState = { ...recipeState, screen: "wall" };
    expect(buildMeta(wallState, makeRecipe())).toEqual(DEFAULT_META);
  });

  it("builds title with dripper, method, coffee, and ratio for recipe screen", () => {
    const meta = buildMeta(recipeState, makeRecipe());
    expect(meta.title).toBe("V60 · Kasuya 4:6 (15g · 1:15) | 핸드드립 계산기");
  });

  it("builds description with roast, coffee, water, pour count, and taste", () => {
    const meta = buildMeta(recipeState, makeRecipe());
    expect(meta.description).toBe(
      "중배전 15g · 물 225g · 3차 푸어. 밸런스 / 미디엄.",
    );
  });

  it("keeps description within 160 characters", () => {
    const meta = buildMeta(recipeState, makeRecipe());
    expect(meta.description.length).toBeLessThanOrEqual(160);
  });

  it("builds canonical url from BASE_URL and encoded state", () => {
    const meta = buildMeta(recipeState, makeRecipe());
    expect(meta.canonical.startsWith(`${BASE_URL}/?`)).toBe(true);
    expect(meta.canonical).toContain("m=kasuya_4_6");
    expect(meta.canonical).toContain("d=v60");
    expect(meta.canonical).toContain("c=15");
  });

  it("generates a title for every registered brew method", () => {
    for (const id of Object.keys(brewMethods)) {
      const state: AppState = {
        ...recipeState,
        method: id as AppState["method"],
      };
      const meta = buildMeta(state, makeRecipe());
      expect(meta.title).toContain(brewMethods[id as AppState["method"]].name);
      expect(meta.title.endsWith("| 핸드드립 계산기")).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test:run src/features/seo/documentMeta.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `documentMeta.ts` (pure part)**

Write `src/features/seo/documentMeta.ts`:

```ts
import { drippers } from "@/domain/drippers";
import { brewMethods } from "@/domain/methods";
import type { Recipe, RoastLevel, SweetnessProfile, StrengthProfile } from "@/domain/types";
import type { AppState } from "@/features/app/state";
import { encodeState } from "@/features/share/urlCodec";

export const BASE_URL = "https://example.com";

const APP_NAME = "핸드드립 계산기";
const APP_SUBTITLE = "V60 · Kalita · Kasuya 4:6 · Hoffmann";
const DEFAULT_DESCRIPTION =
  "V60, Kalita, Kasuya 4:6 등 9가지 핸드드립 레시피를 원두량·로스팅·취향에 맞춰 자동 계산합니다.";

export type DocumentMeta = {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
};

export const DEFAULT_META: DocumentMeta = {
  title: `${APP_NAME} | ${APP_SUBTITLE}`,
  description: DEFAULT_DESCRIPTION,
  canonical: `${BASE_URL}/`,
};

const ROAST_LABEL: Record<RoastLevel, string> = {
  light: "약배전",
  medium: "중배전",
  dark: "강배전",
};

const SWEETNESS_LABEL: Record<SweetnessProfile, string> = {
  sweet: "단맛",
  balanced: "밸런스",
  bright: "산미",
};

const STRENGTH_LABEL: Record<StrengthProfile, string> = {
  light: "라이트",
  medium: "미디엄",
  strong: "스트롱",
};

const truncate = (s: string, max = 160): string =>
  s.length <= max ? s : `${s.slice(0, max - 1)}…`;

export function buildMeta(state: AppState, recipe: Recipe): DocumentMeta {
  if (state.screen === "wall") return DEFAULT_META;

  const dripperName = drippers[state.dripper].name;
  const methodName = brewMethods[state.method].name;
  const coffee = Math.round(recipe.coffee as number);
  const water = Math.round(recipe.totalWater as number);
  const ratioValue = Math.round(recipe.ratio as number);

  const title = `${dripperName} · ${methodName} (${coffee}g · 1:${ratioValue}) | ${APP_NAME}`;

  const description = truncate(
    `${ROAST_LABEL[state.roast]} ${coffee}g · 물 ${water}g · ${recipe.pours.length}차 푸어. ${SWEETNESS_LABEL[state.taste.sweetness]} / ${STRENGTH_LABEL[state.taste.strength]}.`,
  );

  const canonical = `${BASE_URL}/?${encodeState(state).toString()}`;

  return { title, description, canonical };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test:run src/features/seo/documentMeta.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/seo/documentMeta.ts src/features/seo/documentMeta.test.ts
git commit -m "feat(seo): add pure buildMeta for dynamic title/description/canonical"
```

---

## Task 4: `applyMeta` imperative DOM updater

**Files:**
- Modify: `/Users/haneul/Projects/bloom-coffee/src/features/seo/documentMeta.ts`

No test for this function (DOM side-effects; validated via typecheck + manual verification in Task 6).

- [ ] **Step 1: Append `applyMeta` to `documentMeta.ts`**

Add at the end of the file:

```ts
type Selector =
  | { kind: "meta-name"; value: string }
  | { kind: "meta-property"; value: string }
  | { kind: "link-rel"; value: string };

function upsert(sel: Selector, attr: "content" | "href", value: string): void {
  if (typeof document === "undefined") return;
  const selectorStr =
    sel.kind === "meta-name"
      ? `meta[name="${sel.value}"]`
      : sel.kind === "meta-property"
        ? `meta[property="${sel.value}"]`
        : `link[rel="${sel.value}"]`;
  let el = document.head.querySelector<HTMLElement>(selectorStr);
  if (!el) {
    if (sel.kind === "link-rel") {
      const link = document.createElement("link");
      link.setAttribute("rel", sel.value);
      el = link;
    } else {
      const meta = document.createElement("meta");
      meta.setAttribute(sel.kind === "meta-name" ? "name" : "property", sel.value);
      el = meta;
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function applyMeta(meta: DocumentMeta): void {
  if (typeof document === "undefined") return;
  document.title = meta.title;
  upsert({ kind: "meta-name", value: "description" }, "content", meta.description);
  upsert({ kind: "link-rel", value: "canonical" }, "href", meta.canonical);
  upsert({ kind: "meta-property", value: "og:title" }, "content", meta.title);
  upsert({ kind: "meta-property", value: "og:description" }, "content", meta.description);
  upsert({ kind: "meta-property", value: "og:url" }, "content", meta.canonical);
  upsert({ kind: "meta-name", value: "twitter:title" }, "content", meta.title);
  upsert({ kind: "meta-name", value: "twitter:description" }, "content", meta.description);
}
```

- [ ] **Step 2: Verify typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Verify existing tests still pass**

Run: `bun run test:run`
Expected: all tests PASS (no regressions).

- [ ] **Step 4: Commit**

```bash
git add src/features/seo/documentMeta.ts
git commit -m "feat(seo): add applyMeta imperative DOM updater"
```

---

## Task 5: Wire `applyMeta` into `AppRoot`

**Files:**
- Modify: `/Users/haneul/Projects/bloom-coffee/src/features/app/AppRoot.tsx`

- [ ] **Step 1: Add import**

At the top of `AppRoot.tsx`, add the import alongside the existing `urlCodec` import:

```ts
import { applyMeta, buildMeta } from "@/features/seo/documentMeta";
```

- [ ] **Step 2: Extend the URL-sync effect to also apply meta**

Locate the existing effect starting at line 35:

```ts
useEffect(() => {
  const params = encodeState(state);
  if (state.screen === "wall") {
    window.history.replaceState(null, "", window.location.pathname);
  } else {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params}`,
    );
  }
  saveParams(params);
}, [state]);
```

Replace with (adds `applyMeta` call and `recipe` to deps):

```ts
useEffect(() => {
  const params = encodeState(state);
  if (state.screen === "wall") {
    window.history.replaceState(null, "", window.location.pathname);
  } else {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params}`,
    );
  }
  saveParams(params);
  applyMeta(buildMeta(state, recipe));
}, [state, recipe]);
```

Note: `recipe` is defined further down in the component via `useMemo`. React will accept the forward reference at runtime because `useEffect` runs after render. If TypeScript/ESLint complains about use-before-declare, move the `recipe = useMemo(...)` block above the `useEffect`.

- [ ] **Step 3: If the effect can't see `recipe` in declaration order, reorder**

Move the `const recipe = useMemo(...)` block (currently around line 59) to sit directly after `const [session, setSession] = useState<BrewSession | null>(null);` and before the `useEffect` that syncs state.

- [ ] **Step 4: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 5: Test**

Run: `bun run test:run`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/app/AppRoot.tsx
git commit -m "feat(seo): apply dynamic meta on state change in AppRoot"
```

---

## Task 6: Manual verification

No code changes. Verify the full feature works end-to-end.

- [ ] **Step 1: Start dev server**

Run: `bun run dev`
Expected: server starts on `http://localhost:5173` (or similar).

- [ ] **Step 2: Verify wall → recipe title transition**

Open the app. On the wall screen, `document.title` should be `핸드드립 계산기 | V60 · Kalita · Kasuya 4:6 · Hoffmann` (open DevTools → Elements → `<title>` or check tab label).

Pick a dripper → you should land on recipe screen and title should change to something like `V60 · Kasuya 4:6 (20g · 1:15) | 핸드드립 계산기`.

- [ ] **Step 3: Verify meta updates in DOM**

In DevTools Elements panel, inspect `<meta name="description">`, `<link rel="canonical">`, `<meta property="og:title">`, `<meta property="og:url">`. Values should reflect the current selected method/dripper/coffee amount.

- [ ] **Step 4: Verify wall restores default**

Click back to wall. Title should return to `핸드드립 계산기 | V60 · Kalita · Kasuya 4:6 · Hoffmann`; `og:url` should return to `https://example.com/`.

- [ ] **Step 5: Build + inspect dist**

Run: `bun run build`
Expected: PASS.

Run: `ls dist/robots.txt dist/sitemap.xml dist/index.html`
Expected: all three present.

Run: `grep -o "application/ld+json\|og:title\|twitter:card\|canonical" dist/index.html | sort -u`
Expected: four lines, one for each.

- [ ] **Step 6: Final commit (if any touch-ups were needed during verification)**

If no changes: skip. Otherwise:

```bash
git add -A
git commit -m "chore(seo): verification fixes"
```

---

## Done Criteria

- [ ] All tasks above checked off.
- [ ] `bun run build` passes.
- [ ] `bun run test:run` passes (pre-existing + 6 new `buildMeta` tests).
- [ ] `bun run typecheck` passes.
- [ ] `dist/` contains `robots.txt`, `sitemap.xml`, and `index.html` with all meta tags + JSON-LD.
- [ ] Dev server shows dynamic `document.title` on method/dripper changes; wall screen restores default.
- [ ] TODO items (domain placeholder, OG image) left for a follow-up — documented in spec.
