/**
 * Free Play is opened as `/student/puzzles/free?tier=…`, so the level comes in
 * as a string from the URL. Only the three the server knows may reach it.
 */
import { describe, expect, it } from "vitest";
import { FREE_TIERS, isFreeTier } from "./puzzles";

describe("Free Play levels", () => {
  it("accepts the three levels the server offers", () => {
    expect(FREE_TIERS).toEqual(["beginner", "intermediate", "advanced"]);
    for (const tier of FREE_TIERS) expect(isFreeTier(tier)).toBe(true);
  });

  it("refuses anything else from the link", () => {
    for (const bad of [undefined, "", "expert", "Beginner", "beginner&x=1"]) expect(isFreeTier(bad)).toBe(false);
  });
});
