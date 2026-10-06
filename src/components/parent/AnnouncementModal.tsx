/* One announcement, full text, over the screen it was tapped on — the web's
 * modal: the "Announcement" label, the title, who it is from and when, the
 * message, and a line for the child, class and attachment when there are any.
 * No colour per sender, so it reads as the academy speaking.
 *
 * A native Modal rather than the portal's fixed overlay, so the hardware back
 * button closes it — on Android a dialog that swallows Back is a dialog you
 * cannot leave. */
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Clock3, Megaphone, Paperclip, UserRound, X } from "lucide-react-native";
import type { AnnouncementV2 } from "@/lib/parent-v2-data";
import { usePalette } from "@/components/ThemeProvider";

export function AnnouncementModal({ a, onClose }: { a: AnnouncementV2; onClose: () => void }) {
  const t = useTranslations("pv2");
  const { pp } = usePalette();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-[rgba(28,25,40,0.5)] p-5">
        {/* Swallows the tap so the card itself never closes the dialog. */}
        <Pressable onPress={() => {}} accessibilityViewIsModal className="max-h-[80%] w-full max-w-[420px] rounded-xl bg-pp-card p-6">
          <ScrollView contentContainerClassName="gap-3" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-start justify-between gap-2.5">
              <View className="flex-row items-center gap-1.5">
                <Megaphone size={14} color={pp.blue} strokeWidth={2} />
                <Text className="font-pp-bold text-[10.5px] uppercase tracking-[1.4px] text-pp-blue">{t("announcementLabel")}</Text>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t("cancel")}
                className="size-[30px] items-center justify-center rounded-[10px] border-[1.5px] border-pp-line bg-pp-card"
              >
                <X size={14} color={pp.ink} />
              </Pressable>
            </View>
            <Text accessibilityRole="header" className="font-pp-display-semibold text-xl leading-snug text-pp-ink">
              {a.title}
            </Text>
            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
              <Text className="font-pp text-[12px] text-pp-muted">{t("fromSender", { name: a.senderName })}</Text>
              <Text className="font-pp text-[12px] text-pp-muted">·</Text>
              <View className="flex-row items-center gap-1">
                <Clock3 size={12} color={pp.muted} strokeWidth={2} />
                <Text className="font-pp text-[12px] text-pp-muted">{a.time}</Text>
              </View>
            </View>
            <View className="border-t border-pp-line" />
            <Text selectable className="font-pp text-[13.5px] leading-relaxed text-pp-ink">
              {a.msg}
            </Text>
            {(a.child || a.cls || a.attachment) && (
              <View className="flex-row flex-wrap gap-x-3 gap-y-1 border-t border-pp-line pt-2">
                {a.child ? (
                  <View className="flex-row items-center gap-1">
                    <UserRound size={12} color={pp.muted} strokeWidth={2} />
                    <Text className="font-pp text-[11.5px] text-pp-muted">{t("forChild", { name: a.child })}</Text>
                  </View>
                ) : null}
                {a.cls ? <Text className="font-pp text-[11.5px] text-pp-muted">{a.cls}</Text> : null}
                {a.attachment ? (
                  <View className="flex-row items-center gap-1">
                    <Paperclip size={12} color={pp.blue} strokeWidth={2} />
                    <Text className="font-pp text-[11.5px] text-pp-blue">{t("oneAttachment")}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
