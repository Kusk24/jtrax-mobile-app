/**
 * One puzzle on the board — from today's set (`?set=daily`) or from the
 * practice list (`?set=list`, with `level` when the list was filtered).
 *
 * Nothing here knows the answer. A tap produces a move, the move goes to the
 * server, and the server says whether it was right and what the position is
 * now — including the opponent's reply on a longer puzzle. The reply lands a
 * beat after the pupil's own move, as the robot answers in a game: both at
 * once hid what the opponent did.
 *
 * Solving one moves on in place: the next unsolved of the day, or the next
 * unticked one on the list in the same level; at the end of the day's set,
 * the dialog that says so.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import { Check, RotateCcw, Target, X } from "lucide-react-native";
import type { Chess } from "chess.js";
import { usePalette } from "@/components/ThemeProvider";
import { PlayShell, Panel } from "@/components/game/PlayShell";
import { ChessBoard } from "@/components/game/ChessBoard";
import { Card, SecondaryPill } from "@/components/student/kit";
import { DailyCompleteDialog } from "@/components/student/DailyCompleteDialog";
import {
  attemptListMove,
  attemptMove,
  gameAt,
  getDailyPuzzles,
  getPuzzleList,
  isFreeTier,
  nextOnList,
  nextUnsolved,
  openListPuzzle,
  openPuzzle,
  puzzleGoal,
  type DailyPuzzle,
  type FreeTier,
  type ListPuzzle,
  type Verdict,
} from "@/lib/puzzles";
import { moveBetween, moveFrom, playSound, preloadSounds, soundForMove } from "@/lib/sound";

/** How long the opponent "thinks" before a puzzle's reply lands — the same
    feel as the robot's minimum think time. */
const REPLY_PAUSE_MS = 550;
/** How long a wrong move stays on the board before it is taken back. Long
    enough to see what happened, short enough not to feel like a punishment. */
const WRONG_MS = 1200;
/** The pause after the last move of a puzzle, before moving on. */
const SOLVED_MS = 1400;

/** The heading on a list puzzle: one puzzle, so "Beginner puzzle". */
const TIER_TITLE: Record<FreeTier, "beginnerPuzzle" | "intermediatePuzzle" | "advancedPuzzle"> = {
  beginner: "beginnerPuzzle",
  intermediate: "intermediatePuzzle",
  advanced: "advancedPuzzle",
};

