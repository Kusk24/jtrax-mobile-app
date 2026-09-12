/**
 * A student's Lichess account on their profile: link it, prove it is theirs,
 * then see the ratings the academy is tracking.
 *
 * The proof step is the interesting part. A typed username is a claim — nothing
 * stops a pupil entering a grandmaster's account and appearing at 3000 on a
 * screen their parents see — so the server issues a one-time code, the pupil
 * pastes it into their Lichess bio, and the server reads it back. A bio is
 * public to read and private to write, which is exactly what verification
 * needs, and it avoids an OAuth round trip and a stored token.
 *
 * The phone differs from the portal in one place, and it is the OAuth grant.
 * The portal sends the whole browser to Lichess and gets it back at a URL;
 * here the grant opens in `WebBrowser.openAuthSessionAsync`, which hands
 * control back through the app's own scheme. That means the outcome arrives as
 * a deep link rather than a query string on a page that is already loaded.
 */
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import * as ExpoLinking from "expo-linking";
import { useTranslations } from "use-intl";
import { Check, Copy, ExternalLink, Swords } from "lucide-react-native";
import {
  getLichessPlayStatus,
  getMyLichess,
  linkLichess,
  sortRatings,
  startLichessOAuth,
  unlinkLichess,
  verifyLichess,
  type LichessLink,
  type LichessPlayStatus,
} from "@/lib/lichess";
import { C } from "@/lib/colors";

/** How long the tick stays on the copy button. */
const COPIED_MS = 1800;

