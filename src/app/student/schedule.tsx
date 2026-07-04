import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Screen } from "@/components/Screen";
import { ClassCard } from "@/components/ClassCard";
import { scheduleByDate, scheduleWeek, student } from "@/lib/student-data";

export default function StudentScheduleScreen() {
  const t = useTranslations();
  const [selected, setSelected] = useState(
    scheduleWeek.find((d) => d.isToday)!.date,
  );
  const sessions = scheduleByDate[selected] ?? [];
  const isToday = scheduleWeek.find((d) => d.date === selected)?.isToday;

  return (
    <Screen>
      <Text className="text-center font-sans-extrabold text-2xl text-navy">
        {t("schedule.title")}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row gap-2 px-1 pt-3"
      >
        {scheduleWeek.map((day) => {
          const active = day.date === selected;
          return (
            <Pressable
              key={day.date}
              onPress={() => setSelected(day.date)}
              className={`relative w-14 items-center rounded-xl border px-2 pb-2 pt-3 ${
                active
                  ? "border-navy bg-card shadow-clay"
                  : "border-transparent bg-navy-soft/70"
              }`}
            >
              {day.isToday && (
                <View className="absolute -top-2.5 rounded-md bg-navy px-2 py-0.5">
                  <Text className="font-sans-semibold text-[10px] text-white">
                    {t("days.today")}
                  </Text>
                </View>
              )}
              <Text className="font-sans-extrabold text-lg text-navy">
                {day.date}
              </Text>
              <Text className="font-sans text-[11px] text-muted">
                {t(`days.${day.label}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View>
        <Text className="font-sans-extrabold text-lg text-ink">
          {isToday
            ? t("schedule.todayClass", { count: sessions.length })
            : t("schedule.classes", { count: sessions.length })}
        </Text>
        <View className="mt-3 gap-4">
          {sessions.map((session) => (
            <ClassCard key={session.id} session={session} child={student} />
          ))}
        </View>
        {sessions.length === 0 && (
          <View className="mt-6 rounded-card bg-card/70 px-4 py-10">
            <Text className="text-center font-sans text-sm text-muted">
              {t("schedule.empty")}
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
