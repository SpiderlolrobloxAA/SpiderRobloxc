import { Request, Response } from "express";
import { getAdminDb } from "../firebaseAdmin";

export async function uploadHandler(req: Request, res: Response) {
  try {
    // Expect JSON body: { filename, data } where data can be data URL or base64
    const { filename, data } = req.body || {};
    if (!filename || !data) return res.status(400).json({ error: "missing" });

    // ensure admin initialized
    await getAdminDb();

    // dynamic import to avoid loading on client builds
    const adminStorage = await import("firebase-admin/storage");
    const { getStorage } = adminStorage;
    const storage = getStorage();
    const bucket = storage.bucket();

    // parse data: accept data URL or raw base64
    let base64 = data as string;
    const dataUrlMatch = base64.match(/^data:(.+);base64,(.*)$/);
    let contentType = "application/octet-stream";
    if (dataUrlMatch) {
      contentType = dataUrlMatch[1];
      base64 = dataUrlMatch[2];
    }

    const buffer = Buffer.from(base64, "base64");
    const destPath = `products/${Date.now()}_${filename}`;
    const file = bucket.file(destPath);

    // generate a random token for public download link
    const token =
      (globalThis as any).crypto?.randomUUID?.() || Date.now().toString(36);

    await file.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
      public: false,
    });

    const bucketName = bucket.name;
    const encodedPath = encodeURIComponent(file.name);
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;

    return res.json({ url });
  } catch (err) {
    console.error("upload:error", err);
    return res.status(500).json({ error: "upload failed" });
  }
}
