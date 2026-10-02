/**
 * The games waiting for this pupil — on the home screen and on Play. The
 * mobile twin of the web app's MyGames.
 *
 * When the teacher pairs two students, the game arrives here as an invitation:
 * who they are playing, which colour, the time control. Nothing starts until
 * the pupil presses Enter; the game is in play once both have, so neither
 * child's clock runs while the other is still across the room. A game the
 * teacher paused shows as Paused: the pupil can open it and look, but
 * nothing moves until the teacher resumes it. Games a friend
 * accepted from Challenge show here too.
 *
 * Polled, not streamed: this list changes a few times a lesson, and the board
 * itself streams once it is open.
 */
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslations } from "use-intl";
import { ChevronRight, DoorOpen, Hourglass, Pause, Swords } from "lucide-react-native";
import { enterRoom, listMyRooms, type Room } from "@/lib/games";
import { stepOf, timeControlLabel, unfinished } from "@/lib/live-games";
import { C } from "@/lib/colors";

const POLL_MS = 8000;

export function MyGames({ myAccountId }: { myAccountId: string }) {
  const t = useTranslations("play");
  const [games, setGames] = useState<Room[]>([]);
  const [entering, setEntering] = useState("");

  const load = useCallback(async () => {
    try {
      setGames(unfinished(await listMyRooms()));
    } catch {
      /* Offline for a moment; the next poll catches up. */
    }
  }, []);

  /* Fresh every time the screen comes back into view — returning from a
     finished game should not leave it listed. */
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  useEffect(() => {
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  if (games.length === 0) return null;

  async function enter(id: string) {
    setEntering(id);
    try {
      await enterRoom(id).catch(() => {});
    } finally {
      setEntering("");
      router.push(`/student/play/room/${id}`);
    }
  }

  return (
    <View className="gap-2.5">
      <Text accessibilityRole="header" className="font-sans-bold text-base text-ink">
        {t("myGames.title")}
      </Text>
      {games.map((g) => {
        const side = g.white?.userAccountId === myAccountId ? "White" : "Black";
        const opponent = side === "White" ? g.black : g.white;
        const step = stepOf(g, myAccountId);
        const myTurn = g.status === "Active" && g.turn === side;
        const tc = timeControlLabel(g.timeControl);
        const details = [
          t("myGames.youPlay", { side: t(`side.${side}`) }),
          tc ? t("timeControl", { tc }) : "",
          g.lichessRated ? t("myGames.rated") : "",
        ].filter(Boolean);

        /* An invitation is the one thing on the screen asking for a tap, so it
           is the loud card: who, which colour, and one button. */
        if (step === "invited") {
          return (
            <View key={g.gameRoomId} className="rounded-card border-2 border-navySoft bg-highlight p-4">
              <Text className="font-sans-bold text-[11px] uppercase tracking-[1px] text-navy">
                {g.moveCount ? t("myGames.continueTitle") : t("myGames.invited")}
              </Text>
              <Text className="mt-1 font-sans-bold text-base text-ink">
                {t("myGames.competing", { name: opponent?.displayName ?? "" })}
              </Text>
              <Text className="mt-1 font-sans text-xs text-muted">{details.join(" · ")}</Text>
              {g.label ? <Text className="mt-0.5 font-sans text-xs text-muted">{g.label}</Text> : null}
              <Pressable
                accessibilityRole="button"
                disabled={entering === g.gameRoomId}
                onPress={() => void enter(g.gameRoomId)}
                className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-navy py-3 active:opacity-80"
              >
                {entering === g.gameRoomId ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <DoorOpen size={16} color="#ffffff" />
                )}
                <Text className="font-sans-bold text-sm text-white">
                  {entering === g.gameRoomId ? t("myGames.entering") : t("myGames.enter")}
                </Text>
              </Pressable>
            </View>
          );
        }

        return (
          <Pressable
            key={g.gameRoomId}
            accessibilityRole="button"
            onPress={() => router.push(`/student/play/room/${g.gameRoomId}`)}
            className={`flex-row items-center gap-3 rounded-card border-2 bg-card p-3.5 active:opacity-80 ${
              myTurn ? "border-olive" : "border-line"
            }`}
          >
            <View className="size-11 items-center justify-center rounded-xl bg-highlight">
              {step === "onHold" ? (
                <Pause size={20} color={C.highlightInk} />
              ) : step === "waitingForOpponent" ? (
                <Hourglass size={20} color={C.highlightInk} />
              ) : (
                <Swords size={20} color={C.highlightInk} />
              )}
            </View>
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="font-sans-bold text-base text-ink">
                {t("myGames.vs", { name: opponent?.displayName ?? "" })}
              </Text>
              <Text className="mt-0.5 font-sans text-xs text-muted">
                {step === "onHold"
                  ? t("myGames.onHoldBody")
                  : step === "waitingForOpponent"
                  ? t("myGames.waitingFor", { name: opponent?.displayName ?? "" })
                  : `${details[0]} · ${myTurn ? t("myGames.yourTurn") : t("myGames.theirTurn")}`}
              </Text>
            </View>
            {step === "onHold" ? (
              <View className="rounded-full bg-highlight px-3 py-1.5">
                <Text className="font-sans-bold text-xs text-navy">{t("myGames.onHold")}</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1">
                <Text className="font-sans-bold text-sm text-navy">{t("myGames.open")}</Text>
                <ChevronRight size={16} color={C.navy} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
