/* Account & Security on a child's profile — the web's ChildAccount: the
 * username the child signs in with, and — for a child without their own
 * email — a way for the parent to set a new password. A child with their own
 * email resets it themselves, so they get no button here. Renders nothing
 * until the login is known.
 *
 * Both calls are the parent's own child only: the backend joins through
 * student_parent and answers 404 for anyone else's.
 */
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTranslations } from "use-intl";
import { Check, Copy, KeyRound, X } from "lucide-react-native";
import { api } from "@/lib/api";
import { checkNewPassword } from "@/lib/password-rules";
import { usePalette } from "@/components/ThemeProvider";

export function ChildAccount({ studentId, name }: { studentId: string; name: string }) {
  const t = useTranslations("pv2");
  const { pp } = usePalette();
  const [login, setLogin] = useState<{ login: string; ownEmail: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get<{ login: string; ownEmail: boolean }>(`students/${encodeURIComponent(studentId)}/login`)
      .then((v) => alive && setLogin(v))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [studentId]);

  if (!login) return null;

  return (
    <View className="gap-3">
      <Text className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">{t("accountSecurity")}</Text>
      <View className="gap-3 rounded-xl bg-pp-card p-4 shadow-clay">
        <View className="gap-0.5">
          <Text className="font-pp text-[11.5px] text-pp-muted">
            {login.ownEmail ? t("signsInWithEmail") : t("loginUsername")}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text selectable numberOfLines={1} className="shrink font-pp-semibold text-[14px] text-pp-ink">
              {login.login}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("copyUsername")}
              hitSlop={8}
              onPress={() => {
                Clipboard.setStringAsync(login.login)
                  .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  })
                  .catch(() => {});
              }}
              className="size-7 items-center justify-center rounded-lg active:bg-pp-soft"
            >
              {copied ? <Check size={14} color={pp.green} /> : <Copy size={14} color={pp.muted} />}
            </Pressable>
          </View>
          {login.ownEmail && (
            <Text className="font-pp text-[12px] text-pp-muted">{t("ownEmailResetHint", { name })}</Text>
          )}
          {done && (
            <Text accessibilityLiveRegion="polite" className="font-pp-semibold text-[12.5px] text-pp-green">
              {t("childPasswordChanged", { name })}
            </Text>
          )}
        </View>
        {!login.ownEmail && (
          <Pressable
            onPress={() => {
              setDone(false);
              setOpen(true);
            }}
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-2 self-start rounded-xl border-[1.5px] border-pp-line bg-pp-card px-4 py-2.5 active:bg-pp-soft"
          >
            <KeyRound size={16} color={pp.blue} />
            <Text className="font-pp-bold text-[13px] text-pp-blue">{t("resetPassword")}</Text>
          </Pressable>
        )}
      </View>
      {open && (
        <ResetDialog
          studentId={studentId}
          name={name}
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            setDone(true);
          }}
        />
      )}
    </View>
  );
}

function ResetDialog({
  studentId,
  name,
  onClose,
  onDone,
}: {
  studentId: string;
  name: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("pv2");
  const tp = useTranslations("changePassword");
  const { pp } = usePalette();
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const problem = checkNewPassword(next, confirm);
    if (problem) {
      setError(tp(problem === "short" ? "errorShort" : problem === "weak" ? "errorWeak" : "errorMismatch"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post(`students/${encodeURIComponent(studentId)}/password`, { password: next });
      onDone();
    } catch {
      setError(tp("errorFailed"));
      setBusy(false);
    }
  }

  const field = (label: string, value: string, set: (v: string) => void) => (
    <View className="gap-1.5">
      <Text className="font-pp-bold text-[12px] text-pp-sub">{label}</Text>
      <TextInput
        value={value}
        onChangeText={set}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        accessibilityLabel={label}
        className="rounded-[13px] border-[1.5px] border-pp-line bg-pp-card px-3.5 py-3 font-pp text-[13px] text-pp-ink"
      />
    </View>
  );

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-[rgba(28,25,40,0.5)] p-5">
          {/* A press on the card itself must not close it. */}
          <Pressable onPress={() => {}} accessibilityViewIsModal className="w-full max-w-[420px] gap-3.5 rounded-xl bg-pp-card p-6">
            <View className="flex-row items-start justify-between gap-2.5">
              <Text accessibilityRole="header" className="flex-1 font-pp-display-semibold text-xl leading-snug text-pp-ink">
                {t("resetChildPasswordTitle", { name })}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t("cancel")}
                className="size-[30px] items-center justify-center rounded-[10px] border-[1.5px] border-pp-line bg-pp-card"
              >
                <X size={14} color={pp.ink} />
              </Pressable>
            </View>
            <Text className="font-pp text-[13px] text-pp-sub">{t("resetChildPasswordBody", { name })}</Text>
            {field(t("newPassword"), next, setNext)}
            {field(t("confirmNewPassword"), confirm, setConfirm)}
            <Text className="font-pp text-[11.5px] text-pp-muted">{t("passwordRuleHint")}</Text>
            {error !== "" && (
              <Text accessibilityRole="alert" className="font-pp-semibold text-[12.5px] text-pp-danger">
                {error}
              </Text>
            )}
            <Pressable
              onPress={submit}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              className={`items-center rounded-[14px] bg-pp-blue py-3 ${busy ? "opacity-60" : ""}`}
            >
              <Text className="font-pp-bold text-sm text-white">{t("resetPassword")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
