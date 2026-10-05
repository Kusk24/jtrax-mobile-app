/* Joining a game by the six-character code a teacher or friend reads out.
   The join screen's form, so the Games tab can show it too. */
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { ApiError } from "@/lib/api";
import { joinRoom } from "@/lib/games";
import { usePalette } from "@/components/ThemeProvider";

const CODE_LENGTH = 6;

export function JoinForm() {
  const t = useTranslations("play");
  const { pp } = usePalette();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const { room } = await joinRoom(code);
      router.replace(`/student/play/room/${room.gameRoomId}`);
    } catch (e) {
      // The API distinguishes "no such code" from "that room is full"; both are
      // worth saying plainly, since the fix is different.
      if (e instanceof ApiError && e.status === 409) setError("roomFull");
      else if (e instanceof ApiError && e.status === 403) setError("notAllowed");
      else if (e instanceof ApiError && e.status === 0) setError("unreachable");
      else setError("badCode");
    } finally {
      setBusy(false);
    }
  }

  /* The web's JoinForm: the code field, what it is for, any error, and the
     button — no card of its own, because it sits inside the Games tab's card
     (and the join screen gives it one). */
  return (
    <View className="gap-3.5">
      <View>
        <Text className="mb-2 font-pp-bold text-[13px] text-pp-ink">{t("codeLabel")}</Text>
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={CODE_LENGTH}
          placeholder="ABC123"
          placeholderTextColor={pp.line}
          onSubmitEditing={submit}
          returnKeyType="go"
          accessibilityLabel={t("codeLabel")}
          className="rounded-[9px] border border-pp-line bg-pp-card py-3 text-center font-pp-bold text-[26px] tracking-[8px] text-pp-ink"
        />
        <Text className="mt-2 font-pp text-xs leading-5 text-pp-muted">{t("codeHint")}</Text>
      </View>

      {error !== "" && (
        <View className="rounded-2xl bg-pp-red-soft px-3.5 py-2.5">
          <Text accessibilityRole="alert" className="font-pp-semibold text-[12.5px] text-pp-red">
            {t(`error.${error}`)}
          </Text>
        </View>
      )}

      <Pressable
        onPress={submit}
        disabled={busy || code.length < CODE_LENGTH}
        accessibilityRole="button"
        className={`min-h-12 items-center justify-center rounded-full ${busy || code.length < CODE_LENGTH ? "bg-pp-faint" : "bg-pp-blue"}`}
      >
        {busy ? <ActivityIndicator color="#ffffff" /> : <Text className="font-pp-semibold text-sm text-white">{t("join")}</Text>}
      </Pressable>
    </View>
  );
}
