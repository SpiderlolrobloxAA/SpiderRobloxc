export function normalizeUsername(input: string) {
  const s = (input || "").trim().toLowerCase();
  // keep letters, numbers, dot, underscore, hyphen
  return s.replace(/[^a-z0-9._-]+/g, "");
}

export function usernameToEmail(username: string) {
  const u = normalizeUsername(username);
  return `${u}@app.local`;
}
