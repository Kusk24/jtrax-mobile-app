import { Link, router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  History,
  MapPin,
  XCircle,
} from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Avatar } from "@/components/Avatar";
import { CreditBar } from "@/components/CreditBar";
import { PawnIcon } from "@/components/PawnIcon";
import {
  childAttendanceHistory,
  enrolledClasses,
  getChild,
} from "@/lib/parent-data";
import { C } from "@/lib/colors";

const card = "rounded-card border-2 border-line bg-card p-4 shadow-clay";

export default function ChildProfileScreen() {
  const t = useTranslations();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const child = getChild(childId);
  if (!child) return null;

  const low = child.lowCredits;
  const classes = enrolledClasses[child.id] ?? [];
  const history = childAttendanceHistory[child.id] ?? [];
  const attended = child.credits.used;
  const remaining = child.credits.remaining;

  return (
    <Screen gapClass="gap-5">
      <View className="flex-row items-center justify-center">
        <Pressable
          onPress={() => router.back()}
          className="absolute left-0 rounded-full p-1.5"
        >
          <ArrowLeft size={24} color={C.navy} />
        </Pressable>
        <Text className="font-sans-extrabold text-2xl text-navy">
          {t("profile.childProfile", { name: child.name })}
        </Text>
      </View>

      <View className={card}>
        <View className="flex-row items-center gap-4">
          <Avatar
            name={child.name}
            colorClass={child.avatarColor}
            sizeClass="size-14"
          />
          <View>
            <Text className="font-sans-bold text-base text-ink">
              {child.name}
            </Text>
            <Text className="font-sans text-xs text-muted">
              {t("common.idLabel", { id: child.studentId })}
            </Text>
            <Text className="font-sans text-xs text-muted">
              {t("profile.levelAge", { level: child.level, age: child.age })}
            </Text>
          </View>
        </View>
        <View
          className={`mt-4 rounded-xl p-4 ${low ? "bg-brick-soft/70" : "bg-olive-soft/70"}`}
        >
          <View className="flex-row items-baseline justify-between">
            <Text
              className={`font-sans-bold text-base ${low ? "text-brick" : "text-ink"}`}
            >
              {t("profile.remainingCredits")}
            </Text>
            <Text
              className={`font-sans-extrabold text-lg ${low ? "text-brick" : "text-ink"}`}
            >
              {remaining}
              <Text className="font-sans-semibold text-xs text-muted">
                /{child.credits.total}
              </Text>
            </Text>
          </View>
          <View className="mt-2">
            <CreditBar
              remaining={remaining}
              total={child.credits.total}
              low={low}
              trackClass="bg-white/70"
            />
          </View>
          <Text className="mt-1.5 font-sans text-[11px] text-muted">
            {t("common.validUntil", { date: child.credits.validUntil })}
          </Text>
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center gap-2">
          <GraduationCap size={20} color={C.navy} />
          <Text className="font-sans-extrabold text-base text-ink">
            {t("profile.enrolledClasses")}
          </Text>
        </View>
        {classes.map((session) => (
          <View key={session.id} className="mt-4 flex-row items-center gap-4">
            <View className="size-16 items-center justify-center rounded-xl bg-olive-soft">
              <PawnIcon size={32} color={C.olive} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-sans-bold text-base text-ink">
                {session.course} ({session.section})
              </Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <CalendarDays size={14} color={C.navy} />
                <Text className="font-sans text-xs text-ink">
                  {session.day} {session.time}
                </Text>
              </View>
              <View className="mt-0.5 flex-row items-center gap-1.5">
                <MapPin size={14} color={C.navy} />
                <Text className="font-sans text-xs text-ink">
                  {session.location}
                </Text>
              </View>
            </View>
          </View>
        ))}
        <View className="mt-4 flex-row rounded-xl bg-navy-soft/50 py-3">
          <View className="flex-1 flex-row items-center justify-center gap-2 border-r border-navy/20 px-3">
            <CalendarCheck size={20} color={C.navy} />
            <View>
              <Text className="font-sans-bold text-xs text-ink">
                {attended}/{child.credits.total}
              </Text>
              <Text className="font-sans text-xs text-muted">
                {t("profile.classesAttended")}
              </Text>
            </View>
          </View>
          <View className="flex-1 flex-row items-center justify-center gap-2 px-3">
            <ClipboardList size={20} color={C.navy} />
            <View>
              <Text className="font-sans-bold text-xs text-ink">
                {remaining}
              </Text>
              <Text className="font-sans text-xs text-muted">
                {t("profile.classesRemaining")}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <History size={20} color={C.navy} />
            <Text className="font-sans-extrabold text-base text-ink">
              {t("profile.attendanceHistory")}
            </Text>
          </View>
          <Link href="/parent/attendance" asChild>
            <Pressable>
              <Text className="font-sans-bold text-xs text-navy">
                {t("common.viewAll")}
              </Text>
            </Pressable>
          </Link>
        </View>
        <View className="mt-3 gap-3">
          {history.map((item, i) => {
            const present = item.status === "present";
            return (
              <View key={i} className="flex-row items-center gap-3">
                {present ? (
                  <CheckCircle2 size={24} color={C.card} fill={C.olive} />
                ) : (
                  <XCircle size={24} color={C.card} fill={C.brick} />
                )}
                <View className="min-w-0 flex-1">
                  <Text className="font-sans-semibold text-sm text-ink">
                    {item.course}
                  </Text>
                  <Text className="font-sans text-[11px] text-muted">
                    {item.when}
                  </Text>
                </View>
                <Text
                  className={`font-sans-semibold text-xs ${
                    present ? "text-olive" : "text-brick"
                  }`}
                >
                  {present ? t("common.present") : t("common.absent")}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
