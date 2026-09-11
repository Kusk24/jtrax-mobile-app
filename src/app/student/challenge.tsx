/**
 * Finding a friend and asking them for a game.
 *
 * Two halves on one screen, in the order a child uses them: what is waiting for
 * you, then the search box for starting something new. Invitations come first
 * because somebody is on the other end of them.
 *
 * The rated toggle carries a warning rather than being hidden when it cannot
 * work. A pupil who cannot see the option cannot find out why — "you both need
 * a Lichess account" is a thing they can go and fix, and a disabled-looking row
 * that says so teaches more than a row that is not there.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { Check, Search, Swords, X } from "lucide-react-native";
import { PlayShell, Panel } from "@/components/game/PlayShell";
import { useSession } from "@/lib/session";
import {
  CLOCKS,
  acceptChallenge,
  cancelChallenge,
  declineChallenge,
  listChallenges,
  searchPlayers,
  sendChallenge,
  type Challenge,
  type PlayerResult,
} from "@/lib/challenges";
import { C } from "@/lib/colors";

/** Somebody else may answer while this screen is open, and a child staring at
    "waiting…" should not have to know to pull down to refresh. */
const POLL_MS = 5000;
/** This endpoint names other children, so it is not hit on every keystroke. */
const DEBOUNCE_MS = 350;
const MIN_QUERY = 2;

