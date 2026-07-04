import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Check, Hourglass, TriangleAlert } from "lucide-react-native";
import { C } from "@/lib/colors";
import type { NotificationItem } from "@/lib/types";

const kindStyles = {
  alert: { icon: TriangleAlert, box: "bg-peach", color: C.peachInk },
  success: { icon: Check, box: "bg-olive", color: C.white },
  expiry: { icon: Hourglass, box: "bg-brick-soft", color: C.brick },
} as const;

export function NotificationsPanel({ items }: { items: NotificationItem[] }) {
  const t = useTranslations("notifications");
  const [filter, setFilter] = useState<"all" | "unread">("unread");
  const visible = items.filter((n) => filter === "all" || n.unread);

  return (
    <>
      <View className="flex-row items-center justify-between">
        <Text className="font-sans-extrabold text-lg text-ink">
          {t("title")}
        </Text>
        <View className="flex-row gap-2">
          {(["all", "unread"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`rounded-full px-5 py-1 ${
                filter === f ? "bg-navy" : "border-2 border-line bg-card"
              }`}
            >
              <Text
                className={`font-sans-semibold text-xs ${
                  filter === f ? "text-white" : "text-muted"
                }`}
              >
                {t(f)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="overflow-hidden rounded-card">
        {visible.map((n, i) => {
          const { icon: Icon, box, color } = kindStyles[n.kind];
          return (
            <View
              key={n.id}
              className={`flex-row gap-4 bg-card/70 px-4 py-5 ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <View
                className={`size-12 items-center justify-center rounded-xl ${box}`}
              >
                <Icon size={24} color={color} strokeWidth={2.5} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-bold text-base text-ink">
                  {n.title}
                </Text>
                <Text className="mt-0.5 font-sans text-xs leading-5 text-muted">
                  {n.body}
                </Text>
              </View>
            </View>
          );
        })}
        {visible.length === 0 && (
          <View className="bg-card/70 px-4 py-10">
            <Text className="text-center font-sans text-sm text-muted">
              {t("empty")}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
