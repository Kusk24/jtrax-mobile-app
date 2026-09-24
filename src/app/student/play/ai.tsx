import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Chess } from "chess.js";
import { PlayShell, Panel } from "@/components/game/PlayShell";
import { ResultDialog } from "@/components/game/ResultDialog";
import { ChessBoard } from "@/components/game/ChessBoard";
import { CapturedTray } from "@/components/game/CapturedTray";
import { StockfishWebView, type StockfishHandle } from "@/components/game/StockfishWebView";
import { OnnxWebView, type OnnxHandle } from "@/components/game/OnnxWebView";
import { useAiOpponent } from "@/components/game/useAiOpponent";
import { MODEL_BASE_URL, OPPONENTS, type Opponent } from "@/lib/engines";
import { capturedIn, endingOf, gameFrom, pairedMoves, type Ending } from "@/lib/chess-core";
import { C } from "@/lib/colors";

/* A game against the computer. Entirely local: no room, no API call, no record
   kept. Three opponents, and they are three different models rather than one
   engine turned down — see useAiOpponent.ts. Mirrors the web app's AiGame.

   Two engines are mounted at once: Stockfish for Master, and a shared ONNX
   WebView for the two models the academy trained. The trained pair need
   EXPO_PUBLIC_MODEL_BASE_URL set; without it they report unavailable and
   Stockfish still works. */
export default function AiScreen() {
  const t = useTranslations("play");
  const stockfish = useRef<StockfishHandle>(null);
  const onnx = useRef<OnnxHandle>(null);

  const [opponent, setOpponent] = useState<Opponent>("novice");
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
  // Guards a reply arriving for a game the player already restarted.
  const generation = useRef(0);

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
    setThinking(false);
    setRuntimeFailed(false);
    sync([]);
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

  return (
    <PlayShell title={t("vsComputer")} back="/student/play">
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

      <Panel className="!p-3">
        <Text className="mb-2 font-sans-bold text-sm text-ink">{t("opponent")}</Text>
        <View className="flex-row gap-1.5">
          {OPPONENTS.map((o) => {
            const selected = opponent === o;
            return (
              <Pressable
                key={o}
                onPress={() => {
                  setRuntimeFailed(false);
                  setOpponent(o);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={t(`opponentName.${o}`)}
                // The navy fill for selected, not the pale `highlight` — the
                // same fix the web app made, where gold-on-paper was invisible.
                className={`min-h-11 flex-1 items-center justify-center rounded-xl border-2 px-2 py-2 ${
                  selected ? "border-navy bg-navy" : "border-line bg-paper"
                }`}
              >
                <Text className={`font-sans-bold text-[13px] ${selected ? "text-white" : "text-ink"}`}>
                  {t(`opponentName.${o}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="mt-2 font-sans text-xs leading-5 text-muted">
          {t(`opponentHint.${opponent}`)}
        </Text>
      </Panel>

      {/* You always play White here, so the engine sits at the top of the
          board, with what each side has taken beside its name. */}
      <View className="gap-1.5">
        <View className="flex-row items-center justify-between gap-2 px-1">
          <Text className="font-sans-bold text-xs text-ink">{t("computer")}</Text>
          <CapturedTray side="b" pieces={captured.byBlack} advantage={captured.advantage} />
        </View>
        <ChessBoard
          game={game}
          orientation="w"
          /* Not gated on `ready`. Switching opponent mid-game keeps the position
             — it always did — but the new model is a 26–47 MB download, and
             while it arrived the board stopped accepting moves even on your own
             turn. It looked frozen, so switching looked broken. Your move is
             yours whether or not the opponent has finished loading; the reply
             simply waits. */
          canMove={!thinking && !ending && game.turn() === "w"}
          onMove={(uci) => !thinking && !ending && sync([...moves, uci])}
          lastMove={moves.length ? moves[moves.length - 1] : undefined}
        />
        <View className="flex-row items-center justify-between gap-2 px-1">
          <Text className="font-sans-bold text-xs text-ink">{t("you")}</Text>
          <CapturedTray side="w" pieces={captured.byWhite} advantage={captured.advantage} />
        </View>
      </View>

      <Panel className="!py-2.5">
        {failed ? (
          <Text className="text-center font-sans-bold text-sm text-ink">
            {usesStockfish ? t("error.engine") : t("modelFailed")}
          </Text>
        ) : !ready ? (
          <View className="flex-row items-center justify-center gap-2">
            <ActivityIndicator color={C.navy} />
            <Text className="font-sans-bold text-sm text-ink">
              {/* The two trained models are a 26 MB and 47 MB download, so the
                  first wait is longer than waking a worker and says so. */}
              {usesStockfish ? t("engineLoading") : t("modelLoading")}
            </Text>
          </View>
        ) : (
          <Text className="text-center font-sans-bold text-sm text-ink">
            {ending
              ? t(`result.${ending.result === "1/2-1/2" ? "draw" : ending.result === "1-0" ? "youWon" : "youLost"}`) +
                ` — ${t(`reason.${ending.reason}`)}`
              : thinking
                ? t("thinking")
                : t("yourMove")}
          </Text>
        )}
      </Panel>

      {moves.length > 0 && (
        <Panel className="!py-2.5">
          {pairedMoves(game.history()).map((pair) => (
            <View key={pair.no} className="flex-row">
              <Text className="w-8 font-sans text-xs text-muted">{pair.no}.</Text>
              <Text className="w-16 font-sans text-xs text-ink">{pair.white}</Text>
              <Text className="w-16 font-sans text-xs text-ink">{pair.black ?? ""}</Text>
            </View>
          ))}
        </Panel>
      )}

      <Pressable onPress={reset} className="items-center rounded-xl bg-navy py-3.5 active:opacity-80">
        <Text className="font-sans-bold text-sm text-white">{t("newGame")}</Text>
      </Pressable>

      <ResultDialog
        visible={!!ending && showResult}
        title={
          ending
            ? t(`result.${ending.result === "1/2-1/2" ? "draw" : ending.result === "1-0" ? "youWon" : "youLost"}`)
            : ""
        }
        detail={ending ? t("byReason", { reason: t(`reason.${ending.reason}`) }) : undefined}
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
