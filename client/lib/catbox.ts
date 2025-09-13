export async function uploadFileToCatbox(
  file: File,
  signal?: AbortSignal,
): Promise<string> {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  // Anonymous upload (no userhash)
  form.append("fileToUpload", file, file.name || "upload");

  // Try backend proxy first; if it fails, fallback to direct Catbox API
  try {
    const ab = await file.arrayBuffer();
    const res = await fetch(
      `/api/catbox/upload-file?filename=${encodeURIComponent(file.name || "upload")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: ab,
        signal,
      },
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.url) return data.url;
    }
  } catch {}

  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", file, file.name || "upload");
  const res2 = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: form, signal });
  const text = (await res2.text()).trim();
  if (!res2.ok || !/^https?:\/\//i.test(text)) throw new Error(text || "Catbox upload failed");
  return text;
}

export async function uploadDataUrlToCatbox(
  dataUrl: string,
  filename = "image.png",
  signal?: AbortSignal,
): Promise<string> {
  // Try proxy
  try {
    const res = await fetch("/api/catbox/upload-data-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl, filename }),
      signal,
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.url) return data.url;
    }
  } catch {}
  // Fallback: browser converts to Blob and reuse file upload
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });
  return uploadFileToCatbox(file, signal);
}

export async function uploadRemoteUrlToCatbox(
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const res = await fetch("/api/catbox/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal,
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.url) return data.url;
    }
  } catch {}
  const form = new FormData();
  form.append("reqtype", "urlupload");
  form.append("url", url);
  const res2 = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: form, signal });
  const text = (await res2.text()).trim();
  if (!res2.ok || !/^https?:\/\//i.test(text)) throw new Error(text || "Catbox urlupload failed");
  return text;
}

export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const result = await (async () => {
      try {
        return await (p as any);
      } catch (e) {
        throw e;
      }
    })();
    clearTimeout(t);
    return result;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}
