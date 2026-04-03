# Stores & State Management

## Architecture

Le Web Client utilise deux couches de gestion d'état :

- **Zustand** : État global côté client (panier, auth, navigation)
- **React Query** : État serveur (données fetch, cache, synchronisation)

```
src/store/          # Stores Zustand
src/contexts/       # React Contexts (opérations batch)
```

## Stores Zustand

### `useAuth` (via AuthService)

Gère l'état d'authentification.

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  checkAuth(): Promise<void>;
  updateUser(user: Partial<User>): void;
}
```

**Persistance** : localStorage, clé `auth-storage`

---

### `useCartStore`

Gère le panier multi-articles.

```typescript
interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isCheckingOut: boolean;
  isDrawerOpen: boolean;
  error: string | null;

  // Computed
  getItemCount(): number;
  getTotalPrice(): number;
  getTimeRemaining(): string;  // Expiration du panier

  // Actions
  fetchCart(userId: string): Promise<void>;
  addToCart(data: AddToCartDto): Promise<void>;
  removeItem(userId: string, itemId: string): Promise<void>;
  updateQuantity(userId: string, itemId: string, qty: number): Promise<void>;
  clearCart(userId: string): Promise<void>;
  checkout(userId: string, metadata: CheckoutMetadata): Promise<CheckoutResult>;
  openDrawer(): void;
  closeDrawer(): void;
}
```

**Persistance** : localStorage

---

### `useFlightBookingStore`

Suit la progression du tunnel de réservation de vols.

```typescript
interface FlightBookingState {
  selectedOffer: FlightOffer | null;
  passengers: PassengerInfo[];
  step: 'selection' | 'passengers' | 'payment' | 'confirmation';

  setSelectedOffer(offer: FlightOffer): void;
  setPassengers(passengers: PassengerInfo[]): void;
  nextStep(): void;
  reset(): void;
}
```

---

### `useHotelBookingStore`

Tunnel de réservation hôtel.

```typescript
interface HotelBookingState {
  selectedHotel: Hotel | null;
  selectedOffer: HotelOffer | null;
  checkIn: string;
  checkOut: string;
  guests: GuestInfo[];
  step: 'selection' | 'details' | 'payment' | 'confirmation';
}
```

---

### `useItineraryStore`

Gestion des itinéraires de voyage.

```typescript
interface ItineraryState {
  itineraries: Itinerary[];
  currentItinerary: Itinerary | null;

  fetchItineraries(): Promise<void>;
  createItinerary(data: CreateItineraryDto): Promise<Itinerary>;
  addItem(itineraryId: string, item: ItineraryItemDto): Promise<void>;
  removeItem(itineraryId: string, itemId: string): Promise<void>;
  clearStore(): void;  // Appelé au logout
}
```

---

### `useOnboardingStore`

Progression et état de l'onboarding.

```typescript
interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  data: Partial<OnboardingData>;

  nextStep(): void;
  prevStep(): void;
  saveStepData(step: string, data: object): void;
  complete(): Promise<void>;
}
```

**Persistance** : localStorage (conserve la progression)

---

### `useMobileStore`

État de la navigation mobile.

```typescript
interface MobileState {
  isMenuOpen: boolean;
  openMenu(): void;
  closeMenu(): void;
  toggleMenu(): void;
}
```

---

## React Query

Configuration globale dans `src/main.tsx` :

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,  // 5 minutes
    },
  },
});
```

**Utilisé pour :**
- Résultats de recherche (vols, hôtels, activités)
- Données de bookings
- Profil utilisateur
- Recommandations IA

**Exemple :**
```typescript
const { data: flights, isLoading } = useQuery({
  queryKey: ['flights', searchParams],
  queryFn: () => VoyageService.searchFlights(searchParams),
  enabled: !!searchParams.originLocationCode,
});
```

---

## FavoritesBatchContext

Permet les opérations batch sur les favoris (sélectionner et ajouter/supprimer plusieurs items).

```typescript
interface FavoritesBatchContextType {
  selectedItems: string[];
  isSelecting: boolean;
  toggleSelect(id: string): void;
  startSelecting(): void;
  stopSelecting(): void;
  batchAdd(): Promise<void>;
  batchRemove(): Promise<void>;
}
```

---

## Bonnes pratiques

- Les stores Zustand sont réinitialisés au logout (appeler `clearStore()` sur les stores qui contiennent des données utilisateur)
- Les stores persistés en localStorage contiennent uniquement des données non-sensibles (jamais de données de carte bancaire)
- React Query gère le cache serveur — ne pas dupliquer dans Zustand
- Les actions asynchrones dans les stores font appel aux classes de `src/services/`
