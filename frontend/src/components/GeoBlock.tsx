import React from "react";
import { useGeoControl } from "../context/GeoControlContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Lock } from "lucide-react";

export const GeoBlock: React.FC = () => {
  const { geoInfo, loading } = useGeoControl();

  if (loading) return <div className="text-center py-4">Loading geolocation information...</div>;
  if (!geoInfo) return <div className="text-center py-4 text-red-500">Geolocation information error</div>;

  // Tier 1: Completely blocked (should be redirected, but show fallback)
  if (geoInfo.is_blocked || geoInfo.tier_name === "tier1") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg border-2 border-red-500">
          <div className="flex items-center justify-center mb-4">
            <Lock className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-center text-red-600 mb-2">Service Unavailable</h1>
          <p className="text-center text-gray-600">
            Your region ({geoInfo.region_code}) cannot access this service at this time.
          </p>
          <p className="text-center text-sm text-gray-500 mt-4">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Tier 2: Some features restricted
  if (geoInfo.tier_name === "tier2" && geoInfo.restricted_categories.length > 0) {
    return (
      <Alert className="mb-4 border-yellow-500 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Restricted Region</AlertTitle>
        <AlertDescription className="text-yellow-700">
          Some features are restricted in your region ({geoInfo.region_code}). 
          The following categories are unavailable: {geoInfo.restricted_categories.join(", ")}
        </AlertDescription>
      </Alert>
    );
  }

  // Tier 3: Normal access
  return null;
};
