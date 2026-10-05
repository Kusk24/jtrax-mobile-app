/**
 * Games: every way to play, as the web's Games tab has it.
 *
 * The games already under way come first, because somebody may be waiting on
 * this pupil's move. Then the three ways to start one, each a card that opens
 * to what it holds: against the computer (three robots, by level), against
 * another student (the challenge panel), or at a board by its code.
 */
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import { Bot, ChessKing, ChessKnight, ChessPawn, DoorOpen, type LucideIcon } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { PlayShell } from "@/components/game/PlayShell";
import { MyGames } from "@/components/game/MyGames";
import { JoinForm } from "@/components/game/JoinForm";
import { ChallengePanel } from "@/components/student/ChallengePanel";
import { FriendPawns } from "@/components/student/FriendPawns";
import { GameModeCard } from "@/components/student/GameModeCard";
import { useSession } from "@/lib/session";
import type { PPKey } from "@/lib/theme";

/* The three robots, named by level, in the puzzle list's level colours. */
const LEVELS: { key: "novice" | "strong" | "expert"; level: "beginner" | "intermediate" | "advanced"; icon: LucideIcon; tile: string; label: string; ink: PPKey; border: string }[] = [
  { key: "novice", level: "beginner", icon: ChessPawn, tile: "bg-pp-green-soft", label: "text-pp-green", ink: "green", border: "border-pp-green-soft" },
  { key: "strong", level: "intermediate", icon: ChessKnight, tile: "bg-pp-soft", label: "text-pp-blue", ink: "blue", border: "border-pp-soft" },
  { key: "expert", level: "advanced", icon: ChessKing, tile: "bg-pp-amber-soft", label: "text-pp-amber", ink: "amber", border: "border-pp-amber-soft" },
];

export default function GamesScreen() {
  const t3 = useTranslations("sv3");
  const { user } = useSession();
  const { pp } = usePalette();
  /* Which card to open on arrival — Home's tiles name one. */
  const { open } = useLocalSearchParams<{ open?: string }>();

  return (
    <PlayShell title={t3("games")} nav>
      {/* Draws nothing when there are none. */}
      {user?.userAccountId && <MyGames myAccountId={user.userAccountId} />}

      <View className="gap-2">
        <GameModeCard tone="ai" title={t3("playVsAi")} art={<Bot size={24} color={pp.blue} strokeWidth={2} />} open={open === "computer"}>
          <View className="flex-row gap-2">
            {LEVELS.map(({ key, level, icon: Icon, tile, label, ink, border }) => (
              <Pressable
                key={key}
                onPress={() => router.push({ pathname: "/student/play/ai", params: { opponent: key } })}
                accessibilityRole="button"
                className={`min-w-0 flex-1 items-center gap-1.5 rounded-lg border bg-pp-card px-2 py-3 active:opacity-80 ${border}`}
              >
                <View className={`size-10 items-center justify-center rounded-lg ${tile}`}>
                  <Icon size={20} color={pp[ink]} strokeWidth={1.9} />
                </View>
                <Text numberOfLines={1} className={`font-pp-semibold text-[13px] ${label}`}>
                  {t3(`level.${level}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </GameModeCard>

        <GameModeCard tone="friend" title={t3("playWithFriend")} art={<FriendPawns size={26} />} open={open === "challenge"}>
          <ChallengePanel myStudentId={user?.studentId ?? ""} />
        </GameModeCard>

        <GameModeCard tone="room" title={t3("joinRoom")} art={<DoorOpen size={24} color={pp.green} strokeWidth={2} />} open={open === "room"}>
          <JoinForm />
        </GameModeCard>
      </View>
    </PlayShell>
  );
}
