# Flux panier et réservation

Guide du parcours d'achat complet, du panier jusqu'à la confirmation de réservation.

## Vue d'ensemble

```
Utilisateur
    │
    ▼
[Recherche vol/hôtel/activité]
    │ Voyage Service
    ▼
[Ajout au panier]
    │ CartService → POST /voyage/cart/items
    ▼
[Page Checkout]
    │ CartService → POST /voyage/cart/:userId/checkout
    │ → Crée BookingData (PENDING)
    │ → Demande PaymentIntent à Payment Service
    ▼
[Formulaire Stripe]
    │ stripe.confirmPayment(clientSecret)
    ▼
[Stripe → Webhook]
    │ POST /payment/webhook
    │ → Vérifie signature
    │ → Publie dreamscape.payment.completed (Kafka)
    ▼
[Voyage Service consomme l'événement]
    │ BookingData → CONFIRMED
    │ Notification envoyée à l'utilisateur
    ▼
[Confirmation frontend]
    │ POST /voyage/bookings/:reference/confirm
    │ Redirect /payment/confirmation
    ▼
[Panier vidé]
```

## Séquence détaillée

### 1. Ajouter au panier

```typescript
// Frontend
const result = await CartService.addToCart({
  userId: user.id,
  itemType: 'flight',
  itemData: selectedOffer,
  quantity: 1,
  price: selectedOffer.price.total,
  currency: 'EUR'
});
```

**Backend (Voyage Service) :**
- Crée ou récupère le `Cart` (status: ACTIVE)
- Ajoute un `CartItem` avec les données complètes de l'offre Amadeus
- Calcule le total du panier
- Le panier expire après un délai configurable (countdown visible dans l'UI)

---

### 2. Checkout

```typescript
// Frontend (useCartStore)
const { bookingReference, clientSecret, paymentIntentId, amount } =
  await CartService.checkout(user.id, {
    passengerDetails: [...],
    contactEmail: user.email
  });
```

**Backend (Voyage Service) :**
1. Valide que le panier est actif et non expiré
2. Crée `BookingData` (status: PENDING, reference: `DS-XXXXXXXX`)
3. Appelle Payment Service : `POST /payment/intent` avec le montant total
4. Reçoit `clientSecret` et `paymentIntentId` de Stripe
5. Stocke le `paymentIntentId` dans `BookingData`
6. Met le panier en status CHECKED_OUT
7. Publie `dreamscape.voyage.cart.checkout` (Kafka)
8. Retourne `clientSecret`, `bookingReference`, `amount` au frontend

---

### 3. Paiement Stripe

```typescript
// Frontend (StripeCheckoutForm)
const { error } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: `${window.location.origin}/payment/confirmation`,
  },
  redirect: 'if_required',
});

if (!error) {
  // Confirmer côté backend
  await BookingService.confirmBooking(bookingReference, paymentIntentId);
  navigate('/payment/confirmation');
}
```

---

### 4. Confirmation via Webhook Stripe

Stripe envoie un événement `payment_intent.succeeded` au Payment Service :

**Backend (Payment Service) :**
1. Vérifie la signature du webhook (`stripe-signature` header)
2. Vérifie l'idempotence (`ProcessedWebhookEvent`)
3. Met à jour `PaymentTransaction` (status: SUCCEEDED)
4. Publie `dreamscape.payment.completed` (Kafka)

---

### 5. Confirmation côté Voyage Service (Kafka consumer)

**Backend (Voyage Service) :**
1. Consomme `dreamscape.payment.completed`
2. Trouve `BookingData` par `paymentIntentId`
3. Met à jour le status → CONFIRMED
4. Publie `dreamscape.voyage.booking.confirmed` (Kafka)

**Backend (User Service, Kafka consumer) :**
1. Consomme `dreamscape.voyage.booking.confirmed`
2. Envoie notification temps réel via Socket.IO
3. Envoie email de confirmation via SendGrid

---

### 6. Confirmation frontend

```typescript
// Frontend — après succès Stripe
await BookingService.confirmBooking(bookingReference, paymentIntentId);
useCartStore.getState().clearCart(user.id);
navigate('/payment/confirmation');
```

---

## États du panier

| Status | Description |
|--------|-------------|
| `ACTIVE` | Panier en cours, peut être modifié |
| `CHECKED_OUT` | Checkout lancé, en attente de paiement |
| `ABANDONED` | Expiré sans paiement |

## États d'une réservation

| Status | Description |
|--------|-------------|
| `PENDING` | Réservation créée, paiement en attente |
| `CONFIRMED` | Paiement reçu, réservation confirmée |
| `CANCELLED` | Annulée (par l'utilisateur ou paiement échoué) |
| `REFUNDED` | Remboursée |

## Gestion des erreurs

| Scénario | Comportement |
|----------|-------------|
| Panier expiré | Erreur 400 au checkout, panier vidé, redirect vers recherche |
| Paiement refusé | Stripe retourne une erreur, user peut réessayer avec une autre carte |
| Webhook en doublon | Ignoré grâce à `ProcessedWebhookEvent` (idempotence) |
| Payment service down | Le checkout échoue, booking n'est pas créé |
| Voyage service consumer down | La réservation reste PENDING jusqu'au redémarrage (Kafka rejoue) |

## Export de réservation

Après confirmation, l'utilisateur peut télécharger :
- **PDF** : `GET /api/v1/voyage/bookings/:reference/pdf` (généré avec jsPDF)
- **Calendrier** : `GET /api/v1/voyage/bookings/:reference/ics` (format .ics)
