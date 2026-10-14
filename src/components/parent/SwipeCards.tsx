/* Cards one at a time, swiped sideways, with dots to say where you are — the
 * web portal's SwipeCards. One card is shown as it is, with neither. Used for
 * the upcoming tournaments, soonest first, so several do not push the
 * children down the home. */
import { Children, useState, type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useTranslations } from "use-intl";

export function SwipeCards({ children, label, width }: { children: ReactNode; label: string; width: number }) {
  const t = useTranslations("pv2");
  const items = Children.toArray(children);
  const [idx, setIdx] = useState(0);
  if (items.length <= 1) return <>{items}</>;
  const step = width + 12;
  const settle = (x: number) => setIdx(Math.max(0, Math.min(items.length - 1, Math.round(x / step))));
  return (
    <View className="gap-2" accessibilityLabel={label}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 12 }}
        onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.x)}
        onScroll={(e) => settle(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={64}
      >
        {items.map((item, i) => (
          <View key={i} style={{ width }} accessibilityLabel={t("slideOf", { n: i + 1, total: items.length })}>
            {item}
          </View>
        ))}
      </ScrollView>
      <View className="flex-row justify-center gap-1.5">
        {items.map((_, i) => (
          <View key={i} className={`h-1.5 rounded-full ${i === idx ? "w-[18px] bg-pp-blue" : "w-1.5 bg-pp-soft"}`} />
        ))}
      </View>
    </View>
  );
}
