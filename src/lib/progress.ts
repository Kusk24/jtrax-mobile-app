/**
 * The student's progress and history — the web's lib/progress.ts, on the
 * phone's API client.
 *
 * Everything here is read from the server, which works the numbers out from
 * what was actually recorded (jtrax-backend internal/api/progress.go and
 * history.go). The phone never adds anything up itself.
 */
import { api } from "./api";

export type ChallengeDay = {
  date: string;
  solved: number;
  total: number;
  complete: boolean;
  points: number;
};

export type Progress = {
  points: { total: number; puzzles: number; games: number; challenges: number };
  level: { level: number; into: number; toNext: number; size: number };
  streak: { current: number; longest: number };
  gamesPlayed: number;
  gamesWon: number;
  puzzlesSolved: number;
  challengesCompleted: number;
  challenges: ChallengeDay[];
  practisedDays: string[];
};

export type HistoryEntry = {
  kind: "solo" | "room" | "puzzle";
  id: string;
  at: string;
  day: string;
  against: string;
  result?: string;
  reason?: string;
  moves?: number;
  startedAt?: string;
  source?: "daily" | "free" | "list";
  lichessGameId?: string;
  opponent?: string;
  side?: "white" | "black";
  timeControl?: string;
  gameType?: "computer" | "class" | "challenge";
  points?: number;
};

export const getProgress = () => api.get<Progress>("student/progress");

export const getHistory = (studentId: string) =>
  api
    .get<{ history: HistoryEntry[] }>(`students/${encodeURIComponent(studentId)}/history`)
    .then((r) => r.history);

/** A finished game against the computer, so it counts and can be replayed. */
export const recordSoloGame = (game: { opponent: string; moves: string[]; result: string; reason: string; startedAt?: string }) =>
  api.post<{ recorded: boolean }>("games/solo", game);

export type SoloGame = {
  id: string;
  opponent: string;
  side: "white" | "black";
  moves: string[];
  result: string;
  reason: string;
  at: string;
};

export const getSoloGame = (id: string) => api.get<SoloGame>(`games/solo/${encodeURIComponent(id)}`);

/** Win, loss or draw, from the pupil's side of the board. */
export function outcomeOf(result: string | undefined, side: "white" | "black" | undefined): "win" | "loss" | "draw" | null {
  if (!result || !side) return null;
  if (result === "1/2-1/2") return "draw";
  const whiteWon = result === "1-0";
  return whiteWon === (side === "white") ? "win" : "loss";
}

/** A finished game, not one still on the board. */
export const isFinishedGame = (e: HistoryEntry) => (e.kind === "solo" || e.kind === "room") && !!e.result;

/** A UTC stamp from the server ("2026-09-28 08:30:00") as a Date. */
export function stampDate(at: string): Date {
  return new Date(at.includes("T") ? at : at.replace(" ", "T") + "Z");
}

/** The academy's calendar day, as the server writes it. */
export function academyToday(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}
