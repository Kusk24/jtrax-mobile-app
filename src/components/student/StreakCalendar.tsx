/**
 * This week, Monday to Sunday, with the days practised lit — the web's
 * StreakCalendar (components/student/kit.tsx). Days still to come are dashed,
 * so the pupil can see how much of the week is left to keep the streak; today
 * has a ring until something is done.
 */
import { Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { thisWeek } from "@/lib/streak-week";

export function StreakCalendar({ practised, today }: { practised: string[]; today: string }) {
  const t = useTranslations("sv2");
  const lit = new Set(practised);
  return (
    <View className="w-full gap-1.5">
      <View className="flex-row gap-1.5">
        {[0, 1, 2, 3, 4, 5, 6].map((w) => (
          <Text key={w} className="flex-1 text-center font-pp-semibold text-[11px] text-pp-muted">
            {t(`weekday.${w}`)}
          </Text>
        ))}
      </View>
      <View className="flex-row gap-1.5">
        {thisWeek(today).map((d) => {
          const box = d.future
            ? "border-[1.5px] border-dashed border-pp-line"
            : lit.has(d.key)
              ? "bg-[#f08a3c]"
              : d.key === today
                ? "border-[1.5px] border-pp-blue"
                : "bg-pp-bg";
          const ink = d.future ? "text-pp-faint" : lit.has(d.key) ? "text-white" : d.key === today ? "text-pp-blue" : "text-pp-faint";
          return (
            <View key={d.key} className={`aspect-square flex-1 items-center justify-center rounded-lg ${box}`}>
              <Text className={`font-pp-semibold text-[11.5px] ${ink}`}>{d.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
