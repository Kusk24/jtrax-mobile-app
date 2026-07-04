import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  MapPin,
  Users,
} from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { TeacherHeader } from "@/components/TeacherHeader";
import { TeacherClassCard } from "@/components/TeacherClassCard";
import { myClasses, upcomingClass, weeklyProgress } from "@/lib/teacher-data";
import { C } from "@/lib/colors";

const weeklyStats = [
  {
    icon: CalendarDays,
    value: weeklyProgress.totalSessions,
    labelKey: "totalSessions",
  },
  {
    icon: Clock,
    value: weeklyProgress.remainingSessions,
    labelKey: "remainingSessions",
  },
  {
    icon: CheckCircle2,
    value: weeklyProgress.hoursTaught,
    labelKey: "hoursTaught",
  },
] as const;

export default function TeacherHome() {
  const t = useTranslations("home");
  return (
    <Screen>
      <TeacherHeader classCount={1} />

      <View className="rounded-card bg-peach/60 px-5 py-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-bold text-base text-ink">
            {t("weeklyProgress")}
          </Text>
          <Text className="font-sans-extrabold text-sm text-navy">
            {weeklyProgress.pct}%
          </Text>
        </View>
        <View className="mt-2 h-2 w-full overflow-hidden rounded-full bg-card">
          <View
            className="h-full rounded-full bg-navy"
            style={{ width: `${weeklyProgress.pct}%` }}
          />
        </View>
        <View className="mt-3 flex-row">
          {weeklyStats.map(({ icon: Icon, value, labelKey }, i) => (
            <View
              key={labelKey}
              className={`flex-1 flex-row items-center justify-center gap-2 px-2 ${
                i > 0 ? "border-l border-line" : ""
              }`}
            >
              <Icon size={16} color={C.navy} />
              <View className="shrink">
                <Text className="font-sans-extrabold text-sm text-ink">
                  {value}
                </Text>
                <Text className="font-sans text-[10px] leading-3 text-muted">
                  {t(labelKey)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View>
        <Text className="font-sans-extrabold text-lg text-ink">
          {t("upcomingClass")}
        </Text>
        <View className="mt-3 gap-4">
          <TeacherClassCard session={upcomingClass} withActions />
        </View>
      </View>

      <View>
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-extrabold text-lg text-ink">
            {t("myClasses", { count: myClasses.length })}
          </Text>
          <Link href="/teacher/schedule" asChild>
            <Pressable className="flex-row items-center gap-0.5">
              <Text className="font-sans-semibold text-sm text-navy">
                {t("viewAll")}
              </Text>
              <ChevronRight size={16} color={C.navy} />
            </Pressable>
          </Link>
        </View>
        <View className="mt-3 flex-row gap-4">
          {myClasses.map((cls) => (
            <View
              key={cls.id}
              className="flex-1 overflow-hidden rounded-card border-2 border-navy/20 bg-card shadow-clay"
            >
              <View className="h-24 items-center justify-center bg-olive-soft">
                <Crown size={36} color={C.olive} />
              </View>
              <View className="gap-1.5 p-3">
                <Text className="font-sans-bold text-sm text-navy">
                  {cls.course} ({cls.section})
                </Text>
                <View className="flex-row items-center gap-1.5">
                  <CalendarDays size={14} color={C.navy} />
                  <Text className="font-sans text-xs text-ink">{cls.day}</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Users size={14} color={C.navy} />
                  <Text className="font-sans text-xs text-ink">
                    {t("studentsOfCapacity", {
                      count: cls.studentsEnrolled,
                      capacity: cls.capacity,
                    })}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <MapPin size={14} color={C.navy} />
                  <Text className="font-sans text-xs text-ink">
                    {cls.location} - {cls.room}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
