// src/lib/api.ts
import { getPpxToken } from "@/context/AuthContext";


const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.predictpix.com/api";

// Logout callback to be registered by AuthContext
let logoutCallback: (() => void) | null = null;

/**
 * Register a logout callback function that will be called when token expiration is detected.
 * This should be called from AuthContext to enable automatic logout on 401 responses.
 */
export function registerLogoutCallback(callback: () => void) {
  logoutCallback = callback;
}

/**
 * Unregister the logout callback.
 */
export function unregisterLogoutCallback() {
  logoutCallback = null;
}

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        ...(init.headers || {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${path} failed ${res.status}: ${text}`);
    }

    return res.json();
  } catch (error) {
    // Re-throw with more context for network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(`Network error: Failed to reach API at ${API_BASE}${path}. Please check your connection.`);
    }
    throw error;
  }
}

export async function apiFetchWithToken<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getPpxToken();
  if (!token) throw new Error("No ppx token set. Use setPpxToken(...) once per session.");

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...(init.headers || {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      // Check if the error is due to token expiration or invalid token (401 Unauthorized)
      if (res.status === 401 && logoutCallback) {
        // Any 401 response from an authenticated endpoint indicates the token is invalid/expired
        // Trigger automatic logout when token expiration is detected
        console.warn("Token expired or invalid (401), logging out automatically");
        logoutCallback();
        if (typeof window !== "undefined") {
          window.location.href = '/';
        }
      }
      
      const text = await res.text().catch(() => "");
      throw new Error(`API ${path} failed ${res.status}: ${text}`);
    }

    return res.json();
  } catch (error) {
    // Re-throw with more context for network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(`Network error: Failed to reach API at ${API_BASE}${path}. Please check your connection.`);
    }
    throw error;
  }
}
