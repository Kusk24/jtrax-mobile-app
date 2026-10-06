import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useLocale, useTranslations } from "use-intl";
import { Chess } from "chess.js";
import { Bot } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { PlayShell, Panel } from "@/components/game/PlayShell";
import { ResultDialog } from "@/components/game/ResultDialog";
import { ChessBoard } from "@/components/game/ChessBoard";
import { CapturedTray } from "@/components/game/CapturedTray";
import { StockfishWebView, type StockfishHandle } from "@/components/game/StockfishWebView";
import { OnnxWebView, type OnnxHandle } from "@/components/game/OnnxWebView";
import { useAiOpponent } from "@/components/game/useAiOpponent";
import { PrimaryPill } from "@/components/student/kit";
import { MODEL_BASE_URL, OPPONENTS, type Opponent } from "@/lib/engines";
import { capturedIn, endingOf, gameFrom, pairedMoves, type Ending } from "@/lib/chess-core";
import { recordSoloGame } from "@/lib/progress";
import { clearSavedAiGame, loadSavedAiGame, saveAiGame } from "@/lib/saved-ai-game";

/* A game against one robot, chosen on the Games tab — the web's AiGame. Three
   opponents, and they are three different models rather than one engine
   turned down — see useAiOpponent.ts.

   An unfinished game is kept on the phone after every move, so leaving by any
   route keeps it: reopening the same robot (or Home's Resume card) picks it
   up. A finished game is recorded once, so it counts in History and can be
   replayed there.

   Two engines are mounted at once: Stockfish for the Advanced robot, and a
   shared ONNX WebView for the two models the academy trained. The trained
   pair need EXPO_PUBLIC_MODEL_BASE_URL set; without it they report
   unavailable and Stockfish still works. */
