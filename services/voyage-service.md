# Voyage Service

**Port** : 3003 | **Package** : `dreamscape-voyage-service` | **Pod** : Business

## Responsabilités

- Recherche de vols, hôtels et activités via l'API Amadeus
- Gestion du panier multi-articles (vols + hôtels + activités)
- Réservations et confirmations
- Génération d'itinéraires avec export PDF et ICS
- Analyse de prix et prédiction de retards
- Suivi de l'historique de recherches

## Stack technique

| Dépendance | Usage |
|------------|-------|
| Amadeus SDK | API vols, hôtels, activités, analytics |
| Prisma 5.7 | ORM PostgreSQL |
| Redis | Cache des résultats Amadeus |
| jsPDF 4.0 | Export itinéraires en PDF |
| ics 3.8 | Export calendrier .ics |
| kafkajs 2.2 | Événements réservation |

## Routes

| Module | Préfixe | Fichier |
|--------|---------|---------|
| Vols | `/api/v1/voyage/flights` | `routes/flights.ts` |
| Hôtels | `/api/v1/voyage/accommodations` | `routes/hotels.ts` |
| Activités | `/api/v1/voyage/activities` | `routes/activities.ts` |
| Panier | `/api/v1/voyage/cart` | `routes/cart.ts` |
| Réservations | `/api/v1/voyage/bookings` | `routes/bookings.ts` |
| Itinéraires | `/api/v1/voyage/itineraries` | `routes/itineraries.ts` |
| Compagnies | `/api/v1/voyage/airlines` | `routes/airlines.ts` |
| Aéroports | `/api/v1/voyage/airports` | `routes/airports.ts` |
| Destinations | `/api/v1/voyage/locations` | `routes/locations.ts` |
| Transferts | `/api/v1/voyage/transfers` | `routes/transfers.ts` |

---

## Vols

### `GET /api/v1/voyage/flights/search`
Recherche de vols disponibles.

**Query params :**
| Param | Type | Requis | Description |
|-------|------|--------|-------------|
| `originLocationCode` | string | oui | Code IATA ou nom de ville |
| `destinationLocationCode` | string | oui | Code IATA ou nom de ville |
| `departureDate` | string | oui | Format YYYY-MM-DD |
| `returnDate` | string | non | Format YYYY-MM-DD (aller-retour) |
| `adults` | number | non | 1 par défaut |
| `children` | number | non | 0 par défaut |
| `infants` | number | non | 0 par défaut |
| `travelClass` | string | non | ECONOMY, BUSINESS, FIRST |
| `nonStop` | boolean | non | Vols directs uniquement |
| `maxPrice` | number | non | Prix maximum en EUR |
| `max` | number | non | Nombre max de résultats (250 par défaut) |

**Réponse :** Liste simplifiée de `FlightOffer` avec compagnies, escales, prix, durée.

**Kafka event** : `dreamscape.voyage.search.performed` (searchType: 'flight')

> Les codes de ville sont automatiquement résolus en codes IATA (`CDG`, `JFK`...).

---

### `GET /api/v1/voyage/flights/destinations`
Recherche de destinations disponibles depuis une origine.

### `GET /api/v1/voyage/flights/price-analysis`
Analyse des tendances de prix sur une période.

### `GET /api/v1/voyage/flights/choice-prediction`
Prédit le meilleur choix parmi plusieurs offres (ML Amadeus).

**Method** : POST | **Body** : `{ "flightOffers": [...] }`

### `GET /api/v1/voyage/flights/inspiration`
Suggestions de destinations depuis une ville d'origine.

### `GET /api/v1/voyage/flights/cheapest-dates`
Trouve les dates les moins chères sur un mois.

### `GET /api/v1/voyage/flights/status`
Statut en temps réel d'un vol.

**Query** : `carrierCode`, `flightNumber`, `scheduledDepartureDate`

### `GET /api/v1/voyage/flights/delay-prediction`
Prédiction de retard pour un vol donné.

### `GET /api/v1/voyage/flights/analytics/most-traveled`
Destinations les plus fréquentées dans la période.

---

## Hôtels

### `GET /api/v1/voyage/accommodations/search`
Recherche d'hôtels par ville ou coordonnées.

**Query params :** `cityCode`, `checkIn`, `checkOut`, `adults`, `rooms`, `rating`

### `GET /api/v1/voyage/accommodations/:hotelId`
Détails et disponibilités d'un hôtel.

### `GET /api/v1/voyage/accommodations/recommendations`
Recommandations hôtels basées sur le profil utilisateur (intégration AI Service).

---

## Activités

### `GET /api/v1/voyage/activities/search`
Recherche d'activités par localisation.

**Query params :** `latitude`, `longitude`, `radius`, `category`

### `GET /api/v1/voyage/activities/:activityId`
Détails d'une activité.

### `GET /api/v1/voyage/activities/recommendations`
Recommandations d'activités (intégration AI Service).

