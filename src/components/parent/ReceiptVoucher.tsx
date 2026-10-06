/**
 * A payment receipt drawn as a voucher — the web's lib/receipt-image.ts, laid
 * out as views instead of painted on a canvas, so the same thing on screen is
 * what `react-native-view-shot` saves as a picture.
 *
 * Its colours are fixed, not themed: a receipt is a document, and one saved
 * in dark mode should look like one saved in light.
 */
import { forwardRef } from "react";
import { Image, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import type { ReceiptContent } from "@/lib/receipt-content";

const logo = require("@/../assets/images/jca-logo.png");

const C = {
  page: "#EEF2F8",
  paper: "#FFFFFF",
  navy: "#234A9F",
  navyDeep: "#1E3A70",
  ink: "#1F2A44",
  muted: "#6B7690",
  faint: "#A3ACBF",
  line: "#E3E8F1",
  band: "#F5F7FB",
};
const STAMP = { paid: "#17924A", pending: "#C98A0B", cancelled: "#C8322B" };

/** The voucher's width; everything inside is laid out for it. */
export const RECEIPT_WIDTH = 340;
const PAPER = RECEIPT_WIDTH - 24;
const TEETH = 22;

export type ReceiptWordsShown = {
  school: string;
  title: string;
  itemHeader: string;
  amountHeader: string;
  totalLabel: string;
  status: string;
  thanks: string;
  footnote: string;
};

export const ReceiptVoucher = forwardRef<View, { content: ReceiptContent; words: ReceiptWordsShown }>(
  function ReceiptVoucher({ content: d, words: w }, ref) {
    const stamp = STAMP[d.statusTone];
    const toothW = PAPER / TEETH;
    /* The torn bottom edge: a zigzag across the paper's width. */
    const zigzag = Array.from({ length: TEETH }, (_, i) => `L${(i + 0.5) * toothW},10 L${(i + 1) * toothW},0`).join(" ");
    return (
      <View ref={ref} collapsable={false} style={{ width: RECEIPT_WIDTH, backgroundColor: C.page, padding: 12 }}>
        <View style={{ backgroundColor: C.paper, borderTopLeftRadius: 14, borderTopRightRadius: 14, overflow: "hidden" }}>
          {/* Header band in the app's navy, with faint rings like a printed
              voucher's guilloche. */}
          <View style={{ height: 96, justifyContent: "center" }}>
            <View style={{ position: "absolute", inset: 0 }}>
              <Svg width="100%" height="100%">
                <Defs>
                  <LinearGradient id="rh" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={C.navy} />
                    <Stop offset="1" stopColor={C.navyDeep} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#rh)" />
                {Array.from({ length: 12 }, (_, i) => (
                  <Circle key={i} cx={PAPER - 22} cy={48} r={22 + i * 9} fill="none" stroke="#ffffff" strokeOpacity={0.08} strokeWidth={1} />
                ))}
              </Svg>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18 }}>
              <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
                <Image source={logo} style={{ width: 58, height: 58 }} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} className="font-pp-bold" style={{ color: "#fff", fontSize: 15 }}>
                  {w.school}
                </Text>
                <Text numberOfLines={1} className="font-pp-medium" style={{ color: "rgba(255,255,255,.85)", fontSize: 10 }}>
                  {w.title}
                </Text>
              </View>
            </View>
          </View>

          {/* Details, two to a row, with the status stamped over them. */}
          <View style={{ paddingHorizontal: 22, paddingTop: 16, flexDirection: "row", flexWrap: "wrap", rowGap: 12 }}>
            {d.details.map((line) => (
              <View key={line.label} style={{ width: "50%", paddingRight: 8 }}>
                <Text className="font-pp-bold" style={{ color: C.faint, fontSize: 7.5, letterSpacing: 0.6 }}>
                  {line.label.toUpperCase()}
                </Text>
                <Text numberOfLines={1} className="font-pp-semibold" style={{ color: C.ink, fontSize: 11, marginTop: 2 }}>
                  {line.value}
                </Text>
              </View>
            ))}
            <View
              style={{
                position: "absolute",
                right: 18,
                top: 26,
                transform: [{ rotate: "-11deg" }],
                opacity: 0.85,
                borderWidth: 2,
                borderColor: stamp,
                borderRadius: 6,
                padding: 2.5,
              }}
            >
              <View style={{ borderWidth: 0.8, borderColor: stamp, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text className="font-pp-extrabold" style={{ color: stamp, fontSize: 13 }}>
                  {w.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Dashed tear line with notches either side. */}
          <View style={{ height: 24, justifyContent: "center", marginTop: 6 }}>
            <View style={{ marginHorizontal: 14, borderTopWidth: 1, borderStyle: "dashed", borderColor: C.line }} />
            <View style={{ position: "absolute", left: -8, top: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.page }} />
            <View style={{ position: "absolute", right: -8, top: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.page }} />
          </View>

          {/* The item. */}
          <View style={{ paddingHorizontal: 22 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: C.band, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, marginHorizontal: -8 }}>
              <Text className="font-pp-bold" style={{ color: C.muted, fontSize: 7.5, letterSpacing: 0.6 }}>
                {w.itemHeader.toUpperCase()}
              </Text>
              <Text className="font-pp-bold" style={{ color: C.muted, fontSize: 7.5, letterSpacing: 0.6 }}>
                {w.amountHeader.toUpperCase()}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 12, paddingTop: 10, paddingBottom: 10 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} className="font-pp-semibold" style={{ color: C.ink, fontSize: 12 }}>
                  {d.item}
                </Text>
                <Text numberOfLines={1} className="font-pp-medium" style={{ color: C.muted, fontSize: 9.5, marginTop: 2 }}>
                  {d.itemSub}
                </Text>
              </View>
              <Text className="font-pp-semibold" style={{ color: C.ink, fontSize: 12 }}>
                {d.itemAmount}
              </Text>
            </View>
            {d.adjustments.map((a) => (
              <View key={a.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 8 }}>
                <Text className="font-pp-medium" style={{ color: C.muted, fontSize: 10.5 }}>
                  {a.label}
                </Text>
                <Text className="font-pp-semibold" style={{ color: C.ink, fontSize: 10.5 }}>
                  {a.value}
                </Text>
              </View>
            ))}

            {/* Total. */}
            <View style={{ borderTopWidth: 1.2, borderColor: C.ink, marginTop: 4, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text className="font-pp-bold" style={{ color: C.ink, fontSize: 10.5, letterSpacing: 0.4 }}>
                {w.totalLabel.toUpperCase()}
              </Text>
              <Text className="font-pp-extrabold" style={{ color: C.navyDeep, fontSize: 22 }}>
                {d.total}
              </Text>
            </View>

            {/* Footer. */}
            <View style={{ borderTopWidth: 1, borderColor: C.line, paddingTop: 14, paddingBottom: 22, alignItems: "center", gap: 4 }}>
              <Text className="font-pp-semibold" style={{ color: C.ink, fontSize: 11, textAlign: "center" }}>
                {w.thanks}
              </Text>
              <Text className="font-pp-medium" style={{ color: C.faint, fontSize: 8.5, textAlign: "center" }}>
                {w.footnote}
              </Text>
            </View>
          </View>
        </View>
        {/* The torn bottom edge. */}
        <Svg width={PAPER} height={10}>
          <Path d={`M0,0 ${zigzag} Z`} fill={C.paper} />
        </Svg>
      </View>
    );
  },
);
