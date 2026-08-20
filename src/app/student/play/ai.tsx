import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Chess } from "chess.js";
import { PlayShell, Panel } from "@/components/game/PlayShell";
import { ChessBoard } from "@/components/game/ChessBoard";
import { StockfishWebView, type StockfishHandle } from "@/components/game/StockfishWebView";
import { endingOf, gameFrom, pairedMoves, type Ending } from "@/lib/chess-core";
import { C } from "@/lib/colors";

/** Difficulty as a chess school would set it. Stockfish's floor is Elo 1320,
    which still beats every pupil here, so the easy levels are made easy by
    capping search depth instead. Identical to the web app's table. */
const LEVELS = {
  1: { depth: 1 },
  2: { depth: 2 },
  3: { depth: 4 },
  4: { depth: 8, elo: 1500 },
  5: { depth: 12, elo: 2000 },
} as const;

type Level = keyof typeof LEVELS;

export default function AiScreen() {
  const t = useTranslations("play");
  const engine = useRef<StockfishHandle>(null);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [level, setLevel] = useState<Level>(2);
  const [moves, setMoves] = useState<string[]>([]);
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [ending, setEnding] = useState<Ending>(null);
  const [thinking, setThinking] = useState(false);
  // Guards a reply arriving for a game the player already restarted.
  const generation = useRef(0);

  const sync = useCallback((next: string[]) => {
    const replayed = gameFrom(next);
    if (!replayed) return;
    setMoves(next);
    setGame(replayed);
    setEnding(endingOf(replayed));
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onFailed = useCallback(() => setFailed(true), []);

  function reset() {
    generation.current += 1;
    setThinking(false);
    sync([]);
  }

  /* The engine answers whenever it is black's turn and the game is live. */
  useEffect(() => {
    if (!ready || ending || thinking || game.turn() !== "b") return;
    const mine = generation.current;
    setThinking(true);
    const { depth, elo } = LEVELS[level] as { depth: number; elo?: number };
    void engine.current?.bestMove(moves, depth, elo).then((uci) => {
      if (mine !== generation.current) return; // restarted mid-think
      setThinking(false);
      if (uci) sync([...moves, uci]);
    });
  }, [ready, ending, thinking, game, moves, level, sync]);

  return (
    <PlayShell title={t("vsComputer")}>
      {!failed && <StockfishWebView ref={engine} onReady={onReady} onFailed={onFailed} />}

      {failed ? (
        <Panel><Text className="font-sans-bold text-sm text-ink">{t("error.engine")}</Text></Panel>
      ) : (
        <>
          <Panel className="!p-3">
            <Text className="mb-2 font-sans-bold text-sm text-ink">{t("level")}</Text>
            <View className="flex-row gap-1.5">
              {([1, 2, 3, 4, 5] as Level[]).map((l) => (
                <Pressable
                  key={l}
                  onPress={() => setLevel(l)}
                  accessibilityLabel={`level-${l}`}
                  className={`flex-1 items-center rounded-xl border-2 py-2 ${
                    level === l ? "border-highlight bg-highlight" : "border-line bg-paper"
                  }`}
                >
                  <Text className="font-sans-bold text-sm text-ink">{l}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="mt-2 font-sans text-xs leading-5 text-muted">{t(`levelHint.${level}`)}</Text>
          </Panel>

          <ChessBoard
            game={game}
            orientation="w"
            canMove={ready && !thinking && !ending && game.turn() === "w"}
            onMove={(uci) => !thinking && !ending && sync([...moves, uci])}
            lastMove={moves.length ? moves[moves.length - 1].slice(2, 4) : undefined}
          />

          <Panel className="!py-2.5">
            {!ready ? (
              <View className="flex-row items-center justify-center gap-2">
                <ActivityIndicator color={C.navy} />
                <Text className="font-sans-bold text-sm text-ink">{t("engineLoading")}</Text>
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
        </>
      )}
    </PlayShell>
  );
}
