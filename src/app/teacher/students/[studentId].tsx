import { Link, useLocalSearchParams } from "expo-router";
import { Linking, Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  CalendarDays,
  CheckCircle2,
  Crown,
  GraduationCap,
  History,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
} from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Avatar } from "@/components/Avatar";
import { CheckinHeader } from "@/components/CheckinHeader";
import { roster, studentDetail } from "@/lib/teacher-data";
import { C } from "@/lib/colors";

const card = "rounded-card border-2 border-line bg-card p-4 shadow-clay";

export default function TeacherStudentProfileScreen() {
  const t = useTranslations();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const student = roster.find((s) => s.id === studentId);
  if (!student) return null;

  // Mock: detail data (parents, enrolment) is only modelled for one student.
  const detail = studentDetail;
  const cls = detail.enrolledClass;

  return (
    <Screen gapClass="gap-4">
      <CheckinHeader
        titleKey="profile.studentProfile"
        subtitle=""
        backHref="/teacher/attendance"
      />

      <View className={card}>
        <View className="flex-row items-center gap-3">
          <Avatar
            name={student.name}
            colorClass={student.avatarColor}
            sizeClass="size-14"
          />
          <View>
            <Text className="font-sans-bold text-base text-ink">
              {student.name}
            </Text>
            <Text className="font-sans text-xs text-muted">
              {t("common.idLabel", { id: student.studentId })}
            </Text>
            <Text className="font-sans text-xs text-muted">
              {t("profile.levelAge", { level: detail.level, age: detail.age })}
            </Text>
          </View>
        </View>
        <View
          className={`mt-3 rounded-xl px-4 py-3 ${
            student.lowCredits ? "bg-brick-soft" : "bg-olive-soft"
          }`}
        >
          <View className="flex-row items-center justify-between">
            <Text
              className={`font-sans-bold text-sm ${
                student.lowCredits ? "text-brick" : "text-olive"
              }`}
            >
              {t("profile.remainingCredits")}
            </Text>
            <Text
              className={`font-sans-extrabold text-base ${
                student.lowCredits ? "text-brick" : "text-olive"
              }`}
            >
              {student.creditsRemaining}
              <Text className="font-sans-semibold text-xs">
                /{student.sessionsTotal}
              </Text>
            </Text>
          </View>
          <Text className="mt-0.5 font-sans text-xs text-muted">
            {t("common.validUntil", { date: detail.credits.validUntil })}
          </Text>
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center gap-2">
          <ShieldAlert size={16} color={C.navy} />
          <Text className="font-sans-bold text-base text-navy">
            {t("profile.parentsContact")}
          </Text>
        </View>
        <View className="mt-3 gap-3">
          {detail.parents.map((parent) => (
            <View key={parent.name} className="flex-row items-center gap-3">
              <Avatar
                name={parent.name}
                colorClass={parent.avatarColor}
                sizeClass="size-10"
                textClass="text-base"
              />
              <View className="min-w-0 flex-1">
                <Text className="font-sans-bold text-sm text-ink">
                  {parent.name}
                </Text>
                <Text className="font-sans text-xs text-muted">
                  {parent.relation}
                </Text>
              </View>
              <Pressable
                onPress={() => Linking.openURL(`tel:${parent.phone}`)}
                className="rounded-full p-2"
              >
                <Phone size={16} color={C.navy} fill={C.navy} />
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL(`mailto:${parent.email}`)}
                className="rounded-full p-2"
              >
                <Mail size={16} color={C.navy} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center gap-2">
          <GraduationCap size={16} color={C.navy} />
          <Text className="font-sans-bold text-base text-navy">
            {t("profile.enrolledClasses")}
          </Text>
        </View>
        <View className="mt-3 flex-row gap-3">
          <View className="h-16 w-20 items-center justify-center rounded-xl bg-olive-soft">
            <Crown size={28} color={C.olive} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans-bold text-sm text-navy">
              {cls.course} ({cls.section})
            </Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <CalendarDays size={14} color={C.navy} />
              <Text className="font-sans text-xs text-ink">
                {cls.day}, {cls.time}
              </Text>
            </View>
            <View className="mt-1 flex-row items-center gap-1.5">
              <MapPin size={14} color={C.navy} />
              <Text className="font-sans text-xs text-ink">{cls.location}</Text>
            </View>
          </View>
        </View>
        <View className="mt-3">
          <Text className="text-right font-sans-semibold text-xs text-navy">
            {cls.pct}%
          </Text>
          <View className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <View
              className="h-full rounded-full bg-navy"
              style={{ width: `${cls.pct}%` }}
            />
          </View>
          <Text className="mt-1 font-sans text-xs text-muted">
            {t("profile.classesOf", { attended: cls.attended, total: cls.of })}
          </Text>
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <History size={16} color={C.navy} />
            <Text className="font-sans-bold text-base text-navy">
              {t("profile.attendanceHistory")}
            </Text>
          </View>
          <Link href="/teacher/attendance" asChild>
            <Pressable>
              <Text className="font-sans-semibold text-sm text-navy">
                {t("common.viewAll")}
              </Text>
            </Pressable>
          </Link>
        </View>
        <View className="mt-3 flex-row items-center gap-3">
          <CheckCircle2 size={20} color={C.card} fill={C.olive} />
          <View className="min-w-0 flex-1">
            <Text className="font-sans-bold text-sm text-ink">
              {detail.lastAttendance.course} ({detail.lastAttendance.section})
            </Text>
            <Text className="font-sans text-xs text-muted">
              {detail.lastAttendance.when}
            </Text>
          </View>
          <Text className="font-sans-semibold text-xs text-olive">
            {t("common.present")}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
