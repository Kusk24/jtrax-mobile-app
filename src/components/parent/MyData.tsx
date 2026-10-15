/**
 * The family's own data, on the parent's profile — the web's panel: a copy to
 * download (PDPA s.30–31) and a request to have it erased (s.33). The file is
 * fetched with the session's token in the header, never the URL, and handed
 * to the share sheet; the erasure is the office's to carry out, so the button
 * sends a request and then shows that one is open.
 */
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { useTranslations } from "use-intl";
import { Download, ShieldCheck, Trash2 } from "lucide-react-native";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { API_BASE, api, getAuthToken } from "@/lib/api";
import { usePalette } from "@/components/ThemeProvider";

const row = "flex-row items-center gap-3 border-b border-pp-panel px-4 py-3.5";

export function MyData() {
  const { pp } = usePalette();
  const t = useTranslations("pv2");
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  /* "" until known, then the request's status, or "none". */
  const [request, setRequest] = useState("");

  useEffect(() => {
    let live = true;
    api
      .get<{ status?: string }>("me/erasure-request")
      .then((out) => live && setRequest(out.status || "none"))
      .catch(() => live && setRequest("none"));
    return () => {
      live = false;
    };
  }, []);

  async function download() {
    setDownloading(true);
    setDownloadFailed(false);
    try {
      const token = getAuthToken();
      const file = await File.downloadFileAsync(`${API_BASE}/api/v1/me/export`, new Directory(Paths.cache), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        idempotent: true,
      });
      /* Named as the web names it, so a saved or forwarded copy says what it is. */
      const named = new File(file.parentDirectory, "jtrax-my-data.json");
      if (named.exists) named.delete();
      file.copy(named);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(named.uri, { mimeType: "application/json", UTI: "public.json", dialogTitle: t("downloadData") });
      }
    } catch {
      setDownloadFailed(true);
    } finally {
      setDownloading(false);
    }
  }

  async function ask() {
    setSending(true);
    setSendFailed(false);
    try {
      await api.post("me/erasure-request", { note: note.trim() });
      setRequest("Open");
      setConfirming(false);
    } catch {
      setSendFailed(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <View className="gap-3">
      <Text className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">{t("myData")}</Text>
      <View className="overflow-hidden rounded-card border-[1.5px] border-pp-line bg-pp-card">
        <Pressable onPress={download} disabled={downloading} accessibilityRole="button" className={`${row} active:bg-pp-mist`} style={{ opacity: downloading ? 0.6 : 1 }}>
          <View className="size-8 items-center justify-center rounded-card bg-pp-soft">
            <Download size={16} color={pp.blue} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-pp-bold text-[13px] text-pp-ink">{downloading ? t("downloadingData") : t("downloadData")}</Text>
            <Text className="font-pp text-[11px] text-pp-muted">{t("downloadDataSub")}</Text>
          </View>
        </Pressable>
        {downloadFailed && (
          <Text accessibilityRole="alert" className="px-4 pb-3 font-pp-bold text-[12px] text-pp-danger">{t("downloadDataFailed")}</Text>
        )}

        {request === "Open" ? (
          <View className={row}>
            <View className="size-8 items-center justify-center rounded-card bg-pp-amber-soft">
              <ShieldCheck size={16} color={pp.amber} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-pp-bold text-[13px] text-pp-ink">{t("eraseRequested")}</Text>
              <Text className="font-pp text-[11px] text-pp-muted">{t("eraseRequestedSub")}</Text>
            </View>
          </View>
        ) : confirming ? (
          <View className="gap-2.5 px-4 py-3.5">
            <Text className="font-pp-bold text-[13px] text-pp-ink">{t("eraseConfirm")}</Text>
            <Text className="font-pp text-[12px] leading-5 text-pp-sub">{t("eraseConfirmBody")}</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              maxLength={1000}
              multiline
              placeholder={t("eraseNote")}
              accessibilityLabel={t("eraseNote")}
              placeholderTextColor={pp.faint}
              className="min-h-[56px] rounded-[13px] border-[1.5px] border-pp-line bg-pp-card px-3.5 py-2.5 font-pp text-[13px] text-pp-ink"
            />
            {sendFailed && <Text accessibilityRole="alert" className="font-pp-bold text-[12px] text-pp-danger">{t("eraseFailed")}</Text>}
            <View className="flex-row gap-2">
              <Pressable onPress={() => setConfirming(false)} accessibilityRole="button" className="flex-1 items-center rounded-[12px] border-[1.5px] border-pp-line py-2.5">
                <Text className="font-pp-bold text-[13px] text-pp-ink">{t("eraseCancel")}</Text>
              </Pressable>
              <Pressable onPress={ask} disabled={sending} accessibilityRole="button" className="flex-1 items-center rounded-[12px] bg-pp-danger py-2.5" style={{ opacity: sending ? 0.6 : 1 }}>
                <Text className="font-pp-bold text-[13px] text-white">{t("eraseSend")}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setConfirming(true)} disabled={request === ""} accessibilityRole="button" className={`${row} active:bg-pp-mist`}>
            <View className="size-8 items-center justify-center rounded-card bg-pp-red-soft">
              <Trash2 size={16} color={pp.danger} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-pp-bold text-[13px] text-pp-ink">{t("eraseData")}</Text>
              <Text className="font-pp text-[11px] text-pp-muted">{t("eraseDataSub")}</Text>
            </View>
          </Pressable>
        )}
      </View>
      <Link href="/privacy" className="self-start font-pp-bold text-[12px] text-pp-blue">
        {t("privacyLink")}
      </Link>
    </View>
  );
}
