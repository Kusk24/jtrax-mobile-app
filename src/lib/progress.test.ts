import { afterEach, describe, expect, it, vi } from "vitest";
import { academyToday, getHistory, isFinishedGame, outcomeOf, recordSoloGame, stampDate, type HistoryEntry } from "./progress";

function stubFetch(body: unknown, ok = true) {
  const spy = vi.fn().mockResolvedValue({ ok, json: async () => body, status: ok ? 200 : 500 });
  vi.stubGlobal("fetch", spy);
  return spy;
}

afterEach(() => vi.unstubAllGlobals());

describe("a game's result from the pupil's side", () => {
  it("reads a win, a loss and a draw for either colour", () => {
    expect(outcomeOf("1-0", "white")).toBe("win");
    expect(outcomeOf("1-0", "black")).toBe("loss");
    expect(outcomeOf("0-1", "black")).toBe("win");
    expect(outcomeOf("1/2-1/2", "white")).toBe("draw");
  });

  it("is nothing for a game with no result or no side", () => {
    expect(outcomeOf(undefined, "white")).toBeNull();
    expect(outcomeOf("1-0", undefined)).toBeNull();
  });
});

describe("which history entries are finished games", () => {
  const entry = (over: Partial<HistoryEntry>): HistoryEntry => ({ kind: "solo", id: "x", at: "", day: "", against: "", ...over });

  it("keeps finished robot and board games, and leaves puzzles and live games out", () => {
    expect(isFinishedGame(entry({ kind: "solo", result: "1-0" }))).toBe(true);
    expect(isFinishedGame(entry({ kind: "room", result: "0-1" }))).toBe(true);
    expect(isFinishedGame(entry({ kind: "room" }))).toBe(false);
    expect(isFinishedGame(entry({ kind: "puzzle", result: "solved" }))).toBe(false);
  });
});

describe("dates", () => {
  it("reads the server's UTC stamp as UTC", () => {
    expect(stampDate("2026-09-28 08:30:00").toISOString()).toBe("2026-09-28T08:30:00.000Z");
  });

  it("counts the academy's day in Bangkok, not in UTC", () => {
    // 20:00 UTC is already the next morning in Bangkok.
    expect(academyToday(new Date("2026-10-04T20:00:00Z"))).toBe("2026-10-05");
  });
});

describe("the history and game endpoints", () => {
  it("reads one pupil's history by their id, escaped", async () => {
    const spy = stubFetch({ history: [] });
    await getHistory("stu/penny");
    expect(spy.mock.calls[0][0]).toMatch(/\/students\/stu%2Fpenny\/history$/);
  });

  it("records a finished robot game with its moves and result", async () => {
    const spy = stubFetch({ recorded: true });
    await recordSoloGame({ opponent: "strong", moves: ["e2e4"], result: "1-0", reason: "Checkmate" });
    const [url, init] = spy.mock.calls[0];
    expect(url).toMatch(/\/games\/solo$/);
    expect(JSON.parse(init.body)).toEqual({ opponent: "strong", moves: ["e2e4"], result: "1-0", reason: "Checkmate" });
  });
});
