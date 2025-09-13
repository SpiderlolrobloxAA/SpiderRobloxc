export const DEFAULT_AVATAR_IMG =
  "https://cdn.builder.io/api/v1/image/assets%2Fec69bd5deeba4d6a81033567db96cbc0%2Faa0c928652df48449b7aacff3b6b02f4?format=webp&width=800";

export async function fileToDataUrl(
  file: File,
  opts: { maxWidth?: number; quality?: number } = {},
): Promise<string> {
  const { maxWidth = 1280, quality = 0.85 } = opts;
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = (e) => reject(e);
      i.src = data;
    });
    const scale = Math.min(
      1,
      maxWidth / (img.naturalWidth || img.width || maxWidth),
    );
    const w = Math.round((img.naturalWidth || img.width) * scale);
    const h = Math.round((img.naturalHeight || img.height) * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return data;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return data;
  }
}
