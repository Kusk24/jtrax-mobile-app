/**
 * Minimal Server-Sent Events reader for React Native.
 *
 * RN has no `EventSource`. It does have an `XMLHttpRequest` whose
 * `responseText` grows as the body arrives, which is all SSE needs — so this is
 * ~90 lines instead of a dependency, and it can attach the bearer token, which
 * the browser `EventSource` famously cannot.
 *
 * It reconnects, because the API sleeps after fifteen idle minutes on the free
 * tier and a game must survive that without the player noticing. Every event
 * the backend sends is a full snapshot, so a reconnect needs no replay and no
 * Last-Event-ID handling.
 */
import { API_BASE } from "./api";

const RETRY_MS = 3000;

export type SseHandlers = {
  onEvent: (event: string, data: string) => void;
  onOpen?: () => void;
  onError?: () => void;
};

export type SseConnection = { close: () => void };

/** Opens `path` (relative to /api/v1) as an event stream. */
export function openEventStream(path: string, token: string, handlers: SseHandlers): SseConnection {
  let xhr: XMLHttpRequest | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const connect = () => {
    if (closed) return;
    // How much of responseText has already been turned into events. XHR keeps
    // the whole body, so this is the read cursor rather than a buffer.
    let consumed = 0;

    const req = new XMLHttpRequest();
    xhr = req;
    req.open("GET", `${API_BASE}/api/v1/${path}`);
    req.setRequestHeader("Accept", "text/event-stream");
    req.setRequestHeader("Authorization", `Bearer ${token}`);

    req.onreadystatechange = () => {
      if (closed) return;
      if (req.readyState === 2 && req.status === 200) handlers.onOpen?.();

      if (req.readyState >= 3 && req.status === 200) {
        const text = req.responseText;
        // Events end with a blank line; anything after the last one is a
        // partial event still arriving and must wait.
        let boundary = text.indexOf("\n\n", consumed);
        while (boundary !== -1) {
          dispatch(text.slice(consumed, boundary));
          consumed = boundary + 2;
          boundary = text.indexOf("\n\n", consumed);
        }
      }

      if (req.readyState === 4) {
        // Reaching DONE means the stream ended — a sleeping server, a dropped
        // connection, a proxy timeout. All of them are retried.
        handlers.onError?.();
        scheduleRetry();
      }
    };
    req.onerror = () => {
      if (closed) return;
      handlers.onError?.();
      scheduleRetry();
    };

    try {
      req.send();
    } catch {
      scheduleRetry();
    }
  };

  const dispatch = (chunk: string) => {
    let event = "message";
    const data: string[] = [];
    for (const line of chunk.split("\n")) {
      if (line.startsWith(":")) continue; // heartbeat comment
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trim());
    }
    if (data.length > 0) handlers.onEvent(event, data.join("\n"));
  };

  const scheduleRetry = () => {
    if (closed || retry) return;
    retry = setTimeout(() => {
      retry = null;
      connect();
    }, RETRY_MS);
  };

  connect();

  return {
    close() {
      closed = true;
      if (retry) clearTimeout(retry);
      // abort() fires onreadystatechange with readyState 4; `closed` is what
      // stops that from scheduling a reconnect for a stream we just dropped.
      xhr?.abort();
      xhr = null;
    },
  };
}
