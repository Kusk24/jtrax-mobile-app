import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import { Asset } from "expo-asset";
import { Directory, File, Paths } from "expo-file-system";
import { WebView } from "react-native-webview";
import { STOCKFISH_GLUE } from "../../assets/stockfish/engine-glue";

/**
 * Stockfish on a phone, via a hidden WebView.
 *
 * Hermes has no WebAssembly, so the engine cannot run in the app's own JS
 * runtime. A WebView does have one, which lets the phone run the *same*
 * unmodified `stockfish-18-lite-single` build the web app uses — identical
 * engine, identical strength, identical levels, and no native module to
 * maintain for two platforms.
 *
 * Two details are load-bearing, both learned the hard way on a simulator:
 *
 *  1. The engine must run in a Worker. This build (chess.com's stockfish.js)
 *     detects its environment, and only the worker path wires UCI up to
 *     postMessage; loaded as an inline script it takes a
 *     `document.currentScript._exports` branch and never speaks.
 *
 *  2. The page, the worker script and the .wasm must all sit in one directory
 *     and be loaded from it. A Worker built from a `blob:` URL gets an opaque
 *     origin, and WKWebView will not let that read a `file://` .wasm — the
 *     fetch fails silently, with no error surfacing on either side.
 *
 * The view is 0×0 and never interacted with; it is an engine, not a screen.
 */

export type StockfishHandle = {
  /** Resolves to a UCI move, or "" if the engine is unavailable or has none. */
  bestMove: (moves: string[], depth: number, elo?: number) => Promise<string>;
};

/** If the engine has not completed the UCI handshake by now, something is
    wrong with the WebView and the screen must say so rather than spin. */
const READY_TIMEOUT_MS = 30000;
const MIN_THINK_MS = 450;

const DIR = "stockfish";
const WASM = "engine.wasm";
const WORKER = "engine.js";

/* The worker is told where its .wasm sits through the URL fragment, which is
   this build's convention. Both are relative, so both resolve against the
   page's own directory. */
const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"></head><body><script>
  function send(line) { window.ReactNativeWebView.postMessage(String(line)); }
  try {
    var worker = new Worker("${WORKER}#" + encodeURIComponent("${WASM}"));
    worker.onerror = function (e) { send("jtrax-error worker:" + (e.message || e)); };
    worker.onmessage = function (e) { send(typeof e.data === "string" ? e.data : JSON.stringify(e.data)); };
    window.__engine = worker;
    worker.postMessage("uci");
  } catch (err) {
    send("jtrax-error setup:" + err);
  }
</script></body></html>`;

/** Lays the three files out in one cache directory and returns the page's URI.
    Rewritten every launch: this is cache, and a stale copy after an engine
    upgrade would cost more than the copy does. */
async function stageEngine(): Promise<string> {
  const dir = new Directory(Paths.cache, DIR);
  if (!dir.exists) dir.create({ intermediates: true });

  const asset = await Asset.fromModule(
    require("../../assets/stockfish/stockfish-18-lite-single.wasm"),
  ).downloadAsync();

  const wasm = new File(dir, WASM);
  if (wasm.exists) wasm.delete();
  new File(asset.localUri ?? asset.uri).copy(wasm);

  const worker = new File(dir, WORKER);
  if (worker.exists) worker.delete();
  worker.create();
  worker.write(STOCKFISH_GLUE);

  const page = new File(dir, "index.html");
  if (page.exists) page.delete();
  page.create();
  page.write(PAGE);

  return page.uri;
}

export const StockfishWebView = forwardRef<
  StockfishHandle,
  { onReady: () => void; onFailed: () => void }
>(function StockfishWebView({ onReady, onFailed }, ref) {
  const webRef = useRef<WebView>(null);
  const resolveRef = useRef<((uci: string) => void) | null>(null);
  const readyRef = useRef(false);
  const [source, setSource] = useState<{ uri: string; dir: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    stageEngine()
      .then((uri) => {
        if (!cancelled) setSource({ uri, dir: uri.slice(0, uri.lastIndexOf("/") + 1) });
      })
      .catch(() => {
        if (!cancelled) onFailed();
      });
    return () => {
      cancelled = true;
    };
  }, [onFailed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!readyRef.current) onFailed();
    }, READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [onFailed]);

  const post = useCallback((cmd: string) => {
    webRef.current?.injectJavaScript(`window.__engine.postMessage(${JSON.stringify(cmd)}); true;`);
  }, []);

  useImperativeHandle(ref, () => ({
    async bestMove(moves, depth, elo) {
      if (!readyRef.current) return "";
      // UCI_LimitStrength makes the engine play weaker moves on purpose;
      // capping depth alone still produces near-perfect play.
      post(`setoption name UCI_LimitStrength value ${elo ? "true" : "false"}`);
      if (elo) post(`setoption name UCI_Elo value ${elo}`);
      post(`position startpos${moves.length ? " moves " + moves.join(" ") : ""}`);

      const started = Date.now();
      const uci = await new Promise<string>((resolve) => {
        resolveRef.current = resolve;
        post(`go depth ${depth}`);
      });
      // A reply that lands instantly reads as "it wasn't listening".
      const elapsed = Date.now() - started;
      if (elapsed < MIN_THINK_MS) await new Promise((r) => setTimeout(r, MIN_THINK_MS - elapsed));
      return uci;
    },
  }));

  if (!source) return null;

  return (
    <View style={{ width: 0, height: 0, opacity: 0 }} pointerEvents="none">
      <WebView
        ref={webRef}
        source={{ uri: source.uri }}
        originWhitelist={["*"]}
        javaScriptEnabled
        // iOS: without this the page cannot read its own directory.
        allowingReadAccessToURL={source.dir}
        // Android equivalents.
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        onError={onFailed}
        onMessage={(e) => {
          const line = e.nativeEvent.data ?? "";
          if (line.startsWith("uciok")) {
            post("isready");
            return;
          }
          if (line.startsWith("readyok")) {
            readyRef.current = true;
            onReady();
            return;
          }
          if (line.startsWith("jtrax-error")) {
            onFailed();
            return;
          }
          if (line.startsWith("bestmove")) {
            const uci = line.split(" ")[1];
            const resolve = resolveRef.current;
            resolveRef.current = null;
            resolve?.(uci && uci !== "(none)" ? uci : "");
          }
        }}
      />
    </View>
  );
});
