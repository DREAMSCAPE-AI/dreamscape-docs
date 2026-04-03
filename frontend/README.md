# Frontend DreamScape

Le frontend comprend 3 applications dans `dreamscape-frontend/` :

| Application | Port | Description |
|-------------|------|-------------|
| [Web Client](web-client.md) | 5173 | Application React principale (SPA) |
| API Gateway | 3000 | Proxy Express (voir [architecture/gateway.md](../architecture/gateway.md)) |
| [Panorama VR](../services/panorama-vr.md) | 3006 | Expériences 360° WebXR |

## Stack technique — Web Client

| Catégorie | Technologie |
|-----------|-------------|
| Framework | React 18.3 + TypeScript 5.5 |
| Build | Vite 5.4 |
| Routing | React Router v6 |
| State global | Zustand 4.5 |
| Data fetching | TanStack React Query 5.95 |
| Styling | Tailwind CSS 3.4 |
| Animations | Framer Motion 11 |
| Maps | Mapbox GL 2.15 + react-map-gl |
| Paiement | Stripe React 2.9 |
| Temps réel | Socket.IO client 4.8 |
| i18n | i18next 25.8 (EN/FR) |
| Tests unitaires | Vitest 3.2 + React Testing Library |
| Tests E2E | Cypress 14.5 |

## Documents

| Document | Contenu |
|----------|---------|
| [web-client.md](web-client.md) | Pages, routing, auth flow |
| [stores-and-state.md](stores-and-state.md) | Zustand stores, React Query |
| [service-layer.md](service-layer.md) | Classes API |
| [components.md](components.md) | Design system, composants clés |
| [admin-panel.md](admin-panel.md) | Pages admin |

## Démarrage rapide

```bash
cd dreamscape-frontend/web-client
npm install
cp .env.example .env
# Éditer .env avec les URLs de services
npm run dev   # http://localhost:5173
```
