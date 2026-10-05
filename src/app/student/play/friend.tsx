import { useTranslations } from "use-intl";
import { Panel, PlayShell } from "@/components/game/PlayShell";
import { JoinForm } from "@/components/game/JoinForm";

export default function JoinScreen() {
  const t = useTranslations("play");
  return (
    <PlayShell title={t("vsFriend")} back="/student/play">
      {/* On its own screen the form gets the card the Games tab gives it. */}
      <Panel>
        <JoinForm />
      </Panel>
    </PlayShell>
  );
}
