import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { ChevronRight, Trophy, TriangleAlert } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { StudentHeader } from "@/components/StudentHeader";
import { ClassCard } from "@/components/ClassCard";
import { student, upcomingToday } from "@/lib/student-data";
import { C } from "@/lib/colors";
import { LiveTournamentBanner } from "@/components/LiveTournamentBanner";

export default function StudentHome() {
  const t = useTranslations("home");
  const tp = useTranslations("sv2");
  return (
    <Screen>
      <StudentHeader />

      <LiveTournamentBanner />

      {student.lowCredits && (
        <View className="flex-row items-center gap-4 rounded-card bg-highlight px-5 py-4">
          <TriangleAlert size={28} color={C.highlight} fill={C.highlightInk} />
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

      {/* The way in to today's puzzles. The nav gains a Puzzles tab when the
          home screen itself becomes the portal's; until then this card is how
          a pupil reaches them at all. */}
      <Link href="/student/puzzles" asChild>
        <Pressable className="flex-row items-center gap-3.5 rounded-card border-2 border-line bg-card p-4 shadow-clay active:opacity-80">
          <View className="size-12 items-center justify-center rounded-2xl bg-highlight">
            <Trophy size={24} color={C.highlightInk} strokeWidth={2.2} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans-bold text-base text-ink">{tp("todaysChallenge")}</Text>
            <Text className="mt-1 font-sans text-xs leading-5 text-muted">
              {tp("challengeHint")}
            </Text>
          </View>
          <ChevronRight size={18} color={C.muted} />
        </Pressable>
      </Link>

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
