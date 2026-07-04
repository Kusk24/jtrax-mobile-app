import { useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Pencil } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { CheckinHeader } from "@/components/CheckinHeader";
import { SessionProgress } from "@/components/SessionProgress";
import { RosterRow } from "@/components/RosterRow";
import { roster, sessionHistory } from "@/lib/teacher-data";
import { C } from "@/lib/colors";
import type { RosterStudent } from "@/lib/types";

const PREVIEW_COUNT = 3;

export default function AttendanceSummaryScreen() {
  const t = useTranslations();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const session = sessionHistory.find((s) => s.id === sessionId);

  const [presentIds, setPresentIds] = useState<Set<string>>(
    new Set(session?.presentIds ?? []),
  );
  const [editing, setEditing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (!session) return null;

  const inSession = new Set([...session.presentIds, ...session.absentIds]);
  const students = roster.filter((s) => inSession.has(s.id));
  const present = students.filter((s) => presentIds.has(s.id));
  const absent = students.filter((s) => !presentIds.has(s.id));

  const toggle = (id: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const row = (student: RosterStudent, isPresent: boolean) =>
    editing ? (
      <View key={student.id} className="flex-row items-stretch gap-2">
        <View className="flex-1">
          <RosterRow student={student} />
        </View>
        <Pressable
          onPress={() => toggle(student.id)}
          className={`w-20 items-center justify-center rounded-card shadow-clay ${
            isPresent ? "bg-brick" : "bg-olive"
          }`}
        >
          <Text className="font-sans-semibold text-sm text-white">
            {isPresent ? t("common.absent") : t("common.present")}
          </Text>
        </Pressable>
      </View>
    ) : (
      <Link key={student.id} href={`/teacher/students/${student.id}` as never} asChild>
        <Pressable>
          <RosterRow student={student} />
        </Pressable>
      </Link>
    );

  return (
    <Screen gapClass="gap-4">
      <CheckinHeader
        titleKey="attendance.summaryTitle"
        subtitle={`${session.course} - Section ${session.section.replace("Sec ", "")}`}
        backHref="/teacher/attendance"
      />

      <SessionProgress count={present.length} total={students.length} />

      <View>
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-extrabold text-base text-ink">
            {t("attendance.presentStudents", { count: present.length })}
          </Text>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => setShowAll((v) => !v)}>
              <Text className="font-sans-semibold text-sm text-navy">
                {showAll ? t("common.showLess") : t("common.viewAll")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setEditing((v) => !v)}
              className={`flex-row items-center gap-1 rounded-full px-3 py-1 ${
                editing ? "bg-navy" : "bg-navy-soft/60"
              }`}
            >
              <Pencil size={14} color={editing ? C.white : C.navy} />
              <Text
                className={`font-sans-semibold text-sm ${
                  editing ? "text-white" : "text-navy"
                }`}
              >
                {editing ? t("common.done") : t("common.edit")}
              </Text>
            </Pressable>
          </View>
        </View>
        <View className="mt-3 gap-2.5">
          {(showAll ? present : present.slice(0, PREVIEW_COUNT)).map((s) =>
            row(s, true),
          )}
        </View>
      </View>

      <View>
        <Text className="font-sans-extrabold text-base text-ink">
          {t("attendance.absentStudents", { count: absent.length })}
        </Text>
        <View className="mt-3 gap-2.5">
          {absent.map((s) => row(s, false))}
          {absent.length === 0 && (
            <View className="rounded-card bg-card/70 px-4 py-6">
              <Text className="text-center font-sans text-sm text-muted">
                {t("attendance.everyonePresent")}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
