/* The banner across the top of a tournament — the web's public
 * TournamentBanner, rebuilt for native.
 *
 * The organiser may upload their own poster art; most events never have any,
 * so without it the banner is drawn from the tournament itself: the school's
 * logo and name, the event's name, when and where. Every event gets its own
 * that way. The portal paints its gradient and board in CSS, which React
 * Native lacks, so both are SVG here, and the faint knight and king are the
 * board's own piece art turned white.
 *
 * An uploaded banner is fetched with the session's token: the API serves a
 * live event's banner to any signed-in account, and to everyone only once the
 * event is public. */
import { Image, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop, SvgXml } from "react-native-svg";
import { CalendarDays, MapPin } from "lucide-react-native";
import { API_BASE, getAuthToken } from "@/lib/api";
import { pieceArt } from "@/lib/piece-art";

const logo = require("@/../assets/images/jca-logo.png");

/** The board's squares, as a share of the banner's height. */
const SQUARE = 0.12;
/** Enough columns to fill the right of the widest phone; the panel clips. */
const COLUMNS = 24;
/** How many columns the board takes to reach full strength from its left. */
const FADE_COLUMNS = 8;

/** A piece's artwork as a white silhouette — the CSS `brightness(0) invert(1)`. */
const white = (xml: string) => xml.replace(/#000000|#000\b/g, "#ffffff");

export function TournamentBanner({
  name,
  when,
  venue,
  tournamentId,
  hasBanner = false,
  height,
  rounded = 0,
}: {
  name: string;
  /** Already formatted for the reader's locale. */
  when?: string;
  venue?: string;
  /** With `hasBanner`, which tournament's uploaded art to show. */
  tournamentId?: string;
  hasBanner?: boolean;
  height: number;
  rounded?: number;
}) {
  if (hasBanner && tournamentId) {
    const token = getAuthToken();
    return (
      <View style={{ height, borderRadius: rounded }} className="w-full overflow-hidden bg-pp-navy">
        <Image
          accessibilityLabel={name}
          source={{
            uri: `${API_BASE}/api/v1/tournaments/${encodeURIComponent(tournamentId)}/banner`,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }}
          resizeMode="cover"
          style={{ width: "100%", height: "100%" }}
        />
      </View>
    );
  }

  const square = height * SQUARE;
  const label = [name, when, venue].filter(Boolean).join(" · ");
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ height, borderRadius: rounded }}
      className="w-full overflow-hidden"
    >
      <View style={{ position: "absolute", inset: 0 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="tbg" x1="0" y1="0.2" x2="1" y2="0.8">
              <Stop offset="0" stopColor="#0f2350" />
              <Stop offset="0.52" stopColor="#1b3c85" />
              <Stop offset="1" stopColor="#2e5cb8" />
            </LinearGradient>
            {/* Light from the top right, so the blue is not flat. */}
            <RadialGradient id="tbl" cx="0.88" cy="0" rx="0.55" ry="0.9">
              <Stop offset="0" stopColor="#85aaee" stopOpacity="0.35" />
              <Stop offset="0.7" stopColor="#85aaee" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#tbg)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#tbl)" />
        </Svg>
      </View>
      {/* A board in the right part, fading out before it reaches the words:
          the squares grow fainter column by column toward the left. */}
      <View style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "62%" }} className="overflow-hidden">
        <Svg width="100%" height="100%">
          {Array.from({ length: Math.ceil(1 / SQUARE) + 1 }, (_, r) =>
            Array.from({ length: COLUMNS }, (_, c) =>
              (r + c) % 2 === 0 ? (
                <Rect
                  key={`${r}-${c}`}
                  x={c * square}
                  y={r * square}
                  width={square}
                  height={square}
                  fill="#ffffff"
                  opacity={0.075 * Math.min(1, c / FADE_COLUMNS)}
                />
              ) : null,
            ),
          )}
        </Svg>
      </View>
      <View style={{ position: "absolute", right: "3%", bottom: -0.16 * height, opacity: 0.16 }}>
        <SvgXml xml={white(pieceArt("w", "n"))} width={1.12 * height} height={1.12 * height} />
      </View>
      <View style={{ position: "absolute", right: "3%", marginRight: 0.7 * height, bottom: -0.1 * height, opacity: 0.08 }}>
        <SvgXml xml={white(pieceArt("w", "k"))} width={0.58 * height} height={0.58 * height} />
      </View>

      <View style={{ paddingHorizontal: 18, gap: height * 0.045, maxWidth: "72%" }} className="h-full justify-center">
        <View style={{ gap: height * 0.04 }} className="flex-row items-center">
          <Image
            source={logo}
            style={{ width: Math.max(20, height * 0.16), height: Math.max(20, height * 0.16) }}
            className="rounded-full bg-white"
          />
          <Text
            style={{ fontSize: Math.max(8, height * 0.044), letterSpacing: 1.8, opacity: 0.9 }}
            className="font-pp-bold uppercase text-white"
          >
            JCA Chess School
          </Text>
        </View>
        <Text
          numberOfLines={2}
          style={{ fontSize: Math.max(14, height * 0.12), lineHeight: Math.max(14, height * 0.12) * 1.12 }}
          className="font-pp-display-bold text-white"
        >
          {name}
        </Text>
        {(when || venue) && (
          <View style={{ columnGap: height * 0.06, rowGap: height * 0.015 }} className="flex-row flex-wrap items-center">
            {when ? (
              <View style={{ gap: height * 0.02 }} className="flex-row items-center">
                <CalendarDays size={Math.max(10, height * 0.06)} color="#ffffff" opacity={0.85} />
                <Text style={{ fontSize: Math.max(10, height * 0.052) }} className="font-pp-semibold text-white">
                  {when}
                </Text>
              </View>
            ) : null}
            {venue ? (
              <View style={{ gap: height * 0.02 }} className="min-w-0 shrink flex-row items-center">
                <MapPin size={Math.max(10, height * 0.06)} color="#ffffff" opacity={0.85} />
                <Text numberOfLines={1} style={{ fontSize: Math.max(10, height * 0.052) }} className="shrink font-pp-semibold text-white">
                  {venue}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
      {/* A bright edge along the bottom. */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3 }}>
        <Svg width="100%" height="3">
          <Defs>
            <LinearGradient id="tbe" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
              <Stop offset="0.7" stopColor="#ffffff" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="3" fill="url(#tbe)" />
        </Svg>
      </View>
    </View>
  );
}
