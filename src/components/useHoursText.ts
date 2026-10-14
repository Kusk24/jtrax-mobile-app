/* Hours attended (credits used) as "9 h 15 min", or "9 h" on the hour — the
   web portal's useHoursText. */
import { useTranslations } from "use-intl";
import { splitHours } from "@/lib/hours";

export function useHoursText(): (h: number) => string {
  const t = useTranslations("common");
  return (h: number) => {
    const { hours, minutes } = splitHours(h);
    return minutes === 0 ? t("hoursText", { hours }) : t("hoursMinutesText", { hours, minutes });
  };
}