export default function ChallengeScreen() {
  const t = useTranslations("challenge");
  const { user } = useSession();
  const myStudentId = user?.studentId ?? "";

  const [query, setQuery] = useState("");
  /* The players found *and the query they were found for*, together in one
     piece of state. Keeping them apart meant a third flag for "searching" and
     a window where the list on screen answered a query the box no longer
     held — someone typed "Ur", saw Uri, typed "Urx", and Uri stayed put. */
  const [found, setFound] = useState<{ q: string; players: PlayerResult[] }>({
    q: "",
    players: [],
  });
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rated, setRated] = useState(false);
  const [clock, setClock] = useState(2); // 15+10, the academy's usual
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setChallenges(await listChallenges());
    } catch {
      /* The empty state covers it. */
    }
  }, []);

  useEffect(() => {
    void reload();
    const timer = setInterval(() => void reload(), POLL_MS);
    return () => clearInterval(timer);
  }, [reload]);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const q = query.trim();
    if (q.length < MIN_QUERY) return;
    debounce.current = setTimeout(async () => {
      try {
        setFound({ q, players: await searchPlayers(q) });
      } catch {
        // An answer of "none" for this query, so the screen stops waiting.
        setFound({ q, players: [] });
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(null);
    }
  }

  const pending = challenges.filter((c) => c.status === "Pending");
  const accepted = challenges.filter((c) => c.status === "Accepted" && c.gameRoomId);
  /* Both derived from one fact: whether what we found matches what is in the
     box. Deleting two letters hides the list without waiting for a round trip
     to say so, and typing more shows "Looking…" without a flag to set. */
  const q = query.trim();
  const longEnough = q.length >= MIN_QUERY;
  const answered = found.q === q;
  const searching = longEnough && !answered;
  const shown = longEnough && answered ? found.players : [];

  return (
    <PlayShell title={t("title")} nav>
      {error !== "" && (
        <Panel className="!border-brick-soft !bg-brick-soft">
          <Text accessibilityRole="alert" className="font-sans-bold text-xs text-maroon">
            {error}
          </Text>
        </Panel>
      )}

      {/* ---- games that are ready to play ---- */}
      {accepted.map((c) => (
        <Panel key={c.challengeId} className="!flex-row !items-center !justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="font-sans-bold text-sm text-ink">
              {t("gameReady", { name: c.opponentName })}
            </Text>
            <Text className="font-sans text-xs text-muted">
              {c.rated ? t("rated") : t("friendly")}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(`/student/play/room/${c.gameRoomId}` as never)}
            className="shrink-0 rounded-full bg-navy px-4 py-3 active:opacity-80"
          >
            <Text className="font-sans-bold text-xs text-white">{t("openBoard")}</Text>
          </Pressable>
        </Panel>
      ))}

      {/* ---- invitations ---- */}
      {pending.length > 0 && (
        <>
          <Text className="px-1 font-sans-bold text-xs text-muted">{t("waiting")}</Text>
          {pending.map((c) => (
            <Panel key={c.challengeId} className="!flex-row !items-center !justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="font-sans-bold text-sm text-ink">
                  {c.opponentName}
                </Text>
                <Text className="font-sans text-xs text-muted">
                  {c.direction === "in" ? t("wantsToPlay") : t("waitingOnThem")}
                  {c.rated ? ` · ${t("rated")}` : ""}
                </Text>
                {/* Said before they accept, not after the game turns out
                    unrated. */}
                {c.rated && !c.bothCanPlayRated && (
                  <Text className="mt-1 font-sans-bold text-[11px] text-gold">
                    {t("ratedNotPossible")}
                  </Text>
                )}
              </View>
              <View className="shrink-0 flex-row gap-2">
                {c.direction === "in" ? (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("accept")}
                      disabled={busy === c.challengeId}
                      onPress={() =>
                        void run(c.challengeId, async () => {
                          const out = await acceptChallenge(c.challengeId);
                          router.push(`/student/play/room/${out.gameRoomId}` as never);
                        })
                      }
                      className="size-11 items-center justify-center rounded-full border-2 border-olive bg-olive-soft active:opacity-80 disabled:opacity-60"
                    >
                      <Check size={20} color={C.olive} strokeWidth={3} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("decline")}
                      disabled={busy === c.challengeId}
                      onPress={() =>
                        void run(c.challengeId, async () => {
                          await declineChallenge(c.challengeId);
                          await reload();
                        })
                      }
                      className="size-11 items-center justify-center rounded-full border-2 border-line bg-paper active:opacity-80 disabled:opacity-60"
                    >
                      <X size={20} color={C.ink} strokeWidth={3} />
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    disabled={busy === c.challengeId}
                    onPress={() =>
                      void run(c.challengeId, async () => {
                        await cancelChallenge(c.challengeId);
                        await reload();
                      })
                    }
                    className="min-h-11 justify-center rounded-2xl border-2 border-line bg-paper px-3.5 active:opacity-80 disabled:opacity-60"
                  >
                    <Text className="font-sans-bold text-xs text-muted">{t("cancel")}</Text>
                  </Pressable>
                )}
              </View>
            </Panel>
          ))}
        </>
      )}

      {/* ---- find somebody ---- */}
      <Text className="px-1 font-sans-bold text-xs text-muted">{t("findSomeone")}</Text>

      <View className="flex-row items-center gap-2.5 rounded-2xl border-2 border-line bg-card px-3.5">
        <Search size={18} color={C.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("searchPlaceholder")}
          placeholderTextColor={C.muted}
          accessibilityLabel={t("searchLabel")}
          autoCapitalize="none"
          autoCorrect={false}
          className="min-h-12 flex-1 font-sans-bold text-sm text-ink"
        />
      </View>

      {/* Their own id, so it can be read out to a friend in another class —
          the exact-id search exists precisely so that works. */}
      {myStudentId !== "" && (
        <Text className="px-1 font-sans text-[11px] text-muted">
          {t("yourId", { id: myStudentId })}
        </Text>
      )}

      {/* ---- what kind of game ---- */}
      <Panel className="gap-2.5">
        <View className="flex-row flex-wrap gap-1.5">
          {CLOCKS.map((c, i) => (
            <Pressable
              key={c.label}
              onPress={() => setClock(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: clock === i }}
              className={`min-h-9 justify-center rounded-2xl border-2 px-3 ${
                clock === i ? "border-navy bg-highlight" : "border-line bg-card"
              }`}
            >
              <Text
                className={`font-sans-bold text-xs ${clock === i ? "text-navy" : "text-muted"}`}
              >
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => setRated(!rated)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rated }}
          className="flex-row items-start gap-2.5"
        >
          <View
            className={`mt-0.5 size-5 shrink-0 items-center justify-center rounded-md border-2 ${
              rated ? "border-navy bg-navy" : "border-line bg-card"
            }`}
          >
            {rated && <Check size={13} color={C.white} strokeWidth={3.5} />}
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans-bold text-[13px] text-ink">{t("ratedLabel")}</Text>
            <Text className="font-sans text-[11px] leading-4 text-muted">{t("ratedHint")}</Text>
          </View>
        </Pressable>
      </Panel>

      {searching && (
        <View className="flex-row items-center gap-2 px-1">
          <ActivityIndicator color={C.navy} size="small" />
          <Text className="font-sans text-xs text-muted">{t("searching")}</Text>
        </View>
      )}

      {!searching && longEnough && shown.length === 0 && (
        <Text className="px-1 font-sans text-xs text-muted">{t("noneFound")}</Text>
      )}

      {shown.map((p) => {
        const ratedImpossible = rated && !p.canPlayRated;
        return (
          <Panel key={p.studentId} className="!flex-row !items-center !justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="font-sans-bold text-sm text-ink">
                {p.name}
              </Text>
              <Text className="font-sans text-[11px] text-muted">{p.studentId}</Text>
              {ratedImpossible && (
                <Text className="mt-1 font-sans-bold text-[11px] text-gold">
                  {t("theyHaveNoLichess")}
                </Text>
              )}
            </View>
            <Pressable
              disabled={busy === p.studentId}
              onPress={() =>
                void run(p.studentId, async () => {
                  await sendChallenge(
                    p.studentId,
                    rated,
                    CLOCKS[clock].limit,
                    CLOCKS[clock].increment,
                  );
                  setQuery("");
                  await reload();
                })
              }
              className="min-h-11 shrink-0 flex-row items-center gap-1.5 rounded-full bg-navy px-3.5 active:opacity-80 disabled:opacity-60"
            >
              <Swords size={16} color={C.white} strokeWidth={2.5} />
              <Text className="font-sans-bold text-xs text-white">{t("challenge")}</Text>
            </Pressable>
          </Panel>
        );
      })}
    </PlayShell>
  );
}
