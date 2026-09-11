/**
 * The two card shapes the student home is built from.
 *
 * A `StatTile` is one number a pupil has earned — it is never a placeholder,
 * because a child reads a number on their own screen as something true about
 * them. A `HomeAction` is one of the things they came here to do.
 */
import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import type { Href } from "expo-router";

export function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center gap-2.5 rounded-2xl border-2 border-line bg-card px-3 py-2.5 shadow-clay">
      <View className="size-9 shrink-0 items-center justify-center rounded-xl bg-highlight">
        {icon}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans-extrabold text-base leading-5 text-ink">{value}</Text>
        <Text numberOfLines={1} className="mt-0.5 font-sans-semibold text-[10px] text-muted">
          {label}
        </Text>
      </View>
    </View>
  );
}

export function HomeAction({
  href,
  label,
  body,
  icon,
  tone,
}: {
  href: Href;
  label: string;
  body: string;
  icon: React.ReactNode;
  tone: "mint" | "lilac";
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        className={`min-w-0 flex-1 justify-between gap-3 rounded-card border-2 p-3.5 shadow-clay active:opacity-80 ${
          tone === "mint" ? "border-olive-soft bg-olive-soft" : "border-highlight bg-highlight"
        }`}
      >
        <View className="size-10 items-center justify-center rounded-xl bg-card">{icon}</View>
        <View>
          <Text className="font-sans-bold text-sm text-ink">{label}</Text>
          <Text className="mt-0.5 font-sans text-[10.5px] leading-4 text-muted">{body}</Text>
        </View>
      </Pressable>
    </Link>
  );
}
