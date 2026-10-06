/**
 * Finding a friend and asking them for a game — inside the Games tab, which is
 * where every way of playing a person now lives (the web's ChallengePanel).
 *
 * What is waiting comes first, because somebody is on the other end of it:
 * games ready to open, invitations to answer, a "no" to one this pupil sent,
 * and the invitations still out. Then the search box for starting something
 * new.
 *
 * The rated toggle carries a warning rather than being hidden when it cannot
 * work. A pupil who cannot see the option cannot find out why — "you both need
 * a Lichess account" is a thing they can go and fix, and a row that says so
 * teaches more than a row that is not there.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { Check, Search, Swords, X } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { Panel } from "@/components/game/PlayShell";
import { PrimaryPill, SecondaryPill } from "@/components/student/kit";
import { IncomingChallengeList } from "@/components/student/IncomingChallenges";
import {
  CLOCKS,
  acceptChallenge,
  cancelChallenge,
  declineChallenge,
  dismissDecline,
  listChallenges,
  searchPlayers,
  sendChallenge,
  type Challenge,
  type PlayerResult,
} from "@/lib/challenges";

/** Somebody else may answer while this is open, and a child staring at
    "waiting…" should not have to know to pull down to refresh. */
const POLL_MS = 5000;
/** This endpoint names other children, so it is not hit on every keystroke. */
const DEBOUNCE_MS = 350;
const MIN_QUERY = 2;

/** "5+0", "10+5" — the clock the challenger picked, as the picker shows it. */
const clockLabel = (c: Challenge) => `${Math.round(c.clockLimit / 60)}+${c.clockIncrement}`;

/** A board opened from here leads back to the Games tab. */
const openBoard = (gameRoomId: string) => router.push(`/student/play/room/${gameRoomId}` as never);

