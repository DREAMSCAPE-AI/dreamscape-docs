# Payment API

**Base URL** : `/api/v1/payment` | **Service** : Payment Service (:3004)

## Endpoints

| Méthode | Path | Auth | Description |
|---------|------|------|-------------|
| `POST` | `/payment/intent` | JWT | Créer un PaymentIntent |
| `GET` | `/payment/:paymentIntentId` | JWT | Statut d'un paiement |
| `POST` | `/payment/webhook` | Stripe signature | Webhook Stripe |
| `GET` | `/payment/history` | JWT | Historique paiements |
| `POST` | `/payment/refund` | JWT | Initier un remboursement |
| `GET` | `/health` | Non | Health check |

---

## `POST /payment/intent`

Crée un PaymentIntent Stripe. Appelé par le Voyage Service lors du checkout.

**Auth** : Bearer JWT

```bash
curl -X POST http://localhost:3000/api/v1/payment/intent \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 29950,
    "currency": "eur",
    "bookingReference": "DS-A7B3X2K1"
  }'
```

**Body :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `amount` | integer | oui | Montant en centimes (29950 = 299,50€) |
| `currency` | string | oui | Code devise ISO (eur, usd...) |
| `bookingReference` | string | oui | Référence réservation |
| `metadata` | object | non | Métadonnées additionnelles |

**200 OK :**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_3Ox...8j_secret_...",
    "paymentIntentId": "pi_3Ox...8j",
    "amount": 29950,
    "currency": "eur",
    "status": "requires_payment_method"
  }
}
```

---

## `GET /payment/:paymentIntentId`

**200 OK :**
```json
{
  "success": true,
  "data": {
    "id": "pi_...",
    "status": "succeeded",
    "amount": 29950,
    "currency": "eur",
    "bookingReference": "DS-A7B3X2K1",
    "createdAt": "2024-03-15T10:30:00Z"
  }
}
```

**Statuts Stripe :**
- `requires_payment_method` — En attente de méthode de paiement
- `requires_confirmation` — En attente de confirmation
- `processing` — Traitement en cours
- `succeeded` — Paiement réussi
- `canceled` — Annulé

---

## `POST /payment/webhook`

**Requiert** : Header `stripe-signature` + `STRIPE_WEBHOOK_SECRET`

> Ce endpoint utilise le body brut (`express.raw()`). Ne jamais envoyer un body JSON parsé.

**En développement (Stripe CLI) :**
```bash
stripe listen --forward-to http://localhost:3004/api/v1/payment/webhook
```

**Événements traités :**

| Événement Stripe | Action |
|-----------------|--------|
| `payment_intent.succeeded` | Publie `dreamscape.payment.completed` |
| `payment_intent.payment_failed` | Publie `dreamscape.payment.failed` |
| `payment_intent.canceled` | Publie `dreamscape.payment.cancelled` |
| `charge.dispute.created` | Log dispute |

**200 OK :** `{ "received": true }`

---

## `POST /payment/refund`

**Auth** : Bearer JWT (admin ou propriétaire de la réservation)

```json
{
  "paymentIntentId": "pi_...",
  "amount": 10000,
  "reason": "customer_request"
}
```

`reason` : `duplicate` | `fraudulent` | `customer_request`

---

## `GET /payment/history`

**Query params :** `limit`, `offset`, `status`, `from`, `to`

**200 OK :**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "paymentIntentId": "pi_...",
        "amount": 29950,
        "currency": "eur",
        "status": "succeeded",
        "bookingReference": "DS-...",
        "createdAt": "2024-03-15T10:30:00Z"
      }
    ],
    "total": 5
  }
}
```
