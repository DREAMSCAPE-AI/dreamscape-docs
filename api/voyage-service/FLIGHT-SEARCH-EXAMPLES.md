# 🛫 Exemples d'Utilisation - Flight Search API

Guide pratique pour utiliser l'API de recherche de vols DreamScape intégrée avec Amadeus.

---

## 🚀 Endpoint Disponible

### Recherche de Vols (DTOs mappés)
```
GET /api/v1/flights/search
```

La route retourne automatiquement des données mappées et simplifiées via `FlightOfferMapper` pour une consommation frontend optimale.

---

## 📋 Exemples cURL

### Recherche Aller Simple (Paris → New York)

```bash
curl -X GET "http://localhost:3003/api/v1/flights/search?originLocationCode=CDG&destinationLocationCode=JFK&departureDate=2025-11-15&adults=1&max=10"
```

### Recherche Aller-Retour (Londres → Dubaï)

```bash
curl -X GET "http://localhost:3003/api/v1/flights/search?originLocationCode=LHR&destinationLocationCode=DXB&departureDate=2025-12-01&returnDate=2025-12-10&adults=2&travelClass=BUSINESS&max=5"
```

### Vols Directs Uniquement

```bash
curl -X GET "http://localhost:3003/api/v1/flights/search?originLocationCode=CDG&destinationLocationCode=NCE&departureDate=2025-11-20&adults=1&nonStop=true&max=10"
```

### Budget Limité (Max 500€)

```bash
curl -X GET "http://localhost:3003/api/v1/flights/search?originLocationCode=Paris&destinationLocationCode=Barcelona&departureDate=2025-11-25&adults=1&maxPrice=500&max=10"
```

### Voyage Familial

```bash
curl -X GET "http://localhost:3003/api/v1/flights/search?originLocationCode=CDG&destinationLocationCode=BKK&departureDate=2025-12-20&returnDate=2026-01-05&adults=2&children=2&infants=1&travelClass=ECONOMY&max=15"
```

---

## 💻 Exemples JavaScript/TypeScript

### Axios (Frontend)

```typescript
import axios from 'axios';

// Recherche simple
const searchFlights = async () => {
  try {
    const response = await axios.get('http://localhost:3003/api/v1/flights/search', {
      params: {
        originLocationCode: 'CDG',
        destinationLocationCode: 'JFK',
        departureDate: '2025-11-15',
        adults: 1,
        max: 10
      }
    });

    console.log('Flights found:', response.data.data.length);
    console.log('First flight:', response.data.data[0]);

    return response.data.data; // Array of SimplifiedFlightOfferDTO
  } catch (error) {
    console.error('Flight search error:', error.response?.data || error.message);
    throw error;
  }
};

// Aller-retour avec filtres
const searchRoundTrip = async () => {
  const params = {
    originLocationCode: 'LHR',
    destinationLocationCode: 'DXB',
    departureDate: '2025-12-01',
    returnDate: '2025-12-10',
    adults: 2,
    travelClass: 'BUSINESS',
    nonStop: false,
    maxPrice: 2000,
    max: 5
  };

  const response = await axios.get(
    'http://localhost:3003/api/v1/flights/search/simplified',
    { params }
  );

  return response.data.data;
};

// Avec gestion d'erreurs complète
const robustFlightSearch = async (searchParams) => {
  try {
    const response = await axios.get(
      'http://localhost:3003/api/v1/flights/search',
      {
        params: searchParams,
        timeout: 35000 // 35 secondes
      }
    );

    if (response.data.data.length === 0) {
      console.log('No flights found for your search criteria');
      return [];
    }

    // Trier par prix croissant
    const sortedFlights = response.data.data.sort((a, b) =>
      a.price.total - b.price.total
    );

    return sortedFlights;

  } catch (error) {
    if (error.response) {
      // Erreur API
      console.error('API Error:', error.response.status, error.response.data);

      switch (error.response.status) {
        case 400:
          throw new Error('Invalid search parameters');
        case 429:
          throw new Error('Too many requests. Please wait and try again.');
        case 500:
          throw new Error('Service temporarily unavailable');
        default:
          throw new Error('Flight search failed');
      }
    } else if (error.request) {
      // Pas de réponse
      throw new Error('No response from server. Check your connection.');
    } else {
      // Autre erreur
      throw error;
    }
  }
};
```

---

## ⚛️ Exemple React Component

