/* One announcement, full text, over the screen it was tapped on.
 *
 * A native Modal rather than the portal's fixed overlay, so the hardware back
 * button closes it — on Android a dialog that swallows Back is a dialog you
 * cannot leave. */
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Clock3, Paperclip, UserRound, X } from "lucide-react-native";
import type { AnnouncementV2, SenderKind } from "@/lib/parent-v2-data";
import { PP } from "@/lib/colors";

export const SENDER_STYLE: Record<SenderKind, { labelKey: string; c: string; bg: string }> = {
  teacher: { labelKey: "senderTeacher", c: PP.blue, bg: PP.soft },
  branch: { labelKey: "senderBranch", c: PP.green, bg: PP.greenSoft },
  admin: { labelKey: "senderAdmin", c: PP.deep, bg: "#efeefa" },
};

export function AnnouncementModal({ a, onClose }: { a: AnnouncementV2; onClose: () => void }) {
  const t = useTranslations("pv2");
  const ss = SENDER_STYLE[a.sender];
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center bg-[rgba(28,25,40,0.5)] p-5"
      >
        {/* Swallows the tap so the card itself never closes the dialog. */}
        <Pressable
          onPress={() => {}}
          className="max-h-[80%] w-full max-w-[420px] rounded-card bg-pp-card p-6"
        >
          <ScrollView contentContainerClassName="gap-3" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center justify-between gap-2.5">
              <Text className="min-w-0 flex-1 font-display-semibold text-xl leading-snug text-pp-ink">
                {a.title}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t("cancel")}
                className="size-[30px] items-center justify-center rounded-[10px] border-[1.5px] border-pp-line bg-pp-card"
              >
                <X size={14} color={PP.ink} />
              </Pressable>
            </View>

            <Text className="font-sans text-[13.5px] leading-relaxed text-pp-sub">{a.msg}</Text>

            <View className="flex-row items-center gap-2 border-t border-pp-line pt-2">
              <View
                style={{ backgroundColor: ss.bg }}
                className="size-8 items-center justify-center rounded-full"
              >
                <UserRound size={15} color={ss.c} strokeWidth={2} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-bold text-[13px] text-pp-ink">{a.senderName}</Text>
                <Text className="font-sans text-[11px] text-pp-muted">
                  {t(ss.labelKey)}
                  {a.cls ? ` · ${a.cls}` : ""}
                </Text>
              </View>
            </View>

            {a.child && (
              <View className="flex-row items-center gap-1.5">
                <UserRound size={13} color={PP.muted} strokeWidth={2} />
                <Text className="font-sans text-xs text-pp-muted">
                  {t("forChild", { name: a.child })}
                </Text>
              </View>
            )}

            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-row items-center gap-1.5">
                <Clock3 size={12} color={PP.faint} strokeWidth={2} />
                <Text className="font-sans text-[11px] text-pp-faint">{a.time}</Text>
              </View>
              {a.attachment && (
                <View className="flex-row items-center gap-1.5">
                  <Paperclip size={12} color={PP.blue} strokeWidth={2} />
                  <Text className="font-sans text-[11px] text-pp-blue">{t("oneAttachment")}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
