# Share Image (CompleteScreen) — Design Spec

**Date:** 2026-04-25
**Status:** Approved (brainstormed with user)
**Branch:** `feat/share-image`

## Goal

Replace the disabled 공유 button on `CompleteScreen` with a working flow that lets the user pick a photo (camera or gallery), composes a share-image with their recipe summary overlaid, and either invokes the native share sheet or downloads the PNG.

## Non-goals (v1)

- Variant picker UI (carousel of layouts/themes) — registry is in place; UI added later.
- `short` layout — second variant; designed-in but not shipped.
- `negative` color theme — prop exists; CSS branch not implemented in v1.
- Image editing (crop/filter) — handled by the device camera app.
- EXIF rotation correction — assume mobile cameras return upright JPEGs; revisit if broken in manual testing.
- Multiple export sizes (square, story 9:16) — `exportSize` is per-variant so adding later is a one-file change.

## Architecture

DOM-to-image rendering. Each variant is a normal React component (using existing tokens), rendered off-screen at fixed export dimensions, snapshotted to PNG via the `html-to-image` library. Output goes through an adapter that prefers `navigator.share({ files })` and falls back to a download anchor.

The feature lives in a new folder, `src/features/share-image/`, separate from the existing `src/features/share/` (which is URL-state persistence — misleadingly named, but renaming is out of scope).

### Module structure

```
src/features/share-image/
├── ShareImageDialog.tsx          # Orchestrator: full-screen modal, state machine
├── usePhoto.ts                   # Photo state hook (object URL lifecycle, revoke on unmount)
├── usePhoto.test.ts
├── PhotoPicker.tsx               # File input wrapper: 사진 찍기 / 갤러리에서 선택
├── PhotoPicker.test.tsx
├── ShareComposer.tsx             # Off-screen container hosting variant at fixed export size
├── variants/
│   ├── types.ts                  # ShareLayout, ShareColor, ShareVariantProps, ShareVariant
│   ├── registry.ts               # SHARE_LAYOUTS, DEFAULT_LAYOUT, DEFAULT_COLOR
│   ├── full.tsx                  # MVP variant — Full layout, supports both colors via prop
│   └── full.test.tsx
├── render/
│   ├── domToBlob.ts              # Wraps html-to-image; returns Promise<Blob>
│   └── domToBlob.test.ts         # Stubbed (jsdom limitation, see Testing)
└── output/
    ├── shareOrDownload.ts        # navigator.share if supported, else <a download>
    └── shareOrDownload.test.ts
```

### Subagent decomposability

Each subfolder has one job and a small, well-defined interface. A subagent can build any one of `variants/full.tsx`, `render/`, `output/`, `PhotoPicker.tsx`, or `usePhoto.ts` in isolation — the contracts in `variants/types.ts` and the function signatures below are the only shared surface.

## Types & contracts

```ts
// variants/types.ts
import type { ComponentType } from "react";
import type { BrewSession } from "@/domain/session";

export type ShareLayout = "full" | "short";
export type ShareColor = "positive" | "negative";

export type ShareVariantProps = {
  readonly session: BrewSession;
  readonly photoUrl: string;
  readonly color: ShareColor;
};

export type ShareVariant = {
  readonly id: ShareLayout;
  readonly name: string;
  readonly Component: ComponentType<ShareVariantProps>;
  readonly exportSize: { readonly width: number; readonly height: number };
};

// variants/registry.ts
export const SHARE_LAYOUTS: Readonly<Record<ShareLayout, ShareVariant>> = {
  full: fullLayout,
  // short: shortLayout,   // added later
};
export const DEFAULT_LAYOUT: ShareLayout = "full";
export const DEFAULT_COLOR: ShareColor = "positive";

// render/domToBlob.ts
export const domToBlob = (
  node: HTMLElement,
  opts: { width: number; height: number; pixelRatio?: number },
): Promise<Blob>;

// output/shareOrDownload.ts
export type ShareOutcome = "shared" | "downloaded" | "cancelled" | "failed";
export const canNativeShareImage = (): boolean;
export const shareOrDownload = (blob: Blob, filename: string): Promise<ShareOutcome>;

// usePhoto.ts
export type PhotoState =
  | { kind: "empty" }
  | { kind: "loaded"; url: string; file: File };
export const usePhoto = (): {
  state: PhotoState;
  setFile: (file: File) => void;
  clear: () => void;
};
```

