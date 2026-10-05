/* The challenge tab: its body is ChallengePanel, so the Games tab can show
   the same panel. */
import { useTranslations } from "use-intl";
import { PlayShell } from "@/components/game/PlayShell";
import { ChallengePanel } from "@/components/student/ChallengePanel";
import { useSession } from "@/lib/session";

export default function ChallengeScreen() {
  const t = useTranslations("challenge");
  const { user } = useSession();
  return (
    <PlayShell title={t("title")} nav>
      <ChallengePanel myStudentId={user?.studentId ?? ""} />
    </PlayShell>
  );
}
