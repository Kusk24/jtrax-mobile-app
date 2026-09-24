/**
 * One child, in full: credits, this week's practice, their class, and the
 * sessions on file.
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
import { PawnIcon } from "@/components/PawnIcon";
import { ChildFace } from "@/components/parent/ChildFace";
import { ChildLichess } from "@/components/parent/ChildLichess";
import { BackHeader } from "@/components/parent/BackHeader";
import { useParentData } from "@/components/parent/ParentData";
import { PP } from "@/lib/colors";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const GOAL = 30;
const W = 280, H = 64, P = 6;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-sans-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
      {children}
    </Text>
  );
}

export default function ChildProfile() {
  const t = useTranslations("pv2");
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { children: kids, hist, certSessions } = useParentData();
  const [picked, setPicked] = useState<number | null>(null);
  const ch = kids.find((c) => c.key === childId);

  /* A child id that is not this parent's. Not an error state worth a screen —
     the row it came from is gone or was never theirs, so go back. */
  if (!ch) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-pp-bg px-5">
        <Text className="text-center font-sans text-[13px] text-pp-muted">{t("childGone")}</Text>
        <Pressable
          onPress={() => router.replace("/parent/attendance")}
          accessibilityRole="button"
          className="rounded-card bg-pp-navy px-6 py-2.5"
        >
          <Text className="font-sans-bold text-sm text-white">{t("navChildren")}</Text>
        </Pressable>
      </View>
    );
  }

  const hasExpiry = ch.valid !== "—";
  /* Three states, not two: a date that has already passed is expired, and
     saying "expires soon · 0 days" about it understates what happened. */
  const expired = hasExpiry && !ch.expiresAhead;
  const expSoon = hasExpiry && ch.expiresAhead && ch.daysLeft <= 14;
  /* Progress toward the certificate — the milestone is the academy's own,
     from Settings, not a number this app knows. */
  const toCert = Math.max(0, certSessions - ch.attended);

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
          <Text className="font-display-semibold text-[22px] text-pp-ink">{ch.name}</Text>
          <Text className="font-sans text-xs text-pp-muted">{t("idLabel", { id: ch.id })}</Text>
          <Text className="font-sans-bold text-[12.5px] text-pp-ink">
            {ch.level || "—"}
            {ch.age > 0 ? ` · ${ch.age}` : ""}
          </Text>
        </View>
      </View>

      {/* Credits */}
      <View className="gap-3 rounded-[14px] bg-pp-deep p-5">
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-bold text-[11px] uppercase tracking-[1.3px] text-[#b4c5e4]">
            {t("remainingCredits")}
          </Text>
          {/* The balance alone. A "/ total bought" used to sit beside it, and
              it read as a quota when it is only history. */}
          <Text className="font-display-semibold text-[34px] leading-none text-[#fbfff1]">
            {ch.credits}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: expSoon || expired ? "#fdece0" : "rgba(251,255,241,0.12)",
          }}
          className="flex-row items-center justify-between gap-2.5 rounded-[13px] px-3.5 py-2.5"
        >
          <View className="gap-0.5">
            <Text
              style={{ color: expSoon || expired ? PP.danger : "#fbfff1" }}
              className="font-sans-bold text-[12.5px]"
            >
              {expired ? t("expired") : expSoon ? t("expiresSoon") : t("validUntil")}
            </Text>
            <Text
              style={{ color: expSoon || expired ? PP.amber : "#b4c5e4" }}
              className="font-sans text-[11px]"
            >
              {ch.valid}
            </Text>
          </View>
          {hasExpiry && ch.expiresAhead && (
            <Text
              style={{ color: expSoon ? PP.danger : "#fbfff1" }}
              className="font-display-semibold text-[19px]"
            >
              {t("daysLeftShort", { count: ch.daysLeft })}
            </Text>
          )}
        </View>
        {hasExpiry && (
          <Text className="font-sans text-[10.5px] leading-relaxed text-[#b4c5e4]">
            {t("creditsExpireNote", { date: ch.valid })}
          </Text>
        )}
      </View>

      {/* Practice this week */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <SectionLabel>{t("practiceProgress")}</SectionLabel>
          <View className="flex-row items-center gap-1">
            <Flame size={14} color={PP.amber} fill={PP.amber} />
            <Text className="font-sans-bold text-[12.5px] text-pp-amber">
              {t("dayStreak", { count: ch.streak })}
            </Text>
          </View>
        </View>
        <View className="gap-2.5 rounded-card bg-pp-card p-4 shadow-clay">
          <Text className="font-sans-bold text-[11px] uppercase tracking-[0.9px] text-pp-faint">
            {t("thisWeek")}
          </Text>
          <View className="h-16 w-full">
            <Svg width="100%" height={64} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="chGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={PP.blue} stopOpacity="0.22" />
                  <Stop offset="1" stopColor={PP.blue} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Path d={area} fill="url(#chGrad)" />
              <Path
                d={line}
                fill="none"
                stroke={PP.blue}
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
              <Text className="font-sans-bold text-[9.5px] uppercase tracking-[0.6px] text-[#b4c5e4]">
                {DAYS[picked]}
              </Text>
              <Text className="font-sans-bold text-[12.5px] text-white">
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
                      <Circle cx="11" cy="11" r="9" fill="none" stroke="#f3e6d8" strokeWidth="3" />
                      <Circle
                        cx="11"
                        cy="11"
                        r="9"
                        fill="none"
                        stroke={PP.amber}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(
                          (2 * Math.PI * 9 * Math.max(4, Math.min(100, Math.round((vals[picked] / GOAL) * 100)))) / 100
                        ).toFixed(1)} ${(2 * Math.PI * 9).toFixed(1)}`}
                      />
                    </Svg>
                  </View>
                  <Star size={10} color={PP.amber} fill={PP.amber} strokeWidth={2} />
                </View>
              )}
            </View>
          )}

          <View className="flex-row justify-between">
            {DAYS.map((d) => (
              <Text key={d} className="font-sans-semibold text-[10px] text-pp-faint">
                {d}
              </Text>
            ))}
          </View>
          <Text className="pt-0.5 font-sans-bold text-[12.5px] text-pp-ink">
            {t("weekTotal", { h: Math.floor(weekMins / 60), m: weekMins % 60 })}
          </Text>
        </View>
      </View>

      {/* Enrolled class */}
      <View className="gap-3">
        <SectionLabel>{t("enrolledClasses")}</SectionLabel>
        <View className="gap-4 rounded-card bg-pp-card p-4 shadow-clay">
          <View className="flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-card bg-pp-mist">
              <PawnIcon size={17} color={PP.ink} />
            </View>
            <Text className="flex-1 font-sans-bold text-sm text-pp-ink">{ch.clsTitle}</Text>
          </View>
          {/* Branch, room, a teacher's name and an upcoming-session line all
              used to sit here. The first three were invented on the client —
              the backend has no room or branch column and no teacher-to-class
              link — and the schedule went too: sessions are written one at a
              time by the desk, so "the next class" is not a plan a parent can
              rely on. */}
          <View className="flex-row flex-wrap">
            {(
              [
                [t("creditsExpire"), ch.valid, expSoon || expired],
                [t("levelLabel"), ch.level || "—", false],
                [t("enrolledSince"), ch.enrolledSince || "—", false],
              ] as const
            ).map(([k, v, danger]) => (
              <View key={k} className="w-1/2 gap-0.5 pb-2.5 pr-3.5">
                <Text className="font-sans-bold text-[10px] uppercase tracking-[1px] text-pp-faint">
                  {k}
                </Text>
                <Text
                  className={`font-sans-bold text-[12.5px] ${
                    danger ? "text-pp-danger" : "text-pp-ink"
                  }`}
                >
                  {v}
                </Text>
              </View>
            ))}
          </View>
          {/* Progress toward the certificate — a milestone that only moves
              forward, unlike the credit totals that used to be here. */}
          <View className="flex-row items-center gap-3.5 rounded-[13px] border-[1.5px] border-pp-soft bg-pp-mist px-3.5 py-3">
            <View className="min-w-[78px]">
              <Text className="font-display-semibold text-[32px] leading-none text-pp-blue">
                {ch.attended}
              </Text>
              <Text className="mt-1 font-sans-bold text-[10px] uppercase tracking-[0.8px] text-pp-blue">
                {t("classesAttended")}
              </Text>
            </View>
            <View className="flex-1 gap-1.5">
              <View className="flex-row justify-between">
                <Text className="font-sans text-[11px] text-pp-muted">
                  {t("attendedOf", { attended: ch.attended, total: certSessions })}
                </Text>
                <Text className="font-sans text-[11px] text-pp-muted">
                  {t("remainingOf", { count: toCert })}
                </Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-pp-soft">
                <View
                  style={{
                    width: `${Math.min(100, Math.round((ch.attended / certSessions) * 100))}%`,
                  }}
                  className="h-full rounded-full bg-pp-blue"
                />
              </View>
              <Text className="font-sans text-[10.5px] text-pp-faint">
                {t("certNote", { count: certSessions })}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Attendance history preview */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <SectionLabel>{t("attHistory")}</SectionLabel>
          <Link href={`/parent/child/${ch.key}/history` as never} asChild>
            <Pressable>
              <Text className="font-sans-bold text-xs text-pp-blue">{t("viewAll")} →</Text>
            </Pressable>
          </Link>
        </View>
        <View className="overflow-hidden rounded-card bg-pp-card shadow-clay">
          {histRows.length === 0 && (
            <Text className="px-4 py-5 text-center font-sans text-[12.5px] text-pp-muted">
              {t("noSessions")}
            </Text>
          )}
          {histRows.map((h, i) => (
            <View
              key={i}
              className={`flex-row items-center justify-between gap-2.5 px-4 py-3.5 ${
                i < histRows.length - 1 ? "border-b border-pp-panel" : ""
              }`}
            >
              <View className="min-w-0 flex-1 gap-0.5">
                <Text className="font-sans-bold text-[12.5px] text-pp-ink">{h.cls}</Text>
                <Text className="font-sans text-[11px] text-pp-muted">
                  {h.date} · {h.time}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: h.status === "Present" ? PP.greenSoft : "#fdece0",
                }}
                className="rounded-full px-2.5 py-1"
              >
                <Text
                  style={{ color: h.status === "Present" ? PP.green : PP.danger }}
                  className="font-sans-bold text-[10.5px] uppercase"
                >
                  {h.status === "Present" ? t("present") : t("absent")}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* What this child plays at home. Renders nothing when no account is
          linked, so a family that does not use Lichess never sees an empty
          card asking them to. */}
      <ChildLichess studentId={ch.key} />
    </ScrollView>
  );
}
