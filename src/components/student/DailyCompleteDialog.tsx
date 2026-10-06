/**
 * The day's set finished: said once, with the way home and the way on to
 * more practice — the web's DailyCompleteDialog.
 */
import { Modal, Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { BadgeCheck } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { PrimaryPill, SecondaryPill } from "@/components/student/kit";

export function DailyCompleteDialog({ onHome, onMore }: { onHome: () => void; onMore: () => void }) {
  const t = useTranslations("st");
  const { pp } = usePalette();
  return (
    <Modal transparent animationType="fade" onRequestClose={onHome}>
      <Pressable onPress={onHome} className="flex-1 items-center justify-center bg-[rgba(20,33,58,0.45)] px-6">
        {/* A press on the card itself must not close it. */}
        <Pressable
          onPress={() => {}}
          accessibilityViewIsModal
          className="w-full max-w-[360px] items-center rounded-2xl bg-pp-card p-6"
        >
          <View className="size-20 items-center justify-center rounded-full border-8 border-pp-green-soft/50 bg-pp-green-soft">
            <BadgeCheck size={40} color={pp.green} strokeWidth={1.8} />
          </View>
          <Text accessibilityRole="header" className="mt-4 text-center font-pp-display-bold text-[22px] text-pp-ink">
            {t("challengeDone")}
          </Text>
          <Text className="mt-1 text-center font-pp text-[14px] text-pp-muted">{t("challengeDoneDialog")}</Text>
          <PrimaryPill label={t("backToHome")} onPress={onHome} className="mt-5 w-full" />
          <SecondaryPill label={t("keepPractising")} onPress={onMore} className="mt-2 w-full" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
