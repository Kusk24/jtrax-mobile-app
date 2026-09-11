/**
 * The daily puzzle client.
 *
 * The thing worth pinning is what this does *not* do: it never decides whether
 * a move is right. The phone submits the move and the server answers. Anything
 * this file could decide locally is something a curious ten-year-old with the
 * developer menu open could decide for it.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attemptMove,
  gameAt,
  getDailyPuzzles,
  nextUnsolved,
  puzzleGoal,
  solvedCount,
  type DailyPuzzle,
} from "./puzzles";

const puzzle = (over: Partial<DailyPuzzle> = {}): DailyPuzzle => ({
  puzzleId: "001gi",
  fen: "N6r/1p1k1ppp/2np4/b3p3/4P1b1/N1Q5/P4PPP/R3KB1R b KQ - 0 18",
  rating: 819,
  themes: "hangingPiece mateIn1",
  side: "Black",
  moveCount: 1,
  solved: false,
  wrongMoves: 0,
  ...over,
});

function stubFetch(body: unknown, ok = true) {
  const spy = vi.fn().mockResolvedValue({ ok, json: async () => body, status: ok ? 200 : 500 });
  vi.stubGlobal("fetch", spy);
  return spy;
}

afterEach(() => vi.unstubAllGlobals());

describe("gameAt", () => {
  it("loads a real position from the bank", () => {
    const game = gameAt(puzzle().fen);
    expect(game).not.toBeNull();
    // Black to move, as the puzzle says — the board is turned round for them.
    expect(game!.turn()).toBe("b");
  });

  it("is null for a position it cannot load, so a bad puzzle is skipped rather than drawn wrong", () => {
    expect(gameAt("not a fen")).toBeNull();
    expect(gameAt("")).toBeNull();
  });
});

describe("puzzleGoal", () => {
  it("says mate when the themes say mate, and carries the move count", () => {
    expect(puzzleGoal(puzzle())).toEqual({ key: "mateIn", count: 1 });
    expect(puzzleGoal(puzzle({ themes: "mateIn2", moveCount: 2 }))).toEqual({ key: "mateIn", count: 2 });
  });

  it("asks for the best move when the puzzle is not a mate", () => {
    expect(puzzleGoal(puzzle({ themes: "skewer", moveCount: 2 })).key).toBe("winIn");
  });
});

describe("where a solved puzzle sends you next", () => {
  const set = (...solved: boolean[]) =>
    solved.map((s, i) => puzzle({ puzzleId: `p${i}`, solved: s }));

  it("goes to the first one still unsolved", () => {
    expect(nextUnsolved(set(true, false, false), 0)).toBe(1);
    expect(nextUnsolved(set(true, true, false), 1)).toBe(2);
  });

  it("skips past one already done to reach one that is not", () => {
    // Solving #3 first should send them back to #1, not stop.
    expect(nextUnsolved(set(false, false, true), 2)).toBe(0);
  });

  it("returns -1 when the set is finished, which is what ends the run", () => {
    expect(nextUnsolved(set(true, true, true), 2)).toBe(-1);
  });

  it("never sends you back to the one you have just solved", () => {
    // The caller marks it solved in the same tick, so this cannot depend on
    // that having landed — the index is skipped outright.
    const stale = set(true, false, false);
    stale[0].solved = false;
    expect(nextUnsolved(stale, 0)).toBe(1);
  });

  it("counts what is done", () => {
    expect(solvedCount(set(true, false, true))).toBe(2);
    expect(solvedCount([])).toBe(0);
  });
});

describe("attemptMove", () => {
  it("sends the pupil's own moves and the one being tried — never a verdict", async () => {
    const spy = stubFetch({ correct: true, solved: true, reply: "", fen: "8/8/8/8/8/8/8/8 w - - 0 1" });
    await attemptMove("001gi", "a5c3", ["e2e4"]);

    const [url, init] = spy.mock.calls[0];
    // Unlike the web app there is no same-origin proxy, so the phone names the
    // backend and its version itself.
    expect(url).toMatch(/\/api\/v1\/puzzles\/001gi\/attempt$/);
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body).toEqual({ move: "a5c3", played: ["e2e4"] });
    // Nothing about whether it was right: that is the server's to decide.
    expect(Object.keys(body)).not.toContain("correct");
    expect(Object.keys(body)).not.toContain("solved");
  });

  it("escapes the puzzle id rather than pasting it into the path", async () => {
    const spy = stubFetch({ correct: false, solved: false, reply: "", fen: "" });
    await attemptMove("a/../b", "e2e4", []);
    expect(spy.mock.calls[0][0]).toMatch(/\/puzzles\/a%2F\.\.%2Fb\/attempt$/);
  });

  it("throws when the server refuses, so the board can say so instead of pretending", async () => {
    stubFetch({}, false);
    await expect(attemptMove("001gi", "a5c3", [])).rejects.toThrow();
  });
});

describe("getDailyPuzzles", () => {
  it("carries the exhausted flag, so an empty day can be explained", async () => {
    stubFetch({ puzzles: [], exhausted: true, unseen: 0 });
    const set = await getDailyPuzzles();
    expect(set.exhausted).toBe(true);
    expect(set.puzzles).toEqual([]);
  });

  it("never receives the solution — the payload has no moves on it", async () => {
    stubFetch({ puzzles: [puzzle()], exhausted: false, unseen: 57 });
    const set = await getDailyPuzzles();
    expect(Object.keys(set.puzzles[0])).not.toContain("moves");
    expect(JSON.stringify(set)).not.toContain("a5c3");
  });
});
