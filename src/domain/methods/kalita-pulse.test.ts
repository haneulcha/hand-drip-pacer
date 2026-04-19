import { describe, expect, it } from "vitest";
import { g } from "../units";
import type { RecipeInput } from "../types";
import { kalitaPulse } from "./kalita-pulse";

const baseInput = (overrides: Partial<RecipeInput> = {}): RecipeInput => ({
  method: "kalita_pulse",
  dripper: "kalita_wave",
  coffee: g(20),
  roast: "medium",
  taste: { sweetness: "balanced", strength: "medium" },
  ...overrides,
});

const allCombos = (["sweet", "balanced", "bright"] as const).flatMap(
  (sweetness) =>
    (["light", "medium", "strong"] as const).map((strength) => ({
      sweetness,
      strength,
    })),
);

describe("Kalita Wave pulse", () => {
  describe("spec snapshots", () => {
    it("20g / balanced / medium / roast=medium — design.md reference", () => {
      expect(kalitaPulse.compute(baseInput())).toMatchInlineSnapshot(`
        {
          "coffee": 20,
          "dripper": "kalita_wave",
          "grindHint": "medium",
          "method": "kalita_pulse",
          "notes": [
            "각 푸어는 물이 거의 다 빠지기 전에 시작. 수위를 일정하게 유지.",
            "중심만 좁게 붓고 외곽은 건드리지 않기.",
          ],
          "pours": [
            {
              "atSec": 0,
              "cumulativeWater": 40,
              "index": 0,
              "label": "bloom",
              "pourAmount": 40,
            },
            {
              "atSec": 45,
              "cumulativeWater": 100,
              "index": 1,
              "pourAmount": 60,
            },
            {
              "atSec": 75,
              "cumulativeWater": 180,
              "index": 2,
              "pourAmount": 80,
            },
            {
              "atSec": 105,
              "cumulativeWater": 260,
              "index": 3,
              "pourAmount": 80,
            },
            {
              "atSec": 135,
              "cumulativeWater": 320,
              "index": 4,
              "pourAmount": 60,
            },
          ],
          "ratio": 16,
          "temperature": 93,
          "totalTimeSec": 165,
          "totalWater": 320,
        }
      `);
    });

    it("20g / sweet / strong — longer bloom + heavy middle pulses", () => {
      expect(
        kalitaPulse.compute(
          baseInput({ taste: { sweetness: "sweet", strength: "strong" } }),
        ),
      ).toMatchInlineSnapshot(`
        {
          "coffee": 20,
          "dripper": "kalita_wave",
          "grindHint": "medium",
          "method": "kalita_pulse",
          "notes": [
            "각 푸어는 물이 거의 다 빠지기 전에 시작. 수위를 일정하게 유지.",
            "중심만 좁게 붓고 외곽은 건드리지 않기.",
          ],
          "pours": [
            {
              "atSec": 0,
              "cumulativeWater": 40,
              "index": 0,
              "label": "bloom",
              "pourAmount": 40,
            },
            {
              "atSec": 60,
              "cumulativeWater": 93,
              "index": 1,
              "pourAmount": 53,
            },
            {
              "atSec": 90,
              "cumulativeWater": 181,
              "index": 2,
              "pourAmount": 88,
            },
            {
              "atSec": 120,
              "cumulativeWater": 269,
              "index": 3,
              "pourAmount": 88,
            },
            {
              "atSec": 150,
              "cumulativeWater": 320,
              "index": 4,
              "pourAmount": 51,
            },
          ],
          "ratio": 16,
          "temperature": 93,
          "totalTimeSec": 180,
          "totalWater": 320,
        }
      `);
    });

    it("20g / bright / light — short bloom + 4 pours", () => {
      expect(
        kalitaPulse.compute(
          baseInput({ taste: { sweetness: "bright", strength: "light" } }),
        ),
      ).toMatchInlineSnapshot(`
        {
          "coffee": 20,
          "dripper": "kalita_wave",
          "grindHint": "medium",
          "method": "kalita_pulse",
          "notes": [
            "각 푸어는 물이 거의 다 빠지기 전에 시작. 수위를 일정하게 유지.",
            "중심만 좁게 붓고 외곽은 건드리지 않기.",
          ],
          "pours": [
            {
              "atSec": 0,
              "cumulativeWater": 40,
              "index": 0,
              "label": "bloom",
              "pourAmount": 40,
            },
            {
              "atSec": 30,
              "cumulativeWater": 124,
              "index": 1,
              "pourAmount": 84,
            },
            {
              "atSec": 60,
              "cumulativeWater": 236,
              "index": 2,
              "pourAmount": 112,
            },
            {
              "atSec": 90,
              "cumulativeWater": 320,
              "index": 3,
              "pourAmount": 84,
            },
          ],
          "ratio": 16,
          "temperature": 93,
          "totalTimeSec": 120,
          "totalWater": 320,
        }
      `);
    });
  });

  describe("invariants", () => {
    it.each([10, 15, 20, 25, 30])(
      "pours sum to totalWater (coffee=%ig)",
      (coffeeG) => {
        for (const taste of allCombos) {
          const r = kalitaPulse.compute(
            baseInput({ coffee: g(coffeeG), taste }),
          );
          const sum = r.pours.reduce((acc, p) => acc + p.pourAmount, 0);
          expect(sum).toBe(r.totalWater);
        }
      },
    );

    it("pour count: light=4, medium=5, strong=5", () => {
      expect(
        kalitaPulse.compute(
          baseInput({ taste: { sweetness: "balanced", strength: "light" } }),
        ).pours,
      ).toHaveLength(4);
      expect(
        kalitaPulse.compute(
          baseInput({ taste: { sweetness: "balanced", strength: "medium" } }),
        ).pours,
      ).toHaveLength(5);
      expect(
        kalitaPulse.compute(
          baseInput({ taste: { sweetness: "balanced", strength: "strong" } }),
        ).pours,
      ).toHaveLength(5);
    });

    it("first pour labeled bloom; rest unlabeled", () => {
      const r = kalitaPulse.compute(baseInput());
      expect(r.pours[0]!.label).toBe("bloom");
      for (let i = 1; i < r.pours.length; i++) {
        expect(r.pours[i]!.label).toBeUndefined();
      }
    });

    it("bloom is 2x coffee weight", () => {
      for (const coffeeG of [10, 15, 20, 25]) {
        const r = kalitaPulse.compute(baseInput({ coffee: g(coffeeG) }));
        expect(r.pours[0]!.pourAmount).toBe(coffeeG * 2);
      }
    });

    it("first pulse starts at bloom duration (30/45/60s)", () => {
      expect(
        kalitaPulse.compute(
          baseInput({ taste: { sweetness: "sweet", strength: "medium" } }),
        ).pours[1]!.atSec,
      ).toBe(60);
      expect(
        kalitaPulse.compute(
          baseInput({ taste: { sweetness: "balanced", strength: "medium" } }),
        ).pours[1]!.atSec,
      ).toBe(45);
      expect(
        kalitaPulse.compute(
          baseInput({ taste: { sweetness: "bright", strength: "medium" } }),
        ).pours[1]!.atSec,
      ).toBe(30);
    });

    it("pulses after bloom spaced 30s apart", () => {
      const r = kalitaPulse.compute(baseInput());
      for (let i = 2; i < r.pours.length; i++) {
        expect(r.pours[i]!.atSec - r.pours[i - 1]!.atSec).toBe(30);
      }
    });

    it("strong differs from medium by pour amounts (weights [3,5,5,3] vs [3,4,4,3])", () => {
      const med = kalitaPulse
        .compute(
          baseInput({ taste: { sweetness: "balanced", strength: "medium" } }),
        )
        .pours.map((p) => p.pourAmount);
      const strong = kalitaPulse
        .compute(
          baseInput({ taste: { sweetness: "balanced", strength: "strong" } }),
        )
        .pours.map((p) => p.pourAmount);
      expect(med).not.toEqual(strong);
    });
  });

  describe("metadata", () => {
    it("temperature by roast: light=96, medium=93, dark=90", () => {
      expect(
        kalitaPulse.compute(baseInput({ roast: "light" })).temperature,
      ).toBe(96);
      expect(
        kalitaPulse.compute(baseInput({ roast: "medium" })).temperature,
      ).toBe(93);
      expect(
        kalitaPulse.compute(baseInput({ roast: "dark" })).temperature,
      ).toBe(90);
    });

    it("grind is always medium (taste adjusts bloom time / pour count instead)", () => {
      for (const taste of allCombos) {
        expect(kalitaPulse.compute(baseInput({ taste })).grindHint).toBe(
          "medium",
        );
      }
    });

    it("supports only kalita_wave", () => {
      expect(kalitaPulse.supportedDrippers).toEqual(["kalita_wave"]);
    });

    it("defaultRatio is 16", () => {
      expect(kalitaPulse.defaultRatio).toBe(16);
    });
  });
});
