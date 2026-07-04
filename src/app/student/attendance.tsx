import { Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  XCircle,
} from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Avatar } from "@/components/Avatar";
import { attendanceHistory, student } from "@/lib/student-data";
import { C } from "@/lib/colors";

export default function StudentAttendanceScreen() {
  const t = useTranslations();
  const byDate = new Map<string, typeof attendanceHistory>();
  for (const record of attendanceHistory) {
    const list = byDate.get(record.date) ?? [];
    list.push(record);
    byDate.set(record.date, list);
  }

  return (
    <Screen>
      <Text className="text-center font-sans-extrabold text-2xl text-navy">
        {t("attendance.historyTitle")}
      </Text>

      {[...byDate.entries()].map(([date, records]) => (
        <View key={date}>
          <Text className="font-sans-extrabold text-lg text-ink">{date}</Text>
          <View className="mt-3 gap-3">
            {records.map((record) => {
              const present = record.status === "present";
              return (
                <View
                  key={record.id}
                  className="flex-row items-center gap-3 rounded-card border-2 border-navy/20 bg-card p-4 shadow-clay"
                >
                  <Avatar
                    name={student.name}
                    colorClass={student.avatarColor}
                    sizeClass="size-11"
                  />
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans-bold text-base text-navy">
                      {record.course} ({record.section})
                    </Text>
                    <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
                      <View className="flex-row items-center gap-1">
                        <CalendarDays size={14} color={C.navy} />
                        <Text className="font-sans text-xs text-muted">
                          {record.time}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <MapPin size={14} color={C.navy} />
                        <Text className="font-sans text-xs text-muted">
                          {record.location}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="items-end gap-1.5">
                    <View className="flex-row items-center gap-1">
                      {present ? (
                        <CheckCircle2 size={16} color={C.card} fill={C.olive} />
                      ) : (
                        <XCircle size={16} color={C.card} fill={C.brick} />
                      )}
                      <Text
                        className={`font-sans-semibold text-xs ${
                          present ? "text-olive" : "text-brick"
                        }`}
                      >
                        {present ? t("common.present") : t("common.absent")}
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-2.5 py-0.5 ${
                        present ? "bg-olive-soft" : "bg-brick-soft"
                      }`}
                    >
                      <Text
                        className={`font-sans-semibold text-[10px] ${
                          present ? "text-olive" : "text-brick"
                        }`}
                      >
                        {record.creditsAfter}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </Screen>
  );
}