```tsx
import React, { useState } from 'react';
import axios from 'axios';

interface FlightSearchForm {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  travelClass?: string;
}

const FlightSearchComponent: React.FC = () => {
  const [searchForm, setSearchForm] = useState<FlightSearchForm>({
    origin: '',
    destination: '',
    departureDate: '',
    adults: 1
  });

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        'http://localhost:3003/api/v1/flights/search',
        {
          params: {
            originLocationCode: searchForm.origin,
            destinationLocationCode: searchForm.destination,
            departureDate: searchForm.departureDate,
            returnDate: searchForm.returnDate,
            adults: searchForm.adults,
            travelClass: searchForm.travelClass,
            max: 20
          }
        }
      );

      setFlights(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search flights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flight-search">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="From (e.g., Paris, CDG)"
          value={searchForm.origin}
          onChange={(e) => setSearchForm({...searchForm, origin: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="To (e.g., New York, JFK)"
          value={searchForm.destination}
          onChange={(e) => setSearchForm({...searchForm, destination: e.target.value})}
          required
        />
        <input
          type="date"
          value={searchForm.departureDate}
          onChange={(e) => setSearchForm({...searchForm, departureDate: e.target.value})}
          required
        />
        <input
          type="date"
          placeholder="Return date (optional)"
          value={searchForm.returnDate}
          onChange={(e) => setSearchForm({...searchForm, returnDate: e.target.value})}
        />
        <input
          type="number"
          min="1"
          max="9"
          value={searchForm.adults}
          onChange={(e) => setSearchForm({...searchForm, adults: parseInt(e.target.value)})}
        />
        <select
          value={searchForm.travelClass}
          onChange={(e) => setSearchForm({...searchForm, travelClass: e.target.value})}
        >
          <option value="">Any class</option>
          <option value="ECONOMY">Economy</option>
          <option value="PREMIUM_ECONOMY">Premium Economy</option>
          <option value="BUSINESS">Business</option>
          <option value="FIRST">First Class</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search Flights'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {flights.length > 0 && (
        <div className="results">
          <h2>Found {flights.length} flights</h2>
          {flights.map((flight: any) => (
            <div key={flight.id} className="flight-card">
              <div className="route">
                <span>{flight.departure.airport}</span>
                <span>→</span>
                <span>{flight.arrival.airport}</span>
              </div>
              <div className="times">
                <span>{new Date(flight.departure.time).toLocaleString()}</span>
                <span>{flight.duration}</span>
                <span>{new Date(flight.arrival.time).toLocaleString()}</span>
              </div>
              <div className="airline">
                {flight.airline.name || flight.airline.code}
              </div>
              <div className="price">
                {flight.price.total} {flight.price.currency}
              </div>
              <div className="details">
                <span>{flight.stops} stops</span>
                <span>{flight.cabinClass}</span>
                <span>{flight.availableSeats} seats</span>
              </div>
              <div className="baggage">
                {flight.baggageAllowance.checkedBags} checked bag(s)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlightSearchComponent;
```

---

## 🔧 Exemples Node.js Backend

### Express Route Handler

```typescript
import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

router.post('/user/search-flights', async (req: Request, res: Response) => {
  try {
    const { origin, destination, departureDate, returnDate, adults } = req.body;

    // Validation
    if (!origin || !destination || !departureDate || !adults) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Appel au service voyage
    const voyageResponse = await axios.get(
      'http://localhost:3003/api/v1/flights/search',
      {
        params: {
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate,
          returnDate,
          adults,
          max: 50
        },
        timeout: 35000
      }
    );

    // Filtrage/tri côté application si nécessaire
    const flights = voyageResponse.data.data;

    // Log pour analytics
    console.log(`User searched flights: ${origin} → ${destination}, found ${flights.length} results`);

    res.json({
      success: true,
      count: flights.length,
      flights
    });

  } catch (error: any) {
    console.error('Flight search error:', error.message);

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Too many requests. Please try again in a moment.'
      });
    }

    res.status(500).json({
      error: 'Failed to search flights',
      message: error.message
    });
  }
});

export default router;
```

---

## 📊 Réponse Simplifiée (SimplifiedFlightOfferDTO)

```json
{
  "data": [
    {
      "id": "1",
      "price": {
        "total": 850.50,
        "currency": "EUR"
      },
      "duration": "PT8H30M",
      "stops": 0,
      "departure": {
        "airport": "CDG",
        "time": "2025-11-15T10:00:00.000Z",
        "terminal": "2E"
      },
      "arrival": {
        "airport": "JFK",
        "time": "2025-11-15T18:30:00.000Z",
        "terminal": "1"
      },
      "airline": {
        "code": "AF",
        "name": "Air France"
      },
      "cabinClass": "ECONOMY",
      "availableSeats": 5,
      "isRefundable": false,
      "baggageAllowance": {
        "checkedBags": 1,
        "cabinBags": 1
      }
    }
  ],
  "meta": {
    "count": 10
  }
}
```

---

## 🎯 Cas d'Usage Avancés

### 1. Comparaison de Prix

