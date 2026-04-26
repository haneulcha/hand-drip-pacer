# Share Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the disabled 공유 button on `CompleteScreen` with a working flow that lets the user pick a photo (camera or gallery), composes a share-image with their recipe summary overlaid, and either invokes the native share sheet or downloads the PNG.

**Architecture:** New feature folder `src/features/share-image/`. Each variant is a normal React component using existing tokens; rendered off-screen at fixed export dimensions (1080×1350) and snapshotted to PNG via `html-to-image`. A `shareOrDownload` adapter prefers `navigator.share({ files })` and falls back to a download anchor. State machine lives in `ShareImageDialog`. Each subfolder has one job and a small interface so subagents can build them in isolation.

**Tech Stack:** Bun, Vite 6, React 19, TypeScript (strict), Tailwind 3 + CSS variables (tokens), Vitest 2 + jsdom + @testing-library/react. New dep: `html-to-image`.

**Spec:** `docs/superpowers/specs/2026-04-25-share-image-design.md`

---

## File map

**Create:**
- `src/features/share-image/variants/types.ts`
- `src/features/share-image/variants/registry.ts`
- `src/features/share-image/variants/full.tsx`
- `src/features/share-image/variants/full.test.tsx`
- `src/features/share-image/output/shareOrDownload.ts`
- `src/features/share-image/output/shareOrDownload.test.ts`
- `src/features/share-image/usePhoto.ts`
- `src/features/share-image/usePhoto.test.ts`
- `src/features/share-image/render/domToBlob.ts`
- `src/features/share-image/PhotoPicker.tsx`
- `src/features/share-image/PhotoPicker.test.tsx`
- `src/features/share-image/ShareComposer.tsx`
- `src/features/share-image/ShareImageDialog.tsx`
- `src/features/share-image/ShareImageDialog.test.tsx`

**Modify:**
- `package.json` — add `html-to-image` dep
- `src/features/complete/CompleteScreen.tsx` — wire 공유 button to dialog
- `src/features/complete/CompleteScreen.test.tsx` — update disabled-button test

---

## Task 1: Add `html-to-image` dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dependency**

Run: `bun add html-to-image`

Expected: package added under `dependencies`, lockfile updated.

- [ ] **Step 2: Verify type checking still passes**

Run: `bun run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "feat(share-image): add html-to-image dependency"
```

---

## Task 2: Variant types

The shared contract every other module imports. No logic, just types.

**Files:**
- Create: `src/features/share-image/variants/types.ts`

- [ ] **Step 1: Write the file**

```ts
// src/features/share-image/variants/types.ts
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
```

- [ ] **Step 2: Verify type checking passes**

Run: `bun run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/share-image/variants/types.ts
git commit -m "feat(share-image): add variant type contract"
```

---

## Task 3: `shareOrDownload` adapter (TDD)

Pure function over `navigator.share` / `navigator.canShare`, with download anchor fallback.

