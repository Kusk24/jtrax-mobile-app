/* One announcement as a notice — the web's AnnouncementCard: white, a single
   blue edge, a megaphone and the word "Announcement" beside the date, the
   title, two lines of the message, and who it is from. The same card on the
   home and on the Announcements page — no colour per sender, so it reads as
   the academy speaking rather than a chat bubble. */
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { GraduationCap, Megaphone, Paperclip, UserRound } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import type { AnnouncementV2 } from "@/lib/parent-v2-data";

export function AnnouncementCard({
  a,
  unread,
  onOpen,
  className = "",
  style,
  details = false,
}: {
  a: AnnouncementV2;
  unread: boolean;
  onOpen: () => void;
  className?: string;
  /** A fixed width, for the home's paged row. */
  style?: { width: number };
  /** The child, class and attachment line — the full list shows it. */
  details?: boolean;
}) {
  const t = useTranslations("pv2");
  const { pp } = usePalette();
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      style={style}
      className={`gap-2 rounded-xl border border-l-[3px] border-pp-line border-l-pp-blue bg-pp-card px-4 py-3.5 active:bg-pp-mist ${className}`}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-1.5">
          <Megaphone size={14} color={pp.blue} strokeWidth={2} />
          <Text className="font-pp-bold text-[10px] uppercase tracking-[1.4px] text-pp-blue">
            {t("announcementLabel")}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {unread && (
            <View className="rounded-full bg-pp-blue px-1.5 py-px">
              <Text className="font-pp-bold text-[9px] uppercase tracking-[0.6px] text-white">{t("new")}</Text>
            </View>
          )}
          <Text className="font-pp text-[11px] text-pp-muted">{a.time}</Text>
        </View>
      </View>
      <Text className="font-pp-bold text-[14.5px] leading-snug text-pp-ink">{a.title}</Text>
      <Text numberOfLines={2} className="font-pp text-[12.5px] leading-relaxed text-pp-sub">
        {a.msg}
      </Text>
      {details && (a.child || a.cls || a.attachment) ? (
        <View className="flex-row flex-wrap gap-x-3 gap-y-1">
          {a.child ? (
            <View className="flex-row items-center gap-1">
              <UserRound size={12} color={pp.muted} strokeWidth={2} />
              <Text className="font-pp text-[11px] text-pp-muted">{a.child}</Text>
            </View>
          ) : null}
          {a.cls ? (
            <View className="flex-row items-center gap-1">
              <GraduationCap size={12} color={pp.muted} strokeWidth={2} />
              <Text className="font-pp text-[11px] text-pp-muted">{a.cls}</Text>
            </View>
          ) : null}
          {a.attachment ? (
            <View className="flex-row items-center gap-1">
              <Paperclip size={12} color={pp.muted} strokeWidth={2} />
              <Text className="font-pp text-[11px] text-pp-muted">{t("attachmentWord")}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <Text className="border-t border-pp-line pt-2 font-pp text-[11.5px] text-pp-muted">
        {t("fromSender", { name: a.senderName })}
      </Text>
    </Pressable>
  );
}
