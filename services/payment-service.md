# Payment Service

**Port** : 3004 | **Package** : `@dreamscape/payment-service` | **Pod** : Business

## Responsabilités

- Traitement des paiements via Stripe PaymentIntents
- Gestion des webhooks Stripe (traitement idempotent)
- Suivi des transactions et états de paiement
- Publication d'événements Kafka pour déclencher la confirmation de réservation

## Stack technique

| Dépendance | Usage |
|------------|-------|
| Stripe SDK | Paiements, webhooks |
| Express 4.18 | Framework HTTP |
| Prisma 5.7 | ORM PostgreSQL |
| kafkajs 2.2 | Événements paiement |

> **Important** : Ce service utilise `ts-node + nodemon` (pas `tsx`) pour le hot reload. Ne pas changer cette configuration.

## Configuration

| Variable | Description |
|----------|-------------|
| `PORT` | `3004` (ou `process.env.PORT || 3004`) |
| `DATABASE_URL` | Connexion PostgreSQL |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (`sk_test_...` en dev) |
| `STRIPE_WEBHOOK_SECRET` | Secret de validation des webhooks (`whsec_...`) |
| `KAFKA_BROKERS` | Adresses Kafka |
| `VOYAGE_SERVICE_URL` | `http://localhost:3003` |

## Endpoints

### `POST /api/v1/payment/intent`
Crée un PaymentIntent Stripe pour un montant donné.

**Auth** : Bearer JWT

**Body :**
```json
{
  "amount": 29999,           // montant en centimes
  "currency": "eur",
  "bookingReference": "DS-XXXXXXXX",
  "metadata": {
    "userId": "...",
    "bookingId": "..."
  }
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_..._secret_...",
    "paymentIntentId": "pi_...",
    "amount": 29999,
    "currency": "eur"
  }
}
```

---

### `GET /api/v1/payment/:paymentIntentId`
Récupère le statut d'un paiement.

**Auth** : Bearer JWT

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "pi_...",
    "status": "succeeded",   // requires_payment_method | requires_confirmation | processing | succeeded | canceled
    "amount": 29999,
    "currency": "eur"
  }
}
```

---

### `POST /api/v1/payment/webhook`
Endpoint Stripe webhook. Reçoit les événements de paiement de Stripe.

**Auth** : Signature Stripe (header `stripe-signature` + `STRIPE_WEBHOOK_SECRET`)

> Ce endpoint utilise `express.raw()` (body brut nécessaire pour la vérification de signature). Ne pas appliquer `express.json()` sur cette route.

**Événements traités :**
- `payment_intent.succeeded` → publie `dreamscape.payment.completed`
- `payment_intent.payment_failed` → publie `dreamscape.payment.failed`
- `charge.dispute.created` → log de dispute
- `payment_intent.canceled` → publie `dreamscape.payment.cancelled`

**Idempotence** : Chaque webhook est dédupliqué via le modèle `ProcessedWebhookEvent` (l'ID de l'événement Stripe est stocké pour éviter le double traitement).

---

### `GET /api/v1/payment/history`
Historique des paiements de l'utilisateur.

**Auth** : Bearer JWT

---

### `POST /api/v1/payment/refund`
Initie un remboursement.

**Auth** : Bearer JWT (admin ou propriétaire)

**Body :** `{ "paymentIntentId": "pi_...", "amount": 10000, "reason": "..." }`

---

### `GET /health`
```json
{ "status": "healthy", "database": "connected" }
```

## Modèles Prisma

| Modèle | Description |
|--------|-------------|
| `PaymentTransaction` | Enregistrement de chaque transaction |
| `ProcessedWebhookEvent` | Déduplications des webhooks Stripe |

## Événements Kafka

### Produits

| Topic | Déclencheur | Payload clés |
|-------|-------------|-------------|
| `dreamscape.payment.initiated` | Création d'un PaymentIntent | paymentIntentId, userId, amount, currency, bookingReference |
| `dreamscape.payment.completed` | Webhook `payment_intent.succeeded` | paymentIntentId, userId, amount, bookingReference, completedAt |
| `dreamscape.payment.failed` | Webhook `payment_intent.payment_failed` | paymentIntentId, userId, reason, failedAt |
| `dreamscape.payment.refunded` | Remboursement traité | paymentIntentId, amount, reason |

## Flux de paiement complet

```
1. Voyage Service /cart/:userId/checkout
   → Crée BookingData (status: PENDING)
   → Appelle Payment Service pour créer PaymentIntent
   → Retourne clientSecret au frontend

2. Frontend (Stripe Elements)
   → stripe.confirmPayment(clientSecret)
   → Paiement traité par Stripe

3. Stripe → POST /api/v1/payment/webhook
   → Vérifie signature
   → Déduplique (ProcessedWebhookEvent)
   → Publie dreamscape.payment.completed

4. Voyage Service (consumer Kafka)
   → Consomme dreamscape.payment.completed
   → Met à jour BookingData (status: CONFIRMED)
   → Envoie notification utilisateur

5. Frontend
   → POST /api/v1/voyage/bookings/:reference/confirm
   → Affiche page de confirmation
```

## Sécurité

- Validation de signature des webhooks Stripe (header `stripe-signature`)
- Body brut obligatoire sur `/webhook` (pas de parsing JSON)
- Idempotence via `ProcessedWebhookEvent` (prevent double processing)
- Clés Stripe jamais dans le repo (variables d'environnement uniquement)

Voir [Analyse sécurité Payment](../security/payment-security.md) pour l'audit complet (score 95/100, PCI DSS 12/12).
