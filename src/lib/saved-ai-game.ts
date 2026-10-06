/**
 * A robot game left unfinished, kept on the phone so the pupil can pick it
 * up where they left off — from Home, or by opening the same robot again.
 * The web's lib/saved-ai-game.ts, on AsyncStorage instead of localStorage.
 *
 * Only the moves are kept: the position is rebuilt from them, as the game
 * screen always does. A finished game, or one started over, is cleared.
 * Storage that is unreadable just means there is nothing to resume.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Opponent } from "./engines";

const KEY = "jtrax.aiGame";

export type SavedAiGame = {
  opponent: Opponent;
  moves: string[];
  /** When the first move was made, for History once the game ends. */
  startedAt: string | null;
  savedAt: string;
};

const OPPONENTS: Opponent[] = ["novice", "strong", "expert"];

/** Whether stored JSON is a game this build can resume. */
export function parseSavedAiGame(raw: string | null): SavedAiGame | null {
  if (!raw) return null;
  try {
    const g = JSON.parse(raw) as Partial<SavedAiGame>;
    if (!g || !OPPONENTS.includes(g.opponent as Opponent)) return null;
    if (!Array.isArray(g.moves) || g.moves.length === 0 || !g.moves.every((m) => typeof m === "string")) return null;
    return { opponent: g.opponent as Opponent, moves: g.moves, startedAt: g.startedAt ?? null, savedAt: g.savedAt ?? "" };
  } catch {
    return null;
  }
}

export async function loadSavedAiGame(): Promise<SavedAiGame | null> {
  try {
    return parseSavedAiGame(await AsyncStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export async function saveAiGame(game: Omit<SavedAiGame, "savedAt">): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...game, savedAt: new Date().toISOString() }));
  } catch {
    /* Storage off or full: nothing to resume later. */
  }
}

export async function clearSavedAiGame(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* Nothing stored, nothing to clear. */
  }
}
