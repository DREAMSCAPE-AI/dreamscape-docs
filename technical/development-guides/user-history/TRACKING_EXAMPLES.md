# User History Tracking - Integration Examples

This document provides practical examples of how to integrate user history tracking throughout the DreamScape web client.

## Import the Service

```tsx
import { historyService } from '@/services/historyService';
```

## Example 1: Track Hotel Views

When a user views hotel details, track the action:

```tsx
// In HotelDetails.tsx or similar component
import React, { useEffect } from 'react';
import { historyService } from '@/services/historyService';

const HotelDetails: React.FC<HotelDetailsProps> = ({ hotel, onClose }) => {
  // Track view when component mounts
  useEffect(() => {
    const trackHotelView = async () => {
      try {
        await historyService.trackAction({
          actionType: 'VIEWED',
          entityType: 'hotel',
          entityId: hotel.id,
          metadata: {
            name: hotel.name,
            location: hotel.address?.cityName || 'Unknown',
            price: hotel.price?.total,
            currency: hotel.price?.currency,
            rating: hotel.rating,
            chainCode: hotel.chainCode,
          }
        });
      } catch (error) {
        // Silent fail - don't disrupt user experience
        console.error('Failed to track hotel view:', error);
      }
    };

    trackHotelView();
  }, [hotel.id]); // Only track once per hotel

  return (
    // Your component JSX
  );
};
```

## Example 2: Track Search Queries

When a user performs a search, track it:

```tsx
// In SearchBar.tsx or SearchPage.tsx
import { historyService } from '@/services/historyService';

const handleSearch = async (searchParams: SearchParams) => {
  try {
    // Perform the actual search
    const results = await voyageService.searchHotels(searchParams);

    // Track the search action
    await historyService.trackAction({
      actionType: 'SEARCHED',
      entityType: 'search',
      entityId: `search-${Date.now()}`, // Generate unique ID
      metadata: {
        query: searchParams.query,
        location: searchParams.location,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.guests,
        resultsCount: results.length,
        timestamp: new Date().toISOString(),
      }
    });

    setResults(results);
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

## Example 3: Track Favorites

When a user adds or removes a favorite:

```tsx
// In DestinationCard.tsx or similar
import { historyService } from '@/services/historyService';

const handleToggleFavorite = async (destination: Destination) => {
  const isFavorited = favorites.includes(destination.id);

  try {
    if (isFavorited) {
      // Remove from favorites
      await favoritesService.remove(destination.id);

      // Track unfavorite action
      await historyService.trackAction({
        actionType: 'UNFAVORITED',
        entityType: 'destination',
        entityId: destination.id,
        metadata: {
          destinationName: destination.name,
          location: destination.location,
        }
      });
    } else {
      // Add to favorites
      await favoritesService.add(destination.id);

      // Track favorite action
      await historyService.trackAction({
        actionType: 'FAVORITED',
        entityType: 'destination',
        entityId: destination.id,
        metadata: {
          destinationName: destination.name,
          location: destination.location,
          category: destination.category,
        }
      });
    }

    // Update UI
    toggleFavorite(destination.id);
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
  }
};
```

## Example 4: Track Booking Creation

When a user creates a booking:

```tsx
// In BookingFlow.tsx or CheckoutPage.tsx
import { historyService } from '@/services/historyService';

const handleConfirmBooking = async (bookingData: BookingData) => {
  try {
    // Create the booking
    const booking = await voyageService.createBooking(bookingData);

    // Track booking creation
    await historyService.trackAction({
      actionType: 'CREATED',
      entityType: 'booking',
      entityId: booking.id,
      metadata: {
        bookingType: bookingData.type, // 'hotel', 'flight', 'package'
        destination: bookingData.destination,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        status: booking.status,
      }
    });

    // Redirect to confirmation page
    navigate(`/booking/confirmation/${booking.id}`);
  } catch (error) {
    console.error('Booking failed:', error);
  }
};
```

## Example 5: Track Flight Views

When a user selects a flight to view details:

```tsx
// In FlightDetails.tsx or FlightCard.tsx
import { historyService } from '@/services/historyService';

