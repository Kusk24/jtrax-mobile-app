/**
 * One game and one daily challenge, as a row — shared by the Games tab's
 * Recent games and the History screen, so the two describe a game the same
 * way. The web's components/student/HistoryRows.tsx.
 */
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useLocale, useTranslations } from "use-intl";
import { Bot, Check, ChessKnight, ChevronDown, ChevronRight, DoorOpen, Minus, Puzzle, X } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { FriendPawns } from "@/components/student/FriendPawns";
import { stampDate, type ChallengeDay, type HistoryEntry } from "@/lib/progress";

/** Dates and times in the reader's language, through Intl. */
export function useWhen() {
  const locale = useLocale();
  return {
    date: (d: Date) => d.toLocaleDateString(locale, { month: "short", day: "numeric" }),
    time: (d: Date) => d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
    day: (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" }),
  };
}

const OUTCOME = {
  win: { bg: "bg-pp-green-soft", ink: "text-pp-green", icon: Check, key: "green" },
  loss: { bg: "bg-pp-red-soft", ink: "text-pp-red", icon: X, key: "red" },
  draw: { bg: "bg-pp-neutral", ink: "text-pp-muted", icon: Minus, key: "muted" },
} as const;

export function OutcomeChip({ outcome }: { outcome: "win" | "loss" | "draw" }) {
  const t = useTranslations("st");
  const { pp } = usePalette();
  const o = OUTCOME[outcome];
  return (
    <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-0.5 ${o.bg}`}>
      <o.icon size={14} color={pp[o.key]} strokeWidth={2.6} />
      <Text className={`font-pp-semibold text-[12px] ${o.ink}`}>{t(`outcome.${outcome}`)}</Text>
    </View>
  );
}

/** A finished game, plainly: who it was with, when, the result, and View. */
export function GameRow({ game, outcome }: { game: HistoryEntry; outcome: "win" | "loss" | "draw" | null }) {
  const t3 = useTranslations("sv3");
  const when = useWhen();
  const { pp } = usePalette();
  const at = stampDate(game.at);
  const type = game.gameType ?? "class";
  const opponent = type === "computer" ? t3(`robotName.${(game.opponent ?? "novice") as "novice" | "strong" | "expert"}`) : game.opponent || "—";

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/student/history/game", params: { kind: game.kind, id: game.id } })}
      accessibilityRole="button"
      className="flex-row items-center gap-3 py-3 active:opacity-70"
    >
      {/* Each kind of game keeps the icon it has on the Games tab. */}
      <View
        className={`size-10 items-center justify-center rounded-xl ${
          type === "computer" ? "bg-pp-soft" : type === "challenge" ? "bg-st-orange-soft" : "bg-pp-green-soft"
        }`}
      >
        {type === "computer" ? (
          <Bot size={20} color={pp.blue} strokeWidth={2} />
        ) : type === "challenge" ? (
          <FriendPawns size={20} />
        ) : (
          <DoorOpen size={20} color={pp.green} strokeWidth={2} />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-pp text-[14px] text-pp-ink">
          {t3("playWith")} <Text className="font-pp-bold text-pp-blue">{opponent}</Text>
        </Text>
        <Text className="mt-0.5 font-pp text-[12px] text-pp-muted">
          {when.date(at)} · {when.time(at)}
        </Text>
      </View>
      <View className="flex-row items-center gap-2.5">
        {outcome && <OutcomeChip outcome={outcome} />}
        <View className="flex-row items-center gap-0.5">
          <Text className="font-pp-semibold text-[12.5px] text-pp-ink">{t3("view")}</Text>
          <ChevronRight size={14} color={pp.ink} strokeWidth={2.4} />
        </View>
      </View>
    </Pressable>
  );
}

/** One day's daily challenge; it opens to show the day's puzzles. */
export function ChallengeRow({ day, puzzles, today }: { day: ChallengeDay; puzzles?: HistoryEntry[]; today: string }) {
  const t = useTranslations("st");
  const when = useWhen();
  const { pp, st } = usePalette();
  const [open, setOpen] = useState(false);
  const isToday = today === day.date;
  const status = day.complete ? "complete" : isToday ? "inProgress" : "missed";
  const chip =
    status === "complete"
      ? { bg: "bg-pp-green-soft", ink: "text-pp-green" }
      : status === "inProgress"
        ? { bg: "bg-st-gold-soft", ink: "text-st-gold" }
        : { bg: "bg-pp-neutral", ink: "text-pp-muted" };

  return (
    <View className="py-3">
      <View className="flex-row items-center gap-3">
        <View className={`size-10 items-center justify-center rounded-xl ${day.complete ? "bg-pp-green-soft" : "bg-st-gold-soft"}`}>
          {day.complete ? <Check size={20} color={pp.green} strokeWidth={2.6} /> : <Puzzle size={20} color={st.gold} strokeWidth={2} />}
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Text className="font-pp-semibold text-[14.5px] text-pp-ink">{t("dailyChallengeOn", { date: when.day(day.date) })}</Text>
            <View className={`rounded-full px-2.5 py-0.5 ${chip.bg}`}>
              <Text className={`font-pp-semibold text-[12px] ${chip.ink}`}>{t(`challengeStatus.${status}`)}</Text>
            </View>
          </View>
          <Text className="mt-0.5 font-pp text-[12.5px] text-pp-muted">{t("puzzlesOf", { n: day.solved, total: day.total })}</Text>
        </View>
        {isToday && !day.complete ? (
          <Pressable onPress={() => router.push("/student/puzzles/daily")} accessibilityRole="button" className="flex-row items-center gap-0.5">
            <Text className="font-pp-semibold text-[12.5px] text-pp-ink">{t("continueChallenge")}</Text>
            <ChevronRight size={14} color={pp.ink} strokeWidth={2.4} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            className="flex-row items-center gap-0.5"
          >
            <Text className="font-pp-semibold text-[12.5px] text-pp-ink">{t("viewChallenge")}</Text>
            <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
              <ChevronDown size={14} color={pp.ink} strokeWidth={2.4} />
            </View>
          </Pressable>
        )}
      </View>
      {open && (
        <View className="mt-3 gap-2 pl-[52px]">
          {(puzzles ?? []).map((pz, i) => (
            <View key={pz.id} className="flex-row items-center gap-2.5 rounded-xl border-[1.5px] border-pp-line bg-pp-bg px-3 py-2">
              <ChessKnight size={16} color={pp.blue} strokeWidth={2} />
              <View className="min-w-0 flex-1">
                <Text className="font-pp-semibold text-[13px] text-pp-ink">{t("puzzleN", { n: i + 1 })}</Text>
                <Text className="font-pp text-[11.5px] text-pp-muted">{t("rated", { n: pz.against })}</Text>
              </View>
              {pz.result === "solved" ? (
                <Check size={16} color={pp.green} strokeWidth={3} accessibilityLabel={t("solved")} />
              ) : (
                <X size={16} color={pp.faint} strokeWidth={3} accessibilityLabel={t("notSolved")} />
              )}
            </View>
          ))}
          {(puzzles ?? []).length === 0 && <Text className="font-pp text-[12.5px] text-pp-muted">{t("noPuzzleDetail")}</Text>}
        </View>
      )}
    </View>
  );
}
