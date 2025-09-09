export function normalizeUsername(input: string) {
  const s = (input || "").trim().toLowerCase();
  // keep letters, numbers, dot, underscore, hyphen
  return s.replace(/[^a-z0-9._-]+/g, "");
}

export function usernameToEmail(username: string) {
  const u = normalizeUsername(username);
  return `${u}@app.local`;
}

export function emailToUsername(email: string) {
  if (!email) return email;
  // if email ends with @app.local remove domain
  try {
    const at = email.indexOf("@");
    if (at === -1) return email;
    return email.slice(0, at);
  } catch (e) {
    return email;
  }
}