```typescript
const comparePrices = async (routes: Array<{origin: string, destination: string}>) => {
  const searches = routes.map(route =>
    axios.get('http://localhost:3003/api/v1/flights/search/simplified', {
      params: {
        originLocationCode: route.origin,
        destinationLocationCode: route.destination,
        departureDate: '2025-12-01',
        adults: 1,
        max: 5
      }
    })
  );

  const results = await Promise.all(searches);

  const comparison = results.map((res, idx) => ({
    route: `${routes[idx].origin} → ${routes[idx].destination}`,
    cheapestPrice: Math.min(...res.data.data.map(f => f.price.total)),
    currency: res.data.data[0]?.price.currency
  }));

  return comparison.sort((a, b) => a.cheapestPrice - b.cheapestPrice);
};

// Usage
const routes = [
  { origin: 'CDG', destination: 'BKK' },
  { origin: 'CDG', destination: 'SIN' },
  { origin: 'CDG', destination: 'HKG' }
];

const priceComparison = await comparePrices(routes);
console.log('Cheapest destination:', priceComparison[0]);
```

### 2. Monitoring de Prix

```typescript
const monitorPrice = async (searchParams: any) => {
  const checkPrice = async () => {
    const response = await axios.get(
      'http://localhost:3003/api/v1/flights/search',
      { params: searchParams }
    );

    const cheapestFlight = response.data.data.sort((a, b) =>
      a.price.total - b.price.total
    )[0];

    console.log(`Current cheapest price: ${cheapestFlight.price.total} ${cheapestFlight.price.currency}`);

    // Alerte si prix < threshold
    if (cheapestFlight.price.total < 500) {
      console.log('🔔 PRICE ALERT! Flight below 500€');
      // Envoyer notification...
    }
  };

  // Vérifier toutes les heures
  setInterval(checkPrice, 60 * 60 * 1000);
  await checkPrice(); // Premier check immédiat
};
```

### 3. Recommandations Personnalisées

```typescript
const getPersonalizedRecommendations = async (userPreferences: any) => {
  const { budget, preferredClass, directFlightsOnly } = userPreferences;

  const response = await axios.get(
    'http://localhost:3003/api/v1/flights/search/simplified',
    {
      params: {
        originLocationCode: 'CDG',
        destinationLocationCode: 'JFK',
        departureDate: '2025-12-01',
        adults: 1,
        travelClass: preferredClass,
        nonStop: directFlightsOnly,
        maxPrice: budget,
        max: 50
      }
    }
  );

  // Filtrer et scorer les vols selon préférences
  const scored = response.data.data.map(flight => ({
    ...flight,
    score: calculateScore(flight, userPreferences)
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, 10);
};

const calculateScore = (flight: any, prefs: any) => {
  let score = 100;

  // Bonus pour prix bas
  score += (prefs.budget - flight.price.total) / 10;

  // Bonus pour vols directs
  if (prefs.directFlightsOnly && flight.stops === 0) {
    score += 50;
  }

  // Bonus pour airline préférée
  if (prefs.preferredAirlines?.includes(flight.airline.code)) {
    score += 30;
  }

  // Bonus pour horaires
  const departureHour = new Date(flight.departure.time).getHours();
  if (departureHour >= 9 && departureHour <= 18) {
    score += 20; // Préférence pour vols de jour
  }

  return score;
};
```

---

## ⚠️ Gestion des Erreurs

```typescript
const handleFlightSearchError = (error: any) => {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        return {
          type: 'VALIDATION_ERROR',
          message: 'Invalid search parameters. Please check your input.',
          details: error.response.data
        };

      case 429:
        return {
          type: 'RATE_LIMIT',
          message: 'Too many requests. Please wait a moment and try again.',
          retryAfter: 60 // seconds
        };

      case 500:
        return {
          type: 'SERVER_ERROR',
          message: 'Service temporarily unavailable. Please try again later.'
        };

      default:
        return {
          type: 'API_ERROR',
          message: 'An unexpected error occurred.',
          details: error.response.data
        };
    }
  } else if (error.request) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Unable to reach the server. Check your internet connection.'
    };
  } else {
    return {
      type: 'CLIENT_ERROR',
      message: error.message
    };
  }
};

// Usage
try {
  const flights = await searchFlights(params);
} catch (error) {
  const errorInfo = handleFlightSearchError(error);
  console.error(`[${errorInfo.type}] ${errorInfo.message}`);

  if (errorInfo.retryAfter) {
    console.log(`Retry after ${errorInfo.retryAfter} seconds`);
  }
}
```

---

## 🚀 Performance Tips

1. **Pagination** - Limiter `max` à 10-20 pour des réponses rapides
2. **Cache** - Implémenter un cache Redis pour les recherches populaires
3. **Debouncing** - Éviter trop d'appels lors de la saisie utilisateur
4. **Compression** - Activer gzip sur les réponses
5. **Timeout** - Définir un timeout de 35 secondes max

---

## 📚 Ressources

- [Documentation API Complète](../../../IMPLEMENTATION-SUMMARY-DR61.md)
- [Tests Exemples](../../../dreamscape-tests/tests/DR-61-amadeus-integration/)
- [Amadeus API Docs](https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search)

---

**🎉 Happy Flight Searching!**
