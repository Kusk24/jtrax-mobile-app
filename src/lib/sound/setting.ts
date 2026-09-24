/* Whether the board makes sound — one switch, remembered per phone.
 *
 * On unless turned off, as on every chess app. Kept on the device (AsyncStorage)
 * because it is a preference about this phone, not about the pupil: a phone in
 * a quiet classroom and a tablet at home can reasonably disagree. The web
 * portal keeps the same switch in the browser for the same reason.
 *
 * Storage is read once, asynchronously, when the app starts; until it answers
 * the switch reads "on". Every read and write is guarded — a sound setting that
 * cannot be saved must never break the board. */
import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "jtrax.sound";
const listeners = new Set<() => void>();
let on = true;
let loaded: Promise<void> | null = null;

const notify = () => listeners.forEach((l) => l());

/** Reads the saved switch. Safe to call more than once; it reads once. */
export function loadSoundSetting(): Promise<void> {
  if (!loaded) {
    loaded = AsyncStorage.getItem(KEY)
      .then((v) => {
        on = v !== "off";
        notify();
      })
      .catch(() => {
        // Unreadable storage leaves the default: on.
      });
  }
  return loaded;
}

export function isSoundOn(): boolean {
  return on;
}

export function setSoundOn(next: boolean) {
  on = next;
  notify();
  AsyncStorage.setItem(KEY, next ? "on" : "off").catch(() => {
    // Unsaved, but still honoured until the app is closed.
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void loadSoundSetting();
  return () => {
    listeners.delete(listener);
  };
}

/** The switch, as React state. */
export function useSoundOn(): boolean {
  return useSyncExternalStore(subscribe, isSoundOn, () => true);
}

/** Read by the player at the moment a sound would play. */
export const soundAllowed = isSoundOn;