**Notes on the type axes:**
- `layout` is structural (different DOM tree, different info density) → one component file per layout.
- `color` is presentation only (CSS class swap on the same DOM tree) → a prop, not a separate component file.
- Avoids 4 nearly-identical component files for the 2×2 layout/color matrix.

## Data flow & state machine

`ShareImageDialog` is a single state machine.

```
                        (CompleteScreen 공유 button tap)
                                     │
                                     ▼
          ┌────────────────────────────────────────────────┐
          │  state: "empty"                                │
          │  UI: PhotoPicker buttons + 취소                 │
          └─────────────────┬──────────────────────────────┘
                            │ user picks file
                            ▼
          ┌────────────────────────────────────────────────┐
          │  state: "preview"                              │
          │  photoUrl = objectURL(file)                    │
          │  UI: ShareComposer + 공유하기/이미지 저장        │
          │      + 사진 변경 + 취소                          │
          └─────────────────┬──────────────────────────────┘
                            │ user taps share/save
                            ▼
          ┌────────────────────────────────────────────────┐
          │  state: "exporting"                            │
          │  UI: spinner; share button disabled            │
          │  → domToBlob(node) → shareOrDownload(blob)     │
          └─────────────────┬──────────────────────────────┘
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
         shared/        cancelled        failed
         downloaded         │              │
              │             │              ▼
              │             │       state: "error"
              │             │       UI: error + 다시 시도
              │             │              │
              ▼             ▼              ▼
        close dialog,   back to        back to "preview"
        revoke URL      "preview"
```

```ts
type DialogState =
  | { kind: "empty" }
  | { kind: "preview"; photoUrl: string; file: File }
  | { kind: "exporting"; photoUrl: string; file: File }
  | { kind: "error"; photoUrl: string; file: File; message: string };
```

**Photo lifecycle:** `usePhoto.setFile()` creates the object URL; `URL.revokeObjectURL` is called on (a) photo replacement and (b) dialog close / unmount. `ShareImageDialog` never touches `URL.*` directly.

**ShareComposer is one component (no separate preview/export):** it renders the variant at the export size (1080×1350) inside a ref'd container. The dialog wraps that container in a `transform: scale(...)` viewport for the on-screen preview. Snapshotting the ref'd inner container produces the exported image. One DOM source, no preview/export drift.

## MVP variant — `full` × `positive`

**Canvas:** 1080 × 1350 (Instagram portrait 4:5).

**Layout sketch:**

```
┌──────────────────────────────────────────────┐ 1080w
│        [USER PHOTO — full frame, cover]      │
│                                              │
│   ┌────────────────────────────────────┐     │  ← overlay card,
│   │  KASUYA 4:6        2026.04.25      │     │     anchored bottom,
│   │  ─────────────────────────────────  │     │     light bg @ ~85% alpha
│   │  03:42                             │     │     + backdrop-blur
│   │  TOTAL TIME                        │     │
│   │  ─────────────────────────────────  │     │
│   │  드리퍼     V60                    │     │
│   │  원두·물    20 g · 320 g           │     │
│   │  온도·분쇄  93° · medium-fine      │     │
│   │  ─────────────────────────────────  │     │
│   │  ☺  만족스러워요                   │     │
│   └────────────────────────────────────┘     │
│            pourover.work                     │  ← tiny footer wordmark
└──────────────────────────────────────────────┘ 1350h
```

**Content cells (all from existing `BrewSession`):**
- Method name (`brewMethods[recipe.method].name`)
- Brewed-at date (`formatBrewedAt(session.startedAt)`)
- Total time (`formatTime(sessionDurationSec(session))`)
- Dripper (`drippers[recipe.dripper].name`)
- 원두·물 (`${recipe.coffee} · ${recipe.totalWater} g`)
- 온도·분쇄 (`${recipe.temperature}° · ${formatGrindHint(recipe.grindHint)}`)
- Feeling: `FeelingGlyph` + label — **only rendered when `session.feeling != null`**. If null, the row is omitted entirely.
- Wordmark: `pourover.work`

