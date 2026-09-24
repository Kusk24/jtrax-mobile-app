/**
 * One puzzle — from today's set, or from Free Play when opened as
 * `/student/puzzles/free?tier=…`.
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
  getFreePuzzle,
  isFreeTier,
  nextUnsolved,
  openPuzzle,
  puzzleGoal,
  type DailyPuzzle,
  type FreeTier,
} from "@/lib/puzzles";
import { C } from "@/lib/colors";
import { moveBetween, moveFrom, playSound, preloadSounds, soundForMove } from "@/lib/sound";

/** How long a wrong move stays on the board before it is taken back. Long
    enough to see what happened, short enough not to feel like a punishment. */
const WRONG_MS = 1200;
/** The pause after the last move of a puzzle, before moving on. */
const SOLVED_MS = 1400;

/** The heading for each Free Play level. */
const TIER_TITLE: Record<FreeTier, "beginnerPuzzles" | "intermediatePuzzles" | "advancedPuzzles"> = {
  beginner: "beginnerPuzzles",
  intermediate: "intermediatePuzzles",
  advanced: "advancedPuzzles",
};

export default function PuzzleScreen() {
  const { puzzleId, tier } = useLocalSearchParams<{ puzzleId: string; tier?: string }>();
  /* Free Play shares this screen: the same board, the same grader. What
     differs is where the puzzle comes from and what happens after it. */
  const freeTier = puzzleId === "free" && isFreeTier(tier) ? tier : null;
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
  /* Free Play only: the pupil has seen every puzzle at this level. */
  const [exhausted, setExhausted] = useState(false);

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

  /* One puzzle at the chosen level. Each call is a fresh request: the server
     may top the bank up from Lichess, so there is nothing to pre-load. The
     solved board stays up while the next one is fetched, rather than
     flashing a spinner between puzzles. */
  const loadFree = useCallback(
    (level: FreeTier, isCancelled: () => boolean = () => false) => {
      getFreePuzzle(level)
        .then((res) => {
          if (isCancelled()) return;
          if (!res.puzzle) {
            setExhausted(true);
            setPuzzles([]);
            setIndex(-1);
            return;
          }
          setExhausted(false);
          setPuzzles([res.puzzle]);
          load([res.puzzle], 0);
        })
        .catch(() => {})
        .finally(() => !isCancelled() && setLoading(false));
    },
    [load],
  );

  useEffect(() => {
    preloadSounds();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (freeTier) {
      loadFree(freeTier, () => cancelled);
      return () => {
        cancelled = true;
      };
    }
    // A Free Play link with no level it recognises has nothing to open; the
    // render below says so without waiting on anything.
    if (puzzleId === "free") return;
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
  }, [puzzleId, freeTier, load, loadFree]);

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

    /* Sound follows what the pupil sees: their move lands with the new
       position, and any reply a beat later, like an opponent answering. */
    const mine = moveFrom(game.fen(), uci);
    if (mine) playSound(soundForMove(mine));

    if (!verdict.correct) {
      setWrong(true);
      setMessage(t("wrongMsg"));
      setTimeout(() => playSound("wrong"), 180);
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
      const reply = mine ? moveBetween(mine.after, verdict.fen) : null;
      if (reply) setTimeout(() => playSound(soundForMove(reply)), 350);
      return;
    }

    setTimeout(() => playSound("game-end"), 300);
    setSolved(true);
    setMessage(t("checkmateMsg"));

    /* A free puzzle is not part of today's set, so it marks nothing solved
       there. The pupil chose to keep going, so the next one at the same level
       comes instead. */
    if (freeTier) {
      setTimeout(() => loadFree(freeTier), SOLVED_MS);
      return;
    }

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

  const badFreeLink = puzzleId === "free" && !freeTier;

  if (loading && !badFreeLink) {
    return (
      <PlayShell title={t("puzzles")} back="/student/puzzles">
        <Panel className="flex-row items-center justify-center gap-2">
          <ActivityIndicator color={C.navy} />
          <Text className="font-sans-bold text-sm text-ink">{t("puzzlesLoading")}</Text>
        </Panel>
      </PlayShell>
    );
  }

  const title = freeTier ? t(TIER_TITLE[freeTier]) : t("puzzleN", { n: index + 1 });

  if (!puzzle || !game) {
    return (
      <PlayShell title={freeTier ? title : t("puzzles")} back="/student/puzzles">
        <Panel>
          <Text className="font-sans-bold text-sm text-ink">
            {exhausted ? t("tierExhausted") : t("puzzlesUnavailable")}
          </Text>
        </Panel>
      </PlayShell>
    );
  }

  const goal = puzzleGoal(puzzle);

  return (
    <PlayShell title={title} back="/student/puzzles" sound>
      {/* Whose move and what to look for, from this puzzle — not the one line
          "White to move — mate in 1" that used to sit above every position. */}
      <Text className="-mt-1 text-center font-sans-bold text-xs text-muted">
        {t(goal.key === "mateIn" ? "toMoveGoalMate" : "toMoveGoalBest", {
          side: t(puzzle.side === "White" ? "sideWhite" : "sideBlack"),
          count: goal.count,
        })}
      </Text>

      {/* One slot above the board for whatever there is to say about this
          puzzle, and only one thing at a time: what just happened, or — on
          reopening one already beaten — that it is finished (the board is
          locked then, and without the card it would give no word why).
          The slot is always here, the height of the card, and never takes a
          tap. Showing a banner only when there was something to say moved the
          board down by its height — so a child who had just been told "not
          quite" tapped their next square and hit the message instead. The
          feedback used to be a small pill; it is plain, larger text now, which
          reads at a glance. */}
      <View pointerEvents="none" className="h-[60px] justify-center">
        {message !== "" ? (
          <View className="flex-row items-center justify-center gap-2">
            {solved && <Check size={20} color={C.olive} strokeWidth={3} />}
            {wrong && <X size={20} color={C.maroon} strokeWidth={3} />}
            <Text
              className={`text-center font-sans-bold text-lg ${
                solved ? "text-olive" : wrong ? "text-maroon" : "text-ink"
              }`}
            >
              {message}
            </Text>
          </View>
        ) : solved ? (
          <View className="flex-row items-center gap-3 rounded-card border-2 border-olive-soft bg-olive-soft px-3.5 py-2.5">
            <View className="size-9 shrink-0 items-center justify-center rounded-full bg-olive">
              <Check size={20} color={C.white} strokeWidth={3} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-sans-bold text-sm text-ink">{t("completedTitle")}</Text>
              <Text className="font-sans text-[11px] text-muted">{t("completedBody")}</Text>
            </View>
          </View>
        ) : null}
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
