export type ModerationResult = { flagged: boolean; reasons: string[]; evidence?: string };

export async function moderateText(text: string): Promise<ModerationResult> {
  try {
    const res = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return { flagged: false, reasons: [] };
    const json = await res.json();
    return {
      flagged: Boolean(json.flagged),
      reasons: Array.isArray(json.reasons) ? json.reasons : json.reasons ? [String(json.reasons)] : [],
      evidence: json.evidence || "",
    };
  } catch (e) {
    console.warn("moderation:client error", e);
    return { flagged: false, reasons: [] };
  }
}
