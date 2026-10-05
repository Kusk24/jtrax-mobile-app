/**
 * A puzzle's position as a small thumbnail — the Puzzles list shows each
 * puzzle's own board, turned round for a pupil playing Black, as the board it
 * opens is. Decorative: the row beside it names the puzzle.
 */
import { useMemo } from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import { miniBoardSvg } from "@/lib/mini-board";

export function MiniBoard({ fen, flipped = false, size = 56 }: { fen: string; flipped?: boolean; size?: number }) {
  const xml = useMemo(() => miniBoardSvg(fen, flipped), [fen, flipped]);
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
      className="shrink-0 overflow-hidden rounded-md border border-pp-line bg-pp-line"
    >
      {xml && <SvgXml xml={xml} width="100%" height="100%" />}
    </View>
  );
}
