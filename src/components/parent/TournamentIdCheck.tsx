/* The ID card step of a parent's tournament entry, after the child is picked —
 * the web's TournamentIdCheck: the child's ID card is read for the date of
 * birth, and the categories open to that birth year can be chosen. The server
 * keeps what it read, not the photo, and the entry names the check.
 *
 * Where the web has one file input (a phone browser offers camera or library
 * from it), the app offers both as buttons: photographing the card on the
 * spot is the usual way, and a photo already taken is the other. */
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTranslations } from "use-intl";
import { Camera, Lock, Upload } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { ApiError } from "@/lib/api";
import { ageFromDOB, categoryAllows, scanChildIDCard, type PublicCategory } from "@/lib/registration";

export type IdCardRead = {
  studentId: string;
  checkId: string;
  dateOfBirth: string;
  name: string;
  /** Off a Thai ID card, for the optional Thai name. */
  thaiName: string;
  documentType: string;
};

function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function TournamentIdCheck({
  tournamentId,
  studentId,
  startDate,
  categories,
  read,
  onRead,
  categoryId,
  onCategory,
  children,
}: {
  tournamentId: string;
  studentId: string;
  startDate: string;
  categories: PublicCategory[];
  /** The current read, for this child only. */
  read: IdCardRead | null;
  onRead: (read: IdCardRead | null) => void;
  categoryId: string;
  onCategory: (id: string) => void;
  /** Shown between the ID card and the categories — the player's names. */
  children?: ReactNode;
}) {
  const t = useTranslations("register");
  const { pp } = usePalette();
  const [scanning, setScanning] = useState(false);
  const [failed, setFailed] = useState("");

  async function pick(source: "camera" | "library") {
    setFailed("");
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.8 };
    let result: ImagePicker.ImagePickerResult;
    try {
      if (source === "camera") {
        const allowed = await ImagePicker.requestCameraPermissionsAsync();
        if (!allowed.granted) return;
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }
    } catch {
      /* No camera — a simulator — or the picker could not open. */
      setFailed(t("scanFailed"));
      return;
    }
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;

    setScanning(true);
    try {
      const { fields, checkId } = await scanChildIDCard(tournamentId, studentId, asset);
      onRead({
        studentId,
        checkId,
        dateOfBirth: fields.dateOfBirth.value,
        name: [fields.firstName.value, fields.lastName.value].filter(Boolean).join(" "),
        thaiName: fields.thaiName?.value ?? "",
        documentType: fields.documentType,
      });
      onCategory("");
    } catch (err) {
      onRead(null);
      onCategory("");
      /* The server's own sentence when it gave one ("not available right
         now", "too large"); a plain one when the phone lost signal. */
      setFailed(err instanceof ApiError && err.status !== 0 ? err.message : t("scanFailed"));
    } finally {
      setScanning(false);
    }
  }

  const dob = read?.dateOfBirth ?? "";
  const options = categories.map((c) => ({ ...c, ...categoryAllows(c.name, dob, startDate) }));
  const button =
    "min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border-[1.5px] border-pp-line px-2 active:border-pp-blue";

  return (
    <>
      <View className="gap-2">
        <Text className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
          {t("idCardTitle")}
          <Text className="text-pp-danger"> *</Text>
        </Text>
        <View className="gap-2.5 rounded-xl border-[1.5px] border-pp-line bg-pp-card p-4">
          <View className="flex-row items-center gap-1.5">
            <Lock size={14} color={pp.sub} />
            <Text className="flex-1 font-pp text-[12px] text-pp-sub">{t("idCardHint")}</Text>
          </View>
          {scanning ? (
            <View className="min-h-11 flex-row items-center justify-center gap-2">
              <ActivityIndicator size="small" color={pp.blue} />
              <Text className="font-pp-semibold text-[13px] text-pp-blue">{t("scanning")}</Text>
            </View>
          ) : (
            <View className="flex-row gap-2">
              <Pressable onPress={() => void pick("camera")} accessibilityRole="button" className={button}>
                <Camera size={16} color={pp.blue} />
                <Text numberOfLines={1} className="font-pp-semibold text-[13px] text-pp-blue">{t("idCardCamera")}</Text>
              </Pressable>
              <Pressable onPress={() => void pick("library")} accessibilityRole="button" className={button}>
                <Upload size={16} color={pp.blue} />
                <Text numberOfLines={1} className="font-pp-semibold text-[13px] text-pp-blue">
                  {read ? t("idCardAgain") : t("idCardChoose")}
                </Text>
              </Pressable>
            </View>
          )}
          {read && (
            <Text accessibilityLiveRegion="polite" className="font-pp text-[12.5px] text-pp-ink">
              {t("scanRead", {
                name: read.name || "—",
                dob: longDate(read.dateOfBirth),
                age: ageFromDOB(read.dateOfBirth, startDate ? new Date(startDate) : new Date()),
              })}
            </Text>
          )}
          {failed !== "" && (
            <Text accessibilityRole="alert" className="font-pp-semibold text-[12.5px] text-pp-danger">
              {failed}
            </Text>
          )}
        </View>
      </View>

      {children}

      {categories.length > 0 && (
        <View className="gap-2">
          <Text className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
            {t("category")}
            <Text className="text-pp-danger"> *</Text>
          </Text>
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
            {options.map((c) => {
              const selected = categoryId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => onCategory(c.id)}
                  disabled={!c.allowed}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: !c.allowed }}
                  style={{ borderColor: selected ? pp.blue : pp.line, width: "48.5%", opacity: c.allowed ? 1 : 0.5 }}
                  className="gap-0.5 rounded-xl border-[1.5px] bg-pp-card px-3.5 py-3"
                >
                  <Text className="font-pp-semibold text-[13.5px] text-pp-ink">{c.name}</Text>
                  <Text className="font-pp text-[11.5px] text-pp-muted">
                    {c.needsDob
                      ? t("categoryNeedsDob")
                      : c.limit === 0
                        ? t("categoryOpen")
                        : t("categoryBornFrom", { year: c.bornFrom })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </>
  );
}
