/**
 * Three numbers that say where a player stands — their rating, the games they
 * have played and the puzzles they have solved — three across on Profile. The
 * web's SummaryPills (components/student/HomeScreen.tsx).
 */
import { Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { ChessKnight, Puzzle, Star } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";

const TONE = {
  amber: "bg-st-gold-soft",
  blue: "bg-pp-soft",
  violet: "bg-pp-plum-soft",
} as const;

/** One summary number: a small flat icon, the value, and its label under it. */
function StatPill({
  tone,
  icon,
  value,
  small,
  label,
}: {
  tone: keyof typeof TONE;
  icon: React.ReactNode;
  value: string;
  /** For a value that is words rather than a number ("Not rated"). */
  small?: boolean;
  label: string;
}) {
  return (
    <View className="min-w-0 flex-1 gap-1 rounded-xl border-[1.5px] border-pp-line bg-pp-card px-2.5 py-2">
      <View className={`size-6 items-center justify-center rounded-md ${TONE[tone]}`}>{icon}</View>
      <Text numberOfLines={1} className={`font-pp-bold leading-tight text-pp-ink ${small ? "text-[11px]" : "text-[15px]"}`}>
        {value}
      </Text>
      <Text numberOfLines={1} className="font-pp-semibold text-[10px] uppercase tracking-wide text-pp-muted">
        {label}
      </Text>
    </View>
  );
}

export function SummaryPills({
  rating,
  gamesPlayed,
  puzzlesSolved,
}: {
  /** A synced Lichess rating, or null — "Not rated" rather than a 0. */
  rating: { perf: string; value: number } | null;
  /** Null until the numbers load, drawn as a dash. */
  gamesPlayed: number | null;
  puzzlesSolved: number | null;
}) {
  const t3 = useTranslations("sv3");
  const tl = useTranslations("lichess");
  const { pp } = usePalette();
  return (
    <View className="flex-row gap-2">
      <StatPill
        tone="amber"
        icon={<Star size={14} color="#facc15" fill="#facc15" strokeWidth={0} />}
        value={rating ? String(rating.value) : t3("notRated")}
        small={!rating}
        label={rating ? tl(`perf.${rating.perf}`) : t3("ratingPill")}
      />
      <StatPill
        tone="blue"
        icon={<ChessKnight size={14} color={pp.blue} strokeWidth={2.2} />}
        value={gamesPlayed === null ? "—" : String(gamesPlayed)}
        label={t3("gamesPill")}
      />
      <StatPill
        tone="violet"
        icon={<Puzzle size={14} color={pp.deep} strokeWidth={2.2} />}
        value={puzzlesSolved === null ? "—" : String(puzzlesSolved)}
        label={t3("puzzlesPill")}
      />
    </View>
  );
}
