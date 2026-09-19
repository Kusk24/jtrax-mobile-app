/* The tournament banner, rebuilt for native.
 *
 * The portal paints its gradient and chessboard field in CSS; neither exists
 * in React Native, so both are drawn in SVG — which ships already, so this
 * costs no new native module. Same three colours, same board, same lockup. */
import { Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Trophy } from "lucide-react-native";

/** 44px squares, as the portal's repeating-conic-gradient makes. */
const SQUARE = 22;

export function TournamentBanner({ height, rounded = 0 }: { height: number; rounded?: number }) {
  return (
    <View
      style={{ height, borderRadius: rounded }}
      className="w-full items-center justify-center overflow-hidden bg-pp-deep"
    >
      <View style={{ position: "absolute", inset: 0 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="tb" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#234a9f" />
              <Stop offset="0.55" stopColor="#1e3f87" />
              <Stop offset="1" stopColor="#162f5c" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#tb)" />
          {/* The faint board. Drawn as one row of light squares repeated down
              the banner — cheaper than a pattern fill and identical on screen. */}
          {Array.from({ length: Math.ceil(height / SQUARE) }, (_, r) =>
            Array.from({ length: 24 }, (_, c) =>
              (r + c) % 2 === 0 ? (
                <Rect
                  key={`${r}-${c}`}
                  x={c * SQUARE}
                  y={r * SQUARE}
                  width={SQUARE}
                  height={SQUARE}
                  fill="#ffffff"
                  opacity={0.08}
                />
              ) : null,
            ),
          )}
        </Svg>
      </View>
      <View className="items-center gap-1.5">
        <Trophy size={28} color="#ffffff" strokeWidth={1.6} opacity={0.9} />
        <Text className="font-display-semibold text-[15px] uppercase tracking-[3.3px] text-white">
          Chess Championship
        </Text>
        <View className="rounded-full border border-white/40 px-3 py-0.5">
          <Text className="font-sans-bold text-[10.5px] tracking-[3px] text-white">2026</Text>
        </View>
      </View>
    </View>
  );
}
