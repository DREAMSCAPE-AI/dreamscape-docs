# AI Events

**Service consommateur** : AI Service (:3005)

L'AI Service est principalement **consommateur** d'événements. Il enrichit les vecteurs utilisateurs à chaque interaction significative.

## Topics consommés

### `dreamscape.user.onboarding.completed`

Déclenche l'initialisation du vecteur 8D utilisateur.

```typescript
// Handler dans AI Service
async onOnboardingCompleted(event: OnboardingCompletedEvent) {
  const { userId, onboardingData } = event;
  
  // Convertir les réponses d'onboarding en vecteur 8D
  const vector = VectorizationService.fromOnboarding(onboardingData);
  
  // Sauvegarder le UserVector
  await VectorService.upsertUserVector(userId, vector);
  
  // Classifier le segment utilisateur
  const segment = SegmentationService.classify(vector);
  await VectorService.updateSegment(userId, segment);
}
```

---

### `dreamscape.user.preferences.updated`

Met à jour le vecteur utilisateur quand les préférences changent.

---

### `dreamscape.voyage.booking.confirmed`

Enrichit le vecteur utilisateur avec un feedback implicite positif (la destination a été réservée → intérêt confirmé).

```typescript
async onBookingConfirmed(event: BookingConfirmedEvent) {
  // Renforcer les dimensions du vecteur cohérentes avec la destination réservée
  await VectorService.reinforceFromBooking(event.userId, event.items);
  
  // Marquer les recommandations correspondantes comme BOOKED
  await RecommendationService.markAsBooked(event.userId, event.items);
}
```

---

### `dreamscape.voyage.search.performed`

Enrichit le vecteur avec un feedback implicite faible (l'utilisateur a cherché cette destination → intérêt potentiel).

---

## Events produits (à implémenter)

> Ces topics sont planifiés pour une version future.

### `dreamscape.ai.recommendation.generated`

Confirmera la génération d'un batch de recommandations.

### `dreamscape.ai.segment.updated`

Signalera un changement de segment utilisateur.

---

## Logique de mise à jour vectorielle

L'AI Service applique un **alpha d'apprentissage** pour mettre à jour les vecteurs progressivement :

```
nouveau_vecteur = (1 - alpha) × ancien_vecteur + alpha × vecteur_implicite
```

- `alpha = 0.1` pour une recherche (signal faible)
- `alpha = 0.3` pour une réservation confirmée (signal fort)
- `alpha = 0.5` pour une complétion d'onboarding (signal initial fort)

Cela permet au système de s'adapter aux changements de préférences sans perdre l'historique.