export function ChallengePanel({ myStudentId }: { myStudentId: string }) {
  const t = useTranslations("challenge");
  const tCommon = useTranslations("common");
  const { pp } = usePalette();

  const [query, setQuery] = useState("");
  /* The players found *and the query they were found for*, together in one
     piece of state. Keeping them apart meant a third flag for "searching" and
     a window where the list on screen answered a query the box no longer
     held — someone typed "Ur", saw Uri, typed "Urx", and Uri stayed put. */
  const [found, setFound] = useState<{ q: string; players: PlayerResult[] }>({ q: "", players: [] });
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rated, setRated] = useState(false);
  const [clock, setClock] = useState(2); // 15+10, the academy's usual
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  const reload = useCallback(async () => {
    try {
      setChallenges(await listChallenges());
      /* Cleared on success, so one blip while polling does not leave a warning
         on screen for the rest of the session. */
      setLoadFailed(false);
    } catch {
      /* Not "no invitations" — we do not know. A child told nobody wants to
         play them, while a classmate's invitation sits on the other side of a
         failed request, is the one thing this must not say. */
      setLoadFailed(true);
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
        // An answer of "none" for this query, so the panel stops waiting.
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
  /* Split by who has to act: an invitation is theirs to answer, so it gets
     full Accept / Decline buttons; one they sent only needs a Cancel. */
  const incoming = pending.filter((c) => c.direction === "in");
  const sent = pending.filter((c) => c.direction === "out");
  /* The backend returns a decline only to the one who asked, until they
     dismiss it — so their invitation is answered, not just gone. */
  const declined = challenges.filter((c) => c.status === "Declined" && c.direction === "out");
  const accepted = challenges.filter((c) => c.status === "Accepted" && c.gameRoomId);
  /* Both derived from one fact: whether what we found matches what is in the
     box. Deleting two letters hides the list without waiting for a round trip
     to say so, and typing more shows "Looking…" without a flag to set. */
  const q = query.trim();
  const longEnough = q.length >= MIN_QUERY;
  const answered = found.q === q;
  const searching = longEnough && !answered;
  const shown = longEnough && answered ? found.players : [];

  const alert = (text: string) => (
    <View className="rounded-2xl bg-pp-red-soft px-3.5 py-2.5">
      <Text accessibilityRole="alert" className="font-pp-semibold text-[12.5px] text-pp-red">
        {text}
      </Text>
    </View>
  );

  return (
    <View className="gap-3.5">
      {loadFailed && error === "" && alert(tCommon("loadFailed"))}
      {error !== "" && alert(error)}

      {/* ---- games that are ready to play ---- */}
      {accepted.map((c) => (
        <Panel key={c.challengeId} className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="font-pp-bold text-[14.5px] text-pp-ink">{t("gameReady", { name: c.opponentName })}</Text>
            <Text className="font-pp text-[12px] text-pp-muted">{c.rated ? t("rated") : t("friendly")}</Text>
          </View>
          <PrimaryPill label={t("openBoard")} onPress={() => openBoard(c.gameRoomId!)} className="px-4" />
        </Panel>
      ))}

      {/* ---- invitations to answer ---- */}
      <IncomingChallengeList
        incoming={incoming}
        busy={busy}
        onAccept={(c) =>
          void run(c.challengeId, async () => {
            const out = await acceptChallenge(c.challengeId);
            openBoard(out.gameRoomId);
          })
        }
        onDecline={(c) =>
          void run(c.challengeId, async () => {
            await declineChallenge(c.challengeId);
            await reload();
          })
        }
      />

      {/* ---- a "no" to one they sent ---- */}
      {declined.map((c) => (
        <Panel key={c.challengeId} className="flex-row items-center justify-between gap-3 border-pp-danger-line bg-pp-red-soft">
          <View accessibilityRole="summary" className="min-w-0 flex-1 flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-full bg-pp-card">
              <X size={20} color={pp.red} strokeWidth={2.6} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-pp-bold text-[14.5px] text-pp-ink">{t("declinedTitle", { name: c.opponentName })}</Text>
              <Text className="font-pp text-[12.5px] text-pp-muted">
                {clockLabel(c)} · {c.rated ? t("rated") : t("friendly")}
              </Text>
            </View>
          </View>
          <SecondaryPill
            label={t("ok")}
            disabled={busy === c.challengeId}
            onPress={() =>
              void run(c.challengeId, async () => {
                await dismissDecline(c.challengeId);
                await reload();
              })
            }
            className="px-4"
          />
        </Panel>
      ))}

      {/* ---- invitations they sent, waiting on the other player ---- */}
      {sent.length > 0 && (
        <View className="gap-2.5">
          <Text accessibilityRole="header" className="px-1 font-pp-display-semibold text-[16px] text-pp-ink">
            {t("sent")}
          </Text>
          {sent.map((c) => (
            <Panel key={c.challengeId} className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="font-pp-bold text-[14.5px] text-pp-ink">
                  {c.opponentName}
                </Text>
                <Text className="font-pp text-[12px] text-pp-muted">
                  {t("waitingOnThem")} · {clockLabel(c)}
                  {c.rated ? ` · ${t("rated")}` : ""}
                </Text>
                {c.rated && !c.bothCanPlayRated && (
                  <Text className="mt-1 font-pp-bold text-[11.5px] text-pp-amber">{t("ratedNotPossible")}</Text>
                )}
              </View>
              <SecondaryPill
                label={t("cancel")}
                disabled={busy === c.challengeId}
                onPress={() =>
                  void run(c.challengeId, async () => {
                    await cancelChallenge(c.challengeId);
                    await reload();
                  })
                }
                className="px-4"
              />
            </Panel>
          ))}
        </View>
      )}

      {/* ---- find somebody ---- */}
      <View className="gap-2.5">
        <Text accessibilityRole="header" className="px-1 font-pp-semibold text-[14px] text-pp-ink">
          {t("findSomeone")}
        </Text>

        <View className="min-h-11 flex-row items-center gap-2.5 rounded-[9px] border border-pp-line bg-pp-card px-3.5">
          <Search size={18} color={pp.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={pp.faint}
            accessibilityLabel={t("searchLabel")}
            autoCapitalize="none"
            autoCorrect={false}
            className="min-h-11 flex-1 font-pp text-[14.5px] text-pp-ink"
          />
        </View>

        {/* Their own id, so it can be read out to a friend in another class —
            the exact-id search exists precisely so that works. */}
        {myStudentId !== "" && (
          <Text className="px-1 font-pp text-[11.5px] text-pp-muted">{t("yourId", { id: myStudentId })}</Text>
        )}

        {/* ---- what kind of game ---- */}
        <Panel className="gap-2.5">
          <View className="flex-row flex-wrap gap-1.5">
            {CLOCKS.map((c, i) => {
              const on = clock === i;
              return (
                <Pressable
                  key={c.label}
                  onPress={() => setClock(i)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  className={`min-h-9 justify-center rounded-full border px-3.5 ${on ? "border-pp-blue bg-pp-blue" : "border-pp-line bg-pp-card"}`}
                >
                  <Text className={`font-pp-semibold text-[13px] ${on ? "text-white" : "text-pp-ink"}`}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={() => setRated(!rated)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rated }}
            className="flex-row items-start gap-2.5"
          >
            <View
              className={`mt-0.5 size-5 items-center justify-center rounded-md border-2 ${
                rated ? "border-pp-blue bg-pp-blue" : "border-pp-line bg-pp-card"
              }`}
            >
              {rated && <Check size={13} color="#ffffff" strokeWidth={3.5} />}
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-pp-bold text-[13.5px] text-pp-ink">{t("ratedLabel")}</Text>
              <Text className="font-pp text-[11.5px] leading-4 text-pp-muted">{t("ratedHint")}</Text>
            </View>
          </Pressable>
        </Panel>

        {searching && (
          <View className="flex-row items-center gap-2 px-1">
            <ActivityIndicator color={pp.muted} size="small" />
            <Text className="font-pp text-[12.5px] text-pp-muted">{t("searching")}</Text>
          </View>
        )}

        {!searching && longEnough && shown.length === 0 && (
          <Text className="px-1 font-pp text-[12.5px] text-pp-muted">{t("noneFound")}</Text>
        )}

        {shown.map((p) => {
          const ratedImpossible = rated && !p.canPlayRated;
          return (
            <Panel key={p.studentId} className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="font-pp-bold text-[14.5px] text-pp-ink">
                  {p.name}
                </Text>
                <Text className="font-pp text-[11px] text-pp-muted">{p.studentId}</Text>
                {ratedImpossible && (
                  <Text className="mt-1 font-pp-bold text-[11.5px] text-pp-amber">{t("theyHaveNoLichess")}</Text>
                )}
              </View>
              <PrimaryPill
                label={t("challenge")}
                icon={<Swords size={16} color="#ffffff" strokeWidth={2.5} />}
                disabled={busy === p.studentId}
                onPress={() =>
                  void run(p.studentId, async () => {
                    await sendChallenge(p.studentId, rated, CLOCKS[clock].limit, CLOCKS[clock].increment);
                    setQuery("");
                    await reload();
                  })
                }
                className="px-3.5"
              />
            </Panel>
          );
        })}
      </View>
    </View>
  );
}
