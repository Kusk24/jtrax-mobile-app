import { Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Avatar } from "./Avatar";
import type { RosterStudent } from "@/lib/types";

/** One student line in a teacher attendance list; `action` renders on the right. */
export function RosterRow({
  student,
  action,
}: {
  student: RosterStudent;
  action?: React.ReactNode;
}) {
  const t = useTranslations();
  return (
    <View className="flex-row items-center gap-3 rounded-card border-2 border-line bg-card p-3 shadow-clay">
      <Avatar
        name={student.name}
        colorClass={student.avatarColor}
        sizeClass="size-10"
        textClass="text-base"
      />
      <View className="min-w-0 flex-1">
        <Text className="font-sans-bold text-sm text-ink">{student.name}</Text>
        <Text className="font-sans text-[11px] text-muted">
          {t("common.idLabel", { id: student.studentId })} •{" "}
          {t("roster.sessions", {
            used: student.sessionsUsed,
            total: student.sessionsTotal,
          })}
        </Text>
        <Text
          className={`text-[11px] ${
            student.lowCredits
              ? "font-sans-semibold text-brick"
              : "font-sans text-muted"
          }`}
        >
          {t("roster.creditsLine", {
            count: student.creditsRemaining,
            date: student.expiresOn,
          })}
        </Text>
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}
