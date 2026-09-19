/* Every announcement the academy has posted, newest first. Tapping one opens
   the full text and marks it read. */
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { GraduationCap, Paperclip, UserRound } from "lucide-react-native";
import { useParentData } from "@/components/parent/ParentData";
import { AnnouncementModal, SENDER_STYLE } from "@/components/parent/AnnouncementModal";
import { BackHeader } from "@/components/parent/BackHeader";
import { PP } from "@/lib/colors";

export default function ParentAnnouncements() {
  const t = useTranslations("pv2");
  const { announcements, isAnnRead, markAnnRead } = useParentData();
  const [modalId, setModalId] = useState<string | null>(null);
  const modal = announcements.find((a) => a.id === modalId);

  return (
    <ScrollView
      className="flex-1 bg-pp-bg"
      contentContainerClassName="gap-4 px-4 pb-10 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <BackHeader title={t("announcements")} />

      {announcements.length === 0 && (
        <View className="rounded-card border-[1.5px] border-dashed border-pp-dash p-6">
          <Text className="text-center font-sans text-[12.5px] text-pp-muted">
            {t("noAnnouncements")}
          </Text>
        </View>
      )}

      <View className="gap-3">
        {announcements.map((a) => {
          const ss = SENDER_STYLE[a.sender];
          const isUnread = !isAnnRead(a.id);
          return (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              onPress={() => {
                markAnnRead(a.id);
                setModalId(a.id);
              }}
              style={{
                backgroundColor: isUnread ? PP.mist : PP.card,
                borderColor: isUnread ? PP.soft : PP.line,
              }}
              className="gap-2 rounded-card border-[1.5px] p-4"
            >
              <View className="flex-row items-center justify-between gap-2">
                <Text className="min-w-0 flex-1 font-sans-bold text-[14.5px] text-pp-ink">
                  {a.title}
                </Text>
                {isUnread && (
                  <View className="rounded-full bg-pp-blue px-2 py-0.5">
                    <Text className="font-sans-bold text-[9px] uppercase text-white">
                      {t("new")}
                    </Text>
                  </View>
                )}
              </View>
              <Text numberOfLines={2} className="font-sans text-[12.5px] leading-relaxed text-pp-muted">
                {a.msg}
              </Text>
              <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
                {!!a.child && (
                  <View className="flex-row items-center gap-1">
                    <UserRound size={12} color={PP.faint} strokeWidth={2} />
                    <Text className="font-sans text-[10.5px] text-pp-faint">{a.child}</Text>
                  </View>
                )}
                {!!a.cls && (
                  <View className="flex-row items-center gap-1">
                    <GraduationCap size={12} color={PP.faint} strokeWidth={2} />
                    <Text className="font-sans text-[10.5px] text-pp-faint">{a.cls}</Text>
                  </View>
                )}
                {a.attachment && (
                  <View className="flex-row items-center gap-1">
                    <Paperclip size={12} color={PP.faint} strokeWidth={2} />
                    <Text className="font-sans text-[10.5px] text-pp-faint">
                      {t("attachmentWord")}
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-row items-center justify-between gap-2">
                <Text className="font-sans text-[10.5px] text-pp-faint">{a.time}</Text>
                <View style={{ backgroundColor: ss.bg }} className="rounded-full px-2 py-0.5">
                  <Text
                    style={{ color: ss.c }}
                    className="font-sans-bold text-[9px] uppercase"
                  >
                    {t(ss.labelKey)}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {modal && <AnnouncementModal a={modal} onClose={() => setModalId(null)} />}
    </ScrollView>
  );
}
