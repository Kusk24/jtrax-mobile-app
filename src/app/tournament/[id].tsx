/* One tournament, live — the phone-native version of the web's /t/<id> page.
 *
 * Reached from any role's home banner. The data is the public mirror of the
 * arbiter's chess-results upload, so this screen needs no session and shows
 * exactly what the QR code on the wall shows: standings, every round's
 * pairings, and a search that answers "where is my child playing".
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import { ArrowLeft, Search, X } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { C } from "@/lib/colors";
import {
  fetchPublicResults,
  type PublicBoard,
  type PublicResults,
  type PublicRound,
} from "@/lib/tournaments";

/** Points the way a chess score reads: 1, ½, 1½ — never 0.5. */
function points(value: number): string {
  const whole = Math.floor(value);
  const half = value - whole >= 0.5;
  if (whole === 0) return half ? "½" : "0";
  return half ? `${whole}½` : String(whole);
}

function boardResult(r: string): string {
  if (r === "1/2-1/2" || r === "½ - ½") return "½–½";
  if (r === "Pending" || r === "") return "·";
  return r;
}

function isPlayed(status: string): boolean {
  return status === "Completed" || status === "played";
}

export default function TournamentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTranslations("tournament");
  const tCommon = useTranslations("common");
  const [data, setData] = useState<PublicResults | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await fetchPublicResults(String(id));
      setData(d);
      setFailed(false);
    } catch {
      // Keep whatever we had; only the very first load shows the error state.
      setData((prev) => {
        if (prev === null) setFailed(true);
        return prev;
      });
    }
  }, [id]);

  /* The screen follows the arbiter's uploads by itself, exactly like the web
     page: one poll a minute, which is also what nudges the backend's mirror. */
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    void load();
    timer.current = setInterval(() => void load(), 60_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

  const rounds = data?.rounds ?? [];
  const current: PublicRound | undefined =
    rounds.find((r) => r.round === selected) ?? rounds[rounds.length - 1];

  const q = query.trim().toLocaleLowerCase();
  const matches = useMemo(() => {
    const all = data?.standings ?? [];
    return q ? all.filter((s) => s.name.toLocaleLowerCase().includes(q)) : all;
  }, [q, data]);
  const playerGames = useMemo(() => {
    if (!q) return [];
    return rounds.flatMap((r) =>
      r.pairings
        .filter(
          (b) =>
            b.white.toLocaleLowerCase().includes(q) ||
            (b.black ?? "").toLocaleLowerCase().includes(q),
        )
        .map((b) => ({ round: r.round, board: b })),
    );
  }, [q, rounds]);

  return (
    <Screen>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel={t("back")}
          className="size-11 items-center justify-center rounded-xl border-2 border-line bg-card"
        >
          <ArrowLeft size={18} color={C.ink} />
        </Pressable>
        <Text className="min-w-0 flex-1 font-sans-extrabold text-lg text-ink" numberOfLines={2}>
          {data?.tournament.name ?? t("title")}
        </Text>
      </View>

      {data?.stage ? <Text className="-mt-3 font-sans text-xs text-muted">{data.stage}</Text> : null}

      {failed && (
        <View className="rounded-card bg-brick-soft px-5 py-4">
          <Text className="font-sans-bold text-sm text-maroon">{t("loadFailed")}</Text>
        </View>
      )}

      {!data && !failed && (
        <View className="items-center gap-3 py-16">
          <ActivityIndicator color={C.navy} />
          <Text className="font-sans text-sm text-muted">{tCommon("loading")}</Text>
        </View>
      )}

      {data && (
        <>
          <View className="flex-row items-center gap-2.5 rounded-card border-2 border-line bg-card px-4">
            <Search size={16} color={C.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("findPlayer")}
              placeholderTextColor={C.muted}
              className="min-h-[44px] flex-1 font-sans text-[15px] text-ink"
            />
            {query !== "" && (
              <Pressable
                onPress={() => setQuery("")}
                accessibilityLabel={t("clearSearch")}
                className="size-9 items-center justify-center rounded-full"
              >
                <X size={16} color={C.muted} />
              </Pressable>
            )}
          </View>

          {q !== "" && (
            <View className="overflow-hidden rounded-card border-2 border-line bg-card">
              <Text className="border-b border-line px-4 py-3 font-sans-extrabold text-sm text-navy">
                {t("gamesOf", { query: query.trim() })}
              </Text>
              {playerGames.length === 0 ? (
                <Text className="px-4 py-6 text-center font-sans text-sm text-muted">
                  {t("noMatches")}
                </Text>
              ) : (
                playerGames.map(({ round, board }) => (
                  <BoardRow key={`${round}-${board.board}`} board={board} roundNo={round} t={t} />
                ))
              )}
            </View>
          )}

          {q === "" && rounds.length > 0 && current && (
            <View className="overflow-hidden rounded-card border-2 border-line bg-card">
              <View className="flex-row flex-wrap items-center gap-2 border-b border-line px-4 py-3">
                <Text className="mr-1 font-sans-extrabold text-sm text-navy">{t("rounds")}</Text>
                {rounds.map((r) => {
                  const active = current.round === r.round;
                  return (
                    <Pressable
                      key={r.round}
                      onPress={() => setSelected(r.round)}
                      accessibilityLabel={t("roundN", { n: r.round })}
                      className={`min-h-[36px] min-w-[36px] items-center justify-center rounded-full px-3 ${
                        active ? "bg-navy-deep" : isPlayed(r.status) ? "bg-highlight" : "bg-brick-soft"
                      }`}
                    >
                      <Text
                        className={`font-sans-bold text-[13px] ${
                          active ? "text-white" : isPlayed(r.status) ? "text-highlight-ink" : "text-maroon"
                        }`}
                      >
                        {r.round}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View className="flex-row items-center gap-2 px-4 py-3">
                <Text className="font-sans-bold text-sm text-ink">{t("roundN", { n: current.round })}</Text>
                <View className={`rounded-full px-2 py-0.5 ${isPlayed(current.status) ? "bg-olive-soft" : "bg-brick-soft"}`}>
                  <Text className={`font-sans-bold text-[11px] ${isPlayed(current.status) ? "text-olive" : "text-maroon"}`}>
                    {isPlayed(current.status)
                      ? t("finished")
                      : current.status === "Playing"
                        ? t("playing")
                        : t("upcoming")}
                  </Text>
                </View>
              </View>
              {current.pairings.map((b) => (
                <BoardRow key={b.board} board={b} t={t} />
              ))}
            </View>
          )}

          <View className="overflow-hidden rounded-card border-2 border-line bg-card">
            <Text className="border-b border-line px-4 py-3 font-sans-extrabold text-sm text-navy">
              {t("standings")}
            </Text>
            {matches.length === 0 ? (
              <Text className="px-4 py-6 text-center font-sans text-sm text-muted">
                {q ? t("noMatches") : t("noPlayers")}
              </Text>
            ) : (
              matches.map((s, i) => (
                <View
                  key={`${s.rank}-${s.name}-${i}`}
                  className={`flex-row items-center gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <Text className="w-7 font-sans-bold text-sm text-muted">{s.rank}</Text>
                  <Text className="min-w-0 flex-1 font-sans text-sm text-ink" numberOfLines={1}>
                    {s.name}
                  </Text>
                  {s.rating ? <Text className="font-sans text-xs text-muted">{s.rating}</Text> : null}
                  <Text className="w-8 text-right font-sans-bold text-sm text-ink">{points(s.points)}</Text>
                </View>
              ))
            )}
          </View>

          <Text className="text-center font-sans text-xs text-muted">{t("updatesAutomatically")}</Text>
        </>
      )}
    </Screen>
  );
}

function BoardRow({
  board,
  roundNo,
  t,
}: {
  board: PublicBoard;
  roundNo?: number;
  t: ReturnType<typeof useTranslations>;
}) {
  const isBye = !board.black || board.black === "bye";
  return (
    <View className="flex-row items-center gap-2 border-t border-line px-4 py-2.5">
      {roundNo !== undefined && (
        <Text className="w-9 font-sans text-xs text-muted">{t("rShort", { n: roundNo })}</Text>
      )}
      <Text className="w-7 font-sans text-xs text-muted">#{board.board}</Text>
      <Text className="min-w-0 flex-1 font-sans text-[13.5px] text-ink" numberOfLines={2}>
        {board.white}
        <Text className="font-sans-bold text-xs text-muted">  {boardResult(board.result)}  </Text>
        {isBye ? t("bye") : board.black}
      </Text>
    </View>
  );
}
