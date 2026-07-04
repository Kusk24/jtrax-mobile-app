import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { sessionHistory } from "@/lib/teacher-data";
import { C } from "@/lib/colors";

export default function TeacherAttendanceScreen() {
  const t = useTranslations();
  const byDate = new Map<string, typeof sessionHistory>();
  for (const session of sessionHistory) {
    const list = byDate.get(session.date) ?? [];
    list.push(session);
    byDate.set(session.date, list);
  }

  return (
    <Screen>
      <Text className="text-center font-sans-extrabold text-2xl text-navy">
        {t("attendance.teacherHistoryTitle")}
      </Text>

      {[...byDate.entries()].map(([date, sessions]) => (
        <View key={date}>
          <Text className="font-sans-extrabold text-lg text-ink">{date}</Text>
          <View className="mt-3 gap-3">
            {sessions.map((session) => {
              const total =
                session.presentIds.length + session.absentIds.length;
              return (
                <Link
                  key={session.id}
                  href={`/teacher/attendance/${session.id}` as never}
                  asChild
                >
                  <Pressable className="flex-row items-center gap-3 rounded-card border-2 border-navy/20 bg-card p-4 shadow-clay active:border-navy/60">
                    <View className="min-w-0 flex-1">
                      <Text className="font-sans-bold text-base text-navy">
                        {session.course} ({session.section})
                      </Text>
                      <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
                        <View className="flex-row items-center gap-1">
                          <CalendarDays size={14} color={C.navy} />
                          <Text className="font-sans text-xs text-muted">
                            {session.time}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <MapPin size={14} color={C.navy} />
                          <Text className="font-sans text-xs text-muted">
                            {session.location}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text className="font-sans-bold text-sm text-navy">
                      {t("attendance.presentOf", {
                        present: session.presentIds.length,
                        total,
                      })}
                    </Text>
                    <ChevronRight size={16} color={C.navy} />
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </View>
      ))}
    </Screen>
  );
}
