/**
 * One of the three ways to play, on Home — the web's ModeTile: a tinted tile,
 * the icon on a white well, the title and one line under it. Each opens its
 * card on the Games tab.
 */
import { Pressable, Text, View } from "react-native";

const TONE = {
  blue: { card: "border-st-indigo-line bg-st-indigo-soft", well: "border-st-indigo-line", sub: "text-pp-muted" },
  orange: { card: "border-st-amber-line bg-st-amber-soft", well: "border-st-amber-line", sub: "text-st-amber" },
  emerald: { card: "border-st-emerald-line bg-st-emerald-soft", well: "border-st-emerald-line", sub: "text-st-emerald" },
} as const;

export function ModeTile({
  tone,
  icon,
  title,
  sub,
  onPress,
}: {
  tone: keyof typeof TONE;
  icon: React.ReactNode;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  const c = TONE[tone];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${sub}`}
      className={`min-w-0 flex-1 items-center rounded-2xl border p-3.5 active:opacity-80 ${c.card}`}
    >
      <View className={`mb-2.5 size-12 items-center justify-center rounded-xl border bg-pp-card ${c.well}`}>{icon}</View>
      <Text numberOfLines={1} className="max-w-full font-pp-bold text-[13px] leading-tight text-pp-ink">
        {title}
      </Text>
      <Text numberOfLines={1} className={`mt-1 max-w-full font-pp-semibold text-[11px] ${c.sub}`}>
        {sub}
      </Text>
    </Pressable>
  );
}
