# Voyage Events

**Service producteur** : Voyage Service (:3003)
**Service consommateur** : AI Service, User Service (notifications)

## Topics produits

### `dreamscape.voyage.search.performed`

Déclenché à chaque recherche (vols, hôtels, activités).

```typescript
interface SearchPerformedEvent {
  searchId: string;
  sessionId: string;          // userId ou 'anonymous'
  searchType: 'flight' | 'hotel' | 'activity';
  criteria: {
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    passengers?: number;
    cityCode?: string;
    checkIn?: string;
    checkOut?: string;
  };
  resultsCount: number;
  searchedAt: string;         // ISO 8601
}
```

---

### `dreamscape.voyage.cart.checkout`

Déclenché quand l'utilisateur lance le processus de paiement.

```typescript
interface CartCheckoutEvent {
  checkoutId: string;
  userId: string;
  cartId: string;
  items: Array<{
    itemType: 'flight' | 'hotel' | 'activity';
    itemId: string;
    price: number;
    currency: string;
  }>;
  totalAmount: number;
  currency: string;
  bookingReference: string;
  paymentIntentId: string;
  checkoutAt: string;
}
```

---

### `dreamscape.voyage.booking.created`

Déclenché lors de la création d'une réservation en attente de paiement.

```typescript
interface BookingCreatedEvent {
  bookingId: string;
  bookingReference: string;
  userId: string;
  status: 'PENDING';
  items: BookingItem[];
  totalAmount: number;
  currency: string;
  createdAt: string;
}
```

---

### `dreamscape.voyage.booking.confirmed`

Déclenché après confirmation du paiement (consommé depuis `dreamscape.payment.completed`).

```typescript
interface BookingConfirmedEvent {
  bookingId: string;
  bookingReference: string;
  userId: string;
  status: 'CONFIRMED';
  paymentIntentId: string;
  confirmedAt: string;
  items: BookingItem[];
  totalAmount: number;
  currency: string;
}
```

---

### `dreamscape.voyage.booking.cancelled`

```typescript
interface BookingCancelledEvent {
  bookingId: string;
  bookingReference: string;
  userId: string;
  reason: string;
  cancelledAt: string;
  refundEligible: boolean;
}
```

---

## Topics consommés

### `dreamscape.payment.completed`

Consommé pour confirmer une réservation en attente.

```typescript
// Handler dans Voyage Service
async onPaymentCompleted(event: PaymentCompletedEvent) {
  const booking = await BookingService.findByPaymentIntentId(event.paymentIntentId);
  if (booking) {
    await BookingService.confirm(booking.id);
    // Publie dreamscape.voyage.booking.confirmed
  }
}
```

---

### `dreamscape.payment.failed`

Consommé pour annuler une réservation en attente.

```typescript
async onPaymentFailed(event: PaymentFailedEvent) {
  const booking = await BookingService.findByPaymentIntentId(event.paymentIntentId);
  if (booking && booking.status === 'PENDING') {
    await BookingService.cancel(booking.id, 'payment_failed');
  }
}
```

---

## Partitionnement

Les événements de voyage sont partitionnés par `userId` pour garantir l'ordre des messages pour un même utilisateur.