---

## Panier

### `GET /api/v1/voyage/cart/:userId`
Récupère le panier de l'utilisateur.

### `POST /api/v1/voyage/cart/items`
Ajoute un article au panier.

**Body :**
```json
{
  "userId": "...",
  "itemType": "flight",   // "flight" | "hotel" | "activity"
  "itemData": { ... },    // données de l'offre Amadeus
  "quantity": 1,
  "price": 299.99,
  "currency": "EUR"
}
```

### `PUT /api/v1/voyage/cart/:userId/items/:itemId`
Met à jour la quantité d'un article.

### `DELETE /api/v1/voyage/cart/:userId/items/:itemId`
Retire un article du panier.

### `DELETE /api/v1/voyage/cart/:userId`
Vide le panier.

### `POST /api/v1/voyage/cart/:userId/checkout`
Lance le processus de paiement.

**Body :**
```json
{
  "metadata": {
    "passengerDetails": [...],
    "contactEmail": "..."
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "bookingReference": "DS-XXXXXXXX",
    "clientSecret": "pi_..._secret_...",   // Stripe PaymentIntent
    "paymentIntentId": "pi_...",
    "amount": 299.99,
    "currency": "EUR"
  }
}
```

**Kafka event** : `dreamscape.voyage.cart.checkout`

---

## Réservations

### `GET /api/v1/voyage/bookings`
Liste les réservations de l'utilisateur.

### `GET /api/v1/voyage/bookings/:reference`
Détails d'une réservation par référence.

### `POST /api/v1/voyage/bookings/:reference/confirm`
Confirme une réservation après paiement Stripe.

**Body :** `{ "paymentIntentId": "pi_..." }`

**Kafka event** : `dreamscape.voyage.booking.confirmed`

### `DELETE /api/v1/voyage/bookings/:reference`
Annule une réservation.

### `GET /api/v1/voyage/bookings/:reference/pdf`
Génère et retourne le PDF de la réservation.

### `GET /api/v1/voyage/bookings/:reference/ics`
Génère le fichier ICS pour l'ajout au calendrier.

---

## Itinéraires

### `GET /api/v1/voyage/itineraries`
Liste les itinéraires de l'utilisateur.

### `POST /api/v1/voyage/itineraries`
Crée un nouvel itinéraire.

### `GET /api/v1/voyage/itineraries/:id`
Détails d'un itinéraire.

### `PUT /api/v1/voyage/itineraries/:id`
Met à jour un itinéraire.

### `DELETE /api/v1/voyage/itineraries/:id`
Supprime un itinéraire.

### `POST /api/v1/voyage/itineraries/:id/items`
Ajoute un élément à l'itinéraire (vol, hôtel, activité, note).

### `PUT /api/v1/voyage/itineraries/:id/items/:itemId`
Met à jour un élément.

### `DELETE /api/v1/voyage/itineraries/:id/items/:itemId`
Retire un élément.

---

## Aéroports & Compagnies

### `GET /api/v1/voyage/airports/search?query=Paris`
Autocomplétion des aéroports.

### `GET /api/v1/voyage/airports/nearest?lat=48.8566&lng=2.3522`
Aéroports les plus proches d'une coordonnée.

### `GET /api/v1/voyage/airlines/:code`
Détails d'une compagnie aérienne.

---

## Modèles Prisma

| Modèle | Description |
|--------|-------------|
| `FlightData` | Données de vols mis en cache |
| `HotelData` | Données d'hôtels mis en cache |
| `LocationData` | Villes et aéroports |
| `Cart` | Panier utilisateur |
| `CartItem` | Article du panier |
| `BookingData` | Réservation confirmée |
| `Itinerary` | Itinéraire de voyage |
| `ItineraryItem` | Élément d'itinéraire |
| `SearchHistory` | Historique des recherches |

## Événements Kafka

### Produits

| Topic | Déclencheur |
|-------|-------------|
| `dreamscape.voyage.search.performed` | Recherche de vols/hôtels/activités |
| `dreamscape.voyage.cart.checkout` | Déclenchement du paiement |
| `dreamscape.voyage.booking.created` | Création d'une réservation |
| `dreamscape.voyage.booking.confirmed` | Confirmation après paiement |
| `dreamscape.voyage.booking.cancelled` | Annulation |

### Consommés

| Topic | Action |
|-------|--------|
| `dreamscape.payment.completed` | Confirme la réservation en attente |
| `dreamscape.payment.failed` | Annule la réservation en attente |

## Intégration Amadeus

Voir [Limitations API Amadeus (test)](../reference/amadeus-test-limitations.md) pour les restrictions en environnement test (8 villes disponibles, données fictives).

- `AMADEUS_HOSTNAME=test` → environnement sandbox Amadeus
- `AMADEUS_HOSTNAME=production` → API live (clés de production requises)
- Le cache Redis réduit les appels Amadeus (TTL configurable)
