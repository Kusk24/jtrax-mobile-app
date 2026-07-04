import { Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  UserSquare2,
} from "lucide-react-native";
import { Avatar } from "./Avatar";
import { CreditBar } from "./CreditBar";
import { C } from "@/lib/colors";
import type { Child, ClassSession } from "@/lib/types";

export function ClassCard({
  session,
  child,
  hideStudentPanel = false,
  action,
}: {
  session: ClassSession;
  child: Child;
  /** Student portal: the viewer is the student, so skip the left identity panel. */
  hideStudentPanel?: boolean;
  action?: React.ReactNode;
}) {
  const t = useTranslations("common");
  const low = child.lowCredits;
  return (
    <View
      className={`flex-row overflow-hidden rounded-card border-2 border-navy/20 bg-card shadow-clay ${
        hideStudentPanel ? "border-l-4 border-l-navy" : ""
      }`}
    >
      {!hideStudentPanel && (
        <View className="w-24 items-center justify-center gap-1.5 bg-navy-soft/60 px-2 py-4">
          <Avatar
            name={child.name}
            colorClass={child.avatarColor}
            sizeClass="size-14"
          />
          <Text
            className={`font-sans-bold text-sm ${low ? "text-brick" : "text-ink"}`}
          >
            {child.name}
          </Text>
          <Text className="font-sans text-[10px] text-muted">
            {t("idLabel", { id: child.studentId })}
          </Text>
        </View>
      )}
      <View className="min-w-0 flex-1 gap-2 p-4">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 font-sans-bold text-base text-navy">
            {session.course} ({session.section})
          </Text>
          {session.status === "present" && (
            <View className="flex-row items-center gap-1">
              <CheckCircle2 size={16} color={C.card} fill={C.olive} />
              <Text className="font-sans-semibold text-xs text-olive">
                {t("present")}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-2">
          <CalendarDays size={16} color={C.navy} />
          <Text className="font-sans text-sm text-ink">
            {session.day} {session.time}
          </Text>
        </View>
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <UserSquare2 size={16} color={C.navy} />
          <Text className="font-sans text-sm text-ink">{session.teacher}</Text>
          <MapPin size={16} color={C.navy} style={{ marginLeft: 4 }} />
          <Text className="font-sans text-sm text-ink">
            {session.location} - {session.room}
          </Text>
        </View>
        <View className="mt-auto pt-1">
          <CreditBar
            remaining={child.credits.remaining}
            total={child.credits.total}
            low={low}
          />
          <View className="mt-1.5 flex-row items-center justify-between">
            <Text className="font-sans text-xs text-muted">
              {t("validUntil", { date: child.credits.validUntil })}
            </Text>
            <Text
              className={`font-sans-semibold text-xs ${low ? "text-brick" : "text-navy"}`}
            >
              {t("creditsOf", {
                remaining: child.credits.remaining,
                total: child.credits.total,
              })}
            </Text>
          </View>
          {action && <View className="mt-3 items-end">{action}</View>}
        </View>
      </View>
    </View>
  );
}
