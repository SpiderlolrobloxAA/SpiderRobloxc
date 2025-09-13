import type { RequestHandler } from "express";
import { FormData, Blob } from "undici";

const CATBOX_API = "https://catbox.moe/user/api.php";

export const uploadFileProxy: RequestHandler = async (req, res) => {
  try {
    const filename = (req.query.filename as string) || `upload_${Date.now()}`;
    // req.body is Buffer if express.raw middleware is applied
    const buf: Buffer = req.body as any;
    if (!buf || !buf.length) {
      res.status(400).json({ error: "Empty body" });
      return;
    }
    const blob = new Blob([buf], {
      type: req.headers["content-type"] || "application/octet-stream",
    });
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", blob, filename);
    const r = await fetch(CATBOX_API, { method: "POST", body: form as any });
    const text = (await r.text()).trim();
    if (!r.ok || !/^https?:\/\//i.test(text)) {
      res.status(502).json({ error: text || "Catbox upload failed" });
      return;
    }
    res.json({ url: text });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
};

export const uploadDataUrlProxy: RequestHandler = async (req, res) => {
  try {
    const { dataUrl, filename } = req.body || {};
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      res.status(400).json({ error: "dataUrl required" });
      return;
    }
    const blob = await (await fetch(dataUrl)).blob();
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", blob, filename || `image_${Date.now()}.png`);
    const r = await fetch(CATBOX_API, { method: "POST", body: form as any });
    const text = (await r.text()).trim();
    if (!r.ok || !/^https?:\/\//i.test(text)) {
      res.status(502).json({ error: text || "Catbox upload failed" });
      return;
    }
    res.json({ url: text });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
};

export const uploadRemoteUrlProxy: RequestHandler = async (req, res) => {
  try {
    const { url } = req.body || {};
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      res.status(400).json({ error: "url required" });
      return;
    }
    const form = new FormData();
    form.append("reqtype", "urlupload");
    form.append("url", url);
    const r = await fetch(CATBOX_API, { method: "POST", body: form as any });
    const text = (await r.text()).trim();
    if (!r.ok || !/^https?:\/\//i.test(text)) {
      res.status(502).json({ error: text || "Catbox urlupload failed" });
      return;
    }
    res.json({ url: text });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
};
