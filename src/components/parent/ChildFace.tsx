/**
 * A child's face, or an honest stand-in.
 *
 * The phone bundles no photographs, so this is always the monogram branch of
 * the portal's component: a child's initial on their tint, which reads as a
 * person rather than as a broken image.
 *
 * Two shapes, because the portal uses two: a circle beside a name, and the
 * band across the top of a child card.
 */
import { Text, View } from "react-native";

export function ChildFace({
  name,
  tint,
  size,
  textClass = "text-lg",
}: {
  name: string;
  tint: string;
  /** Circle diameter in px. */
  size: number;
  textClass?: string;
}) {
  return (
    <View
      accessibilityLabel={name}
      style={{ width: size, height: size, backgroundColor: tint, borderRadius: 999 }}
      className="items-center justify-center"
    >
      <Initial name={name} textClass={textClass} />
    </View>
  );
}

/** The card header band: full width, fixed height, square corners — the
    card's own overflow rounds the top two. */
export function ChildBanner({
  name,
  tint,
  height = 104,
}: {
  name: string;
  tint: string;
  height?: number;
}) {
  return (
    <View
      accessibilityLabel={name}
      style={{ height, backgroundColor: tint }}
      className="w-full items-center justify-center"
    >
      <Initial name={name} textClass="text-[44px]" />
    </View>
  );
}

function Initial({ name, textClass }: { name: string; textClass: string }) {
  return (
    <Text className={`font-sans-extrabold text-navy-deep ${textClass}`}>
      {(name.trim()[0] ?? "?").toUpperCase()}
    </Text>
  );
}