export function LichessCard() {
  const t = useTranslations("lichess");
  const tCommon = useTranslations("common");

  const [link, setLink] = useState<LichessLink | null>(null);
  const [play, setPlay] = useState<LichessPlayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  /** Set by the OAuth callback on its way back here. */
  const [outcome, setOutcome] = useState("");

  const reload = useCallback(async () => {
    const [mine, status] = await Promise.all([getMyLichess(), getLichessPlayStatus()]);
    setLink(mine.linked ? mine.link : null);
    setPlay(status);
  }, []);

  useEffect(() => {
    let cancelled = false;
    reload()
      .catch(() => {
        /* Not "no account linked" — we do not know. Said plainly, because the
           empty state invites a pupil to connect an account they may already
           have connected. */
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function connectForPlay() {
    setBusy(true);
    setError("");
    try {
      // Come back into the app, on this screen, so the pupil lands where they
      // left. `createURL` builds the scheme the app is actually registered
      // under, which differs between a dev client and a store build.
      const returnTo = ExpoLinking.createURL("/student/profile");
      const authorizeUrl = await startLichessOAuth(returnTo);
      const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, returnTo);
      if (result.type === "success") {
        // The callback redirects back with ?lichess=… on the deep link.
        const said = ExpoLinking.parse(result.url).queryParams?.lichess;
        if (typeof said === "string") setOutcome(said);
        await reload();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setNotFound(false);
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  async function submitLink() {
    const name = username.trim();
    if (!name) return;
    await run(() => linkLichess(name));
  }

  async function checkCode() {
    setBusy(true);
    setError("");
    setNotFound(false);
    try {
      const out = await verifyLichess();
      if (!out.verified) setNotFound(true);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!link?.verifyCode) return;
    await Clipboard.setStringAsync(link.verifyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_MS);
  }

  if (loading) {
    return (
      <View className="flex-row items-center justify-center gap-2 rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <ActivityIndicator color={C.navy} size="small" />
        <Text className="font-sans-bold text-sm text-muted">{t("loading")}</Text>
      </View>
    );
  }

  return (
    <View className="gap-2.5 rounded-card border-2 border-line bg-card p-4 shadow-clay">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="font-sans-bold text-base text-ink">{t("title")}</Text>
        {link?.verified && (
          <View className="flex-row items-center gap-1 rounded-full bg-olive-soft px-2.5 py-0.5">
            <Check size={12} color={C.olive} strokeWidth={3} />
            <Text className="font-sans-bold text-[11px] text-olive">{t("verified")}</Text>
          </View>
        )}
      </View>

      {/* The grant bounces back here with an outcome to show. */}
      {outcome !== "" && outcome !== "connected" && (
        <View className="rounded-xl bg-brick-soft px-3 py-2">
          <Text className="font-sans-bold text-xs text-maroon">{t(`outcome.${outcome}`)}</Text>
        </View>
      )}

      {loadFailed && (
        <View className="rounded-xl bg-brick-soft px-3 py-2">
          <Text accessibilityRole="alert" className="font-sans-bold text-xs text-maroon">
            {tCommon("loadFailed")}
          </Text>
        </View>
      )}

      {/* ---- not linked yet ---- */}
      {!link && !loadFailed && (
        <>
          <Text className="font-sans text-xs leading-5 text-muted">{t("intro")}</Text>

          {/* The recommended path. It proves the account *and* unlocks rated
              games, so it is offered first and the bio-code route below is
              framed as the smaller ask it is. */}
          <Pressable
            onPress={() => void connectForPlay()}
            disabled={busy}
            className="min-h-11 flex-row items-center justify-center gap-2 rounded-xl bg-navy active:opacity-80 disabled:opacity-60"
          >
            <Swords size={16} color={C.white} />
            <Text className="font-sans-bold text-xs text-white">
              {busy ? t("checking") : t("connectWithLichess")}
            </Text>
          </Pressable>

          <Text className="text-center font-sans text-[11px] text-muted">{t("orTrackOnly")}</Text>

          <TextInput
            value={username}
            onChangeText={setUsername}
            onSubmitEditing={() => void submitLink()}
            placeholder={t("usernamePlaceholder")}
            placeholderTextColor={C.muted}
            accessibilityLabel={t("usernameLabel")}
            autoCapitalize="none"
            autoCorrect={false}
            className="min-h-11 rounded-xl border-2 border-line bg-paper px-3 font-sans-bold text-sm text-ink"
          />
          <Pressable
            onPress={() => void submitLink()}
            disabled={busy || username.trim() === ""}
            className="min-h-11 items-center justify-center rounded-xl bg-navy active:opacity-80 disabled:opacity-60"
          >
            <Text className="font-sans-bold text-xs text-white">
              {busy ? t("checking") : t("connect")}
            </Text>
          </Pressable>
        </>
      )}

      {/* ---- linked, waiting on proof ---- */}
      {link && !link.verified && (
        <>
          <Text className="font-sans-bold text-sm text-ink">{link.username}</Text>
          <Text className="font-sans text-xs leading-5 text-muted">{t("proveHint")}</Text>

          {link.verifyCode ? (
            <View className="flex-row items-center gap-2">
              <Text
                selectable
                className="flex-1 rounded-xl border-2 border-line bg-paper px-3 py-2 font-sans-bold text-sm text-ink"
              >
                {link.verifyCode}
              </Text>
              <Pressable
                onPress={() => void copyCode()}
                accessibilityRole="button"
                accessibilityLabel={t("copyCode")}
                className="size-11 shrink-0 items-center justify-center rounded-xl border-2 border-line bg-paper active:opacity-80"
              >
                {copied ? (
                  <Check size={16} color={C.olive} strokeWidth={3} />
                ) : (
                  <Copy size={16} color={C.ink} />
                )}
              </Pressable>
            </View>
          ) : (
            /* A staff-created link has no code on this screen — staff cannot
               edit a pupil's bio, so the pupil starts the proof themselves. */
            <Text className="font-sans text-xs leading-5 text-muted">{t("addedByStaff")}</Text>
          )}

          <Pressable
            onPress={() => void Linking.openURL(`${link.profileUrl}/edit`)}
            className="min-h-11 flex-row items-center justify-center gap-1.5"
          >
            <Text className="font-sans-bold text-xs text-navy underline">{t("openLichess")}</Text>
            <ExternalLink size={14} color={C.navy} />
          </Pressable>

          {notFound && (
            <View className="rounded-xl bg-brick-soft px-3 py-2">
              <Text className="font-sans-bold text-xs text-maroon">{t("codeNotFound")}</Text>
            </View>
          )}

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => void checkCode()}
              disabled={busy}
              className="min-h-11 flex-1 items-center justify-center rounded-xl bg-navy active:opacity-80 disabled:opacity-60"
            >
              <Text className="font-sans-bold text-xs text-white">
                {busy ? t("checking") : t("checkNow")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void run(unlinkLichess)}
              disabled={busy}
              className="min-h-11 items-center justify-center rounded-xl border-2 border-line bg-paper px-4 active:opacity-80 disabled:opacity-60"
            >
              <Text className="font-sans-bold text-xs text-muted">{t("remove")}</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* ---- verified: the ratings ---- */}
      {link?.verified && (
        <>
          <Pressable
            onPress={() => void Linking.openURL(link.profileUrl)}
            className="flex-row items-center gap-1.5"
          >
            <Text className="font-sans-bold text-sm text-navy underline">{link.username}</Text>
            <ExternalLink size={14} color={C.navy} />
          </Pressable>

          {link.ratings.length === 0 ? (
            <Text className="font-sans text-xs text-muted">{t("noGamesYet")}</Text>
          ) : (
            <View>
              {sortRatings(link.ratings).map((r, i) => (
                <View
                  key={r.perf}
                  className={`flex-row items-center justify-between gap-3 py-1.5 ${
                    i === 0 ? "" : "border-t-2 border-line"
                  }`}
                >
                  <Text className="font-sans text-sm text-muted">{t(`perf.${r.perf}`)}</Text>
                  <View className="flex-row items-baseline gap-1.5">
                    <Text className="font-sans-bold text-sm text-ink">{r.rating}</Text>
                    {/* A provisional rating swings wildly and is not an
                        achievement yet — saying so is kinder than a number
                        that drops 200 points tomorrow. */}
                    {r.provisional && (
                      <Text className="font-sans text-[10.5px] text-muted">{t("provisional")}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ---- rated play ---- */}
          <View className="gap-1 rounded-xl border-2 border-line bg-paper px-3 py-2.5">
            {play?.canPlay ? (
              <>
                <View className="flex-row items-center gap-1.5">
                  <Swords size={14} color={C.ink} />
                  <Text className="font-sans-bold text-xs text-ink">{t("ratedOn")}</Text>
                </View>
                <Text className="font-sans text-[11px] leading-4 text-muted">{t("ratedOnHint")}</Text>
                {/* A token cannot be refreshed, only granted again — so the
                    warning has to come before it dies, not after. */}
                {play.expiringSoon && (
                  <Text className="font-sans-bold text-[11px] leading-4 text-gold">
                    {t("expiringSoon")}
                  </Text>
                )}
                {play.managed && (
                  <Text className="font-sans text-[11px] leading-4 text-muted">
                    {t("managedAccount")}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text className="font-sans-bold text-xs text-ink">{t("ratedOff")}</Text>
                <Text className="font-sans text-[11px] leading-4 text-muted">{t("ratedOffHint")}</Text>
                <Pressable
                  onPress={() => void connectForPlay()}
                  disabled={busy}
                  className="mt-1 min-h-11 flex-row items-center justify-center gap-2 rounded-xl bg-navy active:opacity-80 disabled:opacity-60"
                >
                  <Swords size={16} color={C.white} />
                  <Text className="font-sans-bold text-xs text-white">
                    {busy ? t("checking") : t("enableRated")}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          <Pressable
            onPress={() => void run(unlinkLichess)}
            disabled={busy}
            className="min-h-11 justify-center disabled:opacity-60"
          >
            <Text className="font-sans-bold text-xs text-muted underline">{t("remove")}</Text>
          </Pressable>
        </>
      )}

      {error !== "" && (
        <View className="rounded-xl bg-brick-soft px-3 py-2">
          <Text className="font-sans-bold text-xs text-maroon">{error}</Text>
        </View>
      )}
    </View>
  );
}
