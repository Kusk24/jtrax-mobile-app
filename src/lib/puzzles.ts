/**
 * The daily puzzle set, from the academy's own bank.
 *
 * The same endpoints the web portal uses, so a pupil sees one set of puzzles
 * whichever device they pick up — and the same rule holds here: the solution
 * stays on the server. A move is submitted and graded, never checked here.
 */
import { Chess } from "chess.js";
import { api } from "./api";

export type DailyPuzzle = {
  puzzleId: string;
  fen: string;
  rating: number;
  themes: string;
  /** Which colour the pupil plays, so the board can be turned round for them. */
  side: "White" | "Black";
  /** How many of the pupil's own moves the solution needs — enough to say
      "mate in 2" without saying which moves. */
  moveCount: number;
  solved: boolean;
  wrongMoves: number;
};

export type DailySet = {
  puzzles: DailyPuzzle[];
  /** Every puzzle in the bank has been set to this pupil before. Puzzles are
      never repeated, so there is genuinely nothing left to give. */
  exhausted: boolean;
  unseen: number;
};

export type Verdict = {
  correct: boolean;
  /** The whole puzzle is finished, not just this move. */
  solved: boolean;
  /** The opponent's reply, when the puzzle continues. */
  reply: string;
  /** The position after the move and any reply — the server's view, which is
      the one that counts. */
  fen: string;
};

export const getDailyPuzzles = () => api.get<DailySet>("puzzles/daily");

/** Submits one move. `played` is the pupil's own moves so far; the opponent's
    replies come from the server's copy of the solution, so it rebuilds the
    position rather than trusting whatever the board here happens to show. */
export const attemptMove = (puzzleId: string, move: string, played: string[]) =>
  api.post<Verdict>(`puzzles/${encodeURIComponent(puzzleId)}/attempt`, { move, played });

/** Tells the server the pupil has started looking at this puzzle, so the time
    they spend on it is measured rather than guessed. Fire-and-forget: a failed
    stamp costs a practice minute, not the puzzle. */
export const openPuzzle = (puzzleId: string) =>
  api
    .post<{ started: boolean }>(`puzzles/${encodeURIComponent(puzzleId)}/open`)
    .catch(() => ({ started: false }));

export type PracticeDay = { date: string; solved: number; practised: boolean };

export type PracticeSummary = {
  /** Consecutive days ending today or yesterday. Derived on the server from
      the days actually practised — never a number this app decides. */
  streak: number;
  days: PracticeDay[];
  todaySolved: number;
  todayTotal: number;
};

export const getPracticeSummary = () => api.get<PracticeSummary>("practice/summary");

/** A game positioned at the puzzle, or null if the server sent a FEN this
    board cannot load — in which case the puzzle is skipped rather than drawn
    wrong. */
export function gameAt(fen: string): Chess | null {
  try {
    return new Chess(fen);
  } catch {
    return null;
  }
}

/** How many of today's set are done. */
export const solvedCount = (puzzles: DailyPuzzle[]) => puzzles.filter((p) => p.solved).length;

/**
 * Where to send a pupil after they solve one: the first still unsolved,
 * skipping the one they have just finished, or -1 when the set is done.
 *
 * `justSolved` is skipped explicitly rather than trusted to be marked, because
 * the caller is mid-update — the row is flagged solved in the same tick and
 * reading it back here would depend on which state landed first.
 */
export function nextUnsolved(puzzles: DailyPuzzle[], justSolved: number): number {
  return puzzles.findIndex((p, i) => i !== justSolved && !p.solved);
}

/** What to call the puzzle in one line: "Mate in 2", else the best move. */
export function puzzleGoal(p: DailyPuzzle): { key: "mateIn" | "winIn"; count: number } {
  const mate = /\bmateIn\d?\b/i.test(p.themes) || /\bmate\b/i.test(p.themes);
  return { key: mate ? "mateIn" : "winIn", count: Math.max(1, p.moveCount) };
}
