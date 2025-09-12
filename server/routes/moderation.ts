import { Request, Response } from "express";

export async function moderateHandler(req: Request, res: Response) {
  // Fallback simple heuristic available in all paths
  const heuristic = (t: string) => {
    const re =
      /\b(?:idiot|stupid|shit|fuck|bitch|asshole|con(nard)?|salope|salaud|merde|encul|pute)\b/i;
    const m = re.exec(t || "");
    if (m) {
      return { flagged: true, reasons: ["insult"], evidence: m[0] };
    }
    return { flagged: false, reasons: [], evidence: "" };
  };

  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string")
      return res.status(400).json({ error: "Missing text" });

    const key = process.env.OPENROUTER_API_KEY;

    if (!key) {
      // No API key configured, use heuristic
      return res.json(heuristic(text));
    }

    // Build prompt to return strict JSON with moderation result
    const prompt = `You are a content safety classifier. Determine if the following text contains insults or offensive language directed at a person or group. Respond with a single JSON object and nothing else in the exact format: {"flagged": true|false, "reasons": ["..."], "evidence": "..."}. Text: """${text}"""`;

    const body = {
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a content moderation assistant. Be concise and return only the JSON object as specified.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 120,
      temperature: 0,
    };

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.warn("openrouter non-ok", resp.status, txt);
      return res.json(heuristic(text));
    }

    const json = await resp.json();
    const content = json?.choices?.[0]?.message?.content || "";
    // Try to extract JSON substring
    const m = content.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const parsed = JSON.parse(m[0]);
        // ensure shape
        return res.json({
          flagged: Boolean(parsed.flagged),
          reasons: Array.isArray(parsed.reasons)
            ? parsed.reasons
            : parsed.reasons
              ? [String(parsed.reasons)]
              : [],
          evidence: parsed.evidence ? String(parsed.evidence) : "",
        });
      } catch (e) {
        // fallthrough to heuristic
      }
    }

    return res.json(heuristic(text));
  } catch (err) {
    console.error("moderation:error", err);
    try {
      const t = (req as any)?.body?.text || "";
      return res.json(heuristic(t));
    } catch {
      return res.json({ flagged: false, reasons: [], evidence: "" });
    }
  }
}
