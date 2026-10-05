import { useTranslations } from "use-intl";
import { PlayShell } from "@/components/game/PlayShell";
import { JoinForm } from "@/components/game/JoinForm";

export default function JoinScreen() {
  const t = useTranslations("play");
  return (
    <PlayShell title={t("vsFriend")} back="/student/play">
      <JoinForm />
    </PlayShell>
  );
}
