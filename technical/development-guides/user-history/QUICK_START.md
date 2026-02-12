# User History - Quick Start Guide

Get the User History feature up and running in 5 minutes.

## Prerequisites

1. **Backend Running**: User service on port 3002
   ```bash
   cd dreamscape-services/user
   npm run dev
   ```

2. **Frontend Running**: Web client on port 5173
   ```bash
   cd dreamscape-frontend/web-client
   npm run dev
   ```

3. **User Account**: Have a registered user account with valid JWT token

## Access the History Page

### Option 1: Direct URL
Navigate to: `http://localhost:5173/history`

### Option 2: Add Navigation Link (Recommended)

#### In Navbar Component
Add a history link to the user menu:

```tsx
// In src/components/Navbar.tsx or similar
import { Clock } from 'lucide-react';

<Link
  to="/history"
  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
>
  <Clock className="w-4 h-4" />
  History
</Link>
```

#### In Dashboard Component
Add a quick action card:

```tsx
// In src/components/dashboard/UserDashboard.tsx or similar
<Link
  to="/history"
  className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
>
  <Clock className="w-8 h-8 text-orange-500 mb-3" />
  <h3 className="font-semibold mb-1">Your History</h3>
  <p className="text-sm text-gray-600">View your activity</p>
</Link>
```

## Testing the Feature

### 1. Generate Some History Data

Use the backend API directly to create test data:

```bash
# Get your JWT token first (login via the app or use auth API)
TOKEN="your-jwt-token-here"

# Add a hotel view
curl -X POST http://localhost:3002/api/v1/users/history \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actionType": "VIEWED",
    "entityType": "hotel",
    "entityId": "hotel-001",
    "metadata": {
      "name": "Grand Hotel Paris",
      "price": 250,
      "location": "Paris, France"
    }
  }'

# Add a search
curl -X POST http://localhost:3002/api/v1/users/history \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actionType": "SEARCHED",
    "entityType": "search",
    "entityId": "search-001",
    "metadata": {
      "query": "hotels in Paris",
      "resultsCount": 42
    }
  }'

# Add a favorite
curl -X POST http://localhost:3002/api/v1/users/history \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actionType": "FAVORITED",
    "entityType": "destination",
    "entityId": "dest-tokyo-001",
    "metadata": {
      "destinationName": "Tokyo, Japan"
    }
  }'
```

### 2. View Your History

1. Navigate to `http://localhost:5173/history`
2. You should see the 3 entries you just created
3. They should be sorted with newest first

### 3. Test Filters

1. **Action Type Filter**: Select "Viewed" - should show only the hotel view
2. **Category Filter**: Select "Hotels" - should show only hotel-related entries
3. **Clear Filters**: Click the "X" on filter pills to clear them

### 4. Test Pagination

If you have more than 20 entries:
1. Scroll to bottom
2. Click "Next" to see page 2
3. Click "Previous" to go back
4. Observe page counter updates

### 5. Test Delete

1. Hover over any entry
2. Click the trash icon
3. Confirm deletion in the modal
4. Entry should disappear from the list

### 6. Test Clear All

1. Click "Clear All" button in the header
2. Confirm in the modal
3. All entries should be removed
4. Empty state message should appear

## Quick Integration Example

To track history in an existing component:

```tsx
import { historyService } from '@/services/historyService';

// In your component
const MyComponent = () => {
  const handleHotelClick = async (hotel: Hotel) => {
    try {
      // Track the view
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

      // Then navigate
      navigate(`/hotels/${hotel.id}`);
    } catch (error) {
      console.error('Failed to track:', error);
    }
  };

  return (
    <button onClick={() => handleHotelClick(hotel)}>
      View Hotel
    </button>
  );
};
```

## Troubleshooting

### History Page Shows "Authentication Required"
**Solution**: You're not logged in. Navigate to `/auth` and log in first.

### History Page is Empty
**Possible Causes**:
1. No history data yet - create some test data (see above)
2. Backend not running - check `http://localhost:3002/health`
3. JWT token expired - log in again

### "Failed to load history" Error
**Check**:
1. Backend is running on port 3002
2. Network tab in DevTools shows the request
3. Check console for detailed error message
4. Verify JWT token is present in localStorage

### Entries Not Appearing After Tracking
**Solutions**:
1. Refresh the history page
2. Check Network tab for 200 OK response
3. Verify request body format is correct
4. Check backend logs for errors

## Browser DevTools Tips

### Check Authentication
```javascript
// In browser console
const authStorage = localStorage.getItem('auth-storage');
console.log(JSON.parse(authStorage));
```

### Check History API Calls
1. Open DevTools > Network tab
2. Filter by "history"
3. Perform actions on history page
4. Inspect requests/responses

### Test Service Directly
```javascript
// In browser console
import { historyService } from './src/services/historyService';

// Get history
historyService.getHistory({ page: 1, limit: 10 })
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

## Next Steps

1. **Add More Tracking**: Integrate history tracking in other components
   - See `docs/HISTORY_TRACKING_EXAMPLES.md` for examples

2. **Customize UI**: Adjust colors, layouts, or add new features
   - Edit `src/pages/history/index.tsx`

3. **Add Navigation**: Make history page easily accessible
   - Add links in navbar, dashboard, or settings

4. **Monitor Usage**: Track how users interact with history
   - Add analytics events
   - Monitor deletion patterns

## Resources

- **Feature Docs**: `docs/HISTORY_FEATURE.md`
- **Examples**: `docs/HISTORY_TRACKING_EXAMPLES.md`
- **API Docs**: `dreamscape-services/user/docs/api/history-api.md`
- **Backend Tests**: `dreamscape-services/user/__tests__/history.test.ts`

## Support

Having issues? Check:
1. This quick start guide
2. Feature documentation
3. Backend API documentation
4. Console logs for errors
5. Network requests in DevTools

## Summary

You now have a fully functional User History interface!

Key points:
- Route: `/history` (protected, requires auth)
- Service: `historyService` in `src/services/historyService.ts`
- Track actions: Call `historyService.trackAction(...)`
- View history: Navigate to `/history` page

Happy coding!
