import { describe, expect, it } from "vitest";
import { brewMethods, methodList, methodsForDripper } from "./index";

describe("brew method registry", () => {
  it("includes all v1 methods", () => {
    expect(Object.keys(brewMethods).sort()).toEqual([
      "april",
      "frothy_monkey",
      "hoffmann_v60",
      "kalita_pulse",
      "kasuya_4_6",
      "kurasu_kyoto",
      "scott_rao",
    ]);
  });

  it("each method id matches its registry key", () => {
    for (const [key, method] of Object.entries(brewMethods)) {
      expect(method.id).toBe(key);
    }
  });

  it("methodList mirrors registry values", () => {
    expect(methodList).toHaveLength(7);
    expect(methodList.map((m) => m.id).sort()).toEqual([
      "april",
      "frothy_monkey",
      "hoffmann_v60",
      "kalita_pulse",
      "kasuya_4_6",
      "kurasu_kyoto",
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

    it("kalita_wave → kalita_pulse + april + kurasu_kyoto + frothy_monkey", () => {
      expect(
        methodsForDripper("kalita_wave")
          .map((m) => m.id)
          .sort(),
      ).toEqual(["april", "frothy_monkey", "kalita_pulse", "kurasu_kyoto"]);
    });
  });
});
