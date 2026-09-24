/**
 * Phone notifications: asking permission, registering this phone with the
 * backend, and letting go of it on sign-out.
 *
 * The backend already writes every notification to the inbox; with a phone
 * registered it also pushes it through Expo's push service, which needs no key
 * of ours. What this needs is an Expo project (its id comes from `eas init`):
 * without one a phone cannot be given a push token, so registration quietly
 * does nothing and the inbox works as before.
 *
 * Nothing here ever throws into the app. A phone that cannot be registered is
 * a phone that gets its notifications in the inbox instead.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { api } from "./api";

/* While the app is open, a notification still shows as a banner — a parent
   looking at the timetable should still see "Penny has arrived". */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushOutcome = "registered" | "denied" | "unsupported" | "failed";

/** The token this phone registered, so sign-out can remove exactly it. */
let registered: string | null = null;

/** The Expo project's id, from `eas init`. Absent until the project exists. */
export function pushProjectId(): string | undefined {
  const fromConfig = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  return fromConfig ?? Constants.easConfig?.projectId ?? undefined;
}

/** Asks for permission (once — the phone remembers the answer) and registers
    this phone's push token with the backend. Safe to call on every sign-in. */
export async function registerForPush(): Promise<PushOutcome> {
  try {
    // Push needs a real phone; a browser or a simulator without Play
    // services has no token to give.
    if (Platform.OS === "web" || !Device.isDevice) return "unsupported";
    const projectId = pushProjectId();
    if (!projectId) return "unsupported";

    /* Android shows nothing for a message aimed at a channel that does not
       exist, and the backend sends to "default". Made before asking, so the
       prompt on Android 13+ has a channel to be about. */
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "JTrax",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") return "denied";

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await api.post("push-subscriptions", {
      channel: "mobile",
      endpoint: token,
      user_agent: `${Platform.OS} ${Device.osVersion ?? ""}`.trim(),
    });
    registered = token;
    return "registered";
  } catch {
    return "failed";
  }
}

/** Removes this phone from the signed-in account, so the next person to use
    it does not get the last one's notifications. Call before signing out,
    while the session still exists. */
export async function unregisterPush(): Promise<void> {
  const token = registered;
  registered = null;
  if (!token) return;
  await api.del("push-subscriptions", { endpoint: token }).catch(() => {});
}

/** Where tapping a notification should land, for someone in this role. */
export function routeForNotification(role: string | undefined, data: Record<string, unknown> | undefined): string | null {
  if (role === "Parent") {
    return data?.type === "announcement" ? "/parent/announcements" : "/parent/notifications";
  }
  if (role === "Student") return "/student";
  return null;
}
