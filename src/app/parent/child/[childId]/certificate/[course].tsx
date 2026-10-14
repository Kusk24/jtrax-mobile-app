/* A child's certificate for one course, as issued by the academy — the web
   portal's certificate page. Shown only once the office has certified them.
   "Download PDF" makes a real PDF of it (expo-print) and hands it to the share
   sheet, where it can be saved to Files or sent on. */
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useLocale, useTranslations } from "use-intl";
import { Download } from "lucide-react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { BackHeader } from "@/components/parent/BackHeader";
import { useParentData } from "@/components/parent/ParentData";
import { useHoursText } from "@/components/useHoursText";
import { fetchCertificates, type CourseCertificate } from "@/lib/certificates";
import { A4_LANDSCAPE, certificateHtml } from "@/lib/certificate-html";

const logo = require("@/../assets/images/jca-logo.png");

/** The logo as base64 PNG: iOS cannot load a local image into a printed page. */
async function logoBase64(): Promise<string> {
  try {
    const asset = await Asset.fromModule(logo).downloadAsync();
    const rendered = await ImageManipulator.manipulate(asset.localUri ?? asset.uri).renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.PNG, base64: true });
    return saved.base64 ?? "";
  } catch {
    return "";
  }
}

export default function CertificateScreen() {
  const t = useTranslations("pv2");
  const hoursText = useHoursText();
  const locale = useLocale();
  const router = useRouter();
  const { childId, course } = useLocalSearchParams<{ childId: string; course: string }>();
  const { children: kids } = useParentData();
  const ch = kids.find((c) => c.key === childId);
  const [cert, setCert] = useState<CourseCertificate | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ch) return;
    fetchCertificates(ch.id)
      .then((d) => setCert(d.courses.find((c) => c.course === course && c.status === "certified") ?? null))
      .catch(() => setCert(null));
  }, [ch, course]);

  if (!ch || cert === null) {
    return (
      <View className="flex-1 items-center justify-center bg-pp-bg p-6">
        <Text className="text-center font-pp text-[13px] text-pp-muted">{t("certNotIssued")}</Text>
      </View>
    );
  }
  if (cert === undefined) return <View className="flex-1 bg-pp-bg" />;

  const date = cert.certified_at
    ? new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(`${cert.certified_at.slice(0, 10)}T00:00:00`))
    : "";
  const courseName = t(`certCourse_${cert.course}`);
  const body = t("certBody", { course: courseName, hours: hoursText(cert.hours_at_certification ?? cert.hours) });

  async function download() {
    if (saving) return;
    setSaving(true);
    try {
      const html = certificateHtml({
        heading: t("certHeading"), name: ch!.name, body, course: courseName,
        date, dateLabel: t("certDate"), certificateId: cert!.certificate_id ?? "",
        logoBase64: await logoBase64(),
      });
      const { uri } = await Print.printToFileAsync({ html, ...A4_LANDSCAPE });
      /* Named for what it is, so a saved or forwarded file says so. */
      const pdf = new File(uri);
      const named = new File(pdf.parentDirectory, `JCA-certificate-${cert!.certificate_id ?? cert!.course}.pdf`);
      if (named.exists) named.delete();
      pdf.copy(named);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(named.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: t("certHeading") });
      }
    } catch {
      /* Dismissed the share sheet, or the PDF could not be made — the
         certificate is still on screen. */
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-pp-bg" contentContainerClassName="gap-4 px-4 pb-10 pt-4">
      <BackHeader
        title={t("certHeading")}
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={() => void download()}
            accessibilityRole="button"
            disabled={saving}
            className={`flex-row items-center gap-1.5 rounded-xl bg-pp-blue px-3.5 py-2.5 ${saving ? "opacity-60" : ""}`}
          >
            <Download size={16} color="#ffffff" strokeWidth={2.2} />
            <Text className="font-pp-bold text-[13px] text-white">{t("certDownload")}</Text>
          </Pressable>
        }
      />

      {/* The certificate itself, in fixed colours: a document reads the same
          in dark mode. */}
      <View className="items-center gap-3 rounded-xl bg-white px-5 py-7" style={{ borderWidth: 6, borderColor: "#2e5cb8" }}>
        <Image source={logo} style={{ width: 56, height: 56 }} resizeMode="contain" accessibilityLabel="JCA Chess Academy" />
        <Text className="text-center font-pp-bold text-[11px] uppercase tracking-[3px]" style={{ color: "#2e5cb8" }}>
          {t("certHeading")}
        </Text>
        <Text className="text-center font-pp-display-bold text-[26px] leading-tight" style={{ color: "#1d2b4f" }}>{ch.name}</Text>
        <Text className="text-center font-pp text-[14px] leading-relaxed" style={{ color: "#1d2b4f" }}>{body}</Text>
        <Text className="text-center font-pp-display-semibold text-[18px]" style={{ color: "#2e5cb8" }}>{courseName}</Text>
        <View className="mt-2 w-full flex-row items-end justify-between gap-4">
          <View>
            <Text className="font-pp-semibold text-[12px]" style={{ color: "#1d2b4f" }}>{date}</Text>
            <Text className="font-pp text-[12px]" style={{ color: "#5b6b8c" }}>{t("certDate")}</Text>
          </View>
          <View className="items-end">
            <Text className="font-pp-semibold text-[12px]" style={{ color: "#1d2b4f" }}>JCA Chess Academy</Text>
            <Text className="font-pp text-[12px]" style={{ color: "#5b6b8c" }}>{cert.certificate_id}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
