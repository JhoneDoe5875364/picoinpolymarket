'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCallback } from 'react';
import { useGeoControl } from '@/context/GeoControlContext';
import { AlertCircle } from 'lucide-react';

const categories = [
  "All",
  "Crypto",
  "Technology",
  "Sports",
  "Politics",
  "Science",
  "Finance",
  "Entertainment",
  "World News",
  "Environment",
  "Other",
];

const sortOptions = {
  'volume': 'Volume',
  'newest': 'Newest',
  'closing-soon': 'Closing Soon',
};

type SortOption = keyof typeof sortOptions;

export function MarketFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { geoInfo } = useGeoControl();

    const selectedCategory = searchParams.get('category') ?? 'All';
    const sortOption = (searchParams.get('sort') as SortOption) ?? 'volume';

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);
            return params.toString();
        },
        [searchParams]
    );

    const handleCategoryChange = (value: string) => {
        router.push(`/?${createQueryString('category', value)}`);
    };

    const handleSortChange = (value: string) => {
        router.push(`/?${createQueryString('sort', value)}`);
    };

    // Check if category is restricted based on server geo data
    const isCategoryDisabled = (category: string): boolean => {
      if (!geoInfo) return false;
      if (category === "All") return false; // "All" is always enabled
      
      // Tier 1 is fully blocked (should not reach this page)
      if (geoInfo.tier_name === "tier1" || geoInfo.is_blocked) return true;
      
      // Tier 2: Check if category is in restricted list
      if (geoInfo.tier_name === "tier2") {
        return geoInfo.restricted_categories.includes(category) ||
               geoInfo.blocked_categories.includes(category);
      }
      
      // Tier 3: No restrictions (only blocked_categories are disabled)
      return geoInfo.blocked_categories.includes(category);
    };

    const getCategoryTooltip = (category: string): string => {
      if (!geoInfo) return "";
      if (isCategoryDisabled(category)) {
        if (geoInfo.blocked_categories.includes(category)) {
          return `${category} is not available in your region`;
        } else if (geoInfo.restricted_categories.includes(category)) {
          return `${category} is restricted in your region (${geoInfo.region_code})`;
        }
      }
      return "";
    };

    return (
        <div className="flex flex-col md:flex-row gap-4">
            {/* Geo restriction notice for Tier 2 */}
            {geoInfo?.tier_name === "tier2" && geoInfo.restricted_categories.length > 0 && (
              <div className="w-full flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Some categories are restricted in your region</span>
              </div>
            )}

            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:max-w-xs">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map(category => {
                      const isDisabled = isCategoryDisabled(category);
                      const tooltip = getCategoryTooltip(category);
                      
                      return (
                        <SelectItem 
                          key={category} 
                          value={category}
                          disabled={isDisabled}
                          title={tooltip}
                        >
                          {isDisabled && <span className="mr-1">🔒</span>}
                          Filter by: {category}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
            </Select>

            <Select value={sortOption} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full md:max-w-xs">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(sortOptions).map(([key, value]) => (
                        <SelectItem key={key} value={key}>Sort by: {value}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
