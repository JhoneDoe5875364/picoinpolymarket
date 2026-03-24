import { useGeoControl } from "@/context/GeoControlContext";

/**
 * Hook to check if a category is accessible in the user's region
 * Returns whether a category is allowed, restricted, or blocked
 */
export const useGeoCategoryAccess = (category: string) => {
  const { geoInfo } = useGeoControl();

  if (!geoInfo) {
    return {
      isAllowed: false,
      isRestricted: false,
      isBlocked: false,
      message: "Geolocation data not available"
    };
  }

  const isBlocked = geoInfo.blocked_categories.includes(category);
  const isRestricted = geoInfo.restricted_categories.includes(category);
  const isAllowed = geoInfo.allowed_categories.includes(category) || 
                    (!isBlocked && !isRestricted && geoInfo.tier_name === "tier3");

  let message = "";
  if (isBlocked) {
    message = "This category is not available in your region";
  } else if (isRestricted) {
    message = "This category is restricted in your region";
  }

  return {
    isAllowed,
    isRestricted,
    isBlocked,
    message,
    tier: geoInfo.tier_name,
    region: geoInfo.region_code
  };
};

/**
 * Hook to render UI based on geo tier
 */
export const useGeoTierUI = () => {
  const { geoInfo } = useGeoControl();

  if (!geoInfo) return { tier: null, isFullyBlocked: false, isRestricted: false, isNormal: false };

  return {
    tier: geoInfo.tier_name,
    isFullyBlocked: geoInfo.tier_name === "tier1" || geoInfo.is_blocked,
    isRestricted: geoInfo.tier_name === "tier2",
    isNormal: geoInfo.tier_name === "tier3",
    restrictedCategories: geoInfo.restricted_categories,
    allowedCategories: geoInfo.allowed_categories,
    blockedCategories: geoInfo.blocked_categories
  };
};
