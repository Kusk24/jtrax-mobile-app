import { Linking, Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Info,
  Languages,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Avatar } from "@/components/Avatar";
import { CreditBar } from "@/components/CreditBar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { PawnIcon } from "@/components/PawnIcon";
import {
  classStats,
  enrolledClasses,
  parentContacts,
  student,
} from "@/lib/student-data";
import { C } from "@/lib/colors";

const card = "rounded-card border-2 border-line bg-card p-4 shadow-clay";

export default function StudentProfileScreen() {
  const t = useTranslations();
  const low = student.lowCredits;
  return (
    <Screen gapClass="gap-5">
      <Text className="text-center font-sans-extrabold text-2xl text-navy">
        {t("profile.myProfile")}
      </Text>

      <View className={card}>
        <View className="flex-row items-center gap-4">
          <Avatar
            name={student.name}
            colorClass={student.avatarColor}
            sizeClass="size-14"
          />
          <View>
            <Text className="font-sans-bold text-base text-ink">
              {student.name}
            </Text>
            <Text className="font-sans text-xs text-muted">
              {t("common.idLabel", { id: student.studentId })}
            </Text>
            <Text className="font-sans text-xs text-muted">
              {t("profile.levelAge", { level: student.level, age: student.age })}
            </Text>
          </View>
        </View>
        <View
          className={`mt-4 rounded-xl p-4 ${low ? "bg-brick-soft/70" : "bg-olive-soft/70"}`}
        >
          <View className="flex-row items-baseline justify-between">
            <Text
              className={`font-sans-bold text-base ${low ? "text-brick" : "text-ink"}`}
            >
              {t("profile.remainingCredits")}
            </Text>
            <Text
              className={`font-sans-extrabold text-lg ${low ? "text-brick" : "text-ink"}`}
            >
              {student.credits.remaining}
              <Text className="font-sans-semibold text-xs text-muted">
                /{student.credits.total}
              </Text>
            </Text>
          </View>
          <View className="mt-2">
            <CreditBar
              remaining={student.credits.remaining}
              total={student.credits.total}
              low={low}
              trackClass="bg-white/70"
            />
          </View>
          <Text className="mt-1.5 font-sans text-[11px] text-muted">
            {t("common.validUntil", { date: student.credits.validUntil })}
          </Text>
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center gap-2">
          <Users size={20} color={C.navy} />
          <Text className="font-sans-extrabold text-base text-ink">
            {t("profile.parentsContact")}
          </Text>
        </View>
        <View className="mt-4 gap-4">
          {parentContacts.map((contact) => (
            <View key={contact.name} className="flex-row items-center gap-3">
              <Avatar
                name={contact.name}
                colorClass={contact.avatarColor}
                sizeClass="size-11"
              />
              <View className="min-w-0 flex-1">
                <Text className="font-sans-bold text-sm text-navy">
                  {contact.name}
                </Text>
                <Text className="font-sans text-xs text-muted">
                  {contact.relation}
                </Text>
              </View>
              <Pressable
                onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                className="rounded-full p-2"
              >
                <Phone size={20} color={C.navy} />
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL(`mailto:${contact.email}`)}
                className="rounded-full p-2"
              >
                <Mail size={20} color={C.navy} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center gap-2">
          <GraduationCap size={20} color={C.navy} />
          <Text className="font-sans-extrabold text-base text-ink">
            {t("profile.enrolledClasses")}
          </Text>
        </View>
        {enrolledClasses.map((session) => (
          <View key={session.id} className="mt-4 flex-row items-center gap-4">
            <View className="size-16 items-center justify-center rounded-xl bg-olive-soft">
              <PawnIcon size={32} color={C.olive} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-sans-bold text-base text-ink">
                {session.course} ({session.section})
              </Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <CalendarDays size={14} color={C.navy} />
                <Text className="font-sans text-xs text-ink">
                  {session.day} {session.time}
                </Text>
              </View>
              <View className="mt-0.5 flex-row items-center gap-1.5">
                <MapPin size={14} color={C.navy} />
                <Text className="font-sans text-xs text-ink">
                  {session.location}
                </Text>
              </View>
            </View>
          </View>
        ))}
        <View className="mt-4 flex-row rounded-xl bg-navy-soft/50 py-3">
          <View className="flex-1 flex-row items-center justify-center gap-2 border-r border-navy/20 px-3">
            <CalendarCheck size={20} color={C.navy} />
            <View>
              <Text className="font-sans-bold text-xs text-ink">
                {classStats.attended}/{student.credits.total}
              </Text>
              <Text className="font-sans text-xs text-muted">
                {t("profile.classesAttended")}
              </Text>
            </View>
          </View>
          <View className="flex-1 flex-row items-center justify-center gap-2 px-3">
            <ClipboardList size={20} color={C.navy} />
            <View>
              <Text className="font-sans-bold text-xs text-ink">
                {classStats.remaining}
              </Text>
              <Text className="font-sans text-xs text-muted">
                {t("profile.classesRemaining")}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center gap-2">
          <Info size={20} color={C.navy} />
          <Text className="font-sans-extrabold text-base text-ink">
            {t("profile.more")}
          </Text>
        </View>
        <View className="mt-2">
          <View className="flex-row items-center gap-3 px-1 py-2.5">
            <Languages size={16} color={C.navy} />
            <Text className="font-sans text-sm text-ink">
              {t("common.language")}
            </Text>
            <View className="ml-auto">
              <LanguageToggle />
            </View>
          </View>
          <Pressable className="flex-row items-center gap-3 rounded-lg px-1 py-2.5 active:bg-cream">
            <Phone size={16} color={C.navy} />
            <Text className="font-sans text-sm text-ink">
              {t("profile.contactSchool")}
            </Text>
            <ChevronRight
              size={16}
              color={C.muted}
              style={{ marginLeft: "auto" }}
            />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
