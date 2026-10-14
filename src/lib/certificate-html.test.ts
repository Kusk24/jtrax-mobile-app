import { describe, expect, it } from "vitest";
import { certificateHtml } from "./certificate-html";

const text = {
  heading: "Certificate of Completion", name: "Penny <Jones>", body: "has completed 50 h of the JCA Starters course",
  course: "JCA Starters", date: "1 October 2026", dateLabel: "Date", certificateId: "cert_1",
};

describe("certificateHtml", () => {
  it("prints what the certificate on screen says", () => {
    const html = certificateHtml(text);
    for (const part of ["Certificate of Completion", "has completed 50 h", "JCA Starters", "1 October 2026", "cert_1"]) {
      expect(html).toContain(part);
    }
  });

  it("escapes a name, so it cannot become markup", () => {
    expect(certificateHtml(text)).toContain("Penny &lt;Jones&gt;");
  });

  it("inlines the logo, and leaves it out when there is none", () => {
    expect(certificateHtml({ ...text, logoBase64: "AAAA" })).toContain('src="data:image/png;base64,AAAA"');
    expect(certificateHtml(text)).not.toContain("<img");
  });
});