export default function PuzzleScreen() {
  const { puzzleId, set, level: levelParam } = useLocalSearchParams<{ puzzleId: string; set?: string; level?: string }>();
  const onList = set === "list";
  /* The list's filter when the puzzle was opened, so moving on stays in it. */
  const level: FreeTier | "" = isFreeTier(levelParam) ? levelParam : "";
  const t = useTranslations("sv2");
  const ts = useTranslations("st");
  const t3 = useTranslations("sv3");
  const tp = useTranslations("play");
  const { pp } = usePalette();

  const [puzzles, setPuzzles] = useState<(DailyPuzzle | ListPuzzle)[]>([]);
  const [index, setIndex] = useState(-1);
  const [game, setGame] = useState<Chess | null>(null);
  /* The pupil's own moves, which is what the grader wants — it replays the
     opponent from its copy of the solution. */
  const [played, setPlayed] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState(false);
  /* The pupil's move is on the board and the opponent's reply is coming. */
  const [waiting, setWaiting] = useState(false);
  const [message, setMessage] = useState("");
  const [lastMove, setLastMove] = useState<string | undefined>();
  /* A list puzzle solved again today: said so under the board. */
  const [replay, setReplay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  /* Bumped whenever the board is reset or changed, so a reply or a take-back
     still on its way does not land on a board the pupil has moved away from. */
  const boardGen = useRef(0);

  const puzzle = index >= 0 ? puzzles[index] : undefined;

  /** Puts a puzzle on the board and starts its clock server-side. Only the
      first open counts, so coming back after a wrong answer continues the
      same sitting. A list puzzle opens ready to play even when ticked:
      playing it again is allowed, it just earns nothing. */
  const load = useCallback(
    (rows: (DailyPuzzle | ListPuzzle)[], at: number) => {
      boardGen.current += 1;
      const p = rows[at];
      setIndex(at);
      setGame(p ? gameAt(p.fen) : null);
      setPlayed([]);
      setSolved(onList ? false : (p?.solved ?? false));
      setWrong(false);
      setWaiting(false);
      setMessage("");
      setReplay(false);
      setLastMove(undefined);
      if (p && onList) void openListPuzzle(p.puzzleId);
      else if (p && !p.solved) void openPuzzle(p.puzzleId);
    },
    [onList],
  );

  useEffect(() => {
    preloadSounds();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const rows: Promise<(DailyPuzzle | ListPuzzle)[]> = onList
      ? getPuzzleList().then((l) => l.puzzles)
      : getDailyPuzzles().then((s) => s.puzzles);
    rows
      .then((list) => {
        if (cancelled) return;
        setPuzzles(list);
        const at = list.findIndex((p) => p.puzzleId === puzzleId);
        if (at >= 0) load(list, at);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [puzzleId, onList, load]);

  function reset() {
    boardGen.current += 1;
    setGame(puzzle ? gameAt(puzzle.fen) : null);
    setPlayed([]);
    setSolved(false);
    setWrong(false);
    setWaiting(false);
    setMessage("");
    setLastMove(undefined);
  }

  async function submit(uci: string) {
    const p = puzzle;
    if (!p || !game || solved || waiting) return;
    let verdict: Verdict;
    try {
      verdict = onList ? await attemptListMove(p.puzzleId, uci, played) : await attemptMove(p.puzzleId, uci, played);
    } catch {
      setMessage(tp("error.unreachable"));
      return;
    }

    /* The server returns the position after the move and any reply. When the
       puzzle goes on, the pupil's own move is shown first and the reply a
       beat later. The board still ends on the server's position. */
    const next = gameAt(verdict.fen);
    const mine = moveFrom(game.fen(), uci);
    const gen = boardGen.current;
    if (verdict.correct && !verdict.solved && mine) {
      const afterMine = gameAt(mine.after);
      if (afterMine) setGame(afterMine);
      setLastMove(uci.slice(0, 4));
      setWaiting(true);
      const reply = moveBetween(mine.after, verdict.fen);
      setTimeout(() => {
        if (gen !== boardGen.current) return;
        if (next) setGame(next);
        if (reply) {
          setLastMove(reply.from + reply.to);
          playSound(soundForMove(reply));
        }
        setWaiting(false);
      }, REPLY_PAUSE_MS);
    } else if (next) {
      setGame(next);
      setLastMove(uci.slice(0, 4));
    }

    /* Sound follows what the pupil sees: their move now, the reply with it. */
    if (mine) playSound(soundForMove(mine));

    if (!verdict.correct) {
      setWrong(true);
      setMessage(t("wrongMsg"));
      setTimeout(() => playSound("wrong"), 180);
      setTimeout(() => {
        if (gen !== boardGen.current) return;
        setGame(gameAt(p.fen));
        setPlayed([]);
        setWrong(false);
        setMessage("");
        setLastMove(undefined);
      }, WRONG_MS);
      return;
    }

    setPlayed((prev) => [...prev, uci]);
    setWrong(false);

    if (!verdict.solved) {
      // A longer puzzle: the opponent replies and it is the pupil's move again.
      setMessage(t("keepGoingMsg"));
      return;
    }

    setTimeout(() => playSound("game-end"), 300);
    setSolved(true);
    setMessage(t("checkmateMsg"));
    setReplay(onList && verdict.firstSolve !== true);

    const after = puzzles.map((row, i) => (i === index ? { ...row, solved: true } : row));
    setPuzzles(after);
    const onward = onList ? nextOnList(after as ListPuzzle[], index, level) : nextUnsolved(after, index);
    setTimeout(() => {
      if (gen !== boardGen.current) return;
      if (onward >= 0) load(after, onward);
      /* Everything shown is ticked: back to the list it came from. */
      else if (onList) router.back();
      else setCelebrate(true);
    }, SOLVED_MS);
  }

  if (loading) {
    return (
      <PlayShell title={t("puzzles")}>
        <Panel className="flex-row items-center justify-center gap-2">
          <ActivityIndicator color={pp.muted} />
          <Text className="font-pp-bold text-sm text-pp-ink">{t("puzzlesLoading")}</Text>
        </Panel>
      </PlayShell>
    );
  }

  if (!puzzle || !game) {
    return (
      <PlayShell title={t("puzzles")}>
        <Panel>
          <Text className="font-pp-bold text-sm text-pp-ink">{t("puzzlesUnavailable")}</Text>
        </Panel>
      </PlayShell>
    );
  }

  const goal = puzzleGoal(puzzle);
  const title = onList
    ? `${t(TIER_TITLE[(puzzle as ListPuzzle).tier])} · ${index + 1}`
    : t("puzzleN", { n: index + 1 });

  return (
    <>
      <PlayShell title={title} sub={t("ratingLabel", { rating: puzzle.rating })} sound>
        <ChessBoard
          game={game}
          orientation={puzzle.side === "Black" ? "b" : "w"}
          canMove={!solved && !waiting && !wrong}
          onMove={submit}
          lastMove={lastMove}
          look="card"
        />

        <Card>
          <View className="flex-row items-center gap-1.5">
            <Target size={16} color={pp.blue} strokeWidth={2.2} />
            <Text className="font-pp-bold text-[12px] uppercase tracking-[1.4px] text-pp-muted">{t("yourGoal")}</Text>
          </View>
          <Text className="mt-1.5 font-pp-display-bold text-[17px] text-pp-ink">
            {t(goal.key === "mateIn" ? "toMoveGoalMate" : "toMoveGoalBest", {
              side: t(puzzle.side === "White" ? "sideWhite" : "sideBlack"),
              count: goal.count,
            })}
          </Text>
        </Card>

        {/* One slot for what just happened, the same height whether or not
            there is anything in it, so nothing below it jumps. */}
        <View className="min-h-[76px] justify-center" accessibilityLiveRegion="polite">
          {solved ? (
            <View className="flex-row items-center gap-3 rounded-2xl border-[1.5px] border-pp-green-soft bg-pp-green-soft px-4 py-3.5">
              <View className="size-10 items-center justify-center rounded-full bg-pp-green">
                <Check size={20} color="#ffffff" strokeWidth={3} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-pp-bold text-[15px] text-pp-ink">{ts("puzzleComplete")}</Text>
                {replay && <Text className="font-pp-semibold text-[13px] text-pp-green">{t3("solvedAgain")}</Text>}
              </View>
            </View>
          ) : message ? (
            <View
              className={`flex-row items-center gap-2.5 rounded-2xl px-4 py-3.5 ${wrong ? "bg-pp-red-soft" : "bg-pp-soft"}`}
            >
              {wrong ? (
                <X size={20} color={pp.red} strokeWidth={3} />
              ) : (
                <Check size={20} color={pp.green} strokeWidth={3} />
              )}
              <Text className={`min-w-0 flex-1 font-pp-semibold text-[15px] ${wrong ? "text-pp-red" : "text-pp-ink"}`}>
                {message}
              </Text>
            </View>
          ) : null}
        </View>

        <SecondaryPill
          label={t("reset")}
          icon={<RotateCcw size={16} color={pp.ink} />}
          onPress={reset}
          className="w-full"
        />
      </PlayShell>

      {celebrate && (
        <DailyCompleteDialog
          onHome={() => {
            setCelebrate(false);
            router.dismissTo("/student");
          }}
          onMore={() => {
            setCelebrate(false);
            router.dismissTo("/student/puzzles");
          }}
        />
      )}
    </>
  );
}
