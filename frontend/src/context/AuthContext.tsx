"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiFetchWithToken, registerLogoutCallback, unregisterLogoutCallback } from "@/lib/api";
import { setAccessToken as setAuthToken } from "@/lib/auth-token";

interface AuthContextType {
  accessToken: string | null;
  piAccessToken: string | null;
  username: string | null;
  authUser: any;
  role: string | null;
  setAuth: (token: string, piToken: string, username: string, authUser: any, role: string) => void;
  logout: () => void;
  isVerifying: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [piAccessToken, setPiAccessToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  const logout = useCallback(() => {
    setAccessToken(null);
    setPiAccessToken(null);
    setUsername(null);
    setAuthUser(null);
    setRole(null);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("piAccessToken");
        localStorage.removeItem("username");
        localStorage.removeItem("authUser");
        localStorage.removeItem("role");
      }
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }
    setAuthToken("");
  }, []);

  // Register logout callback for automatic logout on token expiration
  useEffect(() => {
    registerLogoutCallback(logout);
    return () => {
      unregisterLogoutCallback();
    };
  }, [logout]);

  // When the page initial loads, load the access token and pi access token from localStorage and verify the token
  useEffect(() => {
    let _accessToken: string | null = null;
    let _piAccessToken: string | null = null;
    let _username: string | null = null;
    let _authUser: string | null = null;
    let _role: string | null = null;
    
    // Safely access localStorage (may fail in some mobile browsers or private mode)
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        _accessToken = localStorage.getItem("accessToken");
        _piAccessToken = localStorage.getItem("piAccessToken");
        _username = localStorage.getItem("username");
        _authUser = localStorage.getItem("authUser");
        _role = localStorage.getItem("role");
      }
    } catch (error) {
      console.warn("Failed to access localStorage:", error);
      setIsVerifying(false);
      return;
    }
    
    if (_accessToken) {
      setAccessToken(_accessToken);
      setPiAccessToken(_piAccessToken);
      setUsername(_username);
      try {
        setAuthUser(_authUser ? JSON.parse(_authUser) : null);
      } catch (error) {
        console.warn("Failed to parse authUser from localStorage:", error);
        setAuthUser(null);
      }
      setRole(_role);
      setAuthToken(_accessToken);
      
      // Verify the token
      setIsVerifying(true);
      apiFetchWithToken("/account/info")
        .then(() => {
          // The token is valid
          setIsVerifying(false);
        })
        .catch((error) => {
          // The token has expired or is invalid
          console.warn("Token verification failed:", error);
          logout();
          setIsVerifying(false);
        });
    } else {
      setIsVerifying(false);
    }
  }, [logout]);

  // Periodically check token validity
  useEffect(() => {
    if (!accessToken) {
      return; // Don't check if not logged in
    }

    // Get token check interval from environment variable (in minutes), default to 10 minutes
    const checkIntervalMinutes = parseInt(
      process.env.NEXT_PUBLIC_TOKEN_CHECK_INTERVAL_MINUTES || "10",
      10
    );
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
  }, [accessToken, logout]);

  const setAuth = (token: string, piToken: string, user: string, _authUser: any, _role: string) => {
    setAccessToken(token);
    setPiAccessToken(piToken);
    setUsername(user);
    setAuthUser(_authUser);
    setRole(_role);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("piAccessToken", piToken);
        localStorage.setItem("username", user);
        localStorage.setItem("authUser", typeof _authUser === "string" ? _authUser : JSON.stringify(_authUser));
        localStorage.setItem("role", _role);
      }
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
    setAuthToken(token);
  };

  return (
    <AuthContext.Provider value={{ accessToken, piAccessToken, username, authUser, role, setAuth, logout, isVerifying }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
