/**
 * The last three finished games on the Games tab, drawn with History's own
 * game row, and the way into the full history — the web's RecentGames.
 */
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslations } from "use-intl";
import { ChevronRight } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { Card } from "@/components/student/kit";
import { GameRow } from "@/components/student/HistoryRows";
import { getHistory, isFinishedGame, outcomeOf, type HistoryEntry } from "@/lib/progress";

export function RecentGames({ studentId }: { studentId: string }) {
  const t3 = useTranslations("sv3");
  const { pp } = usePalette();
  const [games, setGames] = useState<HistoryEntry[] | null>(null);

  /* Re-read on return, so a game just finished is listed. */
  useFocusEffect(
    useCallback(() => {
      if (!studentId) return;
      let alive = true;
      getHistory(studentId)
        .then((h) => alive && setGames(h.filter(isFinishedGame).slice(0, 3)))
        .catch(() => alive && setGames([]));
      return () => {
        alive = false;
      };
    }, [studentId]),
  );

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between px-0.5">
        <Text accessibilityRole="header" className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
          {t3("recentGames")}
        </Text>
        <Pressable onPress={() => router.push("/student/history")} accessibilityRole="link" className="flex-row items-center gap-0.5">
          <Text className="font-pp-semibold text-[12px] text-pp-blue">{t3("seeAllGames")}</Text>
          <ChevronRight size={14} color={pp.blue} strokeWidth={2.4} />
        </Pressable>
      </View>
      <Card className="py-1.5">
        {games === null ? (
          <View className="items-center py-4">
            <ActivityIndicator color={pp.muted} />
          </View>
        ) : games.length === 0 ? (
          <Text className="py-4 text-center font-pp text-[13px] text-pp-muted">{t3("noGamesYet")}</Text>
        ) : (
          games.map((g, i) => (
            <View key={`${g.kind}-${g.id}`} className={i > 0 ? "border-t border-pp-line" : ""}>
              <GameRow game={g} outcome={outcomeOf(g.result, g.side)} />
            </View>
          ))
        )}
      </Card>
    </View>
  );
}
