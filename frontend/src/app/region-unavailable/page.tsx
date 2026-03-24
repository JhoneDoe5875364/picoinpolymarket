"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Globe, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export default function RegionUnavailablePage() {
  const [regionCode, setRegionCode] = useState<string>("Unknown");
  const [contactEmail, setContactEmail] = useState<string>("support@predictpix.com");

  useEffect(() => {
    // Try to get geo info from context or API
    const fetchRegion = async () => {
      try {
        const res = await apiFetch("/geo/me");
        if (res) {
          const data = await res;
          setRegionCode(data.region_code || "Unknown");
        }
      } catch (e) {
        console.error("Failed to fetch region info:", e);
      }
    };
    
    fetchRegion();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-500/20 rounded-full">
            <Globe className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-slate-800 rounded-lg border border-red-500/50 p-2 lg:p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-center text-white mb-2">
            Service Unavailable
          </h1>
          
          <div className="flex items-center justify-center gap-2 mb-6 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-semibold">Your region is restricted</p>
          </div>

          <p className="text-center text-slate-300 mb-6">
            We're sorry, but PredictPix is not available in your region 
            <span className="block font-semibold text-white mt-2">({regionCode})</span>
          </p>

          {/* Reason explanation */}
          <div className="bg-slate-700 rounded p-4 mb-6">
            <div className="flex gap-3">
              <HelpCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-semibold mb-1">Why is this happening?</p>
                <p>PredictPix operates with regional restrictions to comply with local regulations. Your current location does not meet our access requirements.</p>
              </div>
            </div>
          </div>

          {/* What can you do */}
          <div className="bg-slate-700 rounded p-4 mb-6">
            <p className="font-semibold text-white mb-2 text-sm">What can you do?</p>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>• Wait for service expansion to your region</li>
              <li>• Contact our support team for more information</li>
            </ul>
          </div>

          {/* Contact button */}
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.location.href = `mailto:${contactEmail}`}
          >
            Contact Support
          </Button>

          {/* Footer note */}
          <p className="text-xs text-slate-400 text-center mt-4">
            Status: Tier 1 - Region Blocked
          </p>
        </div>

        {/* Legal footer */}
        <p className="text-xs text-slate-500 text-center mt-6">
          PredictPix operates in compliance with regional regulations. 
          Access is determined by your geolocation at connection time.
        </p>
      </div>
    </div>
  );
}
