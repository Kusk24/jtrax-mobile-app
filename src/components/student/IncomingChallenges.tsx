/* Invitations from friends to play — who, the clock, rated or not, and
   Accept / Decline. The web's IncomingChallengeList, shared by the Games
   tab's challenge panel and the student home, so an invitation is seen
   wherever the child is. */
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { Check, Timer, X } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { Panel } from "@/components/game/PlayShell";
import { PrimaryPill, SecondaryPill } from "@/components/student/kit";
import { acceptChallenge, declineChallenge, incomingInvitations, listChallenges, type Challenge } from "@/lib/challenges";

/** As often as the Games tab checks: somebody is waiting on the answer. */
const POLL_MS = 5000;

const clockLabel = (c: Challenge) => `${Math.round(c.clockLimit / 60)}+${c.clockIncrement}`;

/** The invitations, drawn; nothing when there are none. */
export function IncomingChallengeList({
  incoming,
  busy,
  onAccept,
  onDecline,
}: {
  incoming: Challenge[];
  busy: string | null;
  onAccept: (c: Challenge) => void;
  onDecline: (c: Challenge) => void;
}) {
  const t = useTranslations("challenge");
  const { pp } = usePalette();
  if (incoming.length === 0) return null;
  return (
    <View className="gap-2.5">
      <View className="flex-row items-center justify-between gap-2 px-1">
        <View className="flex-row items-center gap-2">
          <View className="size-2.5 rounded-full bg-pp-blue" />
          <Text accessibilityRole="header" className="font-pp-display-semibold text-[16px] text-pp-ink">
            {t("incoming")}
          </Text>
        </View>
        <View className="rounded-full bg-pp-blue px-2.5 py-[3px]">
          <Text className="font-pp-semibold text-[12.5px] text-white">{t("newCount", { n: incoming.length })}</Text>
        </View>
      </View>
      {incoming.map((c) => (
        <Panel key={c.challengeId} className="gap-3.5">
          <View className="flex-row items-center gap-3">
            <View className="size-12 items-center justify-center rounded-full bg-pp-soft">
              <Text className="font-pp-display-bold text-[18px] text-pp-blue">
                {c.opponentName.trim().charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="font-pp-display-semibold text-[16px] text-pp-ink">
                {c.opponentName}
              </Text>
              <Text className="font-pp text-[13px] text-pp-muted">
                {clockLabel(c)} · {c.rated ? t("rated") : t("friendly")}
              </Text>
            </View>
            <View className="flex-row items-center gap-1 rounded-full bg-pp-green-soft px-2.5 py-1">
              <Timer size={14} color={pp.green} strokeWidth={2.4} />
              <Text className="font-pp-semibold text-[12.5px] text-pp-green">
                {t("minutes", { n: Math.round(c.clockLimit / 60) })}
              </Text>
            </View>
          </View>
          {/* Said before they accept, not after the game turns out unrated. */}
          {c.rated && !c.bothCanPlayRated && (
            <Text className="font-pp-semibold text-[12.5px] text-pp-amber">{t("ratedNotPossible")}</Text>
          )}
          <View className="flex-row gap-2.5">
            <PrimaryPill
              label={t("accept")}
              icon={<Check size={16} color="#ffffff" strokeWidth={2.6} />}
              disabled={busy === c.challengeId}
              onPress={() => onAccept(c)}
              className="flex-1 px-4"
            />
            <SecondaryPill
              label={t("decline")}
              icon={<X size={16} color={pp.ink} strokeWidth={2.6} />}
              disabled={busy === c.challengeId}
              onPress={() => onDecline(c)}
              className="flex-1 px-4"
            />
          </View>
        </Panel>
      ))}
    </View>
  );
}

/** The same, on its own: fetches and keeps checking, for the home screen.
    Accepting goes straight to the board, as it does from Games. */
export function IncomingChallenges() {
  const t = useTranslations("challenge");
  const [incoming, setIncoming] = useState<Challenge[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setIncoming(incomingInvitations(await listChallenges()));
    } catch {
      /* A blip leaves what was shown; Games says when loading fails. */
    }
  }, []);

  useEffect(() => {
    /* First look straight away, then every few seconds, as Games does. */
    const first = setTimeout(() => void reload(), 0);
    const timer = setInterval(() => void reload(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [reload]);

  async function run(c: Challenge, fn: () => Promise<void>) {
    setBusy(c.challengeId);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(null);
    }
  }

  if (incoming.length === 0) return null;
  return (
    <View className="gap-2">
      {error !== "" && (
        <View className="rounded-2xl bg-pp-red-soft px-3.5 py-2.5">
          <Text accessibilityRole="alert" className="font-pp-semibold text-[12.5px] text-pp-red">
            {error}
          </Text>
        </View>
      )}
      <IncomingChallengeList
        incoming={incoming}
        busy={busy}
        onAccept={(c) =>
          void run(c, async () => {
            const out = await acceptChallenge(c.challengeId);
            router.push(`/student/play/room/${out.gameRoomId}` as never);
          })
        }
        onDecline={(c) =>
          void run(c, async () => {
            await declineChallenge(c.challengeId);
            await reload();
          })
        }
      />
    </View>
  );
}
