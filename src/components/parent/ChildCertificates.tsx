/**
 * A child's certificates, read-only: each course's hours toward the
 * requirement and whether the academy has certified them — the web portal's
 * ChildCertificates. Only the office certifies; the certificate can be opened
 * once it is issued.
 */
import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Award } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { useHoursText } from "@/components/useHoursText";
import { fetchCertificates, progressPct, type StudentCertificates } from "@/lib/certificates";

export function ChildCertificates({ studentId, childKey, refreshKey }: { studentId: string; childKey: string; refreshKey: unknown }) {
  const t = useTranslations("pv2");
  const { pp } = usePalette();
  const hoursText = useHoursText();
  const [data, setData] = useState<StudentCertificates | null>(null);

  /* Read again when the child's attendance changes. */
  useEffect(() => {
    let live = true;
    fetchCertificates(studentId).then((d) => live && setData(d)).catch(() => live && setData(null));
    return () => {
      live = false;
    };
  }, [studentId, refreshKey]);

  if (!data || data.courses.length === 0) return null;
  const required = data.required_hours;
  return (
    <View className="gap-3 rounded-xl bg-pp-card p-4">
      <Text className="px-0.5 font-pp-display-bold text-[17px] text-pp-ink">{t("certificates")}</Text>
      {data.courses.map((c) => {
        const done = c.status === "certified";
        return (
          <View key={c.course} className="gap-2 rounded-xl border-[1.5px] border-pp-line px-3.5 py-3">
            <View className="flex-row items-center justify-between gap-2">
              <Text numberOfLines={1} className="min-w-0 flex-1 font-pp-semibold text-[13.5px] text-pp-ink">
                {t(`certCourse_${c.course}`)}
              </Text>
              <View className={`rounded-full px-2 py-0.5 ${done ? "bg-pp-green-soft" : "bg-pp-soft"}`}>
                <Text className={`font-pp-bold text-[10.5px] ${done ? "text-pp-green" : "text-pp-blue"}`}>
                  {done ? t("certCertified") : t("certInProgress")}
                </Text>
              </View>
            </View>
            <View
              accessibilityRole="progressbar"
              accessibilityLabel={t(`certCourse_${c.course}`)}
              accessibilityValue={{ min: 0, max: required, now: Math.min(c.hours, required) }}
              className="h-1.5 overflow-hidden rounded-full bg-pp-soft"
            >
              <View
                className={`h-full rounded-full ${done ? "bg-pp-green" : "bg-pp-blue"}`}
                style={{ width: `${progressPct(c.hours, required)}%` }}
              />
            </View>
            <View className="flex-row items-center justify-between gap-2">
              <Text className="font-pp text-[12px] text-pp-muted">
                {t("certHoursOf", { hours: hoursText(c.hours), required: hoursText(required) })}
              </Text>
              {done && (
                <Link href={`/parent/child/${childKey}/certificate/${c.course}` as never} asChild>
                  <Pressable accessibilityRole="link" className="flex-row items-center gap-1" hitSlop={8}>
                    <Award size={14} color={pp.blue} strokeWidth={2.2} />
                    <Text className="font-pp-bold text-[12px] text-pp-blue">{t("certView")}</Text>
                  </Pressable>
                </Link>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
