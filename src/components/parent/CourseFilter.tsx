/**
 * Pick one course to look at, with the credits the shown rows used beside the
 * picker — the web's CourseFilter. A child in three courses sees each on its
 * own. The helpers behind it are in lib/course-filter.ts.
 */
import { Text } from "react-native";
import { useTranslations } from "use-intl";
import { Filter } from "lucide-react-native";
import { FilterPicker } from "@/components/parent/FilterPicker";

export function CourseFilter({
  courses,
  value,
  onChange,
}: {
  courses: string[];
  /** "" for every course. */
  value: string;
  onChange: (course: string) => void;
}) {
  const t = useTranslations("pv2");
  return (
    <FilterPicker
      icon={Filter}
      label={t("filterCourse")}
      options={[{ k: "", label: t("allCourses") }, ...courses.map((c) => ({ k: c, label: c }))]}
      value={value}
      onChange={onChange}
    />
  );
}

/** "12 credits used" — what the filtered rows cost, all time. */
export function CreditsUsed({ used }: { used: number }) {
  const t = useTranslations("pv2");
  return (
    <Text numberOfLines={1} className="font-pp text-[12px] text-pp-muted">
      <Text className="font-pp-bold text-pp-ink">{used}</Text> {t("creditsUsedSuffix")}
    </Text>
  );
}
