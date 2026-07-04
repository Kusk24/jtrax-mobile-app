import { Text, View } from "react-native";
import { useTranslations } from "use-intl";

export function SessionProgress({
  labelKey = "attendance.sessionProgress",
  count,
  total,
}: {
  labelKey?: string;
  count: number;
  total: number;
}) {
  const t = useTranslations();
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <View className="rounded-card bg-navy-soft/40 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <View className="size-2 rounded-full bg-olive" />
          <Text className="font-sans-semibold text-sm text-ink">
            {t(labelKey)}
          </Text>
        </View>
        <Text className="font-sans text-sm text-muted">
          <Text className="font-sans-extrabold text-lg text-ink">{count}</Text>/
          {total}
        </Text>
      </View>
      <View className="mt-2 h-2 w-full overflow-hidden rounded-full bg-card">
        <View
          className="h-full rounded-full bg-olive"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
