/**
 * Editing how the student screens show the pupil: a display name, and an emoji
 * avatar — one of five, or any emoji typed from the keyboard. The web's
 * ProfileEditSheet. The name is saved to the account (the office's official
 * name is untouched); the emoji is kept on this phone only.
 */
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTranslations } from "use-intl";
import { Check, Copy, X } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { DEFAULT_AVATARS, firstEmoji } from "@/lib/student-avatar";

const COPIED_MS = 1500;

export function ProfileEditSheet({
  name,
  studentId,
  avatar,
  onClose,
  onSave,
}: {
  name: string;
  /** Shown read-only, with a copy button — the ID the student signs in with. */
  studentId: string;
  avatar: string;
  onClose: () => void;
  /** Resolves false when the name could not be saved. */
  onSave: (next: { name: string; avatar: string }) => Promise<boolean>;
}) {
  const t3 = useTranslations("sv3");
  const { pp } = usePalette();
  const [draftName, setDraftName] = useState(name);
  const [pick, setPick] = useState(avatar);
  const [own, setOwn] = useState(DEFAULT_AVATARS.includes(avatar as (typeof DEFAULT_AVATARS)[number]) ? "" : avatar);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyId() {
    try {
      await Clipboard.setStringAsync(studentId);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      /* Clipboard unavailable: the ID is on screen to read out. */
    }
  }

  const ownEmoji = firstEmoji(own);
  const canSave = draftName.trim().length > 0 && !saving;

  async function save() {
    setSaving(true);
    setFailed(false);
    const ok = await onSave({ name: draftName, avatar: pick });
    setSaving(false);
    if (ok) onClose();
    else setFailed(true);
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-[rgba(20,33,58,0.45)] px-5">
          {/* A press on the card itself must not close it. */}
          <Pressable onPress={() => {}} accessibilityViewIsModal className="w-full max-w-[420px] rounded-2xl bg-pp-card p-5">
            <View className="flex-row items-center justify-between">
              <Text accessibilityRole="header" className="font-pp-display-bold text-[18px] text-pp-ink">
                {t3("editProfile")}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t3("cancel")}
                hitSlop={6}
                className="size-8 items-center justify-center rounded-full active:bg-pp-soft"
              >
                <X size={16} color={pp.muted} strokeWidth={2.4} />
              </Pressable>
            </View>

            {/* The avatar: the one chosen, big, above the choices. */}
            <View className="mt-4 items-center">
              <View className="size-20 items-center justify-center rounded-full bg-pp-soft">
                <Text className={pick ? "text-[40px] leading-[48px]" : "text-[40px] leading-[48px] text-pp-blue"}>
                  {pick || "♘"}
                </Text>
              </View>
            </View>

            <Text className="mt-4 font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">{t3("avatarLabel")}</Text>
            {/* The student's own emoji comes first, then the five defaults — one row. */}
            <View className="mt-2 flex-row items-center gap-2">
              <TextInput
                value={own}
                onChangeText={(v) => {
                  setOwn(v);
                  const got = firstEmoji(v);
                  if (got) setPick(got);
                }}
                maxLength={16}
                placeholder="+"
                placeholderTextColor={pp.faint}
                accessibilityLabel={t3("ownEmoji")}
                className={`size-10 rounded-full border-[1.5px] p-0 text-center text-[20px] text-pp-ink ${
                  ownEmoji && pick === ownEmoji ? "border-[2px] border-pp-blue" : "border-dashed border-pp-line"
                }`}
              />
              {DEFAULT_AVATARS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setPick(e)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: pick === e }}
                  accessibilityLabel={e}
                  className={`size-10 items-center justify-center rounded-full ${
                    pick === e ? "border-[2px] border-pp-blue bg-pp-soft" : "bg-pp-mist"
                  }`}
                >
                  <Text className="text-[22px] leading-[28px]">{e}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="mt-1.5 font-pp text-[11.5px] text-pp-muted">{t3("ownEmojiHint")}</Text>

            <Text className="mt-5 font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">{t3("nameLabel")}</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              maxLength={40}
              accessibilityLabel={t3("nameLabel")}
              className="mt-2 w-full rounded-xl border-[1.5px] border-pp-line bg-pp-card px-3.5 py-2.5 font-pp-semibold text-[15px] text-pp-ink"
            />

            {/* The student ID: read-only — the office sets it — with a copy button. */}
            <Text className="mt-5 font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">{t3("studentIdLabel")}</Text>
            <View className="mt-2 flex-row items-center gap-2 rounded-xl border-[1.5px] border-pp-line bg-pp-mist py-1.5 pl-3.5 pr-1.5">
              <Text selectable numberOfLines={1} className="min-w-0 flex-1 py-1 font-pp-semibold text-[14px] text-pp-muted">
                {studentId || "—"}
              </Text>
              <Pressable
                onPress={copyId}
                disabled={!studentId}
                accessibilityRole="button"
                className={`flex-row items-center gap-1 rounded-lg px-2.5 py-1.5 ${copied ? "bg-pp-green-soft" : "bg-pp-card"}`}
              >
                {copied ? (
                  <Check size={14} color={pp.green} strokeWidth={2.8} />
                ) : (
                  <Copy size={14} color={pp.blue} strokeWidth={2.4} />
                )}
                <Text className={`font-pp-bold text-[12.5px] ${copied ? "text-pp-green" : "text-pp-blue"}`}>
                  {copied ? t3("copied") : t3("copy")}
                </Text>
              </Pressable>
            </View>

            {failed && (
              <Text accessibilityRole="alert" className="mt-3 font-pp-semibold text-[12.5px] text-pp-danger">
                {t3("saveFailed")}
              </Text>
            )}

            <View className="mt-5 flex-row gap-2">
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                className="flex-1 items-center rounded-xl border-[1.5px] border-pp-line py-3 active:bg-pp-mist"
              >
                <Text className="font-pp-bold text-[14px] text-pp-ink">{t3("cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={save}
                disabled={!canSave}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSave }}
                className={`flex-[2] flex-row items-center justify-center gap-1.5 rounded-xl bg-st-brand py-3 active:bg-st-brand-deep ${
                  canSave ? "" : "opacity-60"
                }`}
              >
                <Check size={16} color="#ffffff" strokeWidth={2.6} />
                <Text className="font-pp-bold text-[14px] text-white">{t3("save")}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
