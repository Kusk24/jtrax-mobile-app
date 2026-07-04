import Svg, { Path } from "react-native-svg";

/** Same pawn shape as the web/admin apps. */
export function PawnIcon({
  size = 24,
  color,
}: {
  size?: number;
  color: string;
}) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <Path d="M12 3a3.2 3.2 0 0 0-1.7 5.9c-.3 1.9-1 3.3-2 4.3h7.4c-1-1-1.7-2.4-2-4.3A3.2 3.2 0 0 0 12 3Z" />
      <Path d="M7.5 14.8h9c.4 1.5 1.2 2.7 2.4 3.7.5.4.2 1.5-.5 1.5H5.6c-.7 0-1-1.1-.5-1.5 1.2-1 2-2.2 2.4-3.7Z" />
    </Svg>
  );
}