export default function AiScreen() {
  const t = useTranslations("play");
  const t3 = useTranslations("sv3");
  const ts = useTranslations("st");
  const locale = useLocale();
  const { pp } = usePalette();
  const stockfish = useRef<StockfishHandle>(null);
  const onnx = useRef<OnnxHandle>(null);

  /* Chosen on the Games tab; this screen plays that one robot. */
  const { opponent: wanted } = useLocalSearchParams<{ opponent?: string }>();
  const opponent: Opponent = (OPPONENTS as readonly string[]).includes(wanted ?? "") ? (wanted as Opponent) : "novice";
  const [stockfishReady, setStockfishReady] = useState(false);
  const [stockfishFailed, setStockfishFailed] = useState(false);
  const [onnxReady, setOnnxReady] = useState(false);
  const [onnxFailed, setOnnxFailed] = useState(false);

  const [moves, setMoves] = useState<string[]>([]);
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [ending, setEnding] = useState<Ending>(null);
  /* Separate from `ending` so dismissing does not un-finish the game, and a
     new game can raise it again. */
  const [showResult, setShowResult] = useState(false);
  const [thinking, setThinking] = useState(false);
  /* Until the saved game has been read, nothing is saved over it. */
  const [restored, setRestored] = useState(false);
  // Guards a reply arriving for a game the player already restarted.
  const generation = useRef(0);
  /* When this game's first move was made, and which game was last recorded —
     so a finished game is recorded exactly once. */
  const startedAt = useRef<string | null>(null);
  const recorded = useRef(-1);

  const { failed: runtimeFailed, setFailed: setRuntimeFailed, bestMove } = useAiOpponent(
    opponent,
    { onnx, stockfish },
  );

  const usesStockfish = opponent === "expert";
  const ready = usesStockfish ? stockfishReady : onnxReady;
  const failed = runtimeFailed || (usesStockfish ? stockfishFailed : onnxFailed);

  const sync = useCallback((next: string[]) => {
    const replayed = gameFrom(next);
    if (!replayed) return;
    setMoves(next);
    setGame(replayed);
    const over = endingOf(replayed);
    setEnding(over);
    setShowResult(!!over);
  }, []);

  function reset() {
    generation.current += 1;
    startedAt.current = null;
    setThinking(false);
    setRuntimeFailed(false);
    void clearSavedAiGame();
    sync([]);
  }

  /* An unfinished game against this robot: picked up where it stopped. */
  useEffect(() => {
    let alive = true;
    loadSavedAiGame().then((kept) => {
      if (!alive) return;
      if (kept && kept.opponent === opponent) {
        startedAt.current = kept.startedAt;
        sync(kept.moves);
      }
      setRestored(true);
    });
    return () => {
      alive = false;
    };
  }, [opponent, sync]);

  /* Kept after every move, so leaving by any route keeps the game; a finished
     one is cleared — it is in History now. */
  useEffect(() => {
    if (!restored) return;
    if (ending) void clearSavedAiGame();
    else if (moves.length > 0) void saveAiGame({ opponent, moves, startedAt: startedAt.current });
  }, [moves, ending, opponent, restored]);

  /* Recorded once, so it counts in History like any other game. */
  useEffect(() => {
    if (!ending || recorded.current === generation.current || moves.length === 0) return;
    recorded.current = generation.current;
    recordSoloGame({
      opponent,
      moves,
      result: ending.result,
      reason: ending.reason,
      startedAt: startedAt.current ?? undefined,
    }).catch(() => {
      /* Not saved (offline): the game still happened on screen, it just is
         not in History. */
    });
  }, [ending, moves, opponent]);

  function onMove(uci: string) {
    if (thinking || ending) return;
    if (!startedAt.current) startedAt.current = new Date().toISOString().slice(0, 19).replace("T", " ");
    sync([...moves, uci]);
  }

  /* The engine answers whenever it is black's turn and the game is live. */
  useEffect(() => {
    if (!ready || ending || thinking || game.turn() !== "b") return;
    const mine = generation.current;
    setThinking(true);
    // Each opponent wants the position in its own terms: Stockfish takes the
    // UCI move list, the novice model reads the game as PGN text, Maia a FEN.
    void bestMove(moves, game.history(), game.fen()).then((uci) => {
      if (mine !== generation.current) return; // restarted mid-think
      setThinking(false);
      if (uci) sync([...moves, uci]);
    });
  }, [ready, ending, thinking, game, moves, bestMove, sync]);

  const captured = capturedIn(game);
  const resultKey = ending ? (ending.result === "1/2-1/2" ? "draw" : ending.result === "1-0" ? "youWon" : "youLost") : null;

  return (
    <PlayShell title={t3("playVsAi")} back="/student/play" sound>
      <StockfishWebView
        ref={stockfish}
        onReady={() => setStockfishReady(true)}
        onFailed={() => setStockfishFailed(true)}
      />
      <OnnxWebView
        ref={onnx}
        baseUrl={MODEL_BASE_URL}
        onReady={() => setOnnxReady(true)}
        onFailed={() => setOnnxFailed(true)}
      />

      {/* You always play White here, so the robot sits at the top of the
          board, with what each side has taken beside its name. */}
      <View className="gap-1.5">
        <View className="flex-row items-center justify-between gap-2 px-1">
          <View className="flex-row items-center gap-1.5">
            <Bot size={16} color={pp.blue} strokeWidth={2.2} />
            <Text className="font-pp-bold text-[13px] text-pp-ink">{t3(`robotName.${opponent}`)}</Text>
          </View>
          <CapturedTray side="b" pieces={captured.byBlack} advantage={captured.advantage} />
        </View>
        <ChessBoard
          game={game}
          orientation="w"
          /* Not gated on `ready`: your move is yours whether or not the
             opponent has finished loading; the reply simply waits. */
          canMove={!thinking && !ending && game.turn() === "w"}
          onMove={onMove}
          lastMove={moves.length ? moves[moves.length - 1] : undefined}
        />
        <View className="flex-row items-center justify-between gap-2 px-1">
          <Text className="font-pp-bold text-[12px] text-pp-ink">{t("you")}</Text>
          <CapturedTray side="w" pieces={captured.byWhite} advantage={captured.advantage} />
        </View>
      </View>

      <Panel className="py-2.5">
        {failed ? (
          <Text className="text-center font-pp-bold text-[13px] text-pp-ink">
            {usesStockfish ? t("error.engine") : t("modelFailed")}
          </Text>
        ) : !ready ? (
          <View className="flex-row items-center justify-center gap-2">
            <ActivityIndicator color={pp.muted} />
            <Text className="font-pp-bold text-[13px] text-pp-ink">
              {/* The two trained models are a 26 MB and 47 MB download, so the
                  first wait is longer than waking a worker and says so. */}
              {usesStockfish ? t("engineLoading") : t("modelLoading")}
            </Text>
          </View>
        ) : (
          <Text className="text-center font-pp-bold text-[13px] text-pp-ink">
            {ending && resultKey
              ? `${t(`result.${resultKey}`)} — ${t(`reason.${ending.reason}`)}`
              : thinking
                ? t("thinking")
                : t("yourMove")}
          </Text>
        )}
      </Panel>

      {moves.length > 0 && (
        <Panel className="py-2.5">
          {pairedMoves(game.history()).map((pair) => (
            <View key={pair.no} className="flex-row">
              <Text className="w-8 font-pp text-[12px] text-pp-muted">{pair.no}.</Text>
              <Text className="w-16 font-pp text-[12px] text-pp-ink">{pair.white}</Text>
              <Text className="w-16 font-pp text-[12px] text-pp-ink">{pair.black ?? ""}</Text>
            </View>
          ))}
        </Panel>
      )}

      <PrimaryPill label={t("newGame")} onPress={reset} className="min-h-12" />

      <ResultDialog
        visible={!!ending && showResult}
        title={resultKey ? t(`result.${resultKey}`) : ""}
        detail={ending ? t("byReason", { reason: t(`reason.${ending.reason}`) }) : undefined}
        outcome={resultKey === "draw" ? "draw" : resultKey === "youWon" ? "win" : resultKey ? "loss" : null}
        facts={[
          { label: ts("opponent"), value: t3(`robotName.${opponent}`) },
          { label: ts("youPlayed"), value: ts("side.white") },
          { label: ts("moves"), value: Math.ceil(moves.length / 2) },
          { label: ts("when"), value: new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) },
        ]}
        primaryLabel={t("newGame")}
        onPrimary={() => {
          setShowResult(false);
          reset();
        }}
        onClose={() => setShowResult(false)}
      />
    </PlayShell>
  );
}
