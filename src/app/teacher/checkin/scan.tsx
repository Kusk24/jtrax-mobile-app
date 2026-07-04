import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Nfc } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { CheckinHeader } from "@/components/CheckinHeader";
import { SessionProgress } from "@/components/SessionProgress";
import { RosterRow } from "@/components/RosterRow";
import { roster, upcomingClass } from "@/lib/teacher-data";
import { C } from "@/lib/colors";

type Scan = { studentId: string; at: number };

type AgoT = (key: string, values?: Record<string, number>) => string;

function ago(at: number, now: number, t: AgoT) {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 2) return t("justNow");
  if (s < 60) return t("secondsAgo", { s });
  return t("minutesAgo", { m: Math.floor(s / 60) });
}

/** Mock scan flow: students "scan in" one by one on a timer until the backend
    provides a real device event stream. */
export default function ScanCheckinScreen() {
  const t = useTranslations("checkin");
  const [scans, setScans] = useState<Scan[]>([
    { studentId: "kat", at: Date.now() - 3000 },
    { studentId: "uri", at: Date.now() },
  ]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const feed = setInterval(() => {
      setScans((prev) => {
        const scanned = new Set(prev.map((s) => s.studentId));
        const next = roster.find((s) => !scanned.has(s.id));
        if (!next) return prev;
        return [...prev, { studentId: next.id, at: Date.now() }];
      });
    }, 5000);
    return () => {
      clearInterval(tick);
      clearInterval(feed);
    };
  }, []);

  const recent = [...scans].sort((a, b) => b.at - a.at);

  return (
    <Screen gapClass="gap-4">
      <CheckinHeader
        subtitle={`${upcomingClass.course} - Section ${upcomingClass.section.replace("Sec ", "")}`}
      />

      <View className="items-center py-4">
        <View className="size-40 items-center justify-center rounded-full bg-olive-soft">
          <View className="size-28 items-center justify-center rounded-full bg-olive">
            <Nfc size={48} color={C.white} />
          </View>
        </View>
      </View>

      <SessionProgress
        labelKey="checkin.scannedIn"
        count={scans.length}
        total={roster.length}
      />

      <View>
        <Text className="font-sans-extrabold text-sm text-ink">
          {t("recentScans")}
        </Text>
        <View className="mt-2 gap-2.5">
          {recent.slice(0, 6).map((scan) => {
            const student = roster.find((s) => s.id === scan.studentId)!;
            return (
              <RosterRow
                key={scan.studentId}
                student={student}
                action={
                  <Text className="font-sans-semibold text-xs text-olive">
                    {ago(scan.at, now, t)}
                  </Text>
                }
              />
            );
          })}
        </View>
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
