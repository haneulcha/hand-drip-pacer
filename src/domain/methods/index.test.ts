import { describe, expect, it } from "vitest";
import { brewMethods, methodList, methodsForDripper } from "./index";

describe("brew method registry", () => {
  it("includes all v1 methods", () => {
    expect(Object.keys(brewMethods).sort()).toEqual([
      "april",
      "hoffmann_v60",
      "kalita_pulse",
      "kasuya_4_6",
      "scott_rao",
    ]);
  });

  it("each method id matches its registry key", () => {
    for (const [key, method] of Object.entries(brewMethods)) {
      expect(method.id).toBe(key);
    }
  });

  it("methodList mirrors registry values", () => {
    expect(methodList).toHaveLength(5);
    expect(methodList.map((m) => m.id).sort()).toEqual([
      "april",
      "hoffmann_v60",
      "kalita_pulse",
      "kasuya_4_6",
      "scott_rao",
    ]);
  });

  describe("methodsForDripper", () => {
    it("v60 → kasuya_4_6 + hoffmann_v60 + scott_rao", () => {
      expect(
        methodsForDripper("v60")
          .map((m) => m.id)
          .sort(),
      ).toEqual(["hoffmann_v60", "kasuya_4_6", "scott_rao"]);
    });

    it("kalita_wave → kalita_pulse + april", () => {
      expect(
        methodsForDripper("kalita_wave")
          .map((m) => m.id)
          .sort(),
      ).toEqual(["april", "kalita_pulse"]);
    });
  });
});
