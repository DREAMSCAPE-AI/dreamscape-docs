# Composants

## Structure

Les composants sont organisés par domaine fonctionnel dans `src/components/` :

```
components/
├── auth/                 # Login, Signup, PasswordReset
├── flights/              # FlightSearch, FlightResults, FlightCard, BookingWizard
├── hotels/               # HotelSearch, HotelResults, HotelCard
├── activities/           # ActivitySearch, ActivityCard
├── bookings/             # BookingList, BookingCard, BookingDetails
├── dashboard/            # Dashboard principal
├── business/             # Dashboard voyageur d'affaires
├── leisure/              # Dashboard voyageur loisirs
├── bleisure/             # Dashboard bleisure
├── planner/              # ItineraryBuilder, DayPlanner, ItemDnD
├── destination/          # DestinationHeader, DestinationMap, DestinationActivities
├── experiences/          # ExperienceCard, ExperienceList
├── favorites/            # FavoritesList, FavoriteCard, BatchSelector
├── profile/              # ProfileForm, AvatarUpload, PreferencesForm
├── settings/             # LanguageSelector, NotificationPreferences, PrivacySettings
├── admin/                # AdminNav, UserTable, BookingTable, MetricsCard
├── cart/                 # CartDrawer, CartItemCard, CartSummary
├── checkout/             # StripeCheckoutForm, OrderSummary
├── onboarding/           # OnboardingWizard, StepIndicator, PreferenceSelector
├── gdpr/                 # CookieConsent, ConsentManager, DataRightsSection
├── notifications/        # NotificationBell, NotificationList, ToastProvider
├── map/                  # MapboxMap, DestinationMarker, MapControls
├── vr/                   # VRButton, VRPinEntry, VRViewer
├── search/               # GlobalSearch, SearchBar, SearchSuggestions
├── analytics/            # TravelStats, ChartCard, InsightCard
├── layout/               # Header, Footer, Logo, MobileNav
├── hero/                 # HeroSection, DestinationCarousel
└── common/               # ErrorMessage, LoadingSpinner, LanguageSelector
```

## Design System

**Framework :** Tailwind CSS 3.4 (utility-first)

**Palette principale :**
- Primary (orange) : `#f97316` — `orange-500`
- Background : `gray-50` à `gray-950`
- Text : `gray-900` (dark mode : `gray-100`)

**Icônes :** Lucide React (45+ icons utilisés)

**Animations :** Framer Motion 11
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

## Composants clés

### CookieConsent

Bannière de consentement RGPD. S'affiche à la première visite.

```tsx
// src/components/gdpr/CookieConsent.tsx
<CookieConsent
  onAcceptAll={() => updateConsent({ analytics: true, marketing: true })}
  onCustomize={() => openConsentManager()}
/>
```

### CartDrawer

Panier latéral accessible depuis toutes les pages.

```tsx
const { isDrawerOpen, openDrawer, closeDrawer } = useCartStore();
<CartDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
```

### StripeCheckoutForm

Formulaire de paiement Stripe (Stripe Elements).

```tsx
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <StripeCheckoutForm
    amount={amount}
    currency={currency}
    onSuccess={handlePaymentSuccess}
  />
</Elements>
```

Apparence personnalisée : thème orange (`#f97316`), texte sombre, border radius 8px.

### MapboxMap

Carte interactive pour les destinations.

```tsx
<MapboxMap
  center={[longitude, latitude]}
  zoom={10}
  markers={destinations.map(d => ({ id: d.id, coords: [d.lng, d.lat] }))}
  onMarkerClick={(id) => navigateTo(`/destination/${id}`)}
/>
```

### NotificationBell

Icône de cloche avec badge et panel de notifications (temps réel via Socket.IO).

## Layouts

```
src/layouts/
├── MainLayout.tsx     # Header + Footer + CartDrawer
└── AdminLayout.tsx    # Sidebar admin + Header
```

Le routing dans `App.tsx` enveloppe les pages dans le layout approprié :

```tsx
<Route element={<MainLayout />}>
  <Route path="/" element={<HomePage />} />
  <Route path="/flights" element={<FlightsPage />} />
  ...
</Route>

<Route element={<AdminLayout />}>
  <Route path="/admin/dashboard" element={<AdminDashboard />} />
  ...
</Route>
```

## Accessibilité

- Labels ARIA sur les éléments interactifs
- HTML sémantique (nav, main, section, article)
- Skip-links pour la navigation clavier
- Contraste couleurs conforme WCAG 2.1 AA
- Focus visible sur tous les éléments interactifs

## Mobile

- Design mobile-first (Tailwind breakpoints : `sm:`, `md:`, `lg:`)
- Menu hamburger sur mobile (`useMobileStore`)
- Tests viewport mobile 390×844 (iPhone 14 Pro)
- Scripts d'audit responsive : `npm run audit:responsive`
