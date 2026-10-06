/**
 * One puzzle as a row. The Puzzles list and the Daily Challenge page draw
 * them alike, as the web's do: the puzzle's board, a name from its Lichess
 * themes, its level and rating, and a tick once solved.
 */
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Check, ChevronRight } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { MiniBoard } from "@/components/student/MiniBoard";
import { puzzleTitleKey } from "@/lib/puzzle-title";
import type { DailyPuzzle, FreeTier } from "@/lib/puzzles";

/** Each level keeps one colour, on the filter tags and on every row. */
export const LEVEL_INK: Record<FreeTier, string> = {
  beginner: "text-pp-green",
  intermediate: "text-pp-blue",
  advanced: "text-pp-amber",
};

export function PuzzleRow({
  puzzle,
  tier,
  onPress,
}: {
  puzzle: DailyPuzzle;
  tier: FreeTier;
  onPress: () => void;
}) {
  const t = useTranslations("sv2");
  const t3 = useTranslations("sv3");
  const { pp } = usePalette();
  const name = t3(`theme.${puzzleTitleKey(puzzle.themes)}`);
  const level = t3(`level.${tier}`);
  const rated = t("ratingLabel", { rating: puzzle.rating });
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[name, level, rated, puzzle.solved ? t("solvedLabel") : ""].filter(Boolean).join(", ")}
      className={`flex-row items-center gap-3 rounded-xl border bg-pp-card px-2.5 py-2.5 active:bg-pp-mist ${
        puzzle.solved ? "border-pp-green-soft" : "border-pp-line"
      }`}
    >
      <MiniBoard fen={puzzle.fen} flipped={puzzle.side === "Black"} />
      <View className="min-w-0 flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-pp-bold text-[14px] text-pp-ink">
          {name}
        </Text>
        <Text numberOfLines={1} className="text-[12px]">
          <Text className={`font-pp-semibold ${LEVEL_INK[tier]}`}>{level}</Text>
          <Text className="font-pp text-pp-muted"> • {rated}</Text>
        </Text>
      </View>
      {puzzle.solved ? (
        <View className="size-6 items-center justify-center rounded-full bg-pp-green">
          <Check size={14} color="#ffffff" strokeWidth={3.2} />
        </View>
      ) : (
        <ChevronRight size={20} color={pp.blue} strokeWidth={2.4} />
      )}
    </Pressable>
  );
}
