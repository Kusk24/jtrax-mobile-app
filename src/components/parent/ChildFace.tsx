/**
 * A child's face, or an honest stand-in.
 *
 * The phone bundles no photographs, so this is always the monogram branch of
 * the portal's component: a child's initial on their tint, which reads as a
 * person rather than as a broken image.
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

function Initial({ name, textClass }: { name: string; textClass: string }) {
  return (
    <Text className={`font-pp-extrabold text-navy-deep ${textClass}`}>
      {(name.trim()[0] ?? "?").toUpperCase()}
    </Text>
  );
}
