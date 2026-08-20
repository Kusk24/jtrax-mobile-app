import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { PlayShell, Panel } from "@/components/game/PlayShell";
import { ApiError } from "@/lib/api";
import { joinRoom } from "@/lib/games";
import { C } from "@/lib/colors";

const CODE_LENGTH = 6;

export default function JoinScreen() {
  const t = useTranslations("play");
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

  return (
    <PlayShell title={t("vsFriend")}>
      <Panel>
        <Text className="mb-2 font-sans-bold text-sm text-ink">{t("codeLabel")}</Text>
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={CODE_LENGTH}
          placeholder="ABC123"
          placeholderTextColor={C.line}
          onSubmitEditing={submit}
          returnKeyType="go"
          className="rounded-xl border-2 border-line bg-paper py-3 text-center font-sans-bold text-3xl tracking-[8px] text-ink"
        />
        <Text className="mt-2 font-sans text-xs leading-5 text-muted">{t("codeHint")}</Text>
      </Panel>

      {error !== "" && (
        <Panel className="!border-brick-soft !bg-brick-soft">
          <Text className="font-sans-bold text-xs text-maroon">{t(`error.${error}`)}</Text>
        </Panel>
      )}

      <Pressable
        onPress={submit}
        disabled={busy || code.length < CODE_LENGTH}
        className="items-center rounded-xl bg-navy py-3.5 active:opacity-80 disabled:opacity-60"
      >
        {busy ? <ActivityIndicator color={C.white} /> : <Text className="font-sans-bold text-sm text-white">{t("join")}</Text>}
      </Pressable>
    </PlayShell>
  );
}
