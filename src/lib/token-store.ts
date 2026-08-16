/**
 * Where the session token is kept.
 *
 * On a device this is expo-secure-store — Keychain on iOS, Keystore on
 * Android — because the token is a bearer credential: whatever holds it *is*
 * the user until it expires.
 *
 * SecureStore has no web implementation, and Expo's web target is a
 * development convenience here rather than a shipped product (the real browser
 * portals are jtrax-web-app and jtrax-admin, which keep the token in an
 * httpOnly cookie the page cannot read). So web falls back to AsyncStorage,
 * and the fallback is deliberately narrow: it never runs on a device.
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const KEY = "jtrax_session";

const useSecureStore = Platform.OS !== "web";

export async function readToken(): Promise<string | null> {
  try {
    return useSecureStore ? await SecureStore.getItemAsync(KEY) : await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function writeToken(token: string): Promise<void> {
  if (useSecureStore) await SecureStore.setItemAsync(KEY, token);
  else await AsyncStorage.setItem(KEY, token);
}

export async function clearToken(): Promise<void> {
  try {
    if (useSecureStore) await SecureStore.deleteItemAsync(KEY);
    else await AsyncStorage.removeItem(KEY);
  } catch {
    /* Already gone is the outcome we wanted. */
  }
}
