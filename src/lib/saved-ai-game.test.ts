import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
    removeItem: async (k: string) => void store.delete(k),
  },
}));

const { clearSavedAiGame, loadSavedAiGame, parseSavedAiGame, saveAiGame } = await import("./saved-ai-game");

describe("a saved robot game", () => {
  beforeEach(() => store.clear());

  it("is resumable with a known robot and at least one move", () => {
    const raw = JSON.stringify({ opponent: "strong", moves: ["e2e4", "e7e5"], startedAt: "2026-09-30 10:00:00", savedAt: "x" });
    expect(parseSavedAiGame(raw)).toEqual({ opponent: "strong", moves: ["e2e4", "e7e5"], startedAt: "2026-09-30 10:00:00", savedAt: "x" });
  });

  it("is nothing when missing, empty, unreadable or for an unknown robot", () => {
    expect(parseSavedAiGame(null)).toBeNull();
    expect(parseSavedAiGame("not json")).toBeNull();
    expect(parseSavedAiGame(JSON.stringify({ opponent: "novice", moves: [] }))).toBeNull();
    expect(parseSavedAiGame(JSON.stringify({ opponent: "grandmaster", moves: ["e2e4"] }))).toBeNull();
  });

  it("comes back as it was saved, and is gone once cleared", async () => {
    await saveAiGame({ opponent: "expert", moves: ["d2d4"], startedAt: null });
    expect(await loadSavedAiGame()).toMatchObject({ opponent: "expert", moves: ["d2d4"], startedAt: null });
    await clearSavedAiGame();
    expect(await loadSavedAiGame()).toBeNull();
  });
});
