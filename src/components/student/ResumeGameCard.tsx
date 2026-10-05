/**
 * Home's reminder of a robot game left unfinished — the web's ResumeGameCard:
 * who it is against and how far it got, one tap back to the board, and a ✕
 * to drop it instead. Draws nothing when there is none.
 */
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslations } from "use-intl";
import { Bot, Play, X } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { clearSavedAiGame, loadSavedAiGame, type SavedAiGame } from "@/lib/saved-ai-game";

export function ResumeGameCard() {
  const t3 = useTranslations("sv3");
  const { pp } = usePalette();
  const [kept, setKept] = useState<SavedAiGame | null>(null);

  /* Read on every visit: a game played or finished since changes it. */
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadSavedAiGame().then((g) => alive && setKept(g));
      return () => {
        alive = false;
      };
    }, []),
  );

  if (!kept) return null;
  return (
    <View className="flex-row items-center rounded-xl border-[1.5px] border-pp-soft bg-pp-soft">
      <Pressable
        onPress={() => router.push({ pathname: "/student/play/ai", params: { opponent: kept.opponent } })}
        accessibilityRole="button"
        accessibilityLabel={`${t3("resume")}: ${t3(`robotName.${kept.opponent}`)}`}
        className="min-w-0 flex-1 flex-row items-center gap-3 py-2.5 pl-3 active:opacity-80"
      >
        <View className="size-9 items-center justify-center rounded-lg bg-pp-card">
          <Bot size={20} color={pp.blue} strokeWidth={2} />
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-pp-bold text-[13.5px] text-pp-ink">
            {t3("resumeGame")}
          </Text>
          <Text numberOfLines={1} className="font-pp text-[11.5px] text-pp-blue">
            {t3(`robotName.${kept.opponent}`)} · {t3("moveN", { n: Math.ceil(kept.moves.length / 2) })}
          </Text>
        </View>
        {/* Resume, as a filled play button. */}
        <View className="size-8 items-center justify-center rounded-full bg-pp-blue">
          <Play size={14} color="#ffffff" fill="#ffffff" strokeWidth={0} style={{ marginLeft: 2 }} />
        </View>
      </Pressable>
      {/* Not interested: the unfinished game is dropped, nothing recorded. */}
      <Pressable
        onPress={() => {
          void clearSavedAiGame();
          setKept(null);
        }}
        accessibilityRole="button"
        accessibilityLabel={t3("dismissGame")}
        hitSlop={6}
        className="ml-2 mr-3 size-8 items-center justify-center rounded-full border-[1.5px] border-pp-red bg-pp-card active:bg-pp-red-soft"
      >
        <X size={14} color={pp.red} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}
