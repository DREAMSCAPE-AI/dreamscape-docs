# Système de notifications

DreamScape dispose d'un système de notifications temps réel via Socket.IO et asynchrone via Kafka.

## Architecture

```
Voyage Service ──Kafka──▶ dreamscape.voyage.booking.confirmed
Payment Service ──Kafka──▶ dreamscape.payment.completed
                                  │
                            User Service (consumer)
                                  │
                    ┌─────────────┼─────────────────┐
                    │             │                  │
              Socket.IO      SendGrid Email     Push Notification
                    │
            Web Client (socket.io-client)
                    │
              Toast / Notification Panel
```

## Types de notifications

| Type | Déclencheur | Canal défaut |
|------|-------------|-------------|
| `booking_confirmation` | Réservation confirmée | Email + Push |
| `booking_cancellation` | Réservation annulée | Email + Push |
| `payment_success` | Paiement réussi | Email + Push |
| `payment_failed` | Paiement échoué | Email + Push |
| `price_alert` | Baisse de prix détectée | Email |
| `trip_reminder` | Rappel avant départ (J-7, J-1) | Email + Push + SMS |
| `promotions` | Offres promotionnelles | (désactivé par défaut) |

## Configuration Socket.IO

### Serveur (User Service)

```typescript
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true }
});

io.use(authenticateSocket); // Validation JWT

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  
  // L'utilisateur rejoint sa room personnelle
  socket.join(`user:${userId}`);
  
  socket.on('disconnect', () => {
    socket.leave(`user:${userId}`);
  });
});

// Envoi d'une notification à un utilisateur
function sendNotification(userId: string, notification: Notification) {
  io.to(`user:${userId}`).emit('notification', notification);
}
```

### Client (Web Client)

```typescript
// src/services/NotificationService.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token: string) {
  socket = io(GATEWAY_URL, {
    auth: { token },
    transports: ['websocket'],
  });
  
  socket.on('notification', (notification: Notification) => {
    // Afficher dans le NotificationBell + toast
    useNotificationStore.getState().addNotification(notification);
    toast(notification.title, { description: notification.body });
  });
  
  socket.on('connect_error', (err) => {
    console.error('Socket connection failed:', err.message);
  });
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
```

Le Gateway proxie les connexions WebSocket :
```
Web Client → WS /socket.io → Gateway (:3000) → User Service (:3002)
```

## Préférences de notifications

Chaque utilisateur peut configurer ses préférences par type et par canal :

### Récupérer les préférences

```typescript
GET /api/v1/users/notification-preferences
// Réponse :
{
  "booking_confirmation": { "email": true, "push": true, "sms": false },
  "price_alert": { "email": true, "push": false, "sms": false },
  "trip_reminder": { "email": true, "push": true, "sms": true },
  "promotions": { "email": false, "push": false, "sms": false }
}
```

### Mettre à jour les préférences

```typescript
PUT /api/v1/users/notification-preferences
{
  "price_alert": { "email": false, "push": true }
}
```

Le service vérifie les préférences avant d'envoyer via chaque canal.

## Endpoints de gestion des notifications

```typescript
// Lister
GET /api/v1/users/notifications?status=unread&limit=20

// Marquer une notification comme lue
PATCH /api/v1/users/notifications/:id/read

// Supprimer les notifications lues
DELETE /api/v1/users/notifications
```

## Format d'une notification

```typescript
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  status: 'UNREAD' | 'READ' | 'DELETED';
  metadata: {
    bookingReference?: string;
    amount?: number;
    destinationId?: string;
    [key: string]: any;
  };
  createdAt: string;
}
```

## Emails transactionnels (SendGrid)

Le User Service utilise SendGrid pour les emails transactionnels.

**Configuration :**
```env
SENDGRID_API_KEY=SG.xxxx
```

**Templates utilisés :**
- Confirmation de réservation
- Annulation de réservation
- Rappel avant départ
- Export PDF de réservation (en pièce jointe)

> Sans `SENDGRID_API_KEY`, les emails ne sont pas envoyés mais les notifications Socket.IO fonctionnent normalement.
