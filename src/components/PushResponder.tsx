/* Opens the right screen when a notification is tapped — including the one
   that launched the app from closed. A parent lands on their notifications,
   or on announcements for an announcement; a pupil on their home. */
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useSession } from "@/lib/session";
import { routeForNotification } from "@/lib/push";

/* The web build has no notification to have been tapped — the call behind
   the hook does not exist there and throws, taking the whole app with it — so
   on the web this renders nothing and asks nothing. Chosen once, outside the
   component, so no hook is ever called conditionally. */
export const PushResponder = Platform.OS === "web" ? () => null : NativePushResponder;

function NativePushResponder() {
  const { user } = useSession();
  const response = Notifications.useLastNotificationResponse();
  /* One tap, one navigation: the hook keeps returning the last response, so
     the id it was handled for is remembered. */
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!response || !user) return;
    const id = response.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    const to = routeForNotification(user.role, data);
    if (to) router.push(to as never);
  }, [response, user]);

  return null;
}
