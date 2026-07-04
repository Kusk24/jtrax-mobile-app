import { ScrollView } from "react-native";

/** Scrollable page body matching the web portal main column
    (px-4 pt-6 pb-28 + section gap). */
export function Screen({
  children,
  gapClass = "gap-6",
}: {
  children: React.ReactNode;
  gapClass?: string;
}) {
  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerClassName={`px-4 pb-32 pt-6 ${gapClass}`}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
