"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { apiFetchWithToken, registerLogoutCallback, unregisterLogoutCallback } from "@/lib/api";

interface PpxUser {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  ppxToken: string | null;
  ppxUser: PpxUser | null;
  setPpxToken: (token: string | null) => void;
  setPpxUser: (user: PpxUser | null) => void;
  logout: () => void;
  isVerifying: boolean;
}

const PPX_TOKEN_KEY = "ppx_token";
const PPX_USER_KEY = "ppx_user";

const hasLocalStorage = () => typeof window !== "undefined" && !!window.localStorage;

const savePpxToken = (token: string) => {
  try {
    if (!hasLocalStorage()) {
      return;
    }

    if (token) {
      localStorage.setItem(PPX_TOKEN_KEY, token);
      return;
    }

    localStorage.removeItem(PPX_TOKEN_KEY);
  } catch (error) { 
    console.warn("Failed to save ppx token to localStorage:", error);
  }
};

const savePpxUser = (user: PpxUser | null) => {
  try {
    if (!hasLocalStorage()) {
      return;
    }

    if (user) {
      localStorage.setItem(PPX_USER_KEY, JSON.stringify(user));
      return;
    }

    localStorage.removeItem(PPX_USER_KEY);
  } catch (error) {
    console.warn("Failed to save ppx user to localStorage:", error);
  }
};

export function getPpxToken(): string | null {
  if (!hasLocalStorage()) {
    return null;
  }
  return window.localStorage.getItem(PPX_TOKEN_KEY);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [ppxToken, setPpxToken] = useState<string | null>(null);
  const [ppxUser, setPpxUser] = useState<PpxUser | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  const logout = useCallback(() => {
    try {
      if (hasLocalStorage()) {
        localStorage.removeItem(PPX_TOKEN_KEY);
        localStorage.removeItem(PPX_USER_KEY);
      }
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }

    setPpxToken(null);
    setPpxUser(null);
  }, []);

  useEffect(() => {
    savePpxToken(ppxToken || "");
    savePpxUser(ppxUser || null);
  }, [ppxToken, ppxUser]);

  // Register logout callback for automatic logout on token expiration
  useEffect(() => {
    registerLogoutCallback(logout);
    return () => {
      unregisterLogoutCallback();
    };
  }, [logout]);

  // When the page initial loads, load the access token and pi access token from localStorage and verify the token
  useEffect(() => {
    let _ppxToken: string | null = null;
    let _ppxUserRaw: string | null = null;
    let _ppxUser: PpxUser | null = null;
    
    // Safely access localStorage (may fail in some mobile browsers or private mode)
    try {
      if (hasLocalStorage()) {
        _ppxToken = localStorage.getItem(PPX_TOKEN_KEY);
        _ppxUserRaw = localStorage.getItem(PPX_USER_KEY);
      }

      if (process.env.NEXT_PUBLIC_ENVIRONMENT === "development") {
        _ppxToken = "test_token";
        _ppxUser = { id: "3", username: "dev_user", role: "user" };
      }
    } catch (error) {
      console.warn("Failed to access localStorage:", error);
      setIsVerifying(false);
      return;
    }
    
    if (!_ppxUser && _ppxUserRaw) {
      try {
        _ppxUser = JSON.parse(_ppxUserRaw) as PpxUser;
      } catch (error) {
        console.warn("Failed to parse ppxUser from localStorage:", error);
        _ppxUser = null;
      }
    }

    setPpxToken(_ppxToken);
    setPpxUser(_ppxUser);
    setIsVerifying(false);
  }, []);

  // Periodically check token validity
  useEffect(() => {
    if (!ppxToken) {
      return; // Don't check if not logged in
    }

    // Get token check interval from environment variable (in minutes), default to 10 minutes
    const checkIntervalMinutes = parseInt(process.env.NEXT_PUBLIC_TOKEN_CHECK_INTERVAL_MINUTES || "10", 10);
    const checkIntervalMs = checkIntervalMinutes * 60 * 1000;

    const checkTokenValidity = async () => {
      try {
        await apiFetchWithToken("/auth/pi/me");
        // Token is valid, continue
      } catch (error) {
        // Token is invalid, logout automatically
        console.warn("Token validation failed during periodic check:", error);
        // Only logout if it's a 401 error (unauthorized), not network errors
        if (error instanceof Error && error.message.includes("401")) {
          logout();
        }
      }
    };

    // Check immediately on mount if token exists
    checkTokenValidity();

    // Set up interval to check periodically
    const intervalId = setInterval(checkTokenValidity, checkIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [ppxToken, logout]);

  const contextValue = useMemo(
    () => ({ ppxToken, ppxUser, setPpxToken, setPpxUser, logout, isVerifying }),
    [ppxToken, ppxUser, logout, isVerifying]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
