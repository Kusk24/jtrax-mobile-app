import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useTranslations } from "use-intl";
import { useSession } from "@/lib/session";
import { C } from "@/lib/colors";
import type { Identity } from "@/lib/api";

/**
 * Gate for a portal's whole route tree.
 *
 * It lives on the layout, not on each screen, so a route added later inherits
 * the guard rather than shipping open — the web app learned that the hard way
 * when a whole portal was reachable by anyone with the URL.
 */
export function RequireRole({
  role,
  children,
}: {
  role: Identity["role"];
  children: React.ReactNode;
}) {
  const t = useTranslations("common");
  const { user, loading, offline, retry } = useSession();

  // Waiting on the stored token; redirecting now would bounce a signed-in
  // user to the login screen on every cold start.
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator color={C.navy} />
      </View>
    );
  }

  /* A token that could not be checked, because the server did not answer.
     Sending them to sign in here would tell a parent their session had
     expired every time the train went into a tunnel — and their password
     would not fix it. Say what actually happened instead. */
  if (!user && offline) {
    return (
      <View className="flex-1 items-center justify-center bg-paper px-5">
        <View className="w-full max-w-[380px] items-center gap-3 rounded-card border-2 border-line bg-card p-6">
          <Text className="text-center font-sans-extrabold text-lg text-ink">
            {t("serverDownTitle")}
          </Text>
          <Text className="text-center font-sans text-xs leading-relaxed text-muted">
            {t("serverDownBody")}
          </Text>
          <Pressable
            onPress={retry}
            accessibilityRole="button"
            className="mt-1 rounded-card bg-navy px-6 py-2.5"
          >
            <Text className="font-sans-bold text-sm text-white">{t("retry")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!user || user.role !== role) return <Redirect href="/" />;
  return <>{children}</>;
}
