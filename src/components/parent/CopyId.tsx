/* An id with a small copy button — the child's Student ID on their profile,
   which a parent types into the public tournament form for the student price.
   The web's CopyId, on the phone's clipboard. */
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTranslations } from "use-intl";
import { Check, Copy } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";

export function CopyId({ id }: { id: string }) {
  const t = useTranslations("pv2");
  const { pp } = usePalette();
  const [copied, setCopied] = useState(false);
  return (
    <View className="flex-row items-center gap-1.5">
      <Text selectable className="font-pp-semibold text-xs text-pp-ink">{id}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("copyStudentId")}
        hitSlop={10}
        onPress={() => {
          Clipboard.setStringAsync(id)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
            .catch(() => {});
        }}
        className="size-6 items-center justify-center rounded-md active:bg-pp-soft"
      >
        {copied ? <Check size={14} color={pp.green} /> : <Copy size={14} color={pp.muted} />}
      </Pressable>
    </View>
  );
}
