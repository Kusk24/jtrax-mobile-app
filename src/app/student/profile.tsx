/**
 * Profile: the pupil as a chess player, each fact once — the web's student
 * ProfileScreen.
 *
 * Who they are (avatar, name, login ID, level) centred at the top, three
 * numbers (rating, games played, puzzles solved), this week's streak with the
 * current and longest runs, and the account settings last. Every number is
 * the server's: a streak or a rating a child sees on their own screen is a
 * claim about them. The avatar opens an editor for the display name — saved
 * to the account — and an emoji kept on this phone.
 */
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslations } from "use-intl";
import { Flame, Pencil, Trophy } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { AppearancePicker } from "@/components/AppearancePicker";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { LanguagePicker } from "@/components/LanguagePicker";
import { SignOutButton } from "@/components/SignOutButton";
import { LichessCard } from "@/components/student/LichessCard";
import { ProfileEditSheet } from "@/components/student/ProfileEditSheet";
import { StreakCalendar } from "@/components/student/StreakCalendar";
import { SummaryPills } from "@/components/student/SummaryPills";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { getMyLichess } from "@/lib/lichess";
import { academyToday, getProgress, type Progress } from "@/lib/progress";
import { cleanDisplayName } from "@/lib/display-name";
import { loadAvatar, saveAvatar } from "@/lib/student-avatar";

/** The pupil's own row. The scope on `students` means this list is only ever
    the caller's own record, but it is found by id rather than taken as [0]. */
type StudentRow = { student_id: string; name?: string; current_level?: string };

/** Rapid is what the academy plays, so it leads; the puzzle rating is last —
    it is not a measure of playing strength. */
const PERF_ORDER = ["rapid", "blitz", "classical", "bullet", "puzzle"];

function SectionTitle({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" className="px-0.5 font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
      {children}
    </Text>
  );
}

export default function StudentProfileScreen() {
  const t = useTranslations("st");
  const t3 = useTranslations("sv3");
  const { st } = usePalette();
  const { user, updateUser } = useSession();
  const studentId = user?.studentId ?? "";

  const [record, setRecord] = useState<StudentRow | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [rating, setRating] = useState<{ perf: string; value: number } | null>(null);
  const [avatar, setAvatar] = useState("");
  const [editing, setEditing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getProgress()
        .then((p) => !cancelled && setProgress(p))
        .catch(() => {});
      getMyLichess()
        .then((mine) => {
          if (cancelled || !mine.linked) return;
          const best = [...mine.link.ratings]
            .filter((r) => r.rating > 0)
            .sort((a, b) => PERF_ORDER.indexOf(a.perf) - PERF_ORDER.indexOf(b.perf))[0];
          setRating(best ? { perf: best.perf, value: best.rating } : null);
        })
        .catch(() => {});
      if (studentId) {
        api
          .get<StudentRow[]>("students")
          .then((rows) => {
            const self = rows.find((r) => r.student_id === studentId);
            if (!cancelled && self) setRecord(self);
          })
          .catch(() => {});
        loadAvatar(studentId).then((a) => !cancelled && setAvatar(a));
      }
      return () => {
        cancelled = true;
      };
    }, [studentId]),
  );

  /* The display name the pupil chose, else the office's name for them. */
  const name = user?.displayName || record?.name || "";

  /** Saves a new display name — what the student screens call the pupil.
      The official name the office entered is untouched. */
  async function rename(next: string): Promise<boolean> {
    const clean = cleanDisplayName(next);
    if (!clean) return false;
    if (clean === name) return true;
    try {
      await api.patch("auth/me", { displayName: clean });
      updateUser({ displayName: clean });
      return true;
    } catch {
      return false;
    }
  }

  return (
    <ScrollView className="flex-1 bg-pp-bg" contentContainerClassName="gap-5 px-4 pb-8 pt-3" showsVerticalScrollIndicator={false}>
      {/* Who, centred: the avatar, then the name, then the login ID and level. */}
      <View className="items-center gap-2 pt-1">
        {/* The avatar opens the editor; the pencil says it can be changed. */}
        <Pressable onPress={() => setEditing(true)} accessibilityRole="button" accessibilityLabel={t3("editProfile")}>
          <View className="size-20 items-center justify-center rounded-full border-4 border-pp-card bg-pp-soft">
            {/* Their emoji, or the white knight until they choose one. */}
            <Text className={avatar ? "text-[40px] leading-[48px]" : "text-[40px] leading-[48px] text-pp-blue"}>
              {avatar || "♘"}
            </Text>
          </View>
          <View className="absolute bottom-0 right-0 size-5 items-center justify-center rounded-full border-2 border-pp-card bg-st-brand">
            <Pencil size={10} color="#ffffff" strokeWidth={2.6} />
          </View>
        </Pressable>
        <View className="max-w-full items-center gap-1">
          <Text accessibilityRole="header" numberOfLines={1} className="font-pp-display-bold text-[23px] leading-tight text-pp-ink">
            {name || "—"}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="font-pp text-[12px] text-pp-muted">@{studentId || "—"}</Text>
            {/* The level the office set. */}
            {record?.current_level ? (
              <View className="rounded-full bg-pp-plum-soft px-2 py-0.5">
                <Text className="font-pp-bold text-[10.5px] text-pp-deep">{record.current_level}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {editing && (
        <ProfileEditSheet
          name={name}
          studentId={studentId}
          avatar={avatar}
          onClose={() => setEditing(false)}
          onSave={async (next) => {
            if (!(await rename(next.name))) return false;
            await saveAvatar(studentId, next.avatar);
            setAvatar(next.avatar);
            return true;
          }}
        />
      )}

      <SummaryPills
        rating={rating}
        gamesPlayed={progress ? progress.gamesPlayed : null}
        puzzlesSolved={progress ? progress.puzzlesSolved : null}
      />

      <View className="rounded-xl border-[1.5px] border-pp-line bg-pp-card p-3">
        {/* The current streak lives here, with the week it is counted on. */}
        <View className="mb-2.5 flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-1.5">
            <Flame size={16} color={st.orange} fill="#fb923c" strokeWidth={2.2} />
            <Text className="font-pp-bold text-[14px] text-pp-ink">{t("dailyStreak")}</Text>
          </View>
          <View className="rounded-full bg-st-orange-soft px-2.5 py-0.5">
            <Text className="font-pp-bold text-[12.5px] text-st-orange">{t("daysN", { n: progress?.streak.current ?? 0 })}</Text>
          </View>
        </View>
        <StreakCalendar practised={progress?.practisedDays ?? []} today={academyToday()} />
        <Text className="mt-2 font-pp text-[11.5px] text-pp-muted">{t("streakHint")}</Text>
        {/* The best run so far, as the card's last line. */}
        <View className="mt-3 flex-row items-center justify-between gap-3 border-t border-pp-line pt-2.5">
          <View className="flex-row items-center gap-1.5">
            <Trophy size={16} color={st.gold} strokeWidth={2.2} />
            <Text className="font-pp-semibold text-[12.5px] text-pp-muted">{t("longestStreak")}</Text>
          </View>
          <Text className="font-pp-bold text-[13px] text-pp-ink">{t("daysN", { n: progress?.streak.longest ?? 0 })}</Text>
        </View>
      </View>

      <View className="gap-2">
        <SectionTitle>{t3("account")}</SectionTitle>
        <LichessCard />
      </View>

      <View className="gap-2">
        <AppearancePicker />
        <LanguagePicker />
      </View>

      <View className="gap-2">
        <ChangePasswordForm tone="student" />
        <SignOutButton />
      </View>
    </ScrollView>
  );
}
