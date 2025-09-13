export async function uploadFileToCatbox(
  file: File,
  signal?: AbortSignal,
): Promise<string> {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  // Anonymous upload (no userhash)
  form.append("fileToUpload", file, file.name || "upload");

  // Send raw file bytes to our backend proxy to avoid CORS issues
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
  const data = await res.json();
  if (!res.ok || !data?.url) {
    throw new Error(
      (data && (data.error || data.url)) || "Catbox upload failed",
    );
  }
  return data.url;
}

export async function uploadDataUrlToCatbox(
  dataUrl: string,
  filename = "image.png",
  signal?: AbortSignal,
): Promise<string> {
  // Convert data URL to Blob
  const res = await fetch("/api/catbox/upload-data-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, filename }),
    signal,
  });
  const data = await res.json();
  if (!res.ok || !data?.url)
    throw new Error(data?.error || "Catbox dataUrl upload failed");
  return data.url;
}

export async function uploadRemoteUrlToCatbox(
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/catbox/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
    signal,
  });
  const data = await res.json();
  if (!res.ok || !data?.url)
    throw new Error(data?.error || "Catbox urlupload failed");
  return data.url;
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
