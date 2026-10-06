/**
 * The Profile's Payment History — the web's: every payment for the family's
 * children, each saying when, for which child, for what, how much, and what
 * it bought, with the receipt one tap on the row away.
 *
 * The receipt opens as a voucher; Save captures it as a PNG and hands it to
 * the share sheet, which is where "Save Image" lives on a phone — the same
 * choice the web makes on a touch screen.
 */
import { useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { File } from "expo-file-system";
import { useLocale, useTranslations } from "use-intl";
import { BookOpen, Download, Trophy } from "lucide-react-native";
import { money } from "@/lib/money";
import type { PaymentRecord } from "@/lib/payment-history";
import { fmtCredits, receiptContent } from "@/lib/receipt-content";
import { useParentData } from "@/components/parent/ParentData";
import { ReceiptVoucher, RECEIPT_WIDTH } from "@/components/parent/ReceiptVoucher";
import { usePalette } from "@/components/ThemeProvider";

function fmtDay(iso: string, locale: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function StatusChip({ status }: { status: PaymentRecord["status"] }) {
  const t = useTranslations("pv2");
  const tone =
    status === "Paid" ? "bg-pp-green-soft text-pp-green"
    : status === "Cancelled" ? "bg-pp-danger-soft text-pp-danger"
    : "bg-pp-amber-soft text-pp-amber";
  const [bg, ink] = tone.split(" ");
  return (
    <View className={`rounded-full px-2 py-0.5 ${bg}`}>
      <Text className={`font-pp-bold text-[10px] ${ink}`}>{t(`payStatus.${status}`)}</Text>
    </View>
  );
}

/** The receipt as a voucher, with Close and Save. */
function Receipt({ p, onClose }: { p: PaymentRecord; onClose: () => void }) {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const { parent } = useParentData();
  const voucher = useRef<View>(null);
  const [saving, setSaving] = useState(false);

  const content = receiptContent(p, parent.name, {
    date: t("payDate"),
    receivedFrom: t("receivedFrom"),
    child: t("payChild"),
    method: t("payMethod"),
    reference: t("payReference"),
    methodName: (m) => (t.has(`payMethodName.${m}`) ? t(`payMethodName.${m}`) : ""),
    tournament: t("payTournament"),
    course: t("payCourse"),
    credits: (count) => t("creditsCount", { count }),
    subtotal: t("paySubtotal"),
    discount: t("payDiscount"),
    day: (iso) => fmtDay(iso, locale),
    money: (v) => money(v, locale === "th" ? "th-TH" : "en-GB"),
  });

  async function save() {
    if (!voucher.current || saving) return;
    setSaving(true);
    try {
      const shot = await captureRef(voucher, { format: "png", quality: 1, result: "tmpfile" });
      /* Named as the web names it, so a saved or forwarded receipt says what
         it is. view-shot's own file name is ignored on iOS, so the capture is
         copied to one, beside it in the temporary folder. */
      /* view-shot answers with a bare path on iOS; File needs a URL. */
      const capture = new File(shot.startsWith("file://") ? shot : `file://${shot}`);
      const named = new File(capture.parentDirectory, `JCA-${p.id}.png`);
      if (named.exists) named.delete();
      capture.copy(named);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(named.uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: t("receiptTitle") });
      }
    } catch {
      /* Dismissed the share sheet, or the capture failed — the receipt is
         still on screen. */
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-[rgba(28,25,40,0.7)] p-4">
        <Pressable onPress={() => {}} accessibilityViewIsModal accessibilityLabel={t("receiptTitle")} style={{ width: RECEIPT_WIDTH }} className="max-h-[92%] gap-3">
          <ScrollView className="rounded-2xl" contentContainerStyle={{ borderRadius: 16, overflow: "hidden" }}>
            <ReceiptVoucher
              ref={voucher}
              content={content}
              words={{
                school: "JCA Chess School",
                title: t("receiptOfficial"),
                itemHeader: t("receiptItem"),
                amountHeader: t("receiptAmount"),
                totalLabel: t("payAmountPaid"),
                status: t(`payStatus.${p.status}`),
                thanks: t("receiptThanks"),
                footnote: t("receiptFootnote"),
              }}
            />
          </ScrollView>
          <View className="flex-row gap-2">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              /* Solid, not see-through: the list under the dialog showed
                 through a translucent button and read as part of it. */
              className="flex-1 items-center rounded-xl border-[1.5px] border-white/40 bg-[#1F2A44] py-3 active:opacity-80"
            >
              <Text className="font-pp-bold text-sm text-white">{t("close")}</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving}
              accessibilityRole="button"
              className={`flex-[2] flex-row items-center justify-center gap-2 rounded-xl bg-white py-3 active:opacity-90 ${saving ? "opacity-60" : ""}`}
            >
              {saving ? <ActivityIndicator size="small" color="#1F2A44" /> : <Download size={16} color="#1F2A44" />}
              <Text className="font-pp-bold text-sm text-[#1F2A44]">{t("saveImage")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function PaymentHistory({ payments }: { payments: PaymentRecord[] }) {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const { pp } = usePalette();
  const [open, setOpen] = useState<PaymentRecord | null>(null);
  const fmt = (v: number) => money(v, locale === "th" ? "th-TH" : "en-GB");

  return (
    <View className="gap-3">
      <Text className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">{t("paymentHistory")}</Text>
      <View className="overflow-hidden rounded-xl border-[1.5px] border-pp-line bg-pp-card">
        {payments.length === 0 ? (
          <Text className="px-4 py-6 text-center font-pp text-[13px] text-pp-muted">{t("noPayments")}</Text>
        ) : (
          payments.map((p, i) => {
            const Kind = p.kind === "tournament" ? Trophy : BookOpen;
            return (
              <Pressable
                key={p.id}
                onPress={() => setOpen(p)}
                accessibilityRole="button"
                className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-pp-mist ${i < payments.length - 1 ? "border-b border-pp-panel" : ""}`}
              >
                <View className="size-9 items-center justify-center rounded-xl bg-pp-soft">
                  <Kind size={16} color={pp.blue} />
                </View>
                <View className="min-w-0 flex-1 gap-0.5">
                  <Text numberOfLines={1} className="font-pp-semibold text-[13.5px] text-pp-ink">
                    {p.forWhat} <Text className="font-pp text-pp-muted">· {p.childName}</Text>
                  </Text>
                  <Text numberOfLines={1} className="font-pp text-[11.5px] text-pp-faint">{fmtDay(p.date, locale)}</Text>
                </View>
                <View className="max-w-[55%] items-end gap-1">
                  <Text className="font-pp-bold text-[14px] text-pp-ink">{fmt(p.paid)}</Text>
                  <View className="flex-row flex-wrap items-center justify-end gap-x-2 gap-y-1">
                    {p.kind === "course" && p.credits > 0 && (
                      <View className="rounded-full bg-pp-green-soft px-2 py-0.5">
                        <Text className="font-pp-bold text-[10px] text-pp-green">
                          {t("creditsPlus", { count: fmtCredits(p.credits) })}
                        </Text>
                      </View>
                    )}
                    {p.status !== "Paid" && <StatusChip status={p.status} />}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
      {open && <Receipt p={open} onClose={() => setOpen(null)} />}
    </View>
  );
}
