/**
 * A pupil's own record, matching the portal's profile screen.
 *
 * The screen this replaces was built entirely from `lib/student-data.ts`: the
 * same name, the same credits, the same two parents and the same three classes
 * for whoever signed in. Everything here is the signed-in account's — their
 * streak, their puzzles, their Lichess.
 *
 * The week strip is the part worth pointing at. It draws the days the pupil
 * *actually practised*, oldest first, each cell labelled with its own weekday.
 * Lighting the first N of seven from a streak number drew a week nobody lived
 * — a three-day streak always showed Monday to Wednesday.
 */
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslations } from "use-intl";
import { Check, Flame, Gamepad2, GraduationCap, Trophy } from "lucide-react-native";
import { SignOutButton } from "@/components/SignOutButton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LichessCard } from "@/components/student/LichessCard";
import { useSession } from "@/lib/session";
import { getDailyPuzzles, getPracticeSummary, solvedCount, type PracticeDay } from "@/lib/puzzles";
import { getMyLichess } from "@/lib/lichess";
import { api } from "@/lib/api";
import { classesAttended } from "@/lib/classes-attended";
import { C } from "@/lib/colors";

/** The pupil's own row. The scope on `students` means this list is only ever
    the caller's own record, but it is found by id rather than taken as [0]. */
type StudentRow = {
  student_id: string;
  name?: string;
  current_level?: string;
};

export default function StudentProfileScreen() {
  const t = useTranslations("sv2");
  const { user } = useSession();

  const [record, setRecord] = useState<StudentRow | null>(null);
  const [days, setDays] = useState<PracticeDay[]>([]);
  const [streak, setStreak] = useState(0);
  const [solved, setSolved] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  /* Classes the pupil has been checked in to — the same count their parent
     sees. Null until it loads, so the tile does not claim "0" meanwhile. */
  const [classes, setClasses] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getPracticeSummary()
        .then((p) => {
          if (cancelled) return;
          setStreak(p.streak);
          setDays(p.days);
        })
        .catch(() => {});
      getDailyPuzzles()
        .then((set) => !cancelled && setSolved(solvedCount(set.puzzles)))
        .catch(() => {});
      getMyLichess()
        .then((mine) => {
          if (cancelled || !mine.linked) return;
          const best = [...mine.link.ratings].filter((r) => r.rating > 0)[0];
          if (best) setRating(best.rating);
        })
        .catch(() => {});
      if (user?.studentId) {
        api
          .get<StudentRow[]>("students")
          .then((rows) => {
            const self = rows.find((r) => r.student_id === user.studentId);
            if (!cancelled && self) setRecord(self);
          })
          .catch(() => {});
        // `attendance` is scoped to the pupil's own rows; the sessions are
        // what the count checks each row against.
        Promise.all([
          api.get<{ session_id: string; check_in_time?: string }[]>("attendance"),
          api.get<{ session_id: string }[]>("class-sessions"),
        ])
          .then(([attendance, sessions]) => {
            if (!cancelled) setClasses(classesAttended(attendance, new Set(sessions.map((x) => x.session_id))));
          })
          .catch(() => {});
      }
      return () => {
        cancelled = true;
      };
    }, [user?.studentId]),
  );

  const name = record?.name ?? user?.displayName ?? "";
  const initial = name.trim().charAt(0).toUpperCase() || "S";

  return (
    <ScrollView
      className="flex-1 bg-paper"
      contentContainerClassName="px-4 pb-32 pt-3 gap-3"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-display-semibold text-2xl text-navy">{t("profile")}</Text>
          <Text className="mt-1 font-sans text-xs text-muted">{t("profileSub")}</Text>
        </View>
        <View className="flex-row shrink-0 items-center gap-1.5 rounded-full border-2 border-line bg-card px-3 py-1.5">
          <Trophy size={14} color={C.gold} />
          <Text className="font-sans-bold text-xs text-ink">{rating ?? "—"}</Text>
        </View>
      </View>

      {/* Who this is. */}
      <View className="flex-row items-center gap-3 rounded-card bg-navy p-4 shadow-clay-lg">
        <View className="size-12 items-center justify-center rounded-2xl border-2 border-highlight bg-navy-deep">
          <Text className="font-display-semibold text-xl text-white">{initial}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-sans-bold text-base text-white">
            {name || "—"}
          </Text>
          <View className="mt-1 flex-row items-center gap-2">
            <View className="rounded-full bg-olive px-2 py-0.5">
              <Text className="font-sans-bold text-[9px] text-white">
                {record?.current_level || t("beginner")}
              </Text>
            </View>
            <Text className="font-sans text-[9px] text-navy-soft">
              #{user?.studentId || "—"}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Tile
          icon={<Flame size={20} color={C.brick} />}
          value={String(streak)}
          label={t("streakLabel")}
        />
        <Tile
          icon={<Gamepad2 size={20} color={C.highlightInk} />}
          value={String(solved)}
          label={t("puzzlesSolvedLabel")}
        />
        <Tile
          icon={<GraduationCap size={20} color={C.olive} />}
          value={classes === null ? "—" : String(classes)}
          label={t("classesLabel")}
        />
      </View>

      {/* The week actually practised. */}
      <View className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <View className="flex-row items-center gap-2">
          <View className="size-8 items-center justify-center rounded-xl bg-brick-soft">
            <Flame size={16} color={C.brick} />
          </View>
          <Text className="font-sans-bold text-sm text-ink">{t("dayStreak", { n: streak })}</Text>
        </View>
        <Text className="ml-10 font-sans text-[10px] text-muted">{t("streakHint")}</Text>

        <View className="mt-3 flex-row gap-1.5">
          {days.map((day) => {
            const weekday = new Date(day.date + "T00:00:00").getDay();
            return (
              <View key={day.date} className="min-w-0 flex-1 items-center gap-1">
                <View
                  className={`aspect-square w-full items-center justify-center rounded-lg ${
                    day.practised ? "bg-brick" : "border-2 border-line bg-paper"
                  }`}
                >
                  {day.practised ? (
                    <Check size={14} color={C.white} strokeWidth={3} />
                  ) : (
                    <Text className="font-sans-bold text-[10px] text-muted">
                      {Number(day.date.slice(8))}
                    </Text>
                  )}
                </View>
                {/* `getDay()` counts from Sunday; the strip and its labels
                    count from Monday, as the academy's week does. */}
                <Text className="font-sans-semibold text-[8px] text-muted">
                  {t(`weekday.${(weekday + 6) % 7}`)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <LichessCard />

      <View className="flex-row items-center justify-between gap-3 rounded-card border-2 border-line bg-card px-4 py-3 shadow-clay">
        <LanguageToggle className="!border-0 !shadow-none" />
        <SignOutButton />
      </View>
    </ScrollView>
  );
}

function Tile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View className="min-w-0 flex-1 items-center rounded-2xl border-2 border-line bg-card px-2 py-3 shadow-clay">
      {icon}
      <Text className="mt-1 font-sans-extrabold text-sm text-ink">{value}</Text>
      <Text numberOfLines={1} className="font-sans-semibold text-[9px] text-muted">
        {label}
      </Text>
    </View>
  );
}
