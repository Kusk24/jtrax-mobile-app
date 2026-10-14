/* The ways a notification type reaches a parent besides the bell — email, the
 * phone app, a browser — each one a small switch under the type's own. Only
 * receipts and announcements leave the app, so only their rows have these; the
 * server says which (channelsByType). The phone port of the web portal's
 * component of the same name. */
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Check, Minus } from "lucide-react-native";
import { useParentData } from "@/components/parent/ParentData";
import { usePalette } from "@/components/ThemeProvider";
import type { NotifType } from "@/lib/parent-v2-data";
import { channelOn, outsideChannels, type OutsideChannel } from "@/lib/notification-channels";

const LABEL_KEY: Record<OutsideChannel, string> = {
  email: "notifByEmail",
  mobile: "notifByPhone",
  webpush: "notifByBrowser",
};

export function NotifChannelSwitches({
  type, typeLabel, onError,
}: {
  type: NotifType;
  /** The type's own label, so each switch says which type it belongs to. */
  typeLabel: string;
  onError: () => void;
}) {
  const t = useTranslations("pv2");
  const { pp } = usePalette();
  const { channelsByType, channelPrefs, saveChannelPref } = useParentData();
  const channels = outsideChannels(channelsByType, type);
  if (channels.length === 0) return null;
  return (
    <View className="flex-row flex-wrap items-center gap-2 px-4 pb-3.5">
      <Text className="font-pp text-[12px] text-pp-muted">{t("notifAlsoBy")}</Text>
      {channels.map((ch) => {
        const on = channelOn(channelPrefs, type, ch);
        const name = t(LABEL_KEY[ch]);
        const tint = on ? pp.greenDot : pp.muted;
        return (
          <Pressable
            key={ch}
            onPress={() => saveChannelPref(type, ch, !on).catch(onError)}
            accessibilityRole="switch"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${typeLabel}: ${name}`}
            style={{ borderColor: on ? pp.greenDot : pp.line }}
            className="min-h-[32px] flex-row items-center gap-1 rounded-full border-[1.5px] px-3"
          >
            {on ? <Check size={14} color={tint} /> : <Minus size={14} color={tint} />}
            <Text style={{ color: tint }} className="font-pp-bold text-[12.5px]">{name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
