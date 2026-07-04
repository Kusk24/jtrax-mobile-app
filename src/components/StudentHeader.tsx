import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Bell } from "lucide-react-native";
import { Avatar } from "./Avatar";
import { notifications, student, upcomingToday } from "@/lib/student-data";
import { C } from "@/lib/colors";

export function StudentHeader() {
  const t = useTranslations();
  const hasUnread = notifications.some((n) => n.unread);
  const classCount = upcomingToday ? 1 : 0;
  return (
    <View className="flex-row items-start justify-between">
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2.5">
          <Text className="font-sans-extrabold text-2xl text-navy">
            {t("common.hi", { name: student.name })}
          </Text>
          <View className="rounded-full bg-olive px-2.5 py-0.5">
            <Text className="font-sans-semibold text-[10px] text-white">
              {t("common.studentBadge")}
            </Text>
          </View>
        </View>
        <Text className="mt-1 font-sans text-sm text-muted">
          {t("home.classesToday", { count: classCount })}
        </Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Link href="/student/notifications" asChild>
          <Pressable className="relative rounded-full p-1.5">
            <Bell size={24} color={C.navy} fill={C.navy} />
            {hasUnread && (
              <View className="absolute right-1 top-1 size-2.5 rounded-full border-2 border-cream bg-brick" />
            )}
          </Pressable>
        </Link>
        <Link href="/student/profile" asChild>
          <Pressable>
            <Avatar
              name={student.name}
              colorClass={student.avatarColor}
              sizeClass="size-11"
            />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
