// src/lib/auth-token.ts
let _token: string | null = null;

// Save once (and persist for reloads)
export function setAccessToken(token: string) {
  _token = token || null;
  try {
    if (typeof window !== "undefined" && token) {
      window.localStorage.setItem("ppx_token", token);
      (window as any).__PPX_TOKEN__ = token;
    }
  } catch { /* ignore */ }
}

// Always try memory -> window -> localStorage (in that order)
export function getAccessToken(): string | null {
  if (_token) return _token;
  try {
    if (typeof window !== "undefined") {
      const w = window as any;
      if (w.__PPX_TOKEN__) _token = String(w.__PPX_TOKEN__);
      else {
        const fromLS = window.localStorage.getItem("ppx_token");
        if (fromLS) _token = fromLS;
      }
    }
  } catch { /* ignore */ }
  return _token;
}
