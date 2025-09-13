import type { RequestHandler } from "express";

function parseEnvList(val?: string | null): string[] {
  if (!val) return [];
  try {
    const arr = JSON.parse(val);
    if (Array.isArray(arr)) return arr.filter(Boolean);
  } catch {}
  return String(val)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const rtcConfigHandler: RequestHandler = async (_req, res) => {
  try {
    // If Metered TURN is configured, prefer it
    const meteredHost = process.env.RTC_METERED_HOST;
    const meteredKey = process.env.RTC_METERED_API_KEY;
    if (meteredHost && meteredKey) {
      try {
        const url = `https://${meteredHost}/api/v1/turn/credentials?apiKey=${encodeURIComponent(
          meteredKey,
        )}`;
        const r = await fetch(url);
        if (r.ok) {
          const iceServers = await r.json();
          if (Array.isArray(iceServers) && iceServers.length) {
            res.json({ iceServers });
            return;
          }
        }
      } catch (e) {
        // fall through to static config
      }
    }

    const stun = parseEnvList(
      process.env.RTC_STUN_URLS ||
        "stun:stun.l.google.com:19302,stun:global.stun.twilio.com:3478",
    );
    const turnUrls = parseEnvList(
      process.env.RTC_TURN_URLS || process.env.RTC_TURN_URL,
    );
    const username =
      process.env.RTC_TURN_USERNAME || process.env.TURN_USERNAME || undefined;
    const credential =
      process.env.RTC_TURN_CREDENTIAL || process.env.TURN_PASSWORD || undefined;

    const iceServers: any[] = [];
    if (stun.length) iceServers.push({ urls: stun });
    if (turnUrls.length && username && credential) {
      iceServers.push({ urls: turnUrls, username, credential });
    }

    res.json({ iceServers });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
};
