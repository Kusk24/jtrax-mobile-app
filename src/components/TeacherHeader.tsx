import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Avatar } from "./Avatar";
import { teacher } from "@/lib/teacher-data";

export function TeacherHeader({ classCount }: { classCount: number }) {
  const t = useTranslations();
  return (
    <View className="flex-row items-start justify-between">
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2.5">
          <Text className="font-sans-extrabold text-2xl text-navy">
            {t("common.hi", { name: teacher.name })}
          </Text>
          <View className="rounded-full bg-navy px-2.5 py-0.5">
            <Text className="font-sans-semibold text-[10px] text-white">
              {t("common.teacherBadge")}
            </Text>
          </View>
        </View>
        <Text className="mt-1 font-sans text-sm text-muted">
          {t("home.classesToday", { count: classCount })}
        </Text>
      </View>
      <Link href="/teacher/profile" asChild>
        <Pressable>
          <Avatar
            name={teacher.name}
            colorClass={teacher.avatarColor}
            sizeClass="size-11"
          />
        </Pressable>
      </Link>
    </View>
  );
}
