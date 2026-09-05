import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

/**
 * The two trained chess models, running in a hidden WebView.
 *
 * Same reason Stockfish needs one: Hermes has no WebAssembly, and
 * onnxruntime-web is WASM. A WebView does have a WASM runtime, so the phone
 * runs the *same* graphs the web app serves — identical models, identical
 * moves — with no native module to build for two platforms.
 *
 * Unlike Stockfish, nothing is staged to disk. onnxruntime-web, its .wasm and
 * both .onnx files are all fetched over HTTPS from EXPO_PUBLIC_MODEL_BASE_URL —
 * the same host the web app can point NEXT_PUBLIC_MODEL_BASE_URL at. So this
 * needs that URL set and a network on first use; after that the WebView's HTTP
 * cache serves them. With no URL set, the two trained opponents report
 * unavailable and Stockfish still works.
 *
 * The encoding lives in RN (lib/engines/maia-encode.ts, shared verbatim with
 * the web app and tested there). This view is a thin graph runner: it is handed
 * tensors, it runs a forward pass, it hands logits back. Keeping the bug-prone
 * encoding in one tested place is worth the few extra postMessage round trips.
 *
 * The view is 0x0 and never interacted with; it is an engine, not a screen.
 */

/** A tensor crossing the RN <-> WebView bridge as plain JSON. */
export type Feed = { data: number[]; dims: number[]; type: "float32" | "int64" };
export type Outputs = Record<string, { data: number[]; dims: number[] }>;
export type OnnxModel = "novice" | "strong";

export type OnnxHandle = {
  /** Runs one forward pass of a model. Rejects if the WebView is unavailable. */
  run: (model: OnnxModel, feeds: Record<string, Feed>) => Promise<Outputs>;
};

/** If onnxruntime has not loaded by now, the WebView is broken and the screen
    must say so rather than spin forever. Model downloads are 26/47 MB, so this
    is generous. */
const READY_TIMEOUT_MS = 60000;

const MODEL_FILES: Record<OnnxModel, string> = {
  novice: "novice_int8.onnx",
  strong: "strong_fp16.onnx",
};

/* The page pulls onnxruntime-web and both models from `base` over HTTPS, then
   answers {op:"run"} requests posted in through injectJavaScript. Sessions are
   created lazily and kept, so the second move does not re-download. */
function pageHtml(base: string, files: Record<OnnxModel, string>): string {
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script src="${base}/ort/ort.min.js"></script>
<script>
  function send(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  var FILES = ${JSON.stringify(files)};
  var sessions = {};

  function ready() {
    if (!window.ort) { send({ type: "failed", error: "ort did not load" }); return; }
    // onnxruntime fetches its own .wasm; point it at the same host as the models.
    ort.env.wasm.wasmPaths = "${base}/ort/";
    ort.env.wasm.numThreads = 1;
    ort.env.logLevel = "error";
    send({ type: "ready" });
  }

  function sessionFor(model) {
    if (!sessions[model]) {
      sessions[model] = ort.InferenceSession.create(
        "${base}/" + FILES[model],
        { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
    }
    return sessions[model];
  }

  window.__run = function (payload) {
    var req = JSON.parse(payload);
    sessionFor(req.model).then(function (sess) {
      var feeds = {};
      Object.keys(req.feeds).forEach(function (name) {
        var f = req.feeds[name];
        if (f.type === "int64") {
          feeds[name] = new ort.Tensor("int64", BigInt64Array.from(f.data.map(BigInt)), f.dims);
        } else {
          feeds[name] = new ort.Tensor("float32", Float32Array.from(f.data), f.dims);
        }
      });
      return sess.run(feeds).then(function (out) {
        var outputs = {};
        Object.keys(out).forEach(function (name) {
          outputs[name] = { data: Array.from(out[name].data), dims: out[name].dims };
        });
        send({ type: "result", id: req.id, ok: true, outputs: outputs });
      });
    }).catch(function (err) {
      send({ type: "result", id: req.id, ok: false, error: String(err) });
    });
  };

  if (window.ort) ready();
  else window.addEventListener("load", ready);
</script></body></html>`;
}

export const OnnxWebView = forwardRef<
  OnnxHandle,
  { baseUrl: string | null; onReady: () => void; onFailed: () => void }
>(function OnnxWebView({ baseUrl, onReady, onFailed }, ref) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const seq = useRef(0);
  const pending = useRef(new Map<number, { resolve: (o: Outputs) => void; reject: (e: Error) => void }>());

  // No base URL means the models are not hosted anywhere reachable; fail fast
  // and let the screen offer Stockfish only, rather than spin.
  useEffect(() => {
    if (!baseUrl) onFailed();
  }, [baseUrl, onFailed]);

  useEffect(() => {
    if (!baseUrl) return;
    const timer = setTimeout(() => {
      if (!readyRef.current) onFailed();
    }, READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [baseUrl, onFailed]);

  // A view that unmounts mid-request must not leave promises hanging forever.
  useEffect(() => {
    const inflight = pending.current;
    return () => {
      inflight.forEach(({ reject }) => reject(new Error("engine closed")));
      inflight.clear();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    run(model, feeds) {
      if (!readyRef.current) return Promise.reject(new Error("engine not ready"));
      const id = (seq.current += 1);
      return new Promise<Outputs>((resolve, reject) => {
        pending.current.set(id, { resolve, reject });
        const payload = JSON.stringify({ id, model, feeds });
        webRef.current?.injectJavaScript(
          `window.__run(${JSON.stringify(payload)}); true;`,
        );
      });
    },
  }));

  if (!baseUrl) return null;

  return (
    <View style={{ width: 0, height: 0, opacity: 0 }} pointerEvents="none">
      <WebView
        ref={webRef}
        source={{ html: pageHtml(baseUrl, MODEL_FILES), baseUrl }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        onError={onFailed}
        onMessage={(e) => {
          let msg: { type: string; id?: number; ok?: boolean; outputs?: Outputs; error?: string };
          try {
            msg = JSON.parse(e.nativeEvent.data ?? "{}");
          } catch {
            return;
          }
          if (msg.type === "ready") {
            readyRef.current = true;
            onReady();
          } else if (msg.type === "failed") {
            onFailed();
          } else if (msg.type === "result" && msg.id != null) {
            const entry = pending.current.get(msg.id);
            if (!entry) return;
            pending.current.delete(msg.id);
            if (msg.ok && msg.outputs) entry.resolve(msg.outputs);
            else entry.reject(new Error(msg.error ?? "inference failed"));
          }
        }}
      />
    </View>
  );
});
