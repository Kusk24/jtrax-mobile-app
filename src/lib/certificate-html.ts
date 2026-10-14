/**
 * A certificate as a printable page, for the phone's "Download PDF": the same
 * layout as the certificate on screen and the web portal's printed one, on an
 * A4 sheet turned sideways. The logo comes in as base64 because iOS cannot
 * load a local image into the page it prints.
 */

export type CertificateText = {
  heading: string;
  name: string;
  body: string;
  course: string;
  date: string;
  dateLabel: string;
  certificateId: string;
  /** PNG data, no data: prefix. Empty prints without the logo. */
  logoBase64?: string;
};

/** A4 landscape at 72 points to the inch, as expo-print takes the size. */
export const A4_LANDSCAPE = { width: 842, height: 595 };

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function certificateHtml(c: CertificateText): string {
  const logo = c.logoBase64 ? `<img src="data:image/png;base64,${c.logoBase64}" alt="" style="height:64px" />` : "";
  return `<!doctype html><html><head><meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 0; }
  body { margin: 0; font-family: -apple-system, "Helvetica Neue", "Noto Sans Thai", sans-serif; color: #1d2b4f; }
  .sheet { box-sizing: border-box; width: 100%; height: 100vh; padding: 28px; }
  .frame { box-sizing: border-box; height: 100%; border: 6px double #2e5cb8; border-radius: 12px;
           display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; padding: 32px; }
  .heading { font-size: 11px; font-weight: 700; letter-spacing: .3em; text-transform: uppercase; color: #2e5cb8; }
  .name { font-size: 30px; font-weight: 700; }
  .body { max-width: 520px; font-size: 14px; line-height: 1.6; }
  .course { font-size: 20px; font-weight: 600; color: #2e5cb8; }
  .foot { margin-top: 8px; width: 100%; max-width: 520px; display: flex; justify-content: space-between; font-size: 12px; }
  .foot span { display: block; }
  .label { color: #5b6b8c; }
</style></head><body><div class="sheet"><div class="frame">
  ${logo}
  <div class="heading">${escape(c.heading)}</div>
  <div class="name">${escape(c.name)}</div>
  <div class="body">${escape(c.body)}</div>
  <div class="course">${escape(c.course)}</div>
  <div class="foot">
    <div style="text-align:left"><span><b>${escape(c.date)}</b></span><span class="label">${escape(c.dateLabel)}</span></div>
    <div style="text-align:right"><span><b>JCA Chess Academy</b></span><span class="label">${escape(c.certificateId)}</span></div>
  </div>
</div></div></body></html>`;
}
