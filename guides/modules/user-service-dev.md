# Guide de développement — User Service

**Port** : 3002 · **Pod** : Core · **Stack** : Node 18+ / Express / Prisma / Redis / Kafka / Socket.IO

## 1. Vue d'ensemble

Gère le profil étendu, l'onboarding, les favoris, l'historique, les notifications (push WebSocket + email/SMS) et les droits RGPD.

**Fonctions** :
- Profil étendu (avatar, bio, dateOfBirth)
- Onboarding multi-étapes (questionnaire de préférences voyage)
- Favoris (vols, hôtels, activités, destinations)
- Historique d'activité
- Notifications temps réel (Socket.IO)
- Préférences de notification (canaux par type)
- RGPD : consentement, droits (export, suppression, etc.)
- Administration (suspension, listing)

**Dépendances** :
- PostgreSQL : `UserProfile`, `UserBehavior`, `UserSettings`, `UserHistory`, `Favorite`, `TravelOnboardingProfile`, `UserConsent`, `GdprRequest`, `DataAccessLog`...
- Redis (cache, rate limit, sessions WebSocket)
- Kafka (publie + consomme)
- Socket.IO (notifications temps réel, proxié via Gateway)

## 2. Prérequis

```bash
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://dreamscape_user:password@localhost:5432/dreamscape
JWT_SECRET=<même que auth-service>
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
AUTH_SERVICE_URL=http://localhost:3001        # vérification cross-service
```

## 3. Démarrage local

```bash
cd dreamscape-services/user
npm install
npx prisma generate
npm run dev
# → http://localhost:3002/health
```

WebSocket test :
```bash
# Le client Socket.IO se connecte via le Gateway (3000), proxié vers user (3002)
wscat -c ws://localhost:3000/socket.io/?EIO=4\&transport=websocket \
  -H "Authorization: Bearer <token>"
```

## 4. Architecture du code

```
user/
├── src/
│   ├── config/             # Socket.IO, Redis, env
│   ├── controllers/        # gdpr.controller.ts, profile.controller.ts...
│   ├── middleware/
│   │   ├── auth.ts         # JWT validation
│   │   └── auditLogger.ts  # log RGPD (DataAccessLog)
│   ├── routes/             # users.routes.ts, admin.routes.ts, gdpr.routes.ts
│   ├── services/           # UserService, NotificationService, GdprService, FavoritesService
│   ├── socket/             # gestion des connexions WebSocket
│   └── server.ts
└── tests/
```

**Fichiers clés** :
- `src/services/GdprService.ts` — exports JSON, anonymisation, soft delete
- `src/services/NotificationService.ts` — orchestration email/push/SMS selon préférences
- `src/socket/index.ts` — auth WebSocket via JWT, rooms par userId

## 5. Base de données

Modèles principaux :
- `UserProfile`, `UserSettings`, `UserHistory`, `UserBehavior`, `Favorite`
- `TravelOnboardingProfile`
- `Notification`, `NotificationPreference`
- `UserConsent`, `ConsentHistory`, `GdprRequest`, `DataAccessLog`, `UserPolicyAcceptance`

⚠️ **Format de réponse** des controllers GDPR : `{ success: true, data: <object> }` (pas de double imbrication).

## 6. Endpoints

Spec : [`api-reference/openapi/user.openapi.yaml`](../../api-reference/openapi/user.openapi.yaml)
Markdown : [`api-reference/user-api.md`](../../api-reference/user-api.md)

Domaines : profile, onboarding, favorites, history, notifications, notification-preferences, gdpr, admin.

## 7. Événements Kafka

**Publiés** :
- `dreamscape.user.preferences.updated`
- `dreamscape.user.onboarding.completed`
- `dreamscape.user.gdpr.request.created`
- `dreamscape.user.profile.updated`

**Consommés** :
- `dreamscape.payment.completed` → marque la réservation, déclenche notif
- `dreamscape.voyage.booking.created` → ajoute à l'historique

Voir [`events/user-events.md`](../../events/user-events.md).

## 8. Tests

```bash
npm test
npm run test:integration                     # nécessite auth-service démarré
```

Patterns :
```ts
beforeEach(async () => {
  // Créer un user via auth-service
  const { token, user } = await registerUser({ email, password });
  authHeader = { Authorization: `Bearer ${token}` };
});
```

## 9. Debug & pièges

| Symptôme | Solution |
|----------|----------|
| Réponse GDPR mal formatée | Vérifier qu'on n'imbrique pas `{ data: { consent: {...} } }` — c'est `{ data: {...} }` directement |
| Socket.IO ne reçoit rien | Vérifier que le user a bien `join(userId)` après auth |
| `auditLogger` manque l'IP | Express derrière proxy : `app.set('trust proxy', 1)` |
| Tests RGPD lents | Réduire la rétention des `DataAccessLog` en environnement test |

## 10. Contribution

Ajouter un nouveau type de notification :
1. Ajouter le type dans l'enum Prisma `NotificationType`
2. `npx prisma db push` puis `generate` partout
3. Mettre à jour `NotificationPreference` (frontend + backend)
4. Ajouter l'orchestration dans `NotificationService.send()`
5. Mettre à jour les tests + la doc OpenAPI
