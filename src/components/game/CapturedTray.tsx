/* The pieces one side has taken, shown beside that player's name.
 *
 * Two things a beginner cannot easily see from the board alone: what has come
 * off, and whether they are ahead. The web portal's tray, drawn with the same
 * piece artwork the phone's board uses.
 *
 * The tray keeps its height whether or not anything has been captured, so the
 * board does not jump down the screen on the first exchange.
 */
import { Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { pieceArt } from "@/lib/piece-art";

export function CapturedTray({
  side,
  pieces,
  advantage,
}: {
  /** The side whose tray this is — it shows the pieces they have taken. */
  side: "w" | "b";
  pieces: string[];
  advantage: number;
}) {
  /* A white tray holds captured black pieces, and vice versa. */
  const colour = side === "w" ? "b" : "w";
  const lead = side === "w" ? advantage : -advantage;

  return (
    <View className="min-h-[19px] flex-row items-center">
      {pieces.map((type, i) => (
        <View
          key={`${type}${i}`}
          /* Runs of the same piece tuck together, so eight pawns still fit
             beside a name without shrinking them. */
          style={{ marginLeft: i > 0 && pieces[i - 1] === type ? -4 : i > 0 ? 1 : 0 }}
        >
          <SvgXml xml={pieceArt(colour, type)} width={17} height={17} />
        </View>
      ))}
      {lead > 0 && <Text className="ml-1 font-sans-bold text-[11.5px] text-muted">+{lead}</Text>}
    </View>
  );
}
