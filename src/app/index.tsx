import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useTranslations } from "use-intl";
import { Lock, Mail } from "lucide-react-native";
import { LanguageToggle } from "@/components/LanguageToggle";
import { homeFor, useSession } from "@/lib/session";
import { forgotPassword } from "@/lib/api";
import { C } from "@/lib/colors";

/**
 * Sign-in. This replaced a role picker that let anyone tap "Student" and walk
 * straight in — the account carries the role, so there was never anything to
 * choose, and multiplayer needs a real identity to claim a seat with.
 */
export default function SignInScreen() {
  const t = useTranslations("signIn");
  const { user, loading, signIn } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  /* A signed-in user who reopens the app goes straight to their portal. */
  useEffect(() => {
    if (!loading && user) {
      const home = homeFor(user.role);
      if (home) router.replace(home);
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color={C.navy} />
      </View>
    );
  }
  if (user && homeFor(user.role)) return <Redirect href={homeFor(user.role)!} />;

  async function submit() {
    setBusy(true);
    setError("");
    const failure = await signIn(email, password);
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    // homeFor is re-read from the identity the sign-in just stored.
    setPassword("");
  }

  async function requestReset() {
    if (!email.trim()) {
      setError("needEmail");
      return;
    }
    // The API answers the same whether or not the address exists, and so does
    // this: saying "no such account" here would undo that.
    await forgotPassword(email).catch(() => {});
    setSent(true);
    setError("");
  }

  const staffOnly = user && !homeFor(user.role);

  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerClassName="min-h-full justify-center px-6 py-12"
      keyboardShouldPersistTaps="handled"
    >
      <View className="absolute right-4 top-4">
        <LanguageToggle />
      </View>

      <Text className="text-center font-display-semibold text-4xl text-navy">JTrax</Text>
      <Text className="mt-2 text-center font-sans text-sm text-muted">{t("tagline")}</Text>

      <View className="mt-10 w-full max-w-md self-center gap-3 rounded-card border-2 border-line bg-card p-5 shadow-clay">
        {staffOnly && (
          <Text className="rounded-xl bg-brick-soft px-3 py-2 font-sans-bold text-xs text-maroon">
            {t("staffUseConsole")}
          </Text>
        )}

        <View>
          <Text className="mb-1.5 font-sans-bold text-sm text-ink">{t("email")}</Text>
          <View className="flex-row items-center gap-2 rounded-xl border-2 border-line bg-cream px-3">
            <Mail size={16} color={C.muted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@jca.ac.th"
              placeholderTextColor={C.muted}
              className="flex-1 py-3 font-sans text-sm text-ink"
            />
          </View>
        </View>

        <View>
          <Text className="mb-1.5 font-sans-bold text-sm text-ink">{t("password")}</Text>
          <View className="flex-row items-center gap-2 rounded-xl border-2 border-line bg-cream px-3">
            <Lock size={16} color={C.muted} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              onSubmitEditing={submit}
              returnKeyType="go"
              className="flex-1 py-3 font-sans text-sm text-ink"
            />
          </View>
        </View>

        {error !== "" && (
          <Text className="font-sans-bold text-xs text-brick">{t(`error.${error}`)}</Text>
        )}
        {sent && <Text className="font-sans-bold text-xs text-olive">{t("resetSent")}</Text>}

        <Pressable
          onPress={submit}
          disabled={busy || !email || !password}
          className="mt-1 items-center rounded-xl bg-navy py-3.5 active:opacity-80 disabled:opacity-60"
        >
          {busy ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <Text className="font-sans-bold text-sm text-white">{t("submit")}</Text>
          )}
        </Pressable>

        <Pressable onPress={requestReset} className="items-center py-1">
          <Text className="font-sans-bold text-xs text-navy">{t("forgot")}</Text>
        </Pressable>

        {/* The account decides the portal, so there is nothing to pick here. */}
        <Text className="mt-1 border-t border-line pt-3 font-sans text-xs leading-5 text-muted">
          {t("accountHint")}
        </Text>
      </View>
    </ScrollView>
  );
}
