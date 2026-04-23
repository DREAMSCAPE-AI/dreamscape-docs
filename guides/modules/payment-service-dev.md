# Guide de développement — Payment Service

**Port** : 3004 · **Pod** : Business · **Stack** : Node 18+ / Express / Prisma / Stripe SDK / Kafka

## 1. Vue d'ensemble

Intégration Stripe pour les paiements et webhooks. Garantit l'idempotence des webhooks et publie les événements de paiement sur Kafka pour que les autres services réagissent (confirmation booking, notif user, etc.).

**Fonctions** :
- Création de PaymentIntent
- Webhook Stripe (vérification signature + idempotence)
- Statut d'un paiement
- Remboursement (partiel ou total)
- Historique des transactions

## 2. Prérequis

```bash
NODE_ENV=development
PORT=3004
DATABASE_URL=postgresql://...
JWT_SECRET=<partagé>
KAFKA_BROKERS=localhost:9092

# Stripe (compte test sur stripe.com)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...        # généré par `stripe listen`
STRIPE_PUBLISHABLE_KEY=pk_test_...     # exposé au frontend uniquement

CLIENT_URL=http://localhost:5173
```

⚠️ **Ne jamais** commiter de clé Stripe live. En CI, utiliser GitHub Secrets.

## 3. Démarrage local

> Le Payment Service utilise **`nodemon + ts-node`** (pas tsx comme les autres) — voir `package.json`.

```bash
cd dreamscape-services/payment
npm install
npx prisma generate
npm run dev                            # nodemon --watch src --exec ts-node src/index.ts
# → http://localhost:3004/health
```

**Forwarding webhook Stripe (obligatoire en dev)** :
```bash
# Installer Stripe CLI : https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to http://localhost:3004/api/v1/payment/webhook
# → Copier le whsec_... affiché dans STRIPE_WEBHOOK_SECRET
```

Tester un paiement :
```bash
# 1. Créer un PaymentIntent
curl -X POST http://localhost:3000/api/v1/payment/intent \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "eur", "bookingReference": "DS-TEST"}'

# 2. Simuler un succès
stripe trigger payment_intent.succeeded
```

## 4. Architecture du code

```
payment/
├── src/
│   ├── config/             # Stripe client, env
│   ├── services/
│   │   ├── PaymentService.ts         # createIntent, getIntent, refund
│   │   ├── WebhookService.ts         # verifySignature, processEvent (idempotent)
│   │   └── KafkaPublisher.ts
│   ├── routes/
│   │   └── payment.routes.ts         # ⚠️ /webhook utilise express.raw()
│   ├── middleware/
│   └── index.ts                      # entry point (PAS server.ts)
└── tests/
```

**Fichiers clés** :
- `routes/payment.routes.ts` :
  ```ts
  // Le webhook DOIT recevoir le body brut pour vérifier la signature
  router.post('/webhook',
    express.raw({ type: 'application/json' }),
    webhookController.handle
  );
  ```
- `services/WebhookService.ts` — idempotence via `ProcessedWebhookEvent` table

## 5. Base de données

Modèles :
- `PaymentTransaction` — toutes les transactions (PaymentIntent + Charges + Refunds)
- `ProcessedWebhookEvent` — `event.id` Stripe pour idempotence

Pattern idempotent :
```ts
const existing = await db.processedWebhookEvent.findUnique({ where: { eventId } });
if (existing) return; // déjà traité, retourner 200 immédiatement

await db.$transaction([
  db.processedWebhookEvent.create({ data: { eventId, type } }),
  db.paymentTransaction.update({ ... }),
]);
await kafkaService.publishEvent(...).catch(err => console.error(err));
```

## 6. Endpoints

Spec : [`api-reference/openapi/payment.openapi.yaml`](../../api-reference/openapi/payment.openapi.yaml)
Markdown : [`api-reference/payment-api.md`](../../api-reference/payment-api.md)

| Méthode | Path | Auth |
|---------|------|------|
| POST | `/api/v1/payment/intent` | JWT |
| GET | `/api/v1/payment/:id` | JWT |
| POST | `/api/v1/payment/webhook` | Stripe signature |
| POST | `/api/v1/payment/refund` | JWT (admin) |
| GET | `/api/v1/payment/history` | JWT |

## 7. Événements Kafka

**Publiés** (depuis le webhook) :
- `dreamscape.payment.completed` ← `payment_intent.succeeded`
- `dreamscape.payment.failed` ← `payment_intent.payment_failed`
- `dreamscape.payment.cancelled` ← `payment_intent.canceled`
- `dreamscape.payment.refunded` ← `charge.refunded`

Voir [`events/payment-events.md`](../../events/payment-events.md).

## 8. Tests

```bash
npm test
npm run test:integration         # mocks Stripe
npm run test:webhook             # tests d'idempotence
```

Cartes de test Stripe :
| Numéro | Comportement |
|--------|--------------|
| `4242 4242 4242 4242` | Succès |
| `4000 0000 0000 9995` | Échec : fonds insuffisants |
| `4000 0027 6000 3184` | 3D Secure requis |

## 9. Debug & pièges

| Symptôme | Cause | Solution |
|----------|-------|----------|
| `Webhook signature verification failed` | `STRIPE_WEBHOOK_SECRET` mal configuré | Recopier la valeur de `stripe listen` |
| `Body must be a Buffer` | `express.json()` avant `/webhook` | Vérifier l'ordre — `express.raw` AVANT |
| Event traité plusieurs fois | Pas de check `ProcessedWebhookEvent` | Toujours wrapper dans `$transaction` |
| Booking pas confirmé | Consumer Kafka voyage HS | Vérifier `dreamscape.payment.completed` consumé |
| `tsx` ne reload pas | Service utilise nodemon, pas tsx | Vérifier `package.json` script `dev` |

**Inspecter en local** :
```bash
# Voir les events Stripe envoyés
stripe events list --limit 5

# Re-déclencher un event spécifique
stripe events resend <evt_xxx>
```

## 10. Sécurité

- **Jamais** stocker une CB côté DreamScape — tout passe par Stripe
- Logs : ne jamais logger `clientSecret` ni le body brut du webhook
- PCI DSS : DreamScape est en **SAQ A** (paiement délégué à Stripe)

Voir [`security/payment-security.md`](../../security/payment-security.md).

## 11. Contribution

Ajouter un nouveau type d'event Stripe :
1. Étendre le `switch` dans `WebhookService.processEvent()`
2. Définir le topic Kafka dans `shared/kafka/src/config.ts`
3. **Rebuild** `@dreamscape/kafka` : `cd shared/kafka && npm run build`
4. Tester avec `stripe trigger <event_name>`
