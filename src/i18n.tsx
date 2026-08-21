import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IntlProvider } from "use-intl";
import en from "./messages/en.json";
import th from "./messages/th.json";

export type Locale = "en" | "th";

const messages = { en, th } as const;

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({ locale: "en", setLocale: () => {} });

/** Same message files and `useTranslations` API as the web app (use-intl is
    the engine inside next-intl); the cookie becomes AsyncStorage. */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  /* The stored choice arrives asynchronously, so rendering before it lands
     showed a Thai reader one frame of English on every cold start. Nothing is
     drawn until the answer is known — the splash screen is still up, so this
     costs no visible delay. */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("locale")
      .then((value) => {
        if (value === "th" || value === "en") setLocaleState(value);
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem("locale", next);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <IntlProvider
        locale={locale}
        messages={messages[locale]}
        timeZone="Asia/Bangkok"
      >
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}

export function useLocaleSwitch() {
  return useContext(LocaleContext);
}