const FlightDetails: React.FC<FlightDetailsProps> = ({ flight }) => {
  useEffect(() => {
    const trackFlightView = async () => {
      try {
        await historyService.trackAction({
          actionType: 'VIEWED',
          entityType: 'flight',
          entityId: flight.id,
          metadata: {
            airline: flight.carrierCode,
            flightNumber: flight.flightNumber,
            origin: flight.departure.iataCode,
            destination: flight.arrival.iataCode,
            departureDate: flight.departure.at,
            price: flight.price.total,
            currency: flight.price.currency,
            duration: flight.duration,
            stops: flight.numberOfStops,
          }
        });
      } catch (error) {
        console.error('Failed to track flight view:', error);
      }
    };

    trackFlightView();
  }, [flight.id]);

  return (
    // Component JSX
  );
};
```

## Example 6: Track Activity Bookings

When a user books an activity or experience:

```tsx
// In ActivityBooking.tsx or ExperienceBooking.tsx
import { historyService } from '@/services/historyService';

const handleBookActivity = async (activity: Activity) => {
  try {
    // Book the activity
    const booking = await activitiesService.book(activity.id, bookingDetails);

    // Track activity booking
    await historyService.trackAction({
      actionType: 'CREATED',
      entityType: 'activity',
      entityId: activity.id,
      metadata: {
        activityName: activity.name,
        location: activity.location,
        date: bookingDetails.date,
        participants: bookingDetails.participants,
        price: activity.price,
        category: activity.category,
        duration: activity.duration,
      }
    });

    showSuccessNotification('Activity booked successfully!');
  } catch (error) {
    console.error('Activity booking failed:', error);
  }
};
```

## Example 7: Track Destination Views

When a user navigates to a destination page:

```tsx
// In DestinationPage.tsx or DestinationDetail.tsx
import { historyService } from '@/services/historyService';

const DestinationPage: React.FC = () => {
  const { id } = useParams();
  const [destination, setDestination] = useState<Destination | null>(null);

  useEffect(() => {
    const loadDestination = async () => {
      try {
        const data = await destinationsService.getById(id!);
        setDestination(data);

        // Track destination view
        await historyService.trackAction({
          actionType: 'VIEWED',
          entityType: 'destination',
          entityId: id!,
          metadata: {
            destinationName: data.name,
            country: data.country,
            city: data.city,
            category: data.category,
            rating: data.rating,
            attractions: data.topAttractions?.length || 0,
          }
        });
      } catch (error) {
        console.error('Failed to load destination:', error);
      }
    };

    if (id) {
      loadDestination();
    }
  }, [id]);

  return (
    // Component JSX
  );
};
```

## Example 8: Custom Hook for Tracking

Create a reusable hook for tracking actions:

```tsx
// In hooks/useHistoryTracking.ts
import { useCallback } from 'react';
import { historyService } from '@/services/historyService';
import type { HistoryActionType, HistoryEntityType, HistoryMetadata } from '@/types/history';

export const useHistoryTracking = () => {
  const trackAction = useCallback(async (
    actionType: HistoryActionType,
    entityType: HistoryEntityType,
    entityId: string,
    metadata?: HistoryMetadata
  ) => {
    try {
      await historyService.trackAction({
        actionType,
        entityType,
        entityId,
        metadata,
      });
    } catch (error) {
      // Silent fail - don't disrupt user experience
      console.error('Failed to track action:', error);
    }
  }, []);

  return { trackAction };
};

// Usage in components:
const MyComponent = () => {
  const { trackAction } = useHistoryTracking();

  const handleHotelView = async (hotel: Hotel) => {
    await trackAction('VIEWED', 'hotel', hotel.id, {
      name: hotel.name,
      price: hotel.price,
    });
  };

  return (
    // Component JSX
  );
};
```

## Example 9: Batch Tracking for Search Results

Track when users interact with search results:

```tsx
// In SearchResults.tsx
import { historyService } from '@/services/historyService';

