"use client"

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export interface GeoInfo {
  ip: string;
  region_code: string;
  state_code?: string;
  tier_name: "tier1" | "tier2" | "tier3";  // Tier 1 = blocked, Tier 2 = restricted, Tier 3 = normal
  allowed_categories: string[];
  restricted_categories: string[];
  blocked_categories: string[];
  is_blocked: boolean;
}

interface GeoControlContextType {
  geoInfo: GeoInfo | null;
  loading: boolean;
  refresh: () => Promise<GeoInfo | null>;
  isCategoryRestricted: (category: string) => boolean;
  isCategoryAllowed: (category: string) => boolean;
}

const GeoControlContext = createContext<GeoControlContextType | undefined>(undefined);

export const GeoControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchGeoInfo = async (): Promise<GeoInfo | null> => {
    setLoading(true);
    try {
      const data = await apiFetch<GeoInfo>("/geo/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!data) {
        throw new Error("Failed to fetch geo info: empty response");
      }
      
      setGeoInfo(data);

      // Tier 1: User is blocked from service
      if (data.tier_name === "tier1" || data.is_blocked) {
        // Use setTimeout to avoid router issues during render
        setTimeout(() => {
          router.push("/region-unavailable");
        }, 0);
      }

      return data;
    } catch (e) {
      console.error("Error fetching geo info:", e);
      // Don't block the app if geo info fails - just set to null and continue
      setGeoInfo(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const isCategoryRestricted = (category: string): boolean => {
    if (!geoInfo) return false;
    return geoInfo.restricted_categories.includes(category);
  };

  const isCategoryAllowed = (category: string): boolean => {
    if (!geoInfo) return false;
    return geoInfo.allowed_categories.includes(category);
  };

  useEffect(() => {
    fetchGeoInfo();
  }, []);

  return (
    <GeoControlContext.Provider 
      value={{ 
        geoInfo, 
        loading, 
        refresh: fetchGeoInfo,
        isCategoryRestricted,
        isCategoryAllowed
      }}
    >
      {children}
    </GeoControlContext.Provider>
  );
};

export const useGeoControl = () => {
  const ctx = useContext(GeoControlContext);
  if (!ctx) throw new Error("useGeoControl must be used within GeoControlProvider");
  return ctx;
};
