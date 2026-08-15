import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslations } from "use-intl";
import { Bot, Users } from "lucide-react-native";
import { PlayShell, Panel } from "@/components/game/PlayShell";
import { C } from "@/lib/colors";

export default function PlayIndexScreen() {
  const t = useTranslations("play");
  const modes = [
    { href: "/student/play/ai", Icon: Bot, title: t("vsComputer"), body: t("vsComputerBody") },
    { href: "/student/play/friend", Icon: Users, title: t("vsFriend"), body: t("vsFriendBody") },
  ] as const;

  return (
    <PlayShell title={t("title")}>
      {modes.map(({ href, Icon, title, body }) => (
        <Link key={href} href={href} asChild>
          <Pressable className="active:opacity-80">
            <Panel className="flex-row items-center gap-3.5">
              <View className="size-12 items-center justify-center rounded-xl bg-peach">
                <Icon size={24} color={C.peachInk} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-bold text-base text-ink">{title}</Text>
                <Text className="mt-1 font-sans text-xs leading-5 text-muted">{body}</Text>
              </View>
            </Panel>
          </Pressable>
        </Link>
      ))}
    </PlayShell>
  );
}