**Files:**
- Create: `src/features/share-image/output/shareOrDownload.ts`
- Create: `src/features/share-image/output/shareOrDownload.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/features/share-image/output/shareOrDownload.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canNativeShareImage,
  shareOrDownload,
} from "./shareOrDownload";

const makeBlob = (): Blob =>
  new Blob([new Uint8Array([0x89, 0x50])], { type: "image/png" });

describe("canNativeShareImage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when navigator.canShare is missing", () => {
    vi.stubGlobal("navigator", {});
    expect(canNativeShareImage()).toBe(false);
  });

  it("returns true when navigator.canShare returns true for files", () => {
    vi.stubGlobal("navigator", {
      canShare: vi.fn().mockReturnValue(true),
    });
    expect(canNativeShareImage()).toBe(true);
  });

  it("returns false when navigator.canShare returns false", () => {
    vi.stubGlobal("navigator", {
      canShare: vi.fn().mockReturnValue(false),
    });
    expect(canNativeShareImage()).toBe(false);
  });
});

describe("shareOrDownload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns 'shared' when navigator.share resolves", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      canShare: vi.fn().mockReturnValue(true),
      share,
    });
    const result = await shareOrDownload(makeBlob(), "x.png");
    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledTimes(1);
    const arg = share.mock.calls[0]![0] as ShareData;
    expect(arg.files?.[0]?.name).toBe("x.png");
  });

  it("returns 'cancelled' when navigator.share rejects with AbortError", async () => {
    const err = new DOMException("user cancelled", "AbortError");
    vi.stubGlobal("navigator", {
      canShare: vi.fn().mockReturnValue(true),
      share: vi.fn().mockRejectedValue(err),
    });
    const result = await shareOrDownload(makeBlob(), "x.png");
    expect(result).toBe("cancelled");
  });

  it("returns 'failed' when navigator.share rejects with other error", async () => {
    vi.stubGlobal("navigator", {
      canShare: vi.fn().mockReturnValue(true),
      share: vi.fn().mockRejectedValue(new Error("boom")),
    });
    const result = await shareOrDownload(makeBlob(), "x.png");
    expect(result).toBe("failed");
  });

  it("falls back to download when share is unsupported", async () => {
    vi.stubGlobal("navigator", {});
    const click = vi.fn();
    const anchor = {
      href: "",
      download: "",
      click,
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const result = await shareOrDownload(makeBlob(), "x.png");

    expect(result).toBe("downloaded");
    expect(anchor.download).toBe("x.png");
    expect(anchor.href).toBe("blob:fake");
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith("blob:fake");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test:run src/features/share-image/output/shareOrDownload.test.ts`
Expected: FAIL — `Cannot find module './shareOrDownload'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/share-image/output/shareOrDownload.ts
export type ShareOutcome = "shared" | "downloaded" | "cancelled" | "failed";

export const canNativeShareImage = (): boolean => {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.canShare !== "function") return false;
  const probe = new File([], "probe.png", { type: "image/png" });
  try {
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
};

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const shareOrDownload = async (
  blob: Blob,
  filename: string,
): Promise<ShareOutcome> => {
  if (!canNativeShareImage()) {
    downloadBlob(blob, filename);
    return "downloaded";
  }
  const file = new File([blob], filename, { type: blob.type });
  try {
    await navigator.share({ files: [file] });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return "cancelled";
    }
    return "failed";
  }
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test:run src/features/share-image/output/shareOrDownload.test.ts`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/features/share-image/output/
git commit -m "feat(share-image): add shareOrDownload adapter"
```

---

## Task 4: `usePhoto` hook (TDD)

Owns object URL lifecycle. Revoke on replace / clear / unmount.

**Files:**
- Create: `src/features/share-image/usePhoto.ts`
- Create: `src/features/share-image/usePhoto.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/features/share-image/usePhoto.test.ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePhoto } from "./usePhoto";

let createdUrls: string[] = [];

