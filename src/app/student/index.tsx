import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { ChevronRight, TriangleAlert } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { StudentHeader } from "@/components/StudentHeader";
import { ClassCard } from "@/components/ClassCard";
import { student, upcomingToday } from "@/lib/student-data";
import { C } from "@/lib/colors";

export default function StudentHome() {
  const t = useTranslations("home");
  return (
    <Screen>
      <StudentHeader />

      {student.lowCredits && (
        <View className="flex-row items-center gap-4 rounded-card bg-peach px-5 py-4">
          <TriangleAlert size={28} color={C.peach} fill={C.peachInk} />
          <View className="min-w-0 flex-1">
            <Text className="font-sans-bold text-base text-ink">
              {t("lowCreditsTitleSelf")}
            </Text>
            <Text className="font-sans text-xs text-muted">
              {t("lowCreditsBody")}
            </Text>
          </View>
        </View>
      )}

      <View>
        <Text className="font-sans-extrabold text-lg text-ink">
          {t("upcomingClasses")}
        </Text>
        <View className="mt-3 gap-4">
          <ClassCard
            session={upcomingToday}
            child={student}
            hideStudentPanel
            action={
              <Link href="/student/checkin" asChild>
                <Pressable className="flex-row items-center gap-1 rounded-full bg-navy px-5 py-2 shadow-clay active:bg-navy-deep">
                  <Text className="font-sans-semibold text-sm text-white">
                    {t("checkIn")}
                  </Text>
                  <ChevronRight size={16} color={C.white} />
                </Pressable>
              </Link>
            }
          />
        </View>
      </View>
    </Screen>
  );
}
