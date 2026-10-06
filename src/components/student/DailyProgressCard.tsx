/**
 * The day's puzzles on Home — the web's DailyProgressCard: a soft blue card
 * with "Today's challenge", "x of 3 completed" and a line under it, the
 * progress ring on the right, and one button for the next puzzle.
 *
 * The card's gradient and the ring are SVG: React Native has no CSS
 * gradients, and the ring's arc is a dash along a circle.
 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useTranslations } from "use-intl";
import { Check, Clock, Play } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";

/** The day's progress as a ring, the percentage inside and a tick once done. */
function ProgressRing({ pct }: { pct: number }) {
  const { st } = usePalette();
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <View accessible={false} className="size-[74px] items-center justify-center">
      <Svg width={74} height={74} viewBox="0 0 74 74" style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={37} cy={37} r={r} fill="none" stroke={st.ring} strokeWidth={6.5} />
        {pct > 0 && (
          <Circle
            cx={37}
            cy={37}
            r={r}
            fill="none"
            stroke={st.brand}
            strokeWidth={6.5}
            strokeLinecap="round"
            strokeDasharray={`${(c * pct) / 100} ${c}`}
          />
        )}
      </Svg>
      <Text className="font-pp-extrabold text-[14px] text-st-brand-ink">{pct}%</Text>
      {pct >= 100 && (
        <View className="absolute -bottom-1 -right-0.5 size-5 items-center justify-center rounded-full border-2 border-pp-card bg-pp-green">
          <Check size={12} color="#ffffff" strokeWidth={3} />
        </View>
      )}
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
  const pct = n > 0 ? Math.round((Math.min(solved, n) / n) * 100) : 0;
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

      <Pressable onPress={onOpen} accessibilityRole="button" className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <Clock size={14} color={st.brandDeep} strokeWidth={2.5} />
            <Text className="font-pp-extrabold text-[11px] uppercase tracking-[1.2px] text-st-brand-deep">{t3("todaysChallenge")}</Text>
          </View>
          <Text className="mt-1 font-pp-extrabold text-[22px] leading-tight text-pp-ink">
            {loading ? "…" : t3("completedOf", { n: solved, total: n })}
          </Text>
          <Text className="mt-1 font-pp-semibold text-[12px] leading-snug text-pp-muted">
            {done ? t3("dailyDoneBody") : t3("dailyBody", { n })}
          </Text>
        </View>
        <ProgressRing pct={loading ? 0 : pct} />
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
