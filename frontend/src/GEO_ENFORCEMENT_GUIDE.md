# Frontend GeoControl Implementation Guide

## Overview
PredictPix implements server-driven geolocation control on the frontend. All region-based UI decisions are driven by server responses from `GET /api/geo/me`.

## Architecture

### 10. FRONTEND ENFORCEMENT

The frontend must NOT rely on its own geolocation checks. Instead, it derives all behavior from server-provided data.

#### On App Load

1. **GeoControlProvider** (in `context/GeoControlContext.tsx`) fetches `GET /api/geo/me`
2. API response includes:
   - `tier`: "1" | "2" | "3"
   - `blocked_categories`: string[]
   - `restricted_categories`: string[]
   - `allowed_categories`: string[]
   - `is_blocked`: boolean
   - `region_code`: string
   - `state_code?: string`

#### Response Handling

##### Tier 1 (is_blocked = true)
- **User is BLOCKED from entire service**
- Frontend immediately redirects to `/region-unavailable`
- Region-unavailable page displays:
  - Region code
  - Explanation of why service is unavailable
  - Contact support button
  - Status indicator: "Tier 1 - Region Blocked"

##### Tier 2 (is_blocked = false, restricted_categories.length > 0)
- **User has LIMITED access**
- UI Behavior:
  - Allow access to general platform
  - Disable restricted categories in filters
  - Show warning: "Some categories are restricted in your region"
  - Display lock icon (🔒) next to restricted categories
  - Prevent submission/participation in restricted categories
  - Show tooltip on hover: "{category} is restricted in your region ({code})"

##### Tier 3 (normal access)
- **User has FULL access**
- All categories are available
- No warnings or restrictions
- Normal UI flow

## Key Files

### Context: `frontend/src/context/GeoControlContext.tsx`

**Responsibilities:**
- Fetches `GET /api/geo/me` on app load
- Stores geo info globally
- Provides utility methods:
  - `isCategoryRestricted(category)`: Check if category is in restricted list
  - `isCategoryAllowed(category)`: Check if category is in allowed list
- Handles Tier 1 redirect to `/region-unavailable`

**Usage:**
```tsx
const { geoInfo, loading, isCategoryRestricted } = useGeoControl();
if (geoInfo?.tier_name === "tier1") {
  // Already redirected
}
if (isCategoryRestricted("Sports")) {
  // Disable Sports UI
}
```

### Page: `frontend/src/app/region-unavailable/page.tsx`

**Responsibilities:**
- Display when Tier 1 (fully blocked)
- Show region code, error explanation
- Provide support contact option
- Status badge: "Tier 1 - Region Blocked"

### Component: `frontend/src/components/GeoBlock.tsx`

**Responsibilities:**
- Display geo restriction alerts
- Tier 2: Show warning banner with restricted categories
- Tier 1 & 3: No warning needed
- Used in app shell or page layouts

### Component: `frontend/src/components/market-filters.tsx`

**Responsibilities:**
- Render category filter dropdown
- Disable restricted/blocked categories based on server data
- Show lock icon (🔒) for disabled categories
- Display tooltip: "{category} is not available in your region"
- Show geo restriction notice for Tier 2 users

### Hook: `frontend/src/hooks/useGeoAccess.ts`

**Provides:**
- `useGeoCategoryAccess(category)`: Returns:
  ```tsx
  {
    isAllowed: boolean,
    isRestricted: boolean,
    isBlocked: boolean,
    message: string,
    tier: "1" | "2" | "3",
    region: string
  }
  ```
- `useGeoTierUI()`: Returns tier info and category lists

## Usage Examples

### Example 1: Disable Category Button
```tsx
import { useGeoCategoryAccess } from '@/hooks/useGeoAccess';

export function CryptoButton() {
  const { isAllowed, message } = useGeoCategoryAccess("Crypto");
  
  return (
    <Button disabled={!isAllowed} title={message}>
      Crypto Markets
    </Button>
  );
}
```

### Example 2: Hide Restricted Categories
```tsx
import { useGeoControl } from '@/context/GeoControlContext';

export function CategoryList() {
  const { geoInfo } = useGeoControl();
  
  const availableCategories = categories.filter(cat => 
    !geoInfo?.restricted_categories.includes(cat)
  );
  
  return availableCategories.map(cat => <CategoryItem key={cat} name={cat} />);
}
```

### Example 3: Show Geo Warning
```tsx
import { GeoBlock } from '@/components/GeoBlock';

export default function Page() {
  return (
    <>
      <GeoBlock />  {/* Shows warning if Tier 2 */}
      <MainContent />
    </>
  );
}
```

## Important Notes

1. **Never Trust Client-Side Logic Alone**
   - Frontend filters are for UX only
   - Backend API MUST validate geo restrictions on every request
   - Frontend UI follows server-provided data, not the reverse

2. **Tier Definitions (Server-Driven)**
   - Tier 1: `is_blocked = true` → User cannot access service
   - Tier 2: Restricted categories present → User has limited access
   - Tier 3: Normal access, no restrictions

3. **Category Access Control**
   - Categories are defined on backend (category_engine)
   - Restrictions are determined on backend (geo_decorators)
   - Frontend reads from `restricted_categories` and `blocked_categories`

4. **Error Handling**
   - If geo fetch fails: Show error message, do not allow full access
   - If geo info is missing: Treat as restricted until confirmed

5. **Caching & Refresh**
   - `useGeoControl()` provides `refresh()` method to refetch geo info
   - Use after user actions that might affect geo status

## Testing Checklist

- [ ] Tier 1 user is redirected to `/region-unavailable`
- [ ] Tier 2 user sees warning banner on home page
- [ ] Tier 2 user cannot select restricted categories in filter
- [ ] Tier 3 user sees no warnings
- [ ] Restricted categories show lock icon (🔒)
- [ ] Tooltips display on category hover
- [ ] API `/api/geo/me` is called once on app load
- [ ] Geo data is shared across all pages via context
- [ ] Refresh button updates geo status

## Related Backend Endpoints

- `GET /api/geo/me`: Get current user's geo tier and restrictions
- `POST /api/geo/check`: Check access to specific category
- All protected endpoints validate geo restrictions via `@geoblock()` decorator
