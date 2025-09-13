export async function uploadFileToCatbox(file: File, signal?: AbortSignal): Promise<string> {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  // Anonymous upload (no userhash)
  form.append("fileToUpload", file, file.name || "upload");

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form,
    signal,
  });
  const text = (await res.text()).trim();
  if (!res.ok || !/^https?:\/\//i.test(text)) {
    throw new Error(text || "Catbox upload failed");
  }
  return text;
}

export async function uploadDataUrlToCatbox(dataUrl: string, filename = "image.png", signal?: AbortSignal): Promise<string> {
  // Convert data URL to Blob
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });
  return uploadFileToCatbox(file, signal);
}

export async function uploadRemoteUrlToCatbox(url: string, signal?: AbortSignal): Promise<string> {
  const form = new FormData();
  form.append("reqtype", "urlupload");
  form.append("url", url);
  const res = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: form, signal });
  const text = (await res.text()).trim();
  if (!res.ok || !/^https?:\/\//i.test(text)) {
    throw new Error(text || "Catbox urlupload failed");
  }
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
