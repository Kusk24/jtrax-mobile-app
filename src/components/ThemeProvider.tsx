/**
 * Appearance for the whole app — the account's Auto / Light / Dark, as the
 * web portals have it.
 *
 * The choice becomes the CSS variables every `pp-*` and `st-*` class reads
 * (src/lib/theme.ts), set once at the root so a screen, a modal and a sheet
 * all agree. Icons take a colour prop rather than a class, so they read the
 * same hexes from `usePalette()`.
 *
 * Signed out, the app is light whatever the device says: sign-in is drawn in
 * the light palette only, as the web's is.
 */
import { createContext, useCallback, useContext, useLayoutEffect, useMemo } from "react";
import { Platform, useColorScheme, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { vars } from "nativewind";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import {
  COLOURS,
  cssVariables,
  preferenceOf,
  schemeOf,
  type Colours,
  type Scheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeState = Colours & {
  scheme: Scheme;
  preference: ThemePreference;
  /** Applies at once; the account catches up in the background. */
  setPreference: (pref: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeState>({
  ...COLOURS.light,
  scheme: "light",
  preference: "System",
  setPreference: () => {},
});

/* Built once per scheme rather than on every render of the root. */
const VARIABLES = { light: cssVariables("light"), dark: cssVariables("dark") };
const VARS = { light: vars(VARIABLES.light), dark: vars(VARIABLES.dark) };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useSession();
  const device = useColorScheme();
  const preference = preferenceOf(user?.themePreference);
  const scheme: Scheme = user ? schemeOf(preference, device) : "light";

  /* On the web build a modal is drawn outside this view, where a variable set
     on it does not reach, so the document carries them too. */
  useLayoutEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    for (const [k, v] of Object.entries(VARIABLES[scheme])) document.documentElement.style.setProperty(k, v);
  }, [scheme]);

  const setPreference = useCallback(
    (pref: ThemePreference) => {
      updateUser({ themePreference: pref });
      api.patch("auth/me", { themePreference: pref }).catch(() => {
        /* Applied on screen; saved the next time it is chosen. */
      });
    },
    [updateUser],
  );

  const value = useMemo(
    () => ({ ...COLOURS[scheme], scheme, preference, setPreference }),
    [scheme, preference, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={[{ flex: 1 }, VARS[scheme]]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** The current scheme's hexes, for an icon's `color` or a `style` — the same
    values the classes read. */
export function usePalette(): Colours {
  const { pp, st } = useContext(ThemeContext);
  return { pp, st };
}
