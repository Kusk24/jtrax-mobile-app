import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  ArrowLeft,
  Check,
  ChessBishop,
  ChessKing,
  ChessKnight,
  ChessPawn,
  ChessRook,
  QrCode,
  School,
} from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { attendanceSession } from "@/lib/student-data";
import { C } from "@/lib/colors";

type CheckinPhase = "enter-code" | "verifying" | "success" | "not-started";

const VERIFY_DURATION_MS = 3000;

const pieces = [
  { Icon: ChessPawn, color: C.navy },
  { Icon: ChessKnight, color: "#f59e0b" },
  { Icon: ChessBishop, color: "#ea580c" },
  { Icon: ChessRook, color: "#2dd4bf" },
  { Icon: ChessKing, color: "#059669" },
];

export default function CheckinScreen() {
  const t = useTranslations("checkin");
  const [phase, setPhase] = useState<CheckinPhase>(
    attendanceSession.active ? "enter-code" : "not-started",
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (phase !== "verifying") return;
    const timer = setTimeout(() => setPhase("success"), VERIFY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  function submitCode() {
    if (code === attendanceSession.code) {
      setError(false);
      setPhase("verifying");
    } else {
      setError(true);
    }
  }

  const notStarted = phase === "not-started";

  return (
    <Screen gapClass="gap-4">
      <View className="flex-row items-start gap-3">
        <Pressable
          onPress={() => router.push("/student")}
          className="mt-0.5 rounded-full p-1"
        >
          <ArrowLeft size={24} color={C.navy} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="font-sans-extrabold text-xl text-navy">
            {notStarted ? t("attendance") : t("selfTitle")}
          </Text>
          <Text className="mt-0.5 font-sans text-xs text-muted">
            {notStarted
              ? `${attendanceSession.course} - ${attendanceSession.section}`
              : t("selfSubtitle")}
          </Text>
        </View>
      </View>

      {phase === "enter-code" && (
        <View className="items-center gap-8 py-8">
          <View className="size-28 items-center justify-center rounded-full bg-navy-soft/70">
            <QrCode size={48} color={C.navy} />
          </View>
          <View className="w-full items-center">
            <Text className="font-sans-bold text-base text-ink">
              {t("enterCode")}
            </Text>
            <Text className="mt-1 font-sans text-xs text-muted">
              {t("codeHint")}
            </Text>
            <TextInput
              value={code}
              onChangeText={(value) => {
                setCode(value.replace(/\D/g, "").slice(0, 6));
                setError(false);
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              placeholder="••••••"
              placeholderTextColor={C.line}
              className={`mt-4 w-56 rounded-xl border-2 bg-card py-3 text-center font-sans-extrabold text-2xl tracking-[8px] text-navy ${
                error ? "border-brick" : "border-navy/40"
              }`}
            />
            {error && (
              <Text className="mt-2 text-center font-sans-semibold text-xs text-brick">
                {t("codeError")}
              </Text>
            )}
            <Pressable
              onPress={submitCode}
              disabled={code.length !== 6}
              className={`mt-4 w-full rounded-xl py-3 shadow-clay ${
                code.length === 6 ? "bg-navy active:bg-navy-deep" : "bg-navy/40"
              }`}
            >
              <Text className="text-center font-sans-semibold text-base text-white">
                {t("checkInBtn")}
              </Text>
            </Pressable>
            <View className="my-5 w-full flex-row items-center gap-3">
              <View className="h-px flex-1 bg-line" />
              <Text className="font-sans text-xs text-muted">{t("or")}</Text>
              <View className="h-px flex-1 bg-line" />
            </View>
            <Pressable
              onPress={() => setPhase("verifying")}
              className="w-full flex-row items-center justify-center gap-2 rounded-xl border-2 border-navy/40 bg-card py-3 active:bg-navy-soft/30"
            >
              <QrCode size={20} color={C.navy} />
              <Text className="font-sans-semibold text-base text-navy">
                {t("scanQr")}
              </Text>
            </Pressable>
            <Text className="mt-2 font-sans text-[10px] text-muted">
              {t("scanNote", { code: attendanceSession.code })}
            </Text>
          </View>
        </View>
      )}

      {phase === "verifying" && (
        <View className="items-center gap-10 py-16">
          <View className="size-48 items-center justify-center rounded-full bg-olive-soft">
            <View className="size-32 items-center justify-center rounded-full bg-olive">
              <School size={48} color={C.white} />
            </View>
          </View>
          <View className="items-center gap-6">
            <Text className="font-sans-semibold text-base text-ink">
              {t("verifying")}
            </Text>
            <View className="flex-row gap-4">
              {pieces.map(({ Icon, color }, i) => (
                <Icon key={i} size={28} color={color} />
              ))}
            </View>
          </View>
        </View>
      )}

      {phase === "success" && (
        <View className="items-center gap-8 py-16">
          <View className="size-48 items-center justify-center rounded-full bg-olive-soft">
            <View className="size-32 items-center justify-center rounded-full bg-olive">
              <Check size={64} color={C.white} strokeWidth={3} />
            </View>
          </View>
          <View className="items-center">
            <Text className="font-sans-extrabold text-xl text-ink">
              {t("successTitle")}
            </Text>
            <Text className="mt-1 font-sans text-sm text-muted">
              {t("welcomeTo", {
                course: `${attendanceSession.course} ${attendanceSession.section}`,
              })}
            </Text>
          </View>
          <View className="w-full flex-row items-center justify-between rounded-xl border border-olive/40 bg-olive-soft/60 px-4 py-3">
            <Text className="font-sans text-sm text-ink">
              {t("checkedInAt", { time: attendanceSession.checkinTime })}
            </Text>
            <Text className="font-sans-bold text-sm text-brick">
              {t("minusCredit")}
            </Text>
          </View>
        </View>
      )}

      {notStarted && (
        <View className="items-center justify-center py-24">
          <Text className="max-w-xs text-center font-sans-semibold text-2xl leading-9 text-navy">
            {t("notStarted")}
          </Text>
        </View>
      )}

      {(phase === "success" || notStarted) && (
        <Pressable
          onPress={() => router.push("/student")}
          className="rounded-xl bg-navy py-3 shadow-clay active:bg-navy-deep"
        >
          <Text className="text-center font-sans-semibold text-base text-white">
            {t("backHome")}
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}
