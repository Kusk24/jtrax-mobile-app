/**
 * "Play with a friend": a white pawn and a black pawn side by side, the black
 * one leaning towards the white — two players, one game. Drawn with the
 * board's own piece art, as the web's FriendPawns is. Decorative.
 */
import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import { pieceArt } from "@/lib/piece-art";

export function FriendPawns({ size = 24 }: { size?: number }) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" className="flex-row items-end">
      <SvgXml xml={pieceArt("w", "p")} width={size} height={size} />
      <View style={{ marginLeft: -size / 3, transform: [{ rotate: "-14deg" }] }}>
        <SvgXml xml={pieceArt("b", "p")} width={size} height={size} />
      </View>
    </View>
  );
}