const SearchResults: React.FC<SearchResultsProps> = ({ results, query }) => {
  const handleResultClick = async (result: SearchResult, index: number) => {
    try {
      // Track which result was clicked
      await historyService.trackAction({
        actionType: 'VIEWED',
        entityType: result.type, // 'hotel', 'flight', etc.
        entityId: result.id,
        metadata: {
          name: result.name,
          price: result.price,
          searchQuery: query,
          resultPosition: index + 1,
          totalResults: results.length,
          clickedAt: new Date().toISOString(),
        }
      });

      // Navigate to detail page
      navigate(`/${result.type}/${result.id}`);
    } catch (error) {
      console.error('Failed to track result click:', error);
    }
  };

  return (
    // Component JSX
  );
};
```

## Best Practices

### 1. Silent Failures
Never let tracking errors disrupt the user experience:

```tsx
try {
  await historyService.trackAction(...);
} catch (error) {
  // Log but don't show to user
  console.error('Failed to track action:', error);
}
```

### 2. Avoid Duplicate Tracking
Use `useEffect` with proper dependencies to prevent duplicate tracking:

```tsx
useEffect(() => {
  trackAction(...);
}, [entityId]); // Only track when entityId changes
```

### 3. Rich Metadata
Include relevant context in metadata for better analytics:

```tsx
metadata: {
  name: hotel.name,
  location: hotel.location,
  price: hotel.price,
  rating: hotel.rating,
  // Add any data useful for recommendations or analytics
  amenities: hotel.amenities,
  category: hotel.category,
  stars: hotel.stars,
}
```

### 4. Consistent Entity IDs
Use consistent ID formats across the app:

```tsx
// Good
entityId: hotel.id  // Use existing backend ID

// Avoid
entityId: `hotel-${hotel.name}` // Don't create synthetic IDs
```

### 5. Async/Await Pattern
Always use async/await for cleaner error handling:

```tsx
// Good
const trackView = async () => {
  try {
    await historyService.trackAction(...);
  } catch (error) {
    console.error(error);
  }
};

// Avoid
historyService.trackAction(...)
  .then(() => {})
  .catch((error) => console.error(error));
```

## Testing Tracking Integration

### Manual Testing
1. Open browser DevTools > Network tab
2. Filter by "history" requests
3. Perform actions in the app
4. Verify POST requests to `/api/v1/users/history`
5. Check request payload has correct structure
6. Visit `/history` page to see tracked actions

### Console Logging (Development)
Add temporary logging during development:

```tsx
if (process.env.NODE_ENV === 'development') {
  console.log('Tracking action:', {
    actionType,
    entityType,
    entityId,
    metadata,
  });
}
```

### Error Monitoring
Consider adding error tracking service integration:

```tsx
import * as Sentry from '@sentry/react'; // Example

try {
  await historyService.trackAction(...);
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'history-tracking' },
    extra: { actionType, entityType, entityId },
  });
}
```

## Common Issues and Solutions

### Issue: "Authentication required" error
**Solution:** Ensure user is logged in and JWT token is present in localStorage.

### Issue: Tracking not appearing in history page
**Solution:**
- Check network requests in DevTools
- Verify API response is 200 OK
- Refresh history page to reload data

### Issue: Duplicate tracking on component re-renders
**Solution:** Use `useEffect` with proper dependency array or track on user action (click) instead of mount.

### Issue: Slow page load due to tracking
**Solution:**
- Use fire-and-forget pattern (don't await)
- Consider debouncing rapid actions
- Track on user interaction, not every render

## Integration Checklist

When adding history tracking to a new feature:

- [ ] Identify all trackable user actions
- [ ] Choose appropriate action types (VIEWED, CREATED, etc.)
- [ ] Choose appropriate entity types (hotel, flight, etc.)
- [ ] Add tracking code with try-catch
- [ ] Include rich metadata for analytics
- [ ] Test in development environment
- [ ] Verify tracking appears in history page
- [ ] Check for duplicate tracking
- [ ] Ensure errors don't break UI
- [ ] Document any custom entity types

## Support

For questions or issues:
- History API docs: `dreamscape-services/user/docs/api/history-api.md`
- History service: `src/services/historyService.ts`
- History types: `src/types/history.ts`
- History page: `src/pages/history/index.tsx`
