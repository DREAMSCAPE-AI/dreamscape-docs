# User History Feature (DR-220)

## Overview

The User History feature allows users to view, filter, and manage their activity history on the DreamScape platform. This feature integrates with the User History API (DR-83) implemented in the backend.

## Implementation Files

### 1. Type Definitions
**File:** `src/types/history.ts`

Defines TypeScript interfaces for:
- `HistoryEntry` - Individual history entry structure
- `HistoryActionType` - Enum for action types (VIEWED, SEARCHED, FAVORITED, etc.)
- `HistoryEntityType` - Enum for entity types (hotel, flight, destination, etc.)
- `HistoryResponse` - API response with pagination
- `HistoryStats` - Statistics response
- Filter and request types

### 2. Service Layer
**File:** `src/services/historyService.ts`

A singleton service class that handles all history-related API calls:

#### Methods:
- `getHistory(params?)` - Fetch paginated history with optional filters
- `getStats()` - Get aggregated history statistics
- `trackAction(entry)` - Create a new history entry
- `deleteEntry(id)` - Delete a specific history entry
- `clearHistory(entityType?)` - Clear all or filtered history

#### Features:
- Axios instance with 10s timeout
- Automatic JWT token injection from localStorage
- Request/response interceptors for error handling
- Automatic redirect to /auth on 401 errors
- Consistent error messages

### 3. UI Component
**File:** `src/pages/history/index.tsx`

A full-featured history management page with:

#### Features:
- **Authentication Guard**: Redirects to /auth if not logged in
- **Filters**: Action type and entity type dropdowns
- **Active Filter Pills**: Visual display of active filters with clear buttons
- **History List**: Cards showing action icon, entity info, and timestamp
- **Relative Timestamps**: "5 minutes ago", "2 days ago", etc.
- **Pagination**: Previous/Next controls with page info
- **Delete Confirmation**: Modal for deleting individual entries
- **Clear All Confirmation**: Modal for clearing history with filter context
- **Empty States**: Different messages for no data vs. filtered results
- **Loading States**: Spinner during API calls
- **Error Handling**: Error messages with retry button

#### UI Components Used:
- Icons from `lucide-react` (Clock, Filter, Trash2, etc.)
- Custom `LoadingSpinner` component
- Custom `ErrorMessage` component
- Tailwind CSS for styling

#### Color Coding:
- VIEWED: Blue
- SEARCHED: Purple
- FAVORITED: Pink
- UNFAVORITED: Gray
- CREATED: Green
- UPDATED: Yellow
- DELETED: Red

### 4. Routing
**File:** `src/App.tsx`

Added protected route:
```tsx
<Route path="/history" element={
  <OnboardingGuard requireOnboarding={false}>
    <HistoryPage />
  </OnboardingGuard>
} />
```

The route is protected but doesn't require onboarding completion.

## API Integration

### Base URL
```
http://localhost:3002/api/v1/users/history
```

### Authentication
All requests require JWT Bearer token from localStorage auth-storage:
```
Authorization: Bearer <token>
```

### Endpoints Used

#### GET /api/v1/users/history
Fetch paginated history with filters:
- Query params: `page`, `limit`, `actionType`, `entityType`, `entityId`
- Returns: `{ success, data: { items, pagination } }`

#### GET /api/v1/users/history/stats
Get history statistics:
- Returns: `{ success, data: { totalCount, byActionType, byEntityType, mostRecentActivity } }`

#### DELETE /api/v1/users/history/:id
Delete specific entry:
- Returns: `{ success, message, data: null }`

#### DELETE /api/v1/users/history
Clear all or filtered history:
- Query params: `entityType` (optional)
- Returns: `{ success, message, data: { deletedCount } }`

## Usage

### Navigation
Users can access the history page at `/history`. Consider adding a link to the user menu or dashboard:

```tsx
<Link to="/history">
  <Clock className="w-4 h-4" />
  History
</Link>
```

### Tracking User Actions
To track user actions throughout the app, use the history service:

```tsx
import { historyService } from '@/services/historyService';

// Track when user views a hotel
await historyService.trackAction({
  actionType: 'VIEWED',
  entityType: 'hotel',
  entityId: hotel.id,
  metadata: {
    name: hotel.name,
    price: hotel.price,
    location: hotel.location,
  }
});

// Track search
await historyService.trackAction({
  actionType: 'SEARCHED',
  entityType: 'search',
  entityId: searchId,
  metadata: {
    query: searchQuery,
    filters: appliedFilters,
    resultsCount: results.length,
  }
});
```

## Future Enhancements

1. **Date Range Filter**: Add date picker for filtering by time period
2. **Bulk Actions**: Select multiple entries for batch deletion
3. **Export History**: Download history as CSV or JSON
4. **Search**: Full-text search across history entries
5. **Insights**: Show personalized insights based on history patterns
6. **Grouping**: Group entries by date (Today, Yesterday, Last Week, etc.)
7. **Details Modal**: Click on entry to see full metadata
8. **Undo Delete**: Temporary storage for recently deleted items

## Testing

### Manual Testing Checklist

- [ ] Page loads correctly when authenticated
- [ ] Redirects to /auth when not authenticated
- [ ] History entries display with correct icons and colors
- [ ] Filters update the list correctly
- [ ] Active filter pills appear and can be cleared
- [ ] Pagination works (previous/next buttons)
- [ ] Delete confirmation modal appears
- [ ] Individual delete works
- [ ] Clear all confirmation modal appears
- [ ] Clear all works (with and without filters)
- [ ] Empty state shows when no history
- [ ] Loading spinner appears during API calls
- [ ] Error messages appear on API failures
- [ ] Retry button works after error
- [ ] Timestamps display correctly
- [ ] Responsive design works on mobile

### Integration Testing

Test with backend API:
1. Start user-service on port 3002
2. Authenticate and get valid JWT token
3. Test all API endpoints through the UI
4. Verify error handling for invalid tokens
5. Check pagination with large datasets
6. Test filter combinations

## Architecture Decisions

### Why Singleton Service?
The `HistoryService` class is instantiated once and exported as a singleton to:
- Share axios instance configuration
- Maintain consistent interceptor logic
- Reduce memory overhead
- Match existing service patterns (ProfileService, etc.)

### Why Index Route?
Using `pages/history/index.tsx` instead of `pages/history.tsx` allows for:
- Future expansion with sub-routes (e.g., `/history/stats`)
- Consistent structure with other page directories
- Better organization as feature grows

### Why OnboardingGuard?
Wrapping the route in `OnboardingGuard` with `requireOnboarding={false}`:
- Ensures user is authenticated
- Allows access without completing onboarding
- Consistent with settings page pattern

### State Management
Using local React state instead of Zustand because:
- History data is page-specific, not global
- No need to share state across components
- Simpler implementation for single-page feature
- Reduces global state complexity

## Dependencies

- `react` ^18.3.0
- `react-router-dom` ^6.x
- `axios` (via existing services)
- `lucide-react` (for icons)
- `tailwindcss` (for styling)

No additional dependencies required.

## Support

For issues or questions:
- Backend API docs: `dreamscape-services/user/docs/api/history-api.md`
- Backend implementation: `dreamscape-services/user/src/routes/history.ts`
- Type definitions: `src/types/history.ts`
- Service layer: `src/services/historyService.ts`
- UI component: `src/pages/history/index.tsx`
