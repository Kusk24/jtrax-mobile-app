/**
 * The ID card scan, as the phone sends it: a multipart upload of the photo,
 * for one child, to the parent's own scan endpoint.
 *
 * Two things go wrong here, both silently on a phone: the fetch Expo installs
 * refuses a photo given by its URI ("Unsupported FormDataPart"), and a JSON
 * Content-Type on a form loses the multipart boundary. So the upload goes
 * through XMLHttpRequest, with no Content-Type of ours.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { setAuthToken } from "./api";
import { scanChildIDCard } from "./registration";

type Sent = { method: string; url: string; headers: Record<string, string>; body: unknown };

/** A stand-in XMLHttpRequest that answers with `status` and `reply`, and
    records what was sent. */
function stubXhr(reply: unknown, status = 200) {
  const sent: Sent[] = [];
  class FakeXhr {
    status = 0;
    responseText = "";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private req: Sent = { method: "", url: "", headers: {}, body: undefined };
    open(method: string, url: string) {
      this.req.method = method;
      this.req.url = url;
    }
    setRequestHeader(k: string, v: string) {
      this.req.headers[k] = v;
    }
    send(body: unknown) {
      this.req.body = body;
      sent.push(this.req);
      this.status = status;
      this.responseText = JSON.stringify(reply);
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal("XMLHttpRequest", FakeXhr);
  const fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  return { sent, fetchSpy };
}

afterEach(() => {
  vi.unstubAllGlobals();
  setAuthToken(null);
});

describe("scanning a child's ID card", () => {
  it("uploads the photo as a form, for that child, with the session's token", async () => {
    setAuthToken("tok");
    const { sent, fetchSpy } = stubXhr({ fields: {}, checkId: "chk_1" });
    const scan = await scanChildIDCard("trn/1", "stu_penny", { uri: "file:///card.jpg", mimeType: "image/png", fileName: "card.png" });

    expect(scan.checkId).toBe("chk_1");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(sent).toHaveLength(1);
    expect(sent[0].method).toBe("POST");
    expect(sent[0].url).toMatch(/\/api\/v1\/tournaments\/trn%2F1\/scan-id\?student_id=stu_penny$/);
    expect(sent[0].body).toBeInstanceOf(FormData);
    expect(sent[0].headers).toEqual({ Authorization: "Bearer tok" });
  });

  it("sends the image part even for a photo with no name or type", async () => {
    const { sent } = stubXhr({ fields: {}, checkId: "chk_2" });
    await scanChildIDCard("trn_1", "stu_uri", { uri: "file:///x" });
    expect((sent[0].body as FormData).has("image")).toBe(true);
  });

  it("passes the server's own reason on when the card cannot be read", async () => {
    stubXhr({ error: "ID card reading is not available right now" }, 503);
    await expect(scanChildIDCard("trn_1", "stu_uri", { uri: "file:///x" })).rejects.toThrow(/not available/);
  });
});
