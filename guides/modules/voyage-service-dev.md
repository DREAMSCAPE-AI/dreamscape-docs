# Guide de développement — Voyage Service

**Port** : 3003 · **Pod** : Business · **Stack** : Node 18+ / Express / Prisma / Redis / Kafka / Amadeus SDK

## 1. Vue d'ensemble

Cœur métier voyage : recherche de vols/hôtels/activités via **Amadeus**, gestion du panier multi-articles, réservations, itinéraires, exports PDF/ICS.

**Fonctions** :
- Recherche vols (Amadeus Flight Offers Search)
- Recherche hôtels et activités
- Analyse de prix, dates les moins chères, prédictions
- Panier multi-articles (flight + hotel + activity)
- Checkout → orchestration paiement (appelle Payment Service)
- Réservations (création, confirmation post-paiement, annulation)
- Itinéraires personnalisés (drag & drop côté front)
- Exports PDF (réservations) et ICS (calendrier)

## 2. Prérequis

```bash
NODE_ENV=development
PORT=3003
DATABASE_URL=postgresql://...
JWT_SECRET=<partagé>
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092

# Amadeus (compte test gratuit sur developers.amadeus.com)
AMADEUS_API_KEY=...
AMADEUS_API_SECRET=...
AMADEUS_ENV=test                              # test | production

# Communication inter-services
PAYMENT_SERVICE_URL=http://localhost:3004
USER_SERVICE_URL=http://localhost:3002
```

> ⚠️ Amadeus **test** a des limitations sévères : voir [`reference/amadeus-test-limitations.md`](../../reference/amadeus-test-limitations.md).

## 3. Démarrage local

```bash
cd dreamscape-services/voyage
npm install
npx prisma generate
npm run dev
# → http://localhost:3003/health
```

Test recherche de vols :
```bash
curl "http://localhost:3003/api/v1/voyage/flights/search?\
originLocationCode=CDG&destinationLocationCode=BCN&departureDate=2026-06-15&adults=1"
```

## 4. Architecture du code

```
voyage/
├── src/
│   ├── config/             # Amadeus client, Redis, env
│   ├── services/
│   │   ├── AmadeusService.ts        # wrapper Amadeus SDK
│   │   ├── FlightService.ts         # logique métier vols
│   │   ├── HotelService.ts
│   │   ├── ActivityService.ts
│   │   ├── CartService.ts           # gestion panier + verrou checkout
│   │   ├── BookingService.ts        # création/confirmation/annulation
│   │   ├── ItineraryService.ts
│   │   └── ExportService.ts         # PDF (pdfkit) + ICS (ical-generator)
│   ├── routes/
│   ├── middleware/
│   └── server.ts
└── tests/
```

**Fichiers clés** :
- `services/AmadeusService.ts` — gestion du token OAuth Amadeus (cache 30 min)
- `services/CartService.ts` — règles de cohérence (un seul vol par panier, etc.)
- `services/BookingService.ts` — état machine `PENDING → CONFIRMED → CANCELLED`

## 5. Base de données

Modèles : `FlightData`, `HotelData`, `BookingData`, `LocationData`, `Itinerary`, `ItineraryItem`, `CartData`, `CartItem`, `SearchHistory`.

> Le `BookingData.reference` (ex : `DS-A7B3X2K1`) est l'identifiant **public** utilisé partout (URLs, exports, paiements).

## 6. Endpoints

Spec : [`api-reference/openapi/voyage.openapi.yaml`](../../api-reference/openapi/voyage.openapi.yaml)
Markdown : [`api-reference/voyage-api.md`](../../api-reference/voyage-api.md)

**Domaines** : flights, accommodations, activities, cart, bookings, itineraries, reference (airports/airlines/locations).

## 7. Événements Kafka

**Publiés** :
- `dreamscape.voyage.search.performed`
- `dreamscape.voyage.cart.item.added` / `removed`
- `dreamscape.voyage.booking.created` / `confirmed` / `cancelled`
- `dreamscape.voyage.itinerary.created`

**Consommés** :
- `dreamscape.payment.completed` → confirme automatiquement la réservation associée
- `dreamscape.payment.failed` → libère le panier

Pattern checkout :
```
[user] POST /cart/{userId}/checkout
       └─→ Voyage crée booking PENDING
       └─→ Voyage POST /payment/intent (HTTP)
       └─→ retourne clientSecret au front
[front] confirmCardPayment(clientSecret)
[Stripe webhook] → Payment publie payment.completed
[Voyage consumer] → marque booking CONFIRMED, publie booking.confirmed
```

## 8. Cache Redis

Voir [`guides/redis-cache.md`](../redis-cache.md).

Clés utilisées :
| Clé | TTL | Usage |
|-----|-----|-------|
| `voyage:flights:search:<hash>` | 5 min | Cache résultats Amadeus |
| `voyage:cart:lock:<userId>` | 15 min | Verrou panier pendant checkout |
| `voyage:amadeus:token` | 25 min | Token OAuth Amadeus |

## 9. Tests

```bash
npm test
npm run test:integration         # mocks Amadeus
npm run test:e2e:cart            # depuis dreamscape-tests/
```

⚠️ Les tests d'intégration **mockent** Amadeus (pas d'appels réels). Mock dans `tests/mocks/amadeus.ts`.

## 10. Debug & pièges

| Symptôme | Cause | Solution |
|----------|-------|----------|
| `AMADEUS_API_KEY required` | Var non chargée | Vérifier `.env` et redémarrer |
| `Token expired` Amadeus | Cache Redis vide | Le service rafraîchit auto, sinon `redis-cli DEL voyage:amadeus:token` |
| `Booking not confirmed` après paiement | Consumer Kafka HS | Vérifier que kafka est UP et que voyage écoute `dreamscape.payment.completed` |
| Erreur PDF generation | Police manquante en prod | Vérifier que `assets/fonts/` est dans l'image Docker |
| Recherche vol vide en prod | Limites Amadeus test | Vérifier `AMADEUS_ENV=production` |

## 11. Contribution

Ajouter un nouvel itemType dans le panier :
1. Étendre `enum CartItemType` dans Prisma + `db push`
2. Ajouter une stratégie de calcul de prix dans `CartService.calculateItemTotal()`
3. Mettre à jour la spec OpenAPI (`itemType` enum)
4. Frontend : composant d'affichage dans `web-client/src/components/Cart/`
