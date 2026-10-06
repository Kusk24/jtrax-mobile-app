/**
 * The games waiting for this pupil — on the home screen and on Games. The
 * mobile twin of the web app's MyGames, drawn as it is there.
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
import { usePalette } from "@/components/ThemeProvider";

const POLL_MS = 8000;

export function MyGames({ myAccountId }: { myAccountId: string }) {
  const t = useTranslations("play");
  const { pp } = usePalette();
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
      <Text accessibilityRole="header" className="font-pp-semibold text-[14px] text-pp-ink">
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
            <View key={g.gameRoomId} className="rounded-2xl border-[1.5px] border-st-brand-line bg-pp-soft p-[18px]">
              <Text className="font-pp-bold text-[10.5px] uppercase tracking-[0.9px] text-pp-blue">
                {g.moveCount ? t("myGames.continueTitle") : t("myGames.invited")}
              </Text>
              <Text className="mt-1 font-pp-bold text-[16px] leading-snug text-pp-ink">
                {t("myGames.competing", { name: opponent?.displayName ?? "" })}
              </Text>
              <Text className="mt-1 font-pp text-[11.5px] text-pp-muted">{details.join(" · ")}</Text>
              {g.label ? <Text className="mt-0.5 font-pp text-[11px] text-pp-muted">{g.label}</Text> : null}
              <Pressable
                accessibilityRole="button"
                disabled={entering === g.gameRoomId}
                onPress={() => void enter(g.gameRoomId)}
                className="mt-3 min-h-11 flex-row items-center justify-center gap-[7px] rounded-full bg-pp-blue active:bg-pp-deep"
              >
                {entering === g.gameRoomId ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <DoorOpen size={16} color="#ffffff" />
                )}
                <Text className="font-pp-semibold text-[14px] text-white">
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
            /* Green when it is this pupil's move: the one game here that is
               waiting on them. */
            className={`flex-row items-center gap-3 rounded-2xl border-[1.5px] p-3.5 active:bg-pp-soft ${
              myTurn ? "border-pp-green-soft bg-pp-green-soft" : "border-pp-line bg-pp-card"
            }`}
          >
            <View className="size-11 items-center justify-center rounded-2xl bg-pp-soft">
              {step === "onHold" ? (
                <Pause size={20} color={pp.ink} strokeWidth={2.2} />
              ) : step === "waitingForOpponent" ? (
                <Hourglass size={20} color={pp.ink} strokeWidth={2.2} />
              ) : (
                <Swords size={20} color={pp.ink} strokeWidth={2.2} />
              )}
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
              <Text numberOfLines={1} className="font-pp-bold text-[14px] text-pp-ink">
                {t("myGames.vs", { name: opponent?.displayName ?? "" })}
              </Text>
              <Text className="font-pp text-[10.5px] text-pp-muted">
                {step === "onHold"
                  ? t("myGames.onHoldBody")
                  : step === "waitingForOpponent"
                  ? t("myGames.waitingFor", { name: opponent?.displayName ?? "" })
                  : `${details[0]} · ${myTurn ? t("myGames.yourTurn") : t("myGames.theirTurn")}`}
              </Text>
            </View>
            {step === "onHold" ? (
              <View className="rounded-full bg-st-gold-soft px-3 py-1.5">
                <Text className="font-pp-bold text-[11.5px] text-st-gold">{t("myGames.onHold")}</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1">
                <Text className="font-pp-bold text-[12px] text-pp-ink">{t("myGames.open")}</Text>
                <ChevronRight size={16} color={pp.ink} strokeWidth={2.2} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
