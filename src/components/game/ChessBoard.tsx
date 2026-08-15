import { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useTranslations } from "use-intl";
import type { Chess } from "chess.js";
import { PIECE_GLYPH, isPromotion, movesFrom, squareName, toGrid } from "@/lib/chess-core";

/**
 * The board, in React Native.
 *
 * Same behaviour as the web component — tap a piece, tap a square — but sized
 * from the viewport rather than a fixed pixel grid, because a phone is whatever
 * width it is and a chess board that needs scrolling is not a chess board.
 */

const LIGHT = "#f8f6eb";
const DARK = "#c4a5a5";
const SELECTED = "#ffe387";
const LAST = "#eedea8";
const PROMOTION_CHOICES = ["q", "r", "b", "n"] as const;

export function ChessBoard({
  game,
  orientation,
  canMove,
  onMove,
  lastMove,
}: {
  game: Chess;
  orientation: "w" | "b";
  canMove: boolean;
  onMove: (uci: string) => void;
  lastMove?: string;
}) {
  const t = useTranslations("play");
  const { width } = useWindowDimensions();
  const [from, setFrom] = useState<string | null>(null);
  const [pending, setPending] = useState<{ from: string; to: string } | null>(null);

  // 32px of page padding plus the board's own 10px frame on each side.
  const board = Math.min(width - 32 - 20, 360);
  const cell = Math.floor(board / 8);

  const grid = toGrid(game);
  const legal = from ? movesFrom(game, from) : [];
  const rows = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  function tap(name: string) {
    if (!canMove) return;
    const piece = game.get(name as never);
    // Tapping your own piece re-aims rather than attempting a capture, which
    // is what a mis-tap on a small screen usually means.
    if (piece && piece.color === game.turn()) {
      setFrom(name === from ? null : name);
      return;
    }
    if (!from) return;
    const target = legal.filter((uci) => uci.slice(2, 4) === name);
    if (target.length === 0) {
      setFrom(null);
      return;
    }
    if (isPromotion(game, from, name)) {
      setPending({ from, to: name });
      return;
    }
    onMove(target[0]);
    setFrom(null);
  }

  return (
    <View className="self-center rounded-[20px] border-2 border-peach bg-peach p-2.5">
      <View style={{ width: cell * 8, height: cell * 8 }} className="overflow-hidden rounded-lg">
        {rows.map((r) => (
          <View key={r} className="flex-row">
            {cols.map((c) => {
              const name = squareName(r, c);
              const piece = grid[r][c];
              const dest = legal.find((uci) => uci.slice(2, 4) === name);
              const isCapture = !!dest && !!piece;
              const bg =
                from === name ? SELECTED : lastMove === name ? LAST : (r + c) % 2 === 0 ? LIGHT : DARK;
              return (
                <Pressable
                  key={name}
                  onPress={() => tap(name)}
                  disabled={!canMove}
                  accessibilityLabel={name}
                  style={{ width: cell, height: cell, backgroundColor: bg }}
                  className="items-center justify-center"
                >
                  {piece && (
                    <Text
                      style={{
                        fontSize: cell * 0.72,
                        lineHeight: cell,
                        color: piece.color === "w" ? "#fffbf0" : "#5a322a",
                      }}
                    >
                      {PIECE_GLYPH[piece.color + piece.type]}
                    </Text>
                  )}
                  {dest &&
                    (isCapture ? (
                      <View
                        style={{ borderWidth: 3, borderColor: "rgba(207,132,40,0.85)" }}
                        className="absolute inset-0.5 rounded-md"
                      />
                    ) : (
                      <View className="absolute size-3 rounded-full bg-[rgba(116,84,44,0.5)]" />
                    ))}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {pending && (
        <View className="absolute inset-0 items-center justify-center rounded-[20px] bg-[rgba(109,61,52,0.55)]">
          <View className="items-center rounded-2xl border-2 border-peach bg-cream p-4">
            <Text className="mb-2 font-sans-bold text-xs text-maroon">{t("promote")}</Text>
            <View className="flex-row gap-1.5">
              {PROMOTION_CHOICES.map((p) => (
                <Pressable
                  key={p}
                  accessibilityLabel={t(`piece.${p}`)}
                  onPress={() => {
                    onMove(pending.from + pending.to + p);
                    setPending(null);
                    setFrom(null);
                  }}
                  className="size-12 items-center justify-center rounded-xl border-2 border-peach bg-peach"
                >
                  <Text style={{ fontSize: 30, color: game.turn() === "w" ? "#fffbf0" : "#5a322a" }}>
                    {PIECE_GLYPH[game.turn() + p]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