beforeEach(() => {
  createdUrls = [];
  let n = 0;
  vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
    const url = `blob:mock-${++n}`;
    createdUrls.push(url);
    return url;
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const mkFile = (name: string): File =>
  new File([new Uint8Array([1, 2, 3])], name, { type: "image/jpeg" });

describe("usePhoto", () => {
  it("starts in 'empty' state", () => {
    const { result } = renderHook(() => usePhoto());
    expect(result.current.state).toEqual({ kind: "empty" });
  });

  it("setFile transitions to 'loaded' with object URL", () => {
    const { result } = renderHook(() => usePhoto());
    const file = mkFile("a.jpg");
    act(() => result.current.setFile(file));
    expect(result.current.state).toEqual({
      kind: "loaded",
      url: "blob:mock-1",
      file,
    });
  });

  it("setFile twice revokes the previous URL", () => {
    const { result } = renderHook(() => usePhoto());
    act(() => result.current.setFile(mkFile("a.jpg")));
    act(() => result.current.setFile(mkFile("b.jpg")));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
    expect(result.current.state).toMatchObject({
      kind: "loaded",
      url: "blob:mock-2",
    });
  });

  it("clear revokes URL and returns to 'empty'", () => {
    const { result } = renderHook(() => usePhoto());
    act(() => result.current.setFile(mkFile("a.jpg")));
    act(() => result.current.clear());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
    expect(result.current.state).toEqual({ kind: "empty" });
  });

  it("unmount revokes the URL", () => {
    const { result, unmount } = renderHook(() => usePhoto());
    act(() => result.current.setFile(mkFile("a.jpg")));
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test:run src/features/share-image/usePhoto.test.ts`
Expected: FAIL — `Cannot find module './usePhoto'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/share-image/usePhoto.ts
import { useCallback, useEffect, useRef, useState } from "react";

export type PhotoState =
  | { readonly kind: "empty" }
  | { readonly kind: "loaded"; readonly url: string; readonly file: File };

export const usePhoto = (): {
  state: PhotoState;
  setFile: (file: File) => void;
  clear: () => void;
} => {
  const [state, setState] = useState<PhotoState>({ kind: "empty" });
  const currentUrlRef = useRef<string | null>(null);

  const revokeCurrent = useCallback(() => {
    if (currentUrlRef.current != null) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
  }, []);

  const setFile = useCallback(
    (file: File) => {
      revokeCurrent();
      const url = URL.createObjectURL(file);
      currentUrlRef.current = url;
      setState({ kind: "loaded", url, file });
    },
    [revokeCurrent],
  );

  const clear = useCallback(() => {
    revokeCurrent();
    setState({ kind: "empty" });
  }, [revokeCurrent]);

  useEffect(() => () => revokeCurrent(), [revokeCurrent]);

  return { state, setFile, clear };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test:run src/features/share-image/usePhoto.test.ts`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/features/share-image/usePhoto.ts src/features/share-image/usePhoto.test.ts
git commit -m "feat(share-image): add usePhoto hook with URL lifecycle"
```

---

## Task 5: `domToBlob` renderer wrapper

Thin wrapper around `html-to-image`. Not unit-tested (jsdom has no real canvas; mocking `html-to-image` would test the mock). Verified manually in Task 11.

**Files:**
- Create: `src/features/share-image/render/domToBlob.ts`

- [ ] **Step 1: Write the file**

```ts
// src/features/share-image/render/domToBlob.ts
import { toBlob } from "html-to-image";

export const domToBlob = async (
  node: HTMLElement,
  opts: {
    readonly width: number;
    readonly height: number;
    readonly pixelRatio?: number;
  },
): Promise<Blob> => {
  const blob = await toBlob(node, {
    width: opts.width,
    height: opts.height,
    pixelRatio: opts.pixelRatio ?? 2,
    cacheBust: true,
  });
  if (blob == null) {
    throw new Error("domToBlob: html-to-image returned null");
  }
  return blob;
};
```

- [ ] **Step 2: Verify type checking passes**

Run: `bun run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/share-image/render/domToBlob.ts
git commit -m "feat(share-image): add domToBlob renderer wrapper"
```

---

## Task 6: `full` variant component (test-first)

The MVP variant. Renders the photo as backdrop with a recipe summary card overlaid. Supports both `positive` and `negative` colors via prop, but v1 only uses `positive` — render path for `negative` returns the same DOM with an inverted color class.

**Files:**
- Create: `src/features/share-image/variants/full.tsx`
- Create: `src/features/share-image/variants/full.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/share-image/variants/full.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Recipe, Pour } from "@/domain/types";
import type { BrewSession } from "@/domain/session";
import { c, g, ratio, s } from "@/domain/units";
import { Full } from "./full";

const mkPour = (i: number, atSec: number, amt: number, cum: number): Pour => ({
  index: i,
  atSec: s(atSec),
  pourAmount: g(amt),
  cumulativeWater: g(cum),
});

const recipe: Recipe = {
  method: "kasuya_4_6",
  dripper: "v60",
  coffee: g(20),
  totalWater: g(300),
  ratio: ratio(15),
  temperature: c(93),
  pours: [mkPour(0, 0, 60, 60), mkPour(1, 45, 240, 300)],
  totalTimeSec: s(208),
  grindHint: "medium-fine",
  notes: [],
};

const baseSession: BrewSession = {
  recipe,
  startedAt: new Date(2026, 3, 25, 9, 12).getTime(),
  completedAt: new Date(2026, 3, 25, 9, 12).getTime() + 222_000, // 3:42
};

describe("Full variant", () => {
  it("renders method name, date, total time and recipe cells", () => {
    render(
      <Full
        session={baseSession}
        photoUrl="blob:fake"
        color="positive"
      />,
    );
    expect(screen.getByText("Kasuya 4:6")).toBeInTheDocument();
    expect(screen.getByText("2026.04.25")).toBeInTheDocument();
    expect(screen.getByText("3:42")).toBeInTheDocument();
    expect(screen.getByText("V60")).toBeInTheDocument();
    expect(screen.getByText("20 · 300 g")).toBeInTheDocument();
    expect(screen.getByText(/93° · 고운 소금 정도/)).toBeInTheDocument();
    expect(screen.getByText("pourover.work")).toBeInTheDocument();
  });

  it("renders feeling row when feeling is set", () => {
    render(
      <Full
        session={{ ...baseSession, feeling: "calm" }}
        photoUrl="blob:fake"
        color="positive"
      />,
    );
    expect(screen.getByText("만족스러워요")).toBeInTheDocument();
  });

  it("omits feeling row when feeling is unset", () => {
    render(
      <Full
        session={baseSession}
        photoUrl="blob:fake"
        color="positive"
      />,
    );
    expect(screen.queryByText("만족스러워요")).not.toBeInTheDocument();
    expect(screen.queryByText("글쎄요")).not.toBeInTheDocument();
    expect(screen.queryByText("아쉬워요")).not.toBeInTheDocument();
  });

  it("uses photoUrl as background image", () => {
    const { container } = render(
      <Full
        session={baseSession}
        photoUrl="blob:my-photo"
        color="positive"
      />,
    );
    const root = container.querySelector('[data-share-variant="full"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute("style") ?? "").toContain("blob:my-photo");
  });

  it("applies color class for negative", () => {
    const { container } = render(
      <Full
        session={baseSession}
        photoUrl="blob:fake"
        color="negative"
      />,
    );
    const root = container.querySelector('[data-share-variant="full"]');
    expect(root?.getAttribute("data-color")).toBe("negative");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test:run src/features/share-image/variants/full.test.tsx`
Expected: FAIL — `Cannot find module './full'`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/share-image/variants/full.tsx
import { brewMethods } from "@/domain/methods";
import { drippers } from "@/domain/drippers";
import { sessionDurationSec, type Feeling } from "@/domain/session";
import { cx } from "@/ui/cx";
import { formatGrindHint, formatTime } from "@/ui/format";
import { FeelingGlyph } from "@/features/complete/FeelingGlyph";
import type { ShareVariant, ShareVariantProps } from "./types";

const FEELING_LABEL: Record<Feeling, string> = {
  calm: "만족스러워요",
  neutral: "글쎄요",
  wave: "아쉬워요",
};

const formatShareDate = (epochMs: number): string => {
  const d = new Date(epochMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
};

export function Full({ session, photoUrl, color }: ShareVariantProps) {
  const { recipe } = session;
  const methodName = brewMethods[recipe.method].name;
  const dripperName = drippers[recipe.dripper].name;
  const isNegative = color === "negative";

  const cardBase = "backdrop-blur-md border";
  const cardColor = isNegative
    ? "bg-black/75 text-white border-white/10"
    : "bg-white/85 text-text-primary border-black/5";
  const dividerColor = isNegative ? "bg-white/15" : "bg-black/10";
  const labelColor = isNegative ? "text-white/60" : "text-text-muted";

  return (
    <div
      data-share-variant="full"
      data-color={color}
      className="relative h-full w-full overflow-hidden font-sans"
      style={{
        backgroundImage: `url(${photoUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex h-full flex-col justify-end p-12">
        <div className={cx(cardBase, cardColor, "rounded-card p-10")}>
          <div className="flex items-baseline justify-between text-sm tracking-wide">
            <span className="font-semibold uppercase">{methodName}</span>
            <span className={cx("tabular-nums", labelColor)}>
              {formatShareDate(session.startedAt)}
            </span>
          </div>

          <div className={cx("my-6 h-px", dividerColor)} />

          <div className="flex flex-col items-center">
            <span className="text-7xl font-medium tabular-nums leading-none">
              {formatTime(sessionDurationSec(session))}
            </span>
            <span
              className={cx(
                "mt-3 text-xs uppercase tracking-widest",
                labelColor,
              )}
            >
              Total Time
            </span>
          </div>

          <div className={cx("my-6 h-px", dividerColor)} />

          <dl className="grid grid-cols-[7rem_1fr] gap-y-3 text-base tabular-nums">
            <dt className={labelColor}>드리퍼</dt>
            <dd>{dripperName}</dd>
            <dt className={labelColor}>원두 · 물</dt>
            <dd>{`${recipe.coffee} · ${recipe.totalWater} g`}</dd>
            <dt className={labelColor}>온도 · 분쇄</dt>
            <dd>{`${recipe.temperature}° · ${formatGrindHint(recipe.grindHint)}`}</dd>
          </dl>

          {session.feeling != null && (
            <>
              <div className={cx("my-6 h-px", dividerColor)} />
              <div className="flex items-center gap-3">
                <FeelingGlyph kind={session.feeling} size={28} />
                <span className="text-base">
                  {FEELING_LABEL[session.feeling]}
                </span>
              </div>
            </>
          )}
        </div>

        <div
          className={cx(
            "mt-6 text-center text-xs tracking-widest",
            isNegative ? "text-white/50" : "text-text-muted",
          )}
        >
          pourover.work
        </div>
      </div>
    </div>
  );
}

export const fullVariant: ShareVariant = {
  id: "full",
  name: "전체",
  Component: Full,
  exportSize: { width: 1080, height: 1350 },
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test:run src/features/share-image/variants/full.test.tsx`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/features/share-image/variants/full.tsx src/features/share-image/variants/full.test.tsx
git commit -m "feat(share-image): add full variant component"
```

---

## Task 7: Variant registry

Single source of truth for available layouts. Only one entry in v1.

**Files:**
- Create: `src/features/share-image/variants/registry.ts`

- [ ] **Step 1: Write the file**

```ts
// src/features/share-image/variants/registry.ts
import { fullVariant } from "./full";
import type { ShareColor, ShareLayout, ShareVariant } from "./types";

export const SHARE_LAYOUTS: Readonly<Record<ShareLayout, ShareVariant>> = {
  full: fullVariant,
  // short: shortVariant,   // added later
} as const;

export const DEFAULT_LAYOUT: ShareLayout = "full";
export const DEFAULT_COLOR: ShareColor = "positive";

export const getVariant = (layout: ShareLayout): ShareVariant => {
  const v = SHARE_LAYOUTS[layout];
  if (v == null) {
    throw new Error(`Unknown share layout: ${layout}`);
  }
  return v;
};
```

- [ ] **Step 2: Verify type checking passes**

Run: `bun run typecheck`
Expected: 0 errors. (TypeScript will narrow `SHARE_LAYOUTS["short"]` to never since it's missing — that's fine; the v1 type union still includes "short" so the runtime check stays useful for v2.)

If `tsc` complains that `SHARE_LAYOUTS` is missing the `short` key, change the line to:

```ts
export const SHARE_LAYOUTS: Partial<Readonly<Record<ShareLayout, ShareVariant>>> = {
  full: fullVariant,
};
```

and re-run `bun run typecheck`. Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/share-image/variants/registry.ts
git commit -m "feat(share-image): add variant registry"
```

---

## Task 8: `PhotoPicker` component (test-first)

Two buttons (사진 찍기 / 갤러리에서 선택), one hidden file input each. Camera button uses `capture="environment"`; gallery does not.

**Files:**
- Create: `src/features/share-image/PhotoPicker.tsx`
- Create: `src/features/share-image/PhotoPicker.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/share-image/PhotoPicker.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PhotoPicker } from "./PhotoPicker";

const mkFile = (): File =>
  new File([new Uint8Array([1])], "shot.jpg", { type: "image/jpeg" });

describe("PhotoPicker", () => {
  it("renders both buttons", () => {
    render(<PhotoPicker onPick={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "사진 찍기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "갤러리에서 선택" }),
    ).toBeInTheDocument();
  });

  it("camera input has capture='environment'", () => {
    const { container } = render(<PhotoPicker onPick={vi.fn()} />);
    const cameraInput = container.querySelector(
      'input[data-source="camera"]',
    ) as HTMLInputElement | null;
    expect(cameraInput).not.toBeNull();
    expect(cameraInput?.getAttribute("capture")).toBe("environment");
    expect(cameraInput?.accept).toContain("image/");
  });

  it("gallery input does not have capture attr", () => {
    const { container } = render(<PhotoPicker onPick={vi.fn()} />);
    const galleryInput = container.querySelector(
      'input[data-source="gallery"]',
    ) as HTMLInputElement | null;
    expect(galleryInput).not.toBeNull();
    expect(galleryInput?.hasAttribute("capture")).toBe(false);
  });

  it("calls onPick with file when camera input changes", () => {
    const onPick = vi.fn();
    const { container } = render(<PhotoPicker onPick={onPick} />);
    const input = container.querySelector(
      'input[data-source="camera"]',
    ) as HTMLInputElement;
    const file = mkFile();
    fireEvent.change(input, { target: { files: [file] } });
    expect(onPick).toHaveBeenCalledWith(file);
  });

  it("calls onPick with file when gallery input changes", () => {
    const onPick = vi.fn();
    const { container } = render(<PhotoPicker onPick={onPick} />);
    const input = container.querySelector(
      'input[data-source="gallery"]',
    ) as HTMLInputElement;
    const file = mkFile();
    fireEvent.change(input, { target: { files: [file] } });
    expect(onPick).toHaveBeenCalledWith(file);
  });

  it("does not call onPick when files is empty", () => {
    const onPick = vi.fn();
    const { container } = render(<PhotoPicker onPick={onPick} />);
    const input = container.querySelector(
      'input[data-source="gallery"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(onPick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test:run src/features/share-image/PhotoPicker.test.tsx`
Expected: FAIL — `Cannot find module './PhotoPicker'`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/share-image/PhotoPicker.tsx
import { useRef, type ChangeEvent } from "react";

type Props = {
  readonly onPick: (file: File) => void;
};

export function PhotoPicker({ onPick }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file != null) onPick(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        className="rounded-button border border-text-primary bg-surface-subtle py-3.5 text-sm font-medium transition-colors hover:bg-surface-inset"
      >
        사진 찍기
      </button>
      <button
        type="button"
        onClick={() => galleryRef.current?.click()}
        className="rounded-button border border-border bg-surface py-3.5 text-sm font-medium transition-colors hover:bg-surface-inset"
      >
        갤러리에서 선택
      </button>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        data-source="camera"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        data-source="gallery"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test:run src/features/share-image/PhotoPicker.test.tsx`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/features/share-image/PhotoPicker.tsx src/features/share-image/PhotoPicker.test.tsx
git commit -m "feat(share-image): add PhotoPicker (camera + gallery)"
```

---

## Task 9: `ShareComposer` component

Off-screen container that renders the variant at exact export dimensions inside a forwarded ref. The dialog wraps it in a CSS-scaled viewport for the visible preview. No test (presentational).

**Files:**
- Create: `src/features/share-image/ShareComposer.tsx`

- [ ] **Step 1: Write the file**

```tsx
// src/features/share-image/ShareComposer.tsx
import { forwardRef } from "react";
import type { BrewSession } from "@/domain/session";
import { getVariant } from "./variants/registry";
import type { ShareColor, ShareLayout } from "./variants/types";

type Props = {
  readonly session: BrewSession;
  readonly photoUrl: string;
  readonly layout: ShareLayout;
  readonly color: ShareColor;
};

export const ShareComposer = forwardRef<HTMLDivElement, Props>(
  function ShareComposer({ session, photoUrl, layout, color }, ref) {
    const variant = getVariant(layout);
    const { width, height } = variant.exportSize;
    const Component = variant.Component;
    return (
      <div
        ref={ref}
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        <Component session={session} photoUrl={photoUrl} color={color} />
      </div>
    );
  },
);
```

- [ ] **Step 2: Verify type checking passes**

Run: `bun run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/share-image/ShareComposer.tsx
git commit -m "feat(share-image): add ShareComposer"
```

---

## Task 10: `ShareImageDialog` orchestrator (test-first, light)

Full-screen modal with the four-state machine. Test focuses on user-visible state transitions; renderer + share I/O are integration-tested manually in Task 12.

**Files:**
- Create: `src/features/share-image/ShareImageDialog.tsx`
- Create: `src/features/share-image/ShareImageDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/share-image/ShareImageDialog.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Pour, Recipe } from "@/domain/types";
import type { BrewSession } from "@/domain/session";
import { c, g, ratio, s } from "@/domain/units";
import { ShareImageDialog } from "./ShareImageDialog";

vi.mock("./render/domToBlob", () => ({
  domToBlob: vi
    .fn()
    .mockResolvedValue(new Blob([new Uint8Array([1])], { type: "image/png" })),
}));

vi.mock("./output/shareOrDownload", () => ({
  canNativeShareImage: vi.fn().mockReturnValue(false),
  shareOrDownload: vi.fn().mockResolvedValue("downloaded"),
}));

const recipe: Recipe = {
  method: "kasuya_4_6",
  dripper: "v60",
  coffee: g(20),
  totalWater: g(300),
  ratio: ratio(15),
  temperature: c(93),
  pours: [
    {
      index: 0,
      atSec: s(0),
      pourAmount: g(60),
      cumulativeWater: g(60),
    } as Pour,
  ],
  totalTimeSec: s(180),
  grindHint: "medium-fine",
  notes: [],
};

const session: BrewSession = {
  recipe,
  startedAt: new Date(2026, 3, 25, 9, 0).getTime(),
  completedAt: new Date(2026, 3, 25, 9, 0).getTime() + 180_000,
};

beforeEach(() => {
  let n = 0;
  vi.spyOn(URL, "createObjectURL").mockImplementation(() => `blob:m${++n}`);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const mkFile = (): File =>
  new File([new Uint8Array([1])], "shot.jpg", { type: "image/jpeg" });

describe("ShareImageDialog", () => {
  it("renders nothing when open=false", () => {
    render(
      <ShareImageDialog open={false} session={session} onClose={vi.fn()} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("starts in 'empty' state showing PhotoPicker", () => {
    render(
      <ShareImageDialog open={true} session={session} onClose={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: "사진 찍기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "갤러리에서 선택" }),
    ).toBeInTheDocument();
  });

  it("transitions to 'preview' after picking a file", () => {
    const { container } = render(
      <ShareImageDialog open={true} session={session} onClose={vi.fn()} />,
    );
    const galleryInput = container.querySelector(
      'input[data-source="gallery"]',
    ) as HTMLInputElement;
    fireEvent.change(galleryInput, { target: { files: [mkFile()] } });
    expect(
      screen.getByRole("button", { name: "이미지 저장" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "사진 변경" }),
    ).toBeInTheDocument();
  });

  it("calls onClose when 취소 tapped from empty state", () => {
    const onClose = vi.fn();
    render(
      <ShareImageDialog open={true} session={session} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("returns to 'empty' when 사진 변경 tapped", () => {
    const { container } = render(
      <ShareImageDialog open={true} session={session} onClose={vi.fn()} />,
    );
    const galleryInput = container.querySelector(
      'input[data-source="gallery"]',
    ) as HTMLInputElement;
    fireEvent.change(galleryInput, { target: { files: [mkFile()] } });
    fireEvent.click(screen.getByRole("button", { name: "사진 변경" }));
    expect(
      screen.getByRole("button", { name: "사진 찍기" }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test:run src/features/share-image/ShareImageDialog.test.tsx`
Expected: FAIL — `Cannot find module './ShareImageDialog'`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/share-image/ShareImageDialog.tsx
import { useEffect, useRef, useState } from "react";
import type { BrewSession } from "@/domain/session";
import { cx } from "@/ui/cx";
import { PhotoPicker } from "./PhotoPicker";
import { ShareComposer } from "./ShareComposer";
import { usePhoto } from "./usePhoto";
import { domToBlob } from "./render/domToBlob";
import {
  canNativeShareImage,
  shareOrDownload,
  type ShareOutcome,
} from "./output/shareOrDownload";
import {
  DEFAULT_COLOR,
  DEFAULT_LAYOUT,
  getVariant,
} from "./variants/registry";

type Props = {
  readonly open: boolean;
  readonly session: BrewSession;
  readonly onClose: () => void;
};

type Phase = "preview" | "exporting" | "error";

const filenameFor = (session: BrewSession): string => {
  const d = new Date(session.startedAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `bloom-coffee-${y}-${m}-${day}.png`;
};

export function ShareImageDialog({ open, session, onClose }: Props) {
  const photo = usePhoto();
  const [phase, setPhase] = useState<Phase>("preview");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const layout = DEFAULT_LAYOUT;
  const color = DEFAULT_COLOR;
  const variant = getVariant(layout);

  useEffect(() => {
    if (!open) {
      photo.clear();
      setPhase("preview");
      setErrorMsg(null);
    }
  }, [open, photo]);

  if (!open) return null;

  const shareLabel = canNativeShareImage() ? "공유하기" : "이미지 저장";

  const handleShare = async (): Promise<void> => {
    if (composerRef.current == null || photo.state.kind !== "loaded") return;
    setPhase("exporting");
    setErrorMsg(null);
    try {
      const blob = await domToBlob(composerRef.current, variant.exportSize);
      const outcome: ShareOutcome = await shareOrDownload(
        blob,
        filenameFor(session),
      );
      if (outcome === "shared" || outcome === "downloaded") {
        onClose();
        return;
      }
      if (outcome === "cancelled") {
        setPhase("preview");
        return;
      }
      setErrorMsg("공유에 실패했어요. 다시 시도해주세요.");
      setPhase("error");
    } catch {
      setErrorMsg("이미지를 만들지 못했어요. 다시 시도해주세요.");
      setPhase("error");
    }
  };

  // Preview viewport: render at exportSize then scale down to fit dialog.
  const PREVIEW_WIDTH = 320;
  const scale = PREVIEW_WIDTH / variant.exportSize.width;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="공유 이미지 만들기"
      className="fixed inset-0 z-50 flex flex-col bg-surface px-6 pb-6 pt-12 text-text-primary"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-md font-semibold">공유하기</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-text-secondary"
        >
          닫기
        </button>
      </header>

      {photo.state.kind === "empty" && (
        <div className="mt-10 flex flex-1 flex-col justify-center gap-6">
          <p className="text-center text-sm text-text-secondary">
            방금 내린 커피 사진을 골라주세요.
          </p>
          <PhotoPicker onPick={photo.setFile} />
          <button
            type="button"
            onClick={onClose}
            className="rounded-button py-3.5 text-sm text-text-muted"
          >
            취소
          </button>
        </div>
      )}

      {photo.state.kind === "loaded" && (
        <div className="mt-6 flex flex-1 flex-col gap-6">
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            {/* Scaled preview viewport. Composer renders at exact export size. */}
            <div
              style={{
                width: `${PREVIEW_WIDTH}px`,
                height: `${variant.exportSize.height * scale}px`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <ShareComposer
                  ref={composerRef}
                  session={session}
                  photoUrl={photo.state.url}
                  layout={layout}
                  color={color}
                />
              </div>
            </div>
          </div>

          {phase === "error" && errorMsg != null && (
            <p className="text-center text-sm text-pour-bloom">{errorMsg}</p>
          )}

          <div className="flex flex-col gap-2 text-sm font-medium">
            <button
              type="button"
              onClick={handleShare}
              disabled={phase === "exporting"}
              className={cx(
                "rounded-button border border-text-primary bg-surface-subtle py-3.5 transition-colors hover:bg-surface-inset",
                phase === "exporting" && "opacity-disabled",
              )}
            >
              {phase === "exporting" ? "만드는 중…" : shareLabel}
            </button>
            <button
              type="button"
              onClick={photo.clear}
              disabled={phase === "exporting"}
              className="rounded-button border border-border py-3.5"
            >
              사진 변경
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test:run src/features/share-image/ShareImageDialog.test.tsx`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/features/share-image/ShareImageDialog.tsx src/features/share-image/ShareImageDialog.test.tsx
git commit -m "feat(share-image): add ShareImageDialog orchestrator"
```

---

## Task 11: Wire `CompleteScreen` to dialog

Re-enable the disabled 공유 button. Update its existing test.

**Files:**
- Modify: `src/features/complete/CompleteScreen.tsx`
- Modify: `src/features/complete/CompleteScreen.test.tsx:172-182`

- [ ] **Step 1: Update the existing failing test**

Replace the test block at `src/features/complete/CompleteScreen.test.tsx:172-182` (the one titled `"renders 공유 button as disabled"`):

```tsx
  it("opens share dialog when 공유 tapped", () => {
    render(
      <CompleteScreen
        session={baseSession}
        onFeelingChange={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    const shareBtn = screen.getByRole("button", { name: "공유" });
    expect(shareBtn).not.toBeDisabled();
    fireEvent.click(shareBtn);
    expect(
      screen.getByRole("dialog", { name: "공유 이미지 만들기" }),
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test:run src/features/complete/CompleteScreen.test.tsx`
Expected: FAIL — share button still disabled / dialog not rendered.

- [ ] **Step 3: Update CompleteScreen.tsx**

Add the `useState` import and `ShareImageDialog` import at the top of `src/features/complete/CompleteScreen.tsx`:

```tsx
import { useState } from "react";
import { ShareImageDialog } from "@/features/share-image/ShareImageDialog";
```

Replace the share button (currently lines 111-118):

```tsx
        <button
          type="button"
          disabled
          aria-label="공유"
          className="w-16 rounded-button border border-border py-3.5 text-text-muted opacity-disabled"
        >
          공유
        </button>
```

with:

```tsx
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          aria-label="공유"
          className="w-16 rounded-button border border-text-primary bg-surface-subtle py-3.5 text-text-primary transition-colors hover:bg-surface-inset"
        >
          공유
        </button>
```

Inside the `CompleteScreen` function body, add the share-open state right below the existing `dateText` line. Find this block:

```tsx
  const dateText = formatBrewedAt(session.startedAt);

  const handleFeelingTap = (feeling: Feeling): void => {
```

and insert the new line between them:

```tsx
  const dateText = formatBrewedAt(session.startedAt);
  const [shareOpen, setShareOpen] = useState(false);

  const handleFeelingTap = (feeling: Feeling): void => {
```

Just before the closing `</div>` of the root container (right after `<Footer />`), insert:

```tsx
      <ShareImageDialog
        open={shareOpen}
        session={session}
        onClose={() => setShareOpen(false)}
      />
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test:run src/features/complete/CompleteScreen.test.tsx`
Expected: PASS — all CompleteScreen tests green including the updated share test.

- [ ] **Step 5: Run the full test suite**

Run: `bun run test:run`
Expected: ALL tests pass.

- [ ] **Step 6: Run typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/complete/CompleteScreen.tsx src/features/complete/CompleteScreen.test.tsx
git commit -m "feat(share-image): wire CompleteScreen 공유 button to dialog"
```

---

## Task 12: Manual verification

Browser-based smoke test of the full flow. The plan has not exercised real camera input or the html-to-image renderer.

- [ ] **Step 1: Start the dev server**

Run: `bun run dev`
Expected: Vite dev server prints local URL.

- [ ] **Step 2: Walk through one full brew session**

Open the URL in a desktop browser. Set a recipe, start brewing, complete to land on `CompleteScreen`. Tap 공유.

Expected: dialog opens, shows 사진 찍기 / 갤러리에서 선택.

- [ ] **Step 3: Pick a sample photo**

Tap 갤러리에서 선택 and choose any photo from your filesystem.

Expected: dialog switches to preview, shows the recipe card overlaid on the photo (scaled-down preview).

- [ ] **Step 4: Save the image**

Tap 이미지 저장 (desktop browsers fall back to download).

Expected: a PNG file `bloom-coffee-YYYY-MM-DD.png` downloads. Open it: photo full-frame as backdrop, white card overlay with method name, date, total time, recipe cells, no feeling row (since you didn't select one), `pourover.work` footer.

- [ ] **Step 5: Test feeling integration**

Close dialog, select a feeling on CompleteScreen, reopen dialog, pick photo, save again.

Expected: the new PNG includes the feeling row with the right glyph and label.

- [ ] **Step 6: Test 사진 변경**

In preview state, tap 사진 변경.

Expected: returns to PhotoPicker buttons.

- [ ] **Step 7: Test on mobile (iOS Safari or Android Chrome)**

If a mobile device is available, open the dev URL on it (over local network or via tunnel). Walk through the same flow. The 공유하기 button (instead of 이미지 저장) should appear, and tapping it should bring up the OS share sheet.

If mobile is unavailable, mark this step as deferred and capture as a followup in `docs/superpowers/followups.md`.

- [ ] **Step 8: No commit needed**

Manual verification produces no code changes.

---

## Done

All tasks complete. The share button is functional, MVP variant ships, and the registry is in place for future variants/themes/output channels.
