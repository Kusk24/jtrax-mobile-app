import { Text, View } from "react-native";

/** Initial-letter avatar. `colorClass` carries both bg- and text- utilities
    (copied from web data); RN has no inheritance, so they get split here. */
export function Avatar({
  name,
  colorClass,
  sizeClass = "size-12",
  textClass = "text-lg",
  badge = false,
}: {
  name: string;
  colorClass: string;
  sizeClass?: string;
  textClass?: string;
  badge?: boolean;
}) {
  const parts = colorClass.split(" ");
  const bg = parts.filter((p) => p.startsWith("bg-")).join(" ");
  const fg = parts.filter((p) => p.startsWith("text-")).join(" ");
  return (
    <View className={`relative ${sizeClass}`}>
      <View
        className={`size-full items-center justify-center rounded-full border-2 border-card ${bg}`}
      >
        <Text className={`font-sans-bold ${textClass} ${fg}`}>
          {name.charAt(0)}
        </Text>
      </View>
      {badge && (
        <View className="absolute -right-0.5 -top-0.5 size-4 items-center justify-center rounded-full border-2 border-cream bg-brick">
          <Text className="font-sans-bold text-[9px] text-white">!</Text>
        </View>
      )}
    </View>
  );
}
