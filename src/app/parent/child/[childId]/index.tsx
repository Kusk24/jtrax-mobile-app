/**
 * One child, in full — the web's child profile: who they are with a Student
 * ID to copy, this week's practice, a card per enrolled course with its own
 * credits and expiry, lifetime credits, the sessions on file, and how the
 * child signs in.
 *
 * The portal's hover tooltip on the practice chart becomes a tap here — a
 * phone has no hover, and a chart whose numbers are only reachable with a
 * mouse has no numbers at all on this device.
 */
import { useState } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Check, Flame, Star } from "lucide-react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { AttendanceRow } from "@/components/parent/AttendanceRow";
import { ChildAccount } from "@/components/parent/ChildAccount";
import { ChildFace } from "@/components/parent/ChildFace";
import { CopyId } from "@/components/parent/CopyId";
import { CourseCard } from "@/components/parent/CourseCard";
import { ChildLichess } from "@/components/parent/ChildLichess";
import { BackHeader } from "@/components/parent/BackHeader";
import { useParentData } from "@/components/parent/ParentData";
import { usePalette } from "@/components/ThemeProvider";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const GOAL = 30;
const W = 280, H = 64, P = 6;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
      {children}
    </Text>
  );
}

export default function ChildProfile() {
  const { pp } = usePalette();
  const t = useTranslations("pv2");
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { children: kids, hist } = useParentData();
  const [picked, setPicked] = useState<number | null>(null);
  const ch = kids.find((c) => c.key === childId);

  /* A child id that is not this parent's. Not an error state worth a screen —
     the row it came from is gone or was never theirs, so go back. */
  if (!ch) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-pp-bg px-5">
        <Text className="text-center font-pp text-[13px] text-pp-muted">{t("childGone")}</Text>
        <Pressable
          onPress={() => router.replace("/parent/attendance")}
          accessibilityRole="button"
          className="rounded-card bg-pp-navy px-6 py-2.5"
        >
          <Text className="font-pp-bold text-sm text-white">{t("navChildren")}</Text>
        </Pressable>
      </View>
    );
  }

  const vals = ch.practiceWeek;
  const max = Math.max(...vals, 1);
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * (W - P * 2) + P,
    H - P - (v / max) * (H - P * 2),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
  const weekMins = vals.reduce((a, b) => a + b, 0);

  /* The three most recent attendance rows, with each session's own times. */
  const histRows = hist.filter((h) => h.child === ch.key).slice(0, 3);

  return (
    <ScrollView
      className="flex-1 bg-pp-bg"
      contentContainerClassName="gap-5 px-4 pb-10 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <BackHeader title={t("childProfileTitle", { name: ch.name })} />

      <View className="flex-row items-center gap-3.5">
        <ChildFace name={ch.name} tint={ch.avBg} size={62} textClass="text-[24px]" />
        <View className="gap-0.5">
          <Text className="font-pp-display-semibold text-[22px] text-pp-ink">{ch.name}</Text>
          <View className="flex-row items-center gap-1.5">
            <Text className="font-pp text-xs text-pp-muted">{t("studentIdLabel")}</Text>
            <CopyId id={ch.id} />
          </View>
          <Text className="font-pp-bold text-[12.5px] text-pp-ink">
            {ch.level || "—"}
            {ch.age > 0 ? ` · ${ch.age}` : ""}
          </Text>
        </View>
      </View>

      {/* Practice this week */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <SectionLabel>{t("practiceProgress")}</SectionLabel>
          <View className="flex-row items-center gap-1">
            <Flame size={14} color={pp.amber} fill={pp.amber} />
            <Text className="font-pp-bold text-[12.5px] text-pp-amber">
              {t("dayStreak", { count: ch.streak })}
            </Text>
          </View>
        </View>
        <View className="gap-2.5 rounded-card bg-pp-card p-4 shadow-clay">
          <Text className="font-pp-bold text-[11px] uppercase tracking-[0.9px] text-pp-faint">
            {t("thisWeek")}
          </Text>
          <View className="h-16 w-full">
            <Svg width="100%" height={64} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="chGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={pp.blue} stopOpacity="0.22" />
                  <Stop offset="1" stopColor={pp.blue} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Path d={area} fill="url(#chGrad)" />
              <Path
                d={line}
                fill="none"
                stroke={pp.blue}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            {pts.map((p, i) => (
              <Pressable
                key={i}
                onPress={() => setPicked((cur) => (cur === i ? null : i))}
                accessibilityRole="button"
                accessibilityLabel={`${DAYS[i]} — ${t("minsTip", { count: vals[i] })}`}
                /* A 16px dot is under the 44px minimum, so the hit box is
                   grown around it rather than the dot being made bigger. */
                hitSlop={14}
                style={{
                  position: "absolute",
                  left: `${(p[0] / W) * 100}%`,
                  top: `${(p[1] / H) * 100}%`,
                  transform: [{ translateX: -8 }, { translateY: -8 }],
                }}
                className="size-4 items-center justify-center"
              >
                <View className="size-1.5 rounded-full bg-pp-blue" />
              </Pressable>
            ))}
          </View>

          {/* The tapped day, under the chart rather than floating over it:
              a tooltip pinned above a point on a 390px screen goes off the
              edge at Monday and at Sunday. */}
          {picked !== null && (
            <View className="flex-row items-center gap-2.5 self-start rounded-[10px] bg-pp-ink px-2.5 py-2">
              <Text className="font-pp-bold text-[9.5px] uppercase tracking-[0.6px] text-[#b4c5e4]">
                {DAYS[picked]}
              </Text>
              <Text className="font-pp-bold text-[12.5px] text-white">
                {t("minsTip", { count: vals[picked] })}
              </Text>
              {vals[picked] >= GOAL ? (
                <View className="size-[22px] items-center justify-center rounded-full bg-pp-green">
                  <Check size={12} color="#ffffff" strokeWidth={3} />
                </View>
              ) : (
                <View className="size-[22px] items-center justify-center">
                  <View style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
                    <Svg width={22} height={22} viewBox="0 0 22 22">
                      <Circle cx="11" cy="11" r="9" fill="none" stroke={pp.track} strokeWidth="3" />
                      <Circle
                        cx="11"
                        cy="11"
                        r="9"
                        fill="none"
                        stroke={pp.amber}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(
                          (2 * Math.PI * 9 * Math.max(4, Math.min(100, Math.round((vals[picked] / GOAL) * 100)))) / 100
                        ).toFixed(1)} ${(2 * Math.PI * 9).toFixed(1)}`}
                      />
                    </Svg>
                  </View>
                  <Star size={10} color={pp.amber} fill={pp.amber} strokeWidth={2} />
                </View>
              )}
            </View>
          )}

          <View className="flex-row justify-between">
            {DAYS.map((d) => (
              <Text key={d} className="font-pp-semibold text-[10px] text-pp-faint">
                {d}
              </Text>
            ))}
          </View>
          <Text className="pt-0.5 font-pp-bold text-[12.5px] text-pp-ink">
            {t("weekTotal", { h: Math.floor(weekMins / 60), m: weekMins % 60 })}
          </Text>
        </View>
      </View>

      {/* Enrolled classes: one card holding a row per course, each with its
          own credits, expiry and start date. */}
      <View className="gap-3 rounded-xl bg-pp-card p-4 shadow-clay">
        <View className="flex-row items-center justify-between px-0.5">
          <Text className="font-pp-display-bold text-[17px] text-pp-ink">{t("enrolledClasses")}</Text>
          {ch.courses.length > 0 && (
            <Text className="font-pp-semibold text-[12.5px] text-pp-blue">
              {t("classesCount", { count: ch.courses.length })}
            </Text>
          )}
        </View>
        {/* All time, across every course: what was bought and what classes used. */}
        <View className="flex-row gap-2.5">
          <View className="flex-1 gap-0.5 rounded-xl bg-pp-soft px-3.5 py-3">
            <Text className="font-pp-bold text-[10.5px] uppercase tracking-[0.8px] text-pp-blue">{t("creditsBoughtTotal")}</Text>
            <Text className="font-pp-display-bold text-[20px] leading-tight text-pp-ink">{ch.lifetime.bought}</Text>
          </View>
          <View className="flex-1 gap-0.5 rounded-xl bg-pp-mist px-3.5 py-3">
            <Text className="font-pp-bold text-[10.5px] uppercase tracking-[0.8px] text-pp-muted">{t("creditsUsedTotal")}</Text>
            <Text className="font-pp-display-bold text-[20px] leading-tight text-pp-ink">{ch.lifetime.used}</Text>
          </View>
        </View>
        {ch.courses.length > 0 ? (
          ch.courses.map((course, i) => <CourseCard key={course.enrollmentId} course={course} index={i} />)
        ) : (
          <Text className="rounded-xl border-[1.5px] border-dashed border-pp-dash p-4 text-center font-pp text-[12.5px] text-pp-muted">
            {t("noActiveCourse")}
          </Text>
        )}
      </View>

      {/* Attendance history preview */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <SectionLabel>{t("attHistory")}</SectionLabel>
          <Link href={`/parent/child/${ch.key}/history` as never} asChild>
            <Pressable>
              <Text className="font-pp-bold text-xs text-pp-blue">{t("viewAll")} →</Text>
            </Pressable>
          </Link>
        </View>
        <View className="overflow-hidden rounded-card bg-pp-card shadow-clay">
          {histRows.length === 0 && (
            <Text className="px-4 py-5 text-center font-pp text-[12.5px] text-pp-muted">
              {t("noSessions")}
            </Text>
          )}
          {histRows.map((h, i) => (
            <AttendanceRow key={i} h={h} last={i === histRows.length - 1} />
          ))}
        </View>
      </View>

      {/* What this child plays at home. Renders nothing when no account is
          linked, so a family that does not use Lichess never sees an empty
          card asking them to. */}
      <ChildLichess studentId={ch.key} />

      {/* How the child signs in, and a new password for one without email. */}
      <ChildAccount studentId={ch.id} name={ch.name} />
    </ScrollView>
  );
}
