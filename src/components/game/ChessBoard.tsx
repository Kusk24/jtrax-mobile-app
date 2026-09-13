import { useEffect, useState } from "react";
import { Animated, Easing, Pressable, Text, View, useWindowDimensions } from "react-native";
import { SvgXml } from "react-native-svg";
import { useTranslations } from "use-intl";
import type { Chess } from "chess.js";
import { isPromotion, movesFrom, squareName, squareToRC, toGrid } from "@/lib/chess-core";
import { pieceArt } from "@/lib/piece-art";
import { C } from "@/lib/colors";

/**
 * The board, in React Native.
 *
 * Same behaviour as the web component — tap a piece, tap a square — but sized
 * from the viewport rather than a fixed pixel grid, because a phone is whatever
 * width it is and a chess board that needs scrolling is not a chess board.
 */

/* Board squares in the academy's blues, matching the web board. The move
   highlights stay warm on purpose: a blue highlight on a blue board is not a
   highlight. */
const LIGHT = "#eef3fa";
const DARK = "#a3b6d2";
const SELECTED = "#f2d98c";
const LAST = "#e4d7b0";
const PROMOTION_CHOICES = ["q", "r", "b", "n"] as const;

/** Long enough to read as a move rather than a repaint, short enough that a
    child waiting for their turn is not waiting on an animation. */
const SLIDE_MS = 320;

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
  /** The last move, as a full UCI pair (`e2e4`). Both of its squares are
      highlighted and the arriving piece slides in from the first — a move that
      simply appeared can now be seen happening. */
  lastMove?: string;
}) {
  const t = useTranslations("play");
  const { width } = useWindowDimensions();
  const [from, setFrom] = useState<string | null>(null);
  const [pending, setPending] = useState<{ from: string; to: string } | null>(null);

  // 32px of page padding plus the board's own 10px frame on each side.
  const board = Math.min(width - 32 - 20, 360);
  const cell = Math.floor(board / 8);

  /* The arriving piece starts at the square it came from and is animated to
     zero. Native has no CSS transition to lean on, so the offset is a value we
     drive ourselves — which is also why it is a ref: re-creating it on a
     re-render would restart the animation mid-flight. */
  /* Lazy `useState`, not `useRef().current`: the transform below reads this
     during render, and reading a ref while rendering is the thing React warns
     about. The initialiser runs once, so the value is still never re-created
     mid-animation. */
  const [slide] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  /* Derived, not stored. The square being animated is always the one the last
     move landed on, and between moves `slide` rests at zero — so the transform
     is the identity and the piece sits where it belongs. Keeping this in state
     meant setting it from inside the effect for no gain. */
  const slidingTo = lastMove && lastMove.length >= 4 ? lastMove.slice(2, 4) : null;
  useEffect(() => {
    if (!lastMove || lastMove.length < 4) return;
    const [fr, fc] = squareToRC(lastMove.slice(0, 2));
    const [tr, tc] = squareToRC(lastMove.slice(2, 4));
    // A board turned round for Black moves pieces the other way on screen.
    const facing = orientation === "w" ? 1 : -1;
    slide.setValue({ x: (fc - tc) * cell * facing, y: (fr - tr) * cell * facing });
    const run = Animated.timing(slide, {
      toValue: { x: 0, y: 0 },
      duration: SLIDE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [lastMove, cell, orientation, slide]);

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
    <View className="self-center rounded-[20px] border-2 border-highlight bg-highlight p-2.5">
      <View style={{ width: cell * 8, height: cell * 8 }} className="overflow-hidden rounded-lg">
        {rows.map((r) => (
          <View key={r} className="flex-row">
            {cols.map((c) => {
              const name = squareName(r, c);
              const piece = grid[r][c];
              const dest = legal.find((uci) => uci.slice(2, 4) === name);
              const isCapture = !!dest && !!piece;
              const bg =
                from === name
                  ? SELECTED
                  : /* Both ends of it. Highlighting only where the piece landed
                       left a child working out where it had come from. */
                    lastMove &&
                      (lastMove.slice(0, 2) === name || lastMove.slice(2, 4) === name)
                    ? LAST
                    : (r + c) % 2 === 0
                      ? LIGHT
                      : DARK;
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
                    <Animated.View
                      style={{
                        transform:
                          slidingTo === name
                            ? [{ translateX: slide.x }, { translateY: slide.y }]
                            : undefined,
                        /* Above the squares it crosses on the way. */
                        zIndex: slidingTo === name ? 2 : 0,
                      }}
                    >
                      <SvgXml
                        xml={pieceArt(piece.color, piece.type)}
                        width={cell * 0.86}
                        height={cell * 0.86}
                      />
                    </Animated.View>
                  )}
                  {dest &&
                    (isCapture ? (
                      <View
                        style={{ borderWidth: 3, borderColor: C.gold }}
                        className="absolute inset-0.5 rounded-md"
                      />
                    ) : (
                      <View className="absolute size-3 rounded-full bg-navy/50" />
                    ))}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {pending && (
        <View className="absolute inset-0 items-center justify-center rounded-[20px] bg-navy/60">
          <View className="items-center rounded-2xl border-2 border-highlight bg-paper p-4">
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
                  className="size-12 items-center justify-center rounded-xl border-2 border-highlight bg-highlight"
                >
                  <SvgXml xml={pieceArt(game.turn(), p)} width={32} height={32} />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
