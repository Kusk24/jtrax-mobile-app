/**
 * URL state, the hooks — see `url-state.ts` for the rules.
 */
import { useCallback, useState } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { pickParam, readDraft, writeDraft } from "./url-state";

/** One route param as state. Setting the fallback removes it, so the plain
    route stays plain. */
export function useParam<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): [T, (next: T) => void] {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const router = useRouter();
  const value = pickParam(params[key], allowed, fallback);
  const set = useCallback(
    (next: T) => router.setParams({ [key]: next === fallback ? undefined : next }),
    [router, key, fallback],
  );
  return [value, set];
}

/** A raw route param ("" when absent), for values checked against data. */
export function useParamValue(key: string): [string, (next: string) => void] {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const router = useRouter();
  const raw = params[key];
  const value = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const set = useCallback(
    (next: string) => router.setParams({ [key]: next === "" ? undefined : next }),
    [router, key],
  );
  return [value, set];
}

/** useState kept in memory under `key` for the life of the app. */
export function useMemoryDraft<T>(key: string, initial: T): [T, (next: T | ((previous: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readDraft<T>(key) ?? initial);
  const set = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(previous) : next;
        writeDraft(key, value);
        return value;
      });
    },
    [key],
  );
  return [value, set];
}

/** Android's Back button steps back through a flow while `back` returns true,
    and leaves the screen as usual once it returns false. */
export function useHardwareBack(back: () => boolean) {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", back);
      return () => sub.remove();
    }, [back]),
  );
}
