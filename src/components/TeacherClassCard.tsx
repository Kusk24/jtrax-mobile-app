import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  CalendarDays,
  ClipboardCheck,
  MapPin,
  Nfc,
  Users,
} from "lucide-react-native";
import { C } from "@/lib/colors";
import type { TeacherClass } from "@/lib/types";

/** Round manual + scan attendance launchers shown on today's class. */
export function AttendanceActions() {
  return (
    <View className="flex-row items-center gap-2.5">
      <Link href="/teacher/checkin/manual" asChild>
        <Pressable className="size-11 items-center justify-center rounded-full bg-navy shadow-clay active:bg-navy-deep">
          <ClipboardCheck size={20} color={C.white} />
        </Pressable>
      </Link>
      <Link href="/teacher/checkin/scan" asChild>
        <Pressable className="size-11 items-center justify-center rounded-full bg-peach shadow-clay active:opacity-80">
          <Nfc size={20} color={C.peachInk} />
        </Pressable>
      </Link>
    </View>
  );
}

/** Today's class with schedule details and attendance launchers. */
export function TeacherClassCard({
  session,
  withActions = false,
}: {
  session: TeacherClass;
  withActions?: boolean;
}) {
  const t = useTranslations("home");
  return (
    <View className="flex-row items-center gap-3 rounded-card border-2 border-l-4 border-navy/20 border-l-navy bg-card p-4 shadow-clay">
      <View className="min-w-0 flex-1 gap-2">
        <Text className="font-sans-bold text-base text-navy">
          {session.course} ({session.section})
        </Text>
        <View className="flex-row items-center gap-2">
          <CalendarDays size={16} color={C.navy} />
          <Text className="font-sans text-sm text-ink">{session.time}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Users size={16} color={C.navy} />
          <Text className="font-sans text-sm text-ink">
            {t("studentsCount", { count: session.studentsEnrolled })}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <MapPin size={16} color={C.navy} />
          <Text className="font-sans text-sm text-ink">
            {session.location} - {session.room}
          </Text>
        </View>
      </View>
      {withActions && <AttendanceActions />}
    </View>
  );
}
