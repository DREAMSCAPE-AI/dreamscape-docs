# Couche Services (API)

Les classes services dans `src/services/` encapsulent tous les appels API vers le backend. Elles sont injectées dans les stores Zustand et les hooks React Query.

## Structure

```
src/services/
├── auth/
│   └── AuthService.ts          # Auth Service (:3001)
├── user/
│   ├── ProfileService.ts       # Profils utilisateur
│   ├── OnboardingService.ts    # Onboarding
│   ├── FavoritesService.ts     # Favoris
│   ├── HistoryService.ts       # Historique
│   └── GdprService.ts          # RGPD
├── voyage/
│   ├── VoyageService.ts        # Vols, hôtels, activités
│   ├── CartService.ts          # Panier
│   └── BookingService.ts       # Réservations
├── admin/
│   ├── AdminDashboardService.ts
│   ├── AdminUserService.ts
│   ├── AdminBookingService.ts
│   └── AdminPaymentService.ts
└── aiRecommendationsService.ts  # AI Service (:3005)
```

## Conventions communes

Toutes les classes services :
- Utilisent `axios` avec le token Bearer automatiquement injecté
- Timeout à 30 secondes
- Loggent les erreurs en console
- Retournent le `data` de la réponse directement

**Intercepteur auth :**
```typescript
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## AuthService

```typescript
class AuthService {
  static async login(email: string, password: string): Promise<AuthResult>
  static async signup(name: string, email: string, password: string): Promise<AuthResult>
  static async logout(): Promise<void>
  static async getUserProfile(token: string): Promise<User>
  static async updateProfile(token: string, data: Partial<User>): Promise<User>
  static async verifyToken(token: string): Promise<TokenPayload>
  static async refreshToken(): Promise<string>
  static async changePassword(currentPwd: string, newPwd: string): Promise<void>
}
```

---

## VoyageService

```typescript
class VoyageService {
  // Vols
  static async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]>
  static async searchFlightDestinations(params: DestinationSearchParams): Promise<Destination[]>
  static async getFlightPriceAnalysis(params: PriceAnalysisParams): Promise<PriceAnalysis>
  static async getFlightChoicePrediction(offers: FlightOffer[]): Promise<PredictionResult>
  static async searchFlightInspiration(params: InspirationParams): Promise<InspirationResult[]>
  static async searchCheapestFlightDates(params: CheapestDatesParams): Promise<DatePrice[]>
  static async getFlightStatus(params: FlightStatusParams): Promise<FlightStatus>
  static async predictFlightDelay(params: DelayPredictionParams): Promise<DelayPrediction>
  static async getMostTraveledDestinations(params: AnalyticsParams): Promise<Destination[]>

  // Hôtels
  static async searchHotels(params: HotelSearchParams): Promise<Hotel[]>
  static async getHotelDetails(hotelId: string): Promise<HotelDetails>

  // Activités
  static async searchActivities(params: ActivitySearchParams): Promise<Activity[]>
  static async getActivityDetails(activityId: string): Promise<ActivityDetails>

  // Aéroports & compagnies
  static async searchAirports(query: string): Promise<Airport[]>
  static async getNearestAirports(lat: number, lng: number): Promise<Airport[]>
  static async getAirlineDetails(code: string): Promise<Airline>
}
```

---

## CartService

```typescript
class CartService {
  static async getCart(userId: string): Promise<Cart>
  static async addToCart(data: AddToCartDto): Promise<Cart>
  static async removeItem(userId: string, itemId: string): Promise<Cart>
  static async updateQuantity(userId: string, itemId: string, qty: number): Promise<Cart>
  static async clearCart(userId: string): Promise<void>
  static async checkout(userId: string, metadata: CheckoutMetadata): Promise<CheckoutResult>
}
```

---

## ProfileService

```typescript
class ProfileService {
  static async getUserProfile(): Promise<UserProfile>
  static async updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile>
  static async uploadAvatar(file: File): Promise<{ avatarUrl: string }>
  static async deleteAccount(): Promise<void>
}
```

---

## OnboardingService

```typescript
class OnboardingService {
  static async initOnboarding(): Promise<OnboardingState>
  static async saveProgress(step: string, data: object): Promise<void>
  static async getProgress(): Promise<OnboardingState>
  static async complete(): Promise<void>
}
```

---

## FavoritesService

```typescript
class FavoritesService {
  static async getFavorites(): Promise<Favorite[]>
  static async addFavorite(itemType: string, itemId: string): Promise<Favorite>
  static async removeFavorite(id: string): Promise<void>
  static async batchAddFavorites(items: FavoriteItem[]): Promise<Favorite[]>
  static async batchRemoveFavorites(ids: string[]): Promise<void>
}
```

---

## AIRecommendationsService

```typescript
class AIRecommendationsService {
  static async getRecommendations(userId: string, limit?: number): Promise<Recommendation[]>
  static async getPopularDestinations(segment?: string): Promise<Destination[]>
  static async getColdStartRecommendations(userId: string, strategy?: string): Promise<Recommendation[]>
  static async trackInteraction(userId: string, destinationId: string, action: string): Promise<void>
  static async getAccommodationRecommendations(params: AccomParams): Promise<Recommendation[]>
}
```

---

## GdprService

```typescript
class GdprService {
  static async getConsent(): Promise<ConsentData>
  static async updateConsent(consent: ConsentData): Promise<ConsentData>
  static async submitRequest(type: GdprRequestType, reason: string): Promise<GdprRequest>
  static async getRequests(): Promise<GdprRequest[]>
  static async getPrivacyPolicy(): Promise<PrivacyPolicy>
  static async acceptPrivacyPolicy(version: string): Promise<void>
}
```
