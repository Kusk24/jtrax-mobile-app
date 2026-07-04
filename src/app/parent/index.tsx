import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { TriangleAlert } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { ParentHeader } from "@/components/ParentHeader";
import { Avatar } from "@/components/Avatar";
import { ClassCard } from "@/components/ClassCard";
import { children, getChild, upcomingClasses } from "@/lib/parent-data";
import { C } from "@/lib/colors";

export default function ParentHome() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const lowCreditChild = children.find((c) => c.lowCredits);
  return (
    <Screen>
      <ParentHeader />

      {lowCreditChild && (
        <View className="flex-row items-center gap-4 rounded-card bg-peach px-5 py-4">
          <TriangleAlert size={28} color={C.peach} fill={C.peachInk} />
          <View className="min-w-0 flex-1">
            <Text className="font-sans-bold text-base text-ink">
              {t("lowCreditsTitleChild", { name: lowCreditChild.name })}
            </Text>
            <Text className="font-sans text-xs text-muted">
              {t("lowCreditsBody")}
            </Text>
          </View>
        </View>
      )}

      <View>
        <Text className="font-sans-extrabold text-lg text-ink">
          {t("myChildren")}
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-6">
          {children.map((child) => (
            <Link key={child.id} href={`/parent/profile/${child.id}` as never} asChild>
              <Pressable className="items-center gap-1">
                <Avatar
                  name={child.name}
                  colorClass={child.avatarColor}
                  sizeClass="size-14"
                  badge={child.lowCredits}
                />
                <Text
                  className={`font-sans-bold text-sm ${
                    child.lowCredits ? "text-brick" : "text-ink"
                  }`}
                >
                  {child.name}
                </Text>
                <Text className="font-sans text-[10px] text-muted">
                  {tc("idLabel", { id: child.studentId })}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>

      <View>
        <Text className="font-sans-extrabold text-lg text-ink">
          {t("upcomingClasses")}
        </Text>
        <View className="mt-3 gap-4">
          {upcomingClasses.map((session) => {
            const child = getChild(session.childId);
            if (!child) return null;
            return <ClassCard key={session.id} session={session} child={child} />;
          })}
        </View>
      </View>
    </Screen>
  );
}
