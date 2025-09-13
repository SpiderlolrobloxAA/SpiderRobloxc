import type { Request, Response } from "express";

// Proxy upload: receive base64 data URL and forward to Catbox (anonymous)
export async function handleUpload(req: Request, res: Response) {
  try {
    const { dataUrl, filename } = req.body || {};
    if (!dataUrl || typeof dataUrl !== "string") {
      return res.status(400).json({ error: "Missing dataUrl" });
    }
    // Convert data URL to Blob
    const m = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!m) return res.status(400).json({ error: "Invalid dataUrl" });
    const mime = m[1] || "application/octet-stream";
    const buf = Buffer.from(m[2], "base64");

    // Use native FormData/fetch (Node 18+/undici)
    const form = new FormData();
    form.set("reqtype", "fileupload");
    const fname = filename || `upload_${Date.now()}`;
    form.set("fileToUpload", new Blob([buf], { type: mime }), fname);

    const resp = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: form as any,
    });
    const txt = await resp.text();
    if (!resp.ok || !/^https?:\/\//.test(txt)) {
      return res.status(502).json({ error: "upstream_failed", detail: txt });
    }
    return res.json({ url: txt.trim() });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("upload:error", e?.message || e);
    return res.status(500).json({ error: "internal" });
  }
}
