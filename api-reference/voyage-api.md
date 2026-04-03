# Voyage API

**Base URL** : `/api/v1/voyage` | **Service** : Voyage Service (:3003)

## Vols

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/voyage/flights/search` | Non | Rechercher des vols |
| `GET` | `/voyage/flights/destinations` | Non | Destinations disponibles |
| `GET` | `/voyage/flights/price-analysis` | Non | Analyse de prix |
| `POST` | `/voyage/flights/choice-prediction` | Non | Prédiction meilleur choix |
| `GET` | `/voyage/flights/inspiration` | Non | Suggestions de destinations |
| `GET` | `/voyage/flights/cheapest-dates` | Non | Dates les moins chères |
| `GET` | `/voyage/flights/status` | Non | Statut d'un vol |
| `GET` | `/voyage/flights/delay-prediction` | Non | Prédiction de retard |
| `GET` | `/voyage/flights/analytics/most-traveled` | Non | Destinations populaires |

### `GET /voyage/flights/search`

```bash
curl "http://localhost:3000/api/v1/voyage/flights/search?\
originLocationCode=CDG\
&destinationLocationCode=BCN\
&departureDate=2024-03-15\
&adults=2"
```

| Param | Requis | Description |
|-------|--------|-------------|
| `originLocationCode` | oui | Code IATA ou nom de ville |
| `destinationLocationCode` | oui | Code IATA ou nom de ville |
| `departureDate` | oui | YYYY-MM-DD |
| `returnDate` | non | YYYY-MM-DD (aller-retour) |
| `adults` | non | 1 défaut |
| `children` | non | 0 défaut |
| `infants` | non | 0 défaut |
| `travelClass` | non | ECONOMY \| BUSINESS \| FIRST |
| `nonStop` | non | true/false |
| `maxPrice` | non | Prix max en EUR |
| `max` | non | Max résultats (250 défaut) |

**200 OK :**
```json
{
  "data": [
    {
      "id": "...",
      "price": { "total": "299.50", "currency": "EUR" },
      "itineraries": [{
        "duration": "PT2H05M",
        "segments": [{
          "departure": { "iataCode": "CDG", "at": "2024-03-15T08:00:00" },
          "arrival": { "iataCode": "BCN", "at": "2024-03-15T10:05:00" },
          "carrierCode": "VY",
          "number": "8739"
        }]
      }]
    }
  ],
  "meta": { "count": 25 }
}
```

---

## Hôtels

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/voyage/accommodations/search` | Non | Rechercher des hôtels |
| `GET` | `/voyage/accommodations/:hotelId` | Non | Détails d'un hôtel |
| `GET` | `/voyage/accommodations/recommendations` | JWT | Recommandations hôtels |

### `GET /voyage/accommodations/search`

| Param | Requis | Description |
|-------|--------|-------------|
| `cityCode` | oui | Code IATA de la ville |
| `checkIn` | oui | YYYY-MM-DD |
| `checkOut` | oui | YYYY-MM-DD |
| `adults` | non | 1 défaut |
| `rooms` | non | 1 défaut |
| `rating` | non | 1-5 étoiles |

---

## Activités

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/voyage/activities/search` | Non | Rechercher des activités |
| `GET` | `/voyage/activities/:activityId` | Non | Détails d'une activité |
| `GET` | `/voyage/activities/recommendations` | JWT | Recommandations activités |

### `GET /voyage/activities/search`

| Param | Requis | Description |
|-------|--------|-------------|
| `latitude` | oui | Latitude |
| `longitude` | oui | Longitude |
| `radius` | non | Rayon en km (20 défaut) |
| `category` | non | Filtre catégorie |

---

## Panier

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/voyage/cart/:userId` | JWT | Récupérer le panier |
| `POST` | `/voyage/cart/items` | JWT | Ajouter un article |
| `PUT` | `/voyage/cart/:userId/items/:itemId` | JWT | Modifier quantité |
| `DELETE` | `/voyage/cart/:userId/items/:itemId` | JWT | Retirer un article |
| `DELETE` | `/voyage/cart/:userId` | JWT | Vider le panier |
| `POST` | `/voyage/cart/:userId/checkout` | JWT | Déclencher le paiement |

### `POST /voyage/cart/items`
```json
{
  "userId": "user-uuid",
  "itemType": "flight",
  "itemData": { "flightOfferId": "...", "segments": [...] },
  "quantity": 1,
  "price": 299.50,
  "currency": "EUR"
}
```
`itemType` : `flight` | `hotel` | `activity`

### `POST /voyage/cart/:userId/checkout`
```json
{
  "metadata": {
    "passengerDetails": [
      { "type": "adult", "firstName": "Jean", "lastName": "Dupont", "dateOfBirth": "1990-01-01" }
    ],
    "contactEmail": "jean@example.com"
  }
}
```

**200 OK :**
```json
{
  "success": true,
  "data": {
    "bookingReference": "DS-A7B3X2K1",
    "clientSecret": "pi_..._secret_...",
    "paymentIntentId": "pi_...",
    "amount": 299.50,
    "currency": "EUR"
  }
}
```

---

## Réservations

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/voyage/bookings` | JWT | Lister les réservations |
| `GET` | `/voyage/bookings/:reference` | JWT | Détails d'une réservation |
| `POST` | `/voyage/bookings/:reference/confirm` | JWT | Confirmer après paiement |
| `DELETE` | `/voyage/bookings/:reference` | JWT | Annuler |
| `GET` | `/voyage/bookings/:reference/pdf` | JWT | Export PDF |
| `GET` | `/voyage/bookings/:reference/ics` | JWT | Export calendrier ICS |

### `POST /voyage/bookings/:reference/confirm`
```json
{ "paymentIntentId": "pi_..." }
```

---

## Itinéraires

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/voyage/itineraries` | JWT | Lister les itinéraires |
| `POST` | `/voyage/itineraries` | JWT | Créer un itinéraire |
| `GET` | `/voyage/itineraries/:id` | JWT | Détails |
| `PUT` | `/voyage/itineraries/:id` | JWT | Modifier |
| `DELETE` | `/voyage/itineraries/:id` | JWT | Supprimer |
| `POST` | `/voyage/itineraries/:id/items` | JWT | Ajouter un élément |
| `PUT` | `/voyage/itineraries/:id/items/:itemId` | JWT | Modifier un élément |
| `DELETE` | `/voyage/itineraries/:id/items/:itemId` | JWT | Retirer un élément |

---

## Aéroports & Compagnies

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `GET` | `/voyage/airports/search` | Non | Autocomplétion aéroports |
| `GET` | `/voyage/airports/nearest` | Non | Aéroports proches |
| `GET` | `/voyage/airlines/:code` | Non | Détails compagnie |
| `GET` | `/voyage/locations/search` | Non | Recherche de destinations |
