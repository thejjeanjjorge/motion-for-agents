import { describe, expect, it } from "vitest";
import { clampProgress, getMotionRecipe, MOTION_INTENTS, PRESETS } from "../src";
import type { MotionIntent, MotionPreset } from "../src";

describe("motion recipes", () => {
  const intents = Object.keys(MOTION_INTENTS) as MotionIntent[];
  const presets = Object.keys(PRESETS) as MotionPreset[];

  it("removes all spatial targets and spring physics for reduced motion", () => {
    for (const preset of presets) {
      for (const intent of intents) {
        const recipe = getMotionRecipe(intent, preset, true);
        for (const target of [recipe.initial, recipe.animate, recipe.exit]) {
          expect(Object.keys(target)).toEqual(["opacity"]);
        }
        expect(recipe.transition.type).toBe("tween");
        expect(recipe.transition).not.toHaveProperty("stiffness");
        expect(recipe.transition.duration).toBeLessThanOrEqual(0.12);
      }
    }
  });

  it("keeps navigation bounded and uses the selected preset", () => {
    for (const preset of presets) {
      const recipe = getMotionRecipe("navigate", preset);
      expect(recipe.initial.x).toBe(PRESETS[preset].distance);
      expect(recipe.animate.x).toBe(0);
      expect(recipe.exit.x).toBe(-PRESETS[preset].distance);
      expect(recipe.transition).not.toHaveProperty("repeat");
    }
    expect(getMotionRecipe("reveal")).toEqual(getMotionRecipe("reveal", "quiet", false));
  });

  it("returns fresh targets so consumer customization cannot change later recipes", () => {
    const first = getMotionRecipe("reveal", "spring");
    first.initial.y = 999;
    first.transition.damping = 1;
    const next = getMotionRecipe("reveal", "spring");
    expect(next.initial.y).toBe(PRESETS.spring.distance);
    expect(next.transition.damping).toBe(PRESETS.spring.spring?.damping);
  });

  it.each([
    [-30, 0], [0, 0], [47.5, 47.5], [100, 100], [500, 100],
    [Number.NaN, 0], [Number.NEGATIVE_INFINITY, 0], [Number.POSITIVE_INFINITY, 100],
  ])("clamps progress %s to %s", (value, expected) => {
    expect(clampProgress(value)).toBe(expected);
  });
});
