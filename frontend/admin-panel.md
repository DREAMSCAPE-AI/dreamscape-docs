# Panel Administrateur

Le panel admin est accessible aux utilisateurs avec le rôle `admin` via `/admin/*`.

## Pages admin

| Route | Composant | Description |
|-------|-----------|-------------|
| `/admin/dashboard` | `AdminDashboard` | KPIs globaux et métriques |
| `/admin/users` | `AdminUserList` | Liste et recherche des utilisateurs |
| `/admin/users/:id` | `AdminUserDetail` | Profil complet et actions |
| `/admin/bookings` | `AdminBookingList` | Toutes les réservations |
| `/admin/bookings/:id` | `AdminBookingDetail` | Détails et actions |
| `/admin/payments` | `AdminPaymentList` | Transactions et remboursements |

## Dashboard KPIs

Le `AdminDashboardService` agrège les métriques depuis plusieurs services :

| Métrique | Source |
|----------|--------|
| Utilisateurs actifs | User Service |
| Réservations du jour | Voyage Service |
| Revenus totaux | Payment Service |
| Taux de conversion | Analytics |
| Recommandations générées | AI Service |

**Composants de visualisation :**
- `MetricsCard` — KPI avec évolution (Recharts)
- `BookingChart` — Graphique de réservations sur 30 jours
- `RevenueChart` — Revenus par période
- `UserGrowthChart` — Croissance des inscriptions

## Gestion des utilisateurs

### Liste des utilisateurs (`AdminUserService`)

```typescript
class AdminUserService {
  static async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'suspended' | 'all';
  }): Promise<{ users: User[]; total: number }>

  static async getUserDetails(userId: string): Promise<UserDetails>
  static async suspendUser(userId: string, reason: string, duration: string): Promise<void>
  static async unsuspendUser(userId: string): Promise<void>
}
```

### Actions disponibles sur un utilisateur

- Voir le profil complet (préférences, historique, vecteur IA)
- Suspendre le compte (avec durée et raison)
- Réactiver un compte suspendu
- Voir les réservations de l'utilisateur
- Consulter les demandes RGPD

## Gestion des réservations

```typescript
class AdminBookingService {
  static async getBookings(params: BookingFilters): Promise<{ bookings: Booking[]; total: number }>
  static async getBookingDetails(bookingId: string): Promise<BookingDetails>
  static async cancelBooking(bookingId: string, reason: string): Promise<void>
}
```

Filtres disponibles : status, date range, service (flight/hotel/activity), montant.

## Gestion des paiements

```typescript
class AdminPaymentService {
  static async getTransactions(params: TransactionFilters): Promise<{ transactions: Transaction[]; total: number }>
  static async processRefund(paymentIntentId: string, amount: number, reason: string): Promise<void>
}
```

## Accès et sécurité

**Vérification du rôle côté frontend :**
```tsx
// Dans App.tsx ou route guard
const AdminRoute = () => {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;
  return <Outlet />;
};
```

**Note** : La vérification de rôle est également effectuée côté backend (User Service) sur chaque endpoint `/admin/*`. La vérification frontend n'est qu'une UX guard.
