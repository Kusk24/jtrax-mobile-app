/**
 * Changing your own password while signed in — parents on Settings, students
 * on their profile.
 *
 * There was no way to do this from the app: a parent could only use "forgot
 * password" and a child could only ask the office. It asks for the current
 * password, so a phone left unlocked cannot be used to take the account, and
 * the new one twice. The backend signs every other device out; this one stays.
 */
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useTranslations } from "use-intl";
import { KeyRound } from "lucide-react-native";
import { ApiError, changePassword } from "@/lib/api";
import { checkNewPassword } from "@/lib/password-rules";
import { usePalette } from "@/components/ThemeProvider";
import type { PPKey } from "@/lib/theme";

type Tone = "parent" | "student";

/* `bold` and `semibold` are the portal's own faces: native text does not
   inherit a font from the screen around it, so the form carries them. */
const LOOK: Record<
  Tone,
  { box: string; label: string; input: string; accent: string | { pp: PPKey }; text: string; bold: string; semibold: string }
> = {
  parent: {
    box: "rounded-card border-[1.5px] border-pp-line bg-pp-card p-4",
    label: "font-pp-semibold text-[12.5px] text-pp-sub",
    input: "rounded-lg border-[1.5px] border-pp-line bg-pp-card px-3 py-2.5 font-pp text-sm text-pp-ink",
    /* A palette key: resolved in the current scheme when drawn. */
    accent: { pp: "blue" },
    text: "text-pp-ink",
    bold: "font-pp-bold",
    semibold: "font-pp-semibold",
  },
  /* The student panel's card, as the web draws it: the parent's form in a
     slightly roomier box. */
  student: {
    box: "rounded-2xl border-[1.5px] border-pp-line bg-pp-card p-[18px]",
    label: "font-pp-semibold text-[13.5px] text-pp-muted",
    input: "rounded-lg border-[1.5px] border-pp-line bg-pp-card px-3 py-2.5 font-pp text-sm text-pp-ink",
    accent: { pp: "blue" },
    text: "text-pp-ink",
    bold: "font-pp-bold",
    semibold: "font-pp-semibold",
  },
};

export function ChangePasswordForm({ tone }: { tone: Tone }) {
  const t = useTranslations("changePassword");
  const { pp } = usePalette();
  const look = LOOK[tone];
  const accent = typeof look.accent === "string" ? look.accent : pp[look.accent.pp];
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function clear() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
  }

  async function save() {
    setError("");
    if (!current) return setError(t("errorCurrent"));
    const problem = checkNewPassword(next, confirm);
    if (problem) {
      return setError(t(problem === "short" ? "errorShort" : problem === "weak" ? "errorWeak" : "errorMismatch"));
    }
    setBusy(true);
    try {
      await changePassword(current, next);
      clear();
      setOpen(false);
      setDone(true);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 429
          ? t("errorTooMany")
          : e instanceof ApiError && /current password/i.test(e.message)
            ? t("errorCurrent")
            : e instanceof ApiError && e.status === 0
              ? t("errorOffline")
              : t("errorFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <View className={look.box}>
        <Pressable
          onPress={() => {
            setDone(false);
            setOpen(true);
          }}
          accessibilityRole="button"
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-2">
            <KeyRound size={16} color={accent} />
            <Text className={`${look.bold} text-sm ${look.text}`}>{t("title")}</Text>
          </View>
          <Text className={look.label}>{t("open")}</Text>
        </Pressable>
        {done && (
          <Text accessibilityLiveRegion="polite" style={{ color: pp.green }} className={`mt-2 ${look.semibold} text-[12.5px]`}>
            {t("done")}
          </Text>
        )}
      </View>
    );
  }

  const field = (label: string, value: string, set: (v: string) => void, kind: "password" | "newPassword") => (
    <View className="gap-1">
      <Text className={look.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={set}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={kind}
        autoComplete={kind === "password" ? "current-password" : "new-password"}
        accessibilityLabel={label}
        className={look.input}
      />
    </View>
  );

  return (
    <View className={`${look.box} gap-3`}>
      <View className="flex-row items-center gap-2">
        <KeyRound size={16} color={accent} />
        <Text className={`${look.bold} text-sm ${look.text}`}>{t("title")}</Text>
      </View>
      {field(t("current"), current, setCurrent, "password")}
      {field(t("new"), next, setNext, "newPassword")}
      {field(t("confirm"), confirm, setConfirm, "newPassword")}
      <Text className={look.label}>{t("rule")}</Text>
      {error !== "" && (
        <Text accessibilityRole="alert" style={{ color: pp.danger }} className={`${look.semibold} text-[12.5px]`}>
          {error}
        </Text>
      )}
      <View className="flex-row gap-2">
        <Pressable
          onPress={save}
          disabled={busy}
          accessibilityRole="button"
          style={{ backgroundColor: accent, opacity: busy ? 0.6 : 1 }}
          className="items-center justify-center rounded-lg px-4 py-2.5"
        >
          {busy ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className={`${look.bold} text-sm text-white`}>{t("save")}</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => {
            clear();
            setOpen(false);
          }}
          accessibilityRole="button"
          className="items-center justify-center rounded-lg px-4 py-2.5"
        >
          <Text style={{ color: accent }} className={`${look.bold} text-sm`}>
            {t("cancel")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
