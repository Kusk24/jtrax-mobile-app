import { Linking, Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  BookMarked,
  ChartColumn,
  CircleDollarSign,
  ClipboardList,
  IdCard,
  Languages,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { branches, monthlyOverview, teacher } from "@/lib/teacher-data";
import { C } from "@/lib/colors";

const card = "rounded-card border-2 border-line bg-card p-4 shadow-clay";

const overviewTiles = [
  {
    icon: ClipboardList,
    value: `${monthlyOverview.sessions}`,
    labelKey: "sessions",
    frame: "border-navy/50",
    color: C.navy,
  },
  {
    icon: Users,
    value: `${monthlyOverview.students}`,
    labelKey: "students",
    frame: "border-olive/60",
    color: C.olive,
  },
  {
    icon: ChartColumn,
    value: `${monthlyOverview.attendancePct}%`,
    labelKey: "attendanceRate",
    frame: "border-teal-500/40",
    color: "#0d9488",
  },
  {
    icon: CircleDollarSign,
    value: `${monthlyOverview.creditsConsumed}`,
    labelKey: "creditConsumed",
    frame: "border-amber-400/60",
    color: "#f59e0b",
  },
] as const;

export default function TeacherProfileScreen() {
  const t = useTranslations();
  return (
    <Screen gapClass="gap-5">
      <Text className="text-center font-sans-extrabold text-2xl text-navy">
        {t("profile.myProfile")}
      </Text>

      <View className={`${card} flex-row items-center gap-4`}>
        <Avatar
          name={teacher.name}
          colorClass={teacher.avatarColor}
          sizeClass="size-14"
        />
        <View>
          <Text className="font-sans-bold text-base text-ink">
            {t("profile.msName", { name: teacher.name })}
          </Text>
          <Text className="font-sans text-xs text-muted">
            {t("common.idLabel", { id: teacher.teacherId })}
          </Text>
          <Text className="font-sans text-xs text-muted">
            {t("profile.teacherLine", { years: teacher.experienceYears })}
          </Text>
        </View>
      </View>

      <View>
        <Text className="font-sans-extrabold text-base text-ink">
          {t("profile.monthlyOverview")}
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-3">
          {overviewTiles.map(({ icon: Icon, value, labelKey, frame, color }) => (
            <View
              key={labelKey}
              className={`w-[47%] flex-row items-center gap-3 rounded-card border-2 bg-card p-4 shadow-clay ${frame}`}
            >
              <Icon size={24} color={color} />
              <View className="shrink">
                <Text className="font-sans-extrabold text-base text-ink">
                  {value}
                </Text>
                <Text className="font-sans text-[11px] leading-4 text-muted">
                  {t(`profile.${labelKey}`)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center gap-2">
          <BookMarked size={16} color={C.navy} />
          <Text className="font-sans-bold text-base text-navy">
            {t("profile.assignedBranches")}
          </Text>
        </View>
        <View className="mt-3 gap-3">
          {branches.map((branch) => (
            <View key={branch.name} className="flex-row items-center gap-2">
              <Text className="min-w-0 flex-1 font-sans text-sm text-ink">
                {branch.name}
              </Text>
              <Pressable
                onPress={() => Linking.openURL(`tel:${branch.phone}`)}
                className="rounded-full p-2"
              >
                <Phone size={16} color={C.navy} fill={C.navy} />
              </Pressable>
              <View className="rounded-full p-2">
                <MapPin size={16} color={C.brick} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center gap-2">
          <IdCard size={16} color={C.navy} />
          <Text className="font-sans-bold text-base text-navy">
            {t("profile.contactInfo")}
          </Text>
        </View>
        <View className="mt-3 gap-3">
          <View className="flex-row items-center gap-3">
            <View className="size-9 items-center justify-center rounded-lg bg-olive-soft">
              <Phone size={16} color={C.olive} />
            </View>
            <View>
              <Text className="font-sans text-[11px] text-muted">
                {t("profile.phone")}
              </Text>
              <Text className="font-sans text-sm text-ink">
                {teacher.phone}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="size-9 items-center justify-center rounded-lg bg-navy-soft">
              <Mail size={16} color={C.navy} />
            </View>
            <View>
              <Text className="font-sans text-[11px] text-muted">
                {t("profile.email")}
              </Text>
              <Text className="font-sans text-sm text-ink">
                {teacher.email}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Languages size={16} color={C.navy} />
            <Text className="font-sans-bold text-base text-navy">
              {t("common.language")}
            </Text>
          </View>
          <LanguageToggle />
        </View>
      </View>
    </Screen>
  );
}
