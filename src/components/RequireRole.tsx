import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useSession } from "@/lib/session";
import { C } from "@/lib/colors";
import type { Identity } from "@/lib/api";

/**
 * Gate for a portal's whole route tree.
 *
 * It lives on the layout, not on each screen, so a route added later inherits
 * the guard rather than shipping open — the web app learned that the hard way
 * when /teacher was reachable by anyone with the URL.
 */
export function RequireRole({
  role,
  children,
}: {
  role: Identity["role"];
  children: React.ReactNode;
}) {
  const { user, loading } = useSession();

  // Waiting on the stored token; redirecting now would bounce a signed-in
  // user to the login screen on every cold start.
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color={C.navy} />
      </View>
    );
  }
  if (!user || user.role !== role) return <Redirect href="/" />;
  return <>{children}</>;
}
