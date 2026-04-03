# Sécurité

## Vue d'ensemble

DreamScape applique plusieurs couches de sécurité sur l'ensemble de la plateforme.

## Scores de sécurité

| Service | Score | Niveau |
|---------|-------|--------|
| Payment Service | 95/100 | Excellent — PCI DSS 12/12 |
| Auth Service | 6.6/10 | Acceptable — voir recommandations |

## Mesures de sécurité par couche

### API Gateway

- **Helmet** : CSP, X-Frame-Options, HSTS, X-Content-Type-Options
- **Rate limiting** : 100 req/15min/IP (`express-rate-limit`)
- **CORS** : Origines autorisées configurées explicitement

### Authentification (Auth Service)

- **JWT** : Access tokens à courte durée (15 min), refresh tokens httpOnly cookie
- **Bcrypt** : Hashage des mots de passe (cost factor 12)
- **Token Blacklist** : Révocation immédiate via Redis
- **Rate limiting** : Limites spécifiques sur `/login`, `/register`, `/refresh`
- **Cookie** : `httpOnly`, `secure` (prod), `sameSite: strict`

Voir [Analyse sécurité Auth](auth-security.md).

### Paiements (Payment Service)

- **PCI DSS** : 12/12 exigences validées
- **Signature webhook** : Vérification Stripe `stripe-signature`
- **Idempotence** : Déduplication des webhooks
- **Isolation** : Clés Stripe uniquement en variables d'environnement

Voir [Analyse sécurité Payment](payment-security.md).

### Base de données

- **Cascade deletes** : `onDelete: Cascade` pour l'intégrité référentielle
- **Prisma** : Requêtes paramétrées (protection injection SQL)
- **Accès restreint** : Chaque service utilise les mêmes credentials mais accède uniquement à ses modèles

### Frontend

- **XSS** : Helmet CSP + sanitisation des inputs
- **CSRF** : Protection via JWT en header (pas en cookie pour les requêtes API)
- **Stockage sécurisé** : Token JWT en mémoire Zustand (pas en cookie accessible en JS)

### RGPD

Voir [Conformité RGPD](gdpr/compliance.md).

## Recommandations non implémentées (Auth Service)

Issues identifiées dans l'audit de sécurité (score 6.6/10) :

1. **Absence de CAPTCHA** sur le login — risque de brute force automatisé
2. **Pas de MFA** (Multi-Factor Authentication)
3. **Monitoring de sessions** insuffisant
4. **Audit trail** des actions admin incomplet

## Variables d'environnement sensibles

Ces variables ne doivent **jamais** être commitées dans Git :

| Variable | Service |
|----------|---------|
| `JWT_SECRET` | Tous |
| `JWT_REFRESH_SECRET` | Auth |
| `STRIPE_SECRET_KEY` | Payment |
| `STRIPE_WEBHOOK_SECRET` | Payment |
| `OPENAI_API_KEY` | AI |
| `AMADEUS_API_SECRET` | Voyage |
| `SENDGRID_API_KEY` | User |
| `DATABASE_URL` (avec password) | Tous |

## Documents de référence

| Document | Contenu |
|----------|---------|
| [auth-security.md](auth-security.md) | Audit complet Auth Service |
| [payment-security.md](payment-security.md) | Audit complet Payment Service (PCI DSS) |
| [gdpr/compliance.md](gdpr/compliance.md) | Implémentation RGPD |
| [gdpr/cookie-policy.md](gdpr/cookie-policy.md) | Politique cookies |
| [gdpr/privacy-policy.md](gdpr/privacy-policy.md) | Politique de confidentialité |
