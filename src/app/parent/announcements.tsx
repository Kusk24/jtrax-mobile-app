/* Every announcement the academy has posted, newest first — the web's page:
   the same notice card as the home, with the child, class and attachment
   line. Tapping one opens the full text and marks it read. */
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { useParentData } from "@/components/parent/ParentData";
import { AnnouncementCard } from "@/components/parent/AnnouncementCard";
import { AnnouncementModal } from "@/components/parent/AnnouncementModal";
import { BackHeader } from "@/components/parent/BackHeader";

export default function ParentAnnouncements() {
  const t = useTranslations("pv2");
  const { announcements, isAnnRead, markAnnRead } = useParentData();
  const [modalId, setModalId] = useState<string | null>(null);
  const modal = announcements.find((a) => a.id === modalId);

  return (
    <ScrollView className="flex-1 bg-pp-bg" contentContainerClassName="gap-4 px-4 pb-10 pt-4" showsVerticalScrollIndicator={false}>
      <BackHeader title={t("announcements")} />

      {announcements.length === 0 && (
        <View className="rounded-card border-[1.5px] border-dashed border-pp-dash p-6">
          <Text className="text-center font-pp text-[12.5px] text-pp-muted">{t("noAnnouncements")}</Text>
        </View>
      )}

      <View className="gap-3">
        {announcements.map((a) => (
          <AnnouncementCard
            key={a.id}
            a={a}
            unread={!isAnnRead(a.id)}
            onOpen={() => {
              markAnnRead(a.id);
              setModalId(a.id);
            }}
            details
          />
        ))}
      </View>

      {modal && <AnnouncementModal a={modal} onClose={() => setModalId(null)} />}
    </ScrollView>
  );
}
