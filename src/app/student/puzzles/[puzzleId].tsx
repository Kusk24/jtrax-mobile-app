/**
 * One puzzle.
 *
 * Nothing here knows the answer. A tap produces a move, the move goes to the
 * server, and the server says whether it was right and what the position is
 * now — including the opponent's reply on a longer puzzle. The board follows
 * that, rather than replaying anything locally, because a board that can work
 * out the answer is a board a child can read the answer off.
 */
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import { Check, X } from "lucide-react-native";
import type { Chess } from "chess.js";
import { PlayShell, Panel } from "@/components/game/PlayShell";
import { ChessBoard } from "@/components/game/ChessBoard";
import {
  attemptMove,
  gameAt,
  getDailyPuzzles,
  nextUnsolved,
  openPuzzle,
  puzzleGoal,
  type DailyPuzzle,
} from "@/lib/puzzles";
import { C } from "@/lib/colors";

/** How long a wrong move stays on the board before it is taken back. Long
    enough to see what happened, short enough not to feel like a punishment. */
const WRONG_MS = 1200;
/** The pause after the last move of a puzzle, before moving on. */
const SOLVED_MS = 1400;

export default function PuzzleScreen() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();
  const t = useTranslations("sv2");
  const tp = useTranslations("play");

  const [puzzles, setPuzzles] = useState<DailyPuzzle[]>([]);
  const [index, setIndex] = useState(-1);
  const [game, setGame] = useState<Chess | null>(null);
  /* The pupil's own moves, which is what the grader wants — it replays the
     opponent from its copy of the solution. */
  const [played, setPlayed] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const puzzle = index >= 0 ? puzzles[index] : undefined;

  /** Puts a puzzle on the board and starts its clock server-side. Only the
      first open counts, so coming back after a wrong answer continues the same
      sitting rather than starting a new one. */
  const load = useCallback((set: DailyPuzzle[], at: number) => {
    const p = set[at];
    setIndex(at);
    setGame(p ? gameAt(p.fen) : null);
    setPlayed([]);
    setSolved(p?.solved ?? false);
    setWrong(false);
    setMessage("");
    if (p && !p.solved) void openPuzzle(p.puzzleId);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDailyPuzzles()
      .then((set) => {
        if (cancelled) return;
        setPuzzles(set.puzzles);
        const at = set.puzzles.findIndex((p) => p.puzzleId === puzzleId);
        if (at >= 0) load(set.puzzles, at);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [puzzleId, load]);

  function reset() {
    if (!puzzle) return;
    setGame(gameAt(puzzle.fen));
    setPlayed([]);
    setSolved(false);
    setWrong(false);
    setMessage("");
  }

  async function submit(uci: string) {
    if (!puzzle || !game || solved) return;
    let verdict;
    try {
      verdict = await attemptMove(puzzle.puzzleId, uci, played);
    } catch {
      setMessage(tp("error.unreachable"));
      return;
    }

    // The server returns the position after the move and any reply, so the
    // board follows its view rather than replaying the reply here.
    const next = gameAt(verdict.fen);
    if (next) setGame(next);

    if (!verdict.correct) {
      setWrong(true);
      setMessage(t("wrongMsg"));
      setTimeout(() => {
        setGame(gameAt(puzzle.fen));
        setPlayed([]);
        setWrong(false);
        setMessage("");
      }, WRONG_MS);
      return;
    }

    setPlayed((prev) => [...prev, uci]);
    setWrong(false);

    if (!verdict.solved) {
      // A longer puzzle: the opponent has replied and it is their move again.
      setMessage(t("keepGoingMsg"));
      return;
    }

    setSolved(true);
    setMessage(t("checkmateMsg"));
    const after = puzzles.map((row, i) => (i === index ? { ...row, solved: true } : row));
    setPuzzles(after);
    const onward = nextUnsolved(after, index);
    setTimeout(() => {
      if (onward >= 0) {
        router.replace(`/student/puzzles/${after[onward].puzzleId}`);
        load(after, onward);
      } else {
        router.replace("/student/puzzles");
      }
    }, SOLVED_MS);
  }

  if (loading) {
    return (
      <PlayShell title={t("puzzles")} back="/student/puzzles">
        <Panel className="flex-row items-center justify-center gap-2">
          <ActivityIndicator color={C.navy} />
          <Text className="font-sans-bold text-sm text-ink">{t("puzzlesLoading")}</Text>
        </Panel>
      </PlayShell>
    );
  }

  if (!puzzle || !game) {
    return (
      <PlayShell title={t("puzzles")} back="/student/puzzles">
        <Panel>
          <Text className="font-sans-bold text-sm text-ink">{t("puzzlesUnavailable")}</Text>
        </Panel>
      </PlayShell>
    );
  }

  const goal = puzzleGoal(puzzle);

  return (
    <PlayShell title={t("puzzleN", { n: index + 1 })} back="/student/puzzles">
      {/* Whose move and what to look for, from this puzzle — not the one line
          "White to move — mate in 1" that used to sit above every position. */}
      <Text className="-mt-1 text-center font-sans-bold text-xs text-muted">
        {t(goal.key === "mateIn" ? "toMoveGoalMate" : "toMoveGoalBest", {
          side: t(puzzle.side === "White" ? "sideWhite" : "sideBlack"),
          count: goal.count,
        })}
      </Text>

      {/* The slot is always here and never takes a tap.
          Showing the banner only when there is something to say moved the
          board down by its height — so a child who had just been told "not
          quite" tapped their next square and hit the message instead, or hit
          the square above the one they meant. Reserved space and
          `pointerEvents="none"` together mean the board does not move and the
          message cannot be in the way. */}
      <View pointerEvents="none" className="h-9 justify-center">
        {message !== "" && (
          <View
            className={`flex-row items-center justify-center gap-1.5 self-center rounded-2xl px-3 py-2 ${
              solved ? "bg-olive-soft" : wrong ? "bg-brick-soft" : "bg-highlight"
            }`}
          >
            {solved && <Check size={16} color={C.olive} strokeWidth={3} />}
            {wrong && <X size={16} color={C.maroon} strokeWidth={3} />}
            <Text
              className={`font-sans-bold text-xs ${
                solved ? "text-olive" : wrong ? "text-maroon" : "text-highlight-ink"
              }`}
            >
              {message}
            </Text>
          </View>
        )}
      </View>

      <ChessBoard
        game={game}
        orientation={puzzle.side === "Black" ? "b" : "w"}
        canMove={!solved}
        onMove={submit}
      />

      <Pressable
        onPress={reset}
        disabled={solved}
        className="items-center self-center rounded-full bg-navy px-7 py-2.5 active:opacity-80 disabled:opacity-60"
      >
        <Text className="font-sans-bold text-sm text-white">{t("reset")}</Text>
      </Pressable>
    </PlayShell>
  );
}
