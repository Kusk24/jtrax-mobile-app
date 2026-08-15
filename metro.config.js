const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

/* Stockfish ships as a .wasm, which Metro treats as source unless told
   otherwise — it has to be copied verbatim so the WebView can fetch it. The
   .js glue is likewise an asset, not a module: it is loaded by a <script> tag
   inside the WebView, never imported into the app's bundle. */
config.resolver.assetExts = [...config.resolver.assetExts, "wasm"];
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => ext !== "wasm");

module.exports = withNativeWind(config, { input: "./src/global.css" });
