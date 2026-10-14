/**
 * The day's puzzles on Home — the web's DailyProgressCard: a soft blue card
 * with "Daily Challenge", "Let's play" (or the stars earned), "x/3 puzzles
 * completed", a star per puzzle on the right, and one button for the next
 * puzzle.
 *
 * The card's gradient and the stars are SVG: React Native has no CSS
 * gradients.
 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { useTranslations } from "use-intl";
import { Check, Clock, Play } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";

/* One star of the day's three: gold once its puzzle is solved, light blue
   until then. Rounded points, as the web draws them. */
const STAR =
  "M32 6.5c1.4 0 2.6.8 3.2 2l6.3 12.8 14.1 2c1.4.2 2.5 1.1 2.9 2.4.4 1.3.1 2.7-.9 3.7L47.4 39.3l2.4 14c.2 1.4-.3 2.7-1.4 3.5-1.1.8-2.6.9-3.8.3L32 50.5l-12.6 6.6c-1.2.6-2.7.5-3.8-.3-1.1-.8-1.6-2.1-1.4-3.5l2.4-14L6.4 29.4c-1-1-1.3-2.4-.9-3.7.4-1.3 1.5-2.2 2.9-2.4l14.1-2 6.3-12.8c.6-1.2 1.8-2 3.2-2z";
const SPARKLE = "M12 1.5c.5 4.9 2.6 7 7.5 7.5v1c-4.9.5-7 2.6-7.5 7.5h-1c-.5-4.9-2.6-7-7.5-7.5V9c4.9-.5 7-2.6 7.5-7.5z";
/* Tailwind's amber-400 / 500 / 300, the web star's colours. */
const GOLD = { fill: "#fbbf24", line: "#f59e0b", sparkle: "#fcd34d" };

function DayStar({ earned, raised }: { earned: boolean; raised: boolean }) {
  const { st } = usePalette();
  return (
    <View style={{ transform: [{ translateY: raised ? -8 : 0 }, { scale: earned ? 1.05 : 1 }] }}>
      <Svg width={48} height={48} viewBox="0 0 64 64">
        <Path
          d={STAR}
          fill={earned ? GOLD.fill : st.starEmpty}
          stroke={earned ? GOLD.line : st.starLine}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function Sparkle({ size, style }: { size: number; style: object }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={[{ position: "absolute" }, style]}>
      <Path d={SPARKLE} fill={GOLD.sparkle} />
    </Svg>
  );
}

/** One star per puzzle, the middle one raised, with sparkles. */
function DayStars({ earned, total, label }: { earned: number; total: number; label: string }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} className="flex-row items-end gap-1.5 px-1 py-3">
      <Sparkle size={14} style={{ left: -4, top: 4 }} />
      <Sparkle size={12} style={{ left: 0, bottom: -2 }} />
      <Sparkle size={14} style={{ right: -4, bottom: -2 }} />
      {Array.from({ length: total }, (_, i) => (
        <DayStar key={i} earned={i < earned} raised={total === 3 && i === 1} />
      ))}
    </View>
  );
}

export function DailyProgressCard({
  solved,
  total,
  loading,
  onOpen,
  action,
}: {
  solved: number;
  total: number;
  loading: boolean;
  /** The top of the card: the Daily Challenge page. */
  onOpen: () => void;
  action: { label: string; onPress: () => void };
}) {
  const t3 = useTranslations("sv3");
  const { st } = usePalette();
  const n = total || 3;
  const done = total > 0 && solved >= total;
  const earned = loading ? 0 : Math.min(solved, n);
  const bold = (chunks: React.ReactNode) => <Text className="font-pp-extrabold text-pp-ink">{chunks}</Text>;
  return (
    <View className="overflow-hidden rounded-[26px] border border-st-hero-line p-5">
      {/* The card's gradient, top left to bottom right. Sized by its style
          alone: a "100%" width is measured inside the card's padding, which
          left an unpainted band down the right and along the bottom. */}
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={st.heroA} />
            <Stop offset="0.5" stopColor={st.heroB} />
            <Stop offset="1" stopColor={st.heroC} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#hero)" />
      </Svg>

      <Pressable onPress={onOpen} accessibilityRole="button" className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <Clock size={14} color={st.brandDeep} strokeWidth={2.5} />
            <Text className="font-pp-extrabold text-[11px] uppercase tracking-[1.2px] text-st-brand-deep">{t3("todaysChallenge")}</Text>
          </View>
          <Text className="mt-2 font-pp-extrabold text-[18px] leading-tight text-st-brand-ink">
            {done ? t3("earnedStars", { n }) : t3("earnStars", { n })}
          </Text>
          <Text className="mt-1.5 font-pp-semibold text-[14px] text-pp-muted">
            {loading ? "…" : t3.rich("puzzlesCompleted", { n: earned, total: n, b: bold })}
          </Text>
        </View>
        <DayStars earned={earned} total={n} label={t3("starsEarned", { n: earned, total: n })} />
      </Pressable>

      <Pressable
        onPress={action.onPress}
        disabled={loading}
        accessibilityRole="button"
        className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-st-brand px-4 py-3.5 active:bg-st-brand-deep ${loading ? "opacity-70" : ""}`}
      >
        {done ? <Check size={16} color="#ffffff" strokeWidth={2.5} /> : <Play size={16} color="#ffffff" fill="#ffffff" strokeWidth={0} />}
        <Text className="font-pp-bold text-[14px] tracking-wide text-white">{action.label}</Text>
      </Pressable>
    </View>
  );
}