**Color modes:**
- `positive` (MVP): light card, dark text. Backdrop ~85% alpha + blur.
- `negative` (later): dark card, light text. Same DOM, different CSS branch.

**Token discipline:** every color/spacing/typography value comes from the existing `tokens.css` system. No hardcoded hex/px. Per CLAUDE.md "Design token 단일 출처" rule.

**No premature extraction:** the markup is similar to `CompleteScreen`'s `SummaryCell`, but the export sizes/spacing differ and prematurely-shared components grow conditional props. Re-implement the small markup (~30 lines) inline in `full.tsx`. Extract only when the second variant duplicates ≥80%.

## Output channels

Single button, label adapts to platform capability:

```ts
canNativeShareImage()
  ? "공유하기"      // navigator.share({ files: [pngFile] })
  : "이미지 저장"   // <a href={blobUrl} download={filename} />
```

`canNativeShareImage()` = `typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([], "x.png", { type: "image/png" })] })`.

**Filename:** `bloom-coffee-{ISO date}.png`, e.g. `bloom-coffee-2026-04-25.png`.

## CompleteScreen integration

Two changes in `src/features/complete/CompleteScreen.tsx`:

1. Re-enable the disabled button at lines 111–118: remove `disabled` and `opacity-disabled`, add `onClick={() => setShareOpen(true)}`.
2. Render `<ShareImageDialog open={shareOpen} session={session} onClose={() => setShareOpen(false)} />` at the end of the component.

The button stays enabled even when `session.feeling == null` — the variant handles the missing feeling row by omission.

## Dependencies

Add `html-to-image` (~30KB, actively maintained, better web-font handling than `dom-to-image-more`).

```bash
bun add html-to-image
```

Imported only inside `render/domToBlob.ts` — replaceable in one file.

## Testing strategy

Per CLAUDE.md: domain layer is the test priority. UI tests stay light.

**TDD'd (pure functions / hooks):**
- `output/shareOrDownload.test.ts` — mock `navigator.share` / `navigator.canShare`; verify the four `ShareOutcome`s (`shared`, `downloaded`, `cancelled`, `failed`) and download fallback path.
- `usePhoto.test.ts` — mock `URL.createObjectURL` / `URL.revokeObjectURL`; verify `setFile` creates URL, `clear` revokes, unmount revokes, replacement revokes the old URL.

**Light component tests:**
- `variants/full.test.tsx` — render with a fixture `BrewSession`; assert method name, total time, all 4 recipe cells, and feeling label appear in the DOM. Assert feeling row is absent when `session.feeling == null`.
- `PhotoPicker.test.tsx` — fire a `change` event on the file input with a mock `File`; assert callback receives the file.

**Not tested (manual verification):**
- `render/domToBlob.ts` — jsdom has no real canvas; mocking `html-to-image` would test the mock. Manual test: pick a photo, share, confirm a real PNG comes out.
- `ShareImageDialog` end-to-end flow — manual test on real mobile device + desktop browser.

## Risks & followups

- **EXIF rotation:** unproven on iOS Safari. If portrait photos appear sideways, we'll need a rotation-aware draw step. Out of scope for v1, captured as a manual-test item.
- **Web Share API availability on iOS Safari for files:** supported since iOS 15+. Older iOS will fall back to download — acceptable degradation.
- **html-to-image with the user's blob URL photo:** local blob URLs are same-origin so no CORS issue. Verify in manual test.
- **Future variant carousel:** the registry is keyed by `ShareLayout`; adding the picker UI is a `ShareImageDialog` change only — variants and renderer untouched.

## v2 extension points

Designed-in but not implemented in v1:
- New layout: drop a file in `variants/`, add registry entry.
- `negative` color: add CSS branch in `full.tsx` (prop already accepted).
- Variant picker: two-axis selector (layout × color) in `ShareImageDialog`.
- Square / story export sizes: per-variant `exportSize` already on `ShareVariant`.
- New output channel (clipboard, etc.): drop a file in `output/`.
