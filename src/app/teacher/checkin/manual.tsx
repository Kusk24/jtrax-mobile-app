import { useState } from "react";
import { Link } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { useTranslations } from "use-intl";
import { Check, CheckCircle2, Search, XCircle } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { CheckinHeader } from "@/components/CheckinHeader";
import { SessionProgress } from "@/components/SessionProgress";
import { RosterRow } from "@/components/RosterRow";
import { roster, upcomingClass } from "@/lib/teacher-data";
import { C } from "@/lib/colors";

export default function ManualCheckinScreen() {
  const t = useTranslations("checkin");
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  const visible = roster.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const toggle = (id: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Screen gapClass="gap-4">
      <CheckinHeader
        subtitle={`${upcomingClass.course} - Section ${upcomingClass.section.replace("Sec ", "")}`}
      />

      <SessionProgress count={presentIds.size} total={roster.length} />

      <View className="flex-row items-center gap-2 rounded-full border-2 border-line bg-card px-4 py-2.5 shadow-clay">
        <Search size={16} color={C.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("searchStudents")}
          placeholderTextColor={C.muted}
          className="flex-1 font-sans text-sm text-ink"
        />
      </View>

      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => setPresentIds(new Set())}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-brick px-4 py-2 shadow-clay active:opacity-90"
        >
          <XCircle size={16} color={C.white} />
          <Text className="font-sans-semibold text-sm text-white">
            {t("allAbsent")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPresentIds(new Set(roster.map((s) => s.id)))}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-olive px-4 py-2 shadow-clay active:opacity-90"
        >
          <CheckCircle2 size={16} color={C.white} />
          <Text className="font-sans-semibold text-sm text-white">
            {t("allPresent")}
          </Text>
        </Pressable>
      </View>

      <View className="gap-2.5">
        {visible.map((student) => {
          const present = presentIds.has(student.id);
          return (
            <RosterRow
              key={student.id}
              student={student}
              action={
                <Pressable
                  onPress={() => toggle(student.id)}
                  className={`size-11 items-center justify-center rounded-xl border-2 ${
                    present ? "border-olive bg-olive" : "border-line bg-card"
                  }`}
                >
                  <Check
                    size={20}
                    color={present ? C.white : "transparent"}
                    strokeWidth={3}
                  />
                </Pressable>
              }
            />
          );
        })}
        {visible.length === 0 && (
          <View className="rounded-card bg-card/70 px-4 py-8">
            <Text className="text-center font-sans text-sm text-muted">
              {t("noMatch", { query })}
            </Text>
          </View>
        )}
      </View>

      <Link href="/teacher/attendance/may10-sec101" asChild>
        <Pressable className="mt-2 rounded-2xl bg-navy py-3 shadow-clay-lg active:bg-navy-deep">
          <Text className="text-center font-sans-bold text-base text-white">
            {t("finish")}
          </Text>
        </Pressable>
      </Link>
    </Screen>
  );
}
