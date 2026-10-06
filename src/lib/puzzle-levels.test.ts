/**
 * The three levels — Beginner, Intermediate, Advanced — as the Puzzles list
 * filters by them and as a daily puzzle is labelled with one.
 */
import { describe, expect, it } from "vitest";
import { FREE_TIERS, isFreeTier, nextOnList, tierOfRating, type ListPuzzle } from "./puzzles";

describe("the levels", () => {
  it("are the three the server knows, and nothing else gets in from a link", () => {
    expect(FREE_TIERS).toEqual(["beginner", "intermediate", "advanced"]);
    for (const tier of FREE_TIERS) expect(isFreeTier(tier)).toBe(true);
    for (const bad of [undefined, "", "expert", "Beginner", "beginner&x=1"]) expect(isFreeTier(bad)).toBe(false);
  });

  it("labels a daily puzzle by the same bands the list uses", () => {
    expect(tierOfRating(650)).toBe("beginner");
    expect(tierOfRating(799)).toBe("beginner");
    expect(tierOfRating(800)).toBe("intermediate");
    expect(tierOfRating(1199)).toBe("intermediate");
    expect(tierOfRating(1200)).toBe("advanced");
  });
});

describe("what the practice list opens after a solve", () => {
  const row = (tier: ListPuzzle["tier"], solved = false, i = 0): ListPuzzle => ({
    puzzleId: `p${i}`,
    fen: "8/8/8/8/8/8/8/8 w - - 0 1",
    rating: 900,
    themes: "",
    side: "White",
    moveCount: 1,
    solved,
    wrongMoves: 0,
    position: i,
    tier,
  });
  const list = (...rows: [ListPuzzle["tier"], boolean][]) => rows.map(([t, s], i) => row(t, s, i));

  it("goes on to the next unticked one below", () => {
    expect(nextOnList(list(["beginner", true], ["beginner", false], ["advanced", false]), 0, "")).toBe(1);
  });

  it("stays inside the chosen level", () => {
    expect(nextOnList(list(["beginner", false], ["advanced", false], ["beginner", false]), 0, "beginner")).toBe(2);
  });

  it("wraps round to one above before giving up", () => {
    expect(nextOnList(list(["beginner", false], ["beginner", true], ["beginner", false]), 2, "")).toBe(0);
  });

  it("is -1 once everything shown is ticked — back to the list", () => {
    expect(nextOnList(list(["beginner", true], ["advanced", false]), 0, "beginner")).toBe(-1);
  });
});
