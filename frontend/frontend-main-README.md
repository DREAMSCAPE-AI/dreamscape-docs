🌐 DreamScape Frontend

> **Frontend Platform** - Interface utilisateur web et gateway API

## 📁 Structure des Applications

- **web-client/** - Frontend React principal (Port 5173)
- **panorama/** - Interface panorama/VR immersive
- **gateway/** - API Gateway & routage (Port 3000)

## 🛠️ Stack Technique

### **Frontend Core**
- **React 18** - Library UI avec hooks
- **Vite** - Build tool & dev server rapide
- **TypeScript** - Type safety
- **Tailwind CSS** - Framework CSS utilitaire

### **State Management**
- **Redux Toolkit** - État global
- **React Query** - Cache & synchronisation API
- **Context API** - État local partagé

### **Expérience Immersive**
- **Marzipano** - Vues panoramiques 360°
- **CesiumJS** - Navigation 3D globale
- **WebGL** - Rendu graphique haute performance

### **Architecture**
- **Component-Based** - Architecture modulaire
- **API-First** - Communication via API Gateway
- **Responsive Design** - Multi-plateforme
- **PWA Ready** - Progressive Web App

## 🚀 Quick Start

### Développement Local
```bash
# Installation des dépendances
npm install

# Variables d'environnement
cp .env.example .env.local

# Démarrer le développement
npm run dev

# Ou applications individuelles
cd web-client && npm run dev    # Frontend sur :5173
cd gateway && npm run dev       # Gateway sur :3000
```

### Scripts Disponibles
```bash
# Développement
npm run dev              # Toutes les apps en mode dev
npm run build            # Build de production
npm run preview          # Preview build locale

# Qualité code
npm run lint             # ESLint vérification
npm run lint:fix         # Auto-correction ESLint
npm run typecheck        # Vérification TypeScript

# Tests
npm run test             # Tests unitaires Jest
npm run test:coverage    # Tests avec couverture
npm run test:e2e         # Tests end-to-end Cypress
```

## 🏗️ Architecture Frontend

```
┌─────────────────┐    ┌─────────────────┐
│   Web Client    │────│   API Gateway   │
│   React (5173)  │    │  Express (3000) │
└─────────────────┘    └─────────────────┘
         │                       │
         ├─────── Auth ───────────┤
         ├─────── API  ───────────┤
         ├─────── Cache ──────────┤
         │                       │
    ┌─────────────┐          ┌─────────────┐
    │  Panorama   │          │  Backend    │
    │ VR Engine   │          │  Services   │
    │ (Marzipano) │          │   (3001+)   │
    └─────────────┘          └─────────────┘
```

## 🌟 Fonctionnalités Principales

### Web Client (React)
- **Authentification** - Login/register sécurisé
- **Recherche Voyage** - Interface intuitive de recherche
- **Réservations** - Processus de booking fluide  
- **Profil Utilisateur** - Gestion compte & préférences
- **Dashboard** - Vue d'ensemble personnalisée
- **Responsive Design** - Mobile & desktop

### Expérience Panoramique
- **Vues 360°** - Découverte immersive destinations
- **Navigation 3D** - Exploration interactive
- **Points d'Intérêt** - Markers informatifs
- **Transitions Fluides** - Expérience seamless
- **Media Rich** - Photos, vidéos, audio

### API Gateway
- **Routage Intelligent** - Distribution requêtes
- **Load Balancing** - Répartition de charge
- **Rate Limiting** - Protection contre abus  
- **CORS Handling** - Gestion cross-origin
- **Health Checks** - Monitoring services
- **Request/Response Logging** - Observabilité

## 🎨 Design System

### **Composants Réutilisables**
```
src/components/
├── common/           # Composants génériques
│   ├── Button/       # Boutons système
│   ├── Modal/        # Modales
│   └── Form/         # Éléments formulaires
├── auth/            # Authentification
├── voyage/          # Fonctions voyage
├── panorama/        # Expérience VR
└── profile/         # Gestion profil
```

### **Hooks Personnalisés**
- `useAPI` - Appels API simplifiés
- `useAuth` - État d'authentification
- `useDashboard` - Données dashboard
- `usePanorama` - Contrôle expérience VR

## 📊 Communication API

### **Endpoints Principaux**
```typescript
// Configuration API centralisée
const API_BASE = process.env.VITE_API_URL || 'http://localhost:3000'

// Services disponibles
/auth/*           → Auth Service (3001)
/users/*          → User Service (3002)
/voyages/*        → Voyage Service (3003)
/payments/*       → Payment Service (3004)
/recommendations/* → AI Service (3005)
/panoramas/*      → Panorama Service (3006)
```

### **Exemple d'Usage**
```typescript
import { searchFlights } from '@/services/voyageService'

const SearchPage = () => {
  const handleSearch = async (criteria) => {
    try {
      const results = await searchFlights(criteria)
      // Traitement résultats
    } catch (error) {
      // Gestion erreurs
    }
  }
  
  return <SearchForm onSearch={handleSearch} />
}
```

## 🧪 Tests & Qualité

### **Stratégie de Test**
- **Unit Tests** - Jest + React Testing Library
- **Integration Tests** - MSW (Mock Service Worker)  
- **E2E Tests** - Cypress automation
- **Visual Tests** - Storybook + Chromatic
- **Performance Tests** - Lighthouse CI

### **Couverture Code**
```bash
# Exécution avec couverture
npm run test:coverage

# Rapports détaillés  
open coverage/lcov-report/index.html
```

## 🚀 Déploiement

### **Environments**
- **Development** - Local dev server
- **Staging** - Preview builds
- **Production** - Cloudflare Pages

### **CI/CD Pipeline**
```bash
# Build & déploiement
npm run build              # Production build
npm run docker:build       # Container images
npm run deploy:staging     # Deploy staging
npm run deploy:prod        # Deploy production
```

## 🔐 Sécurité Frontend

- **Content Security Policy** - Protection XSS
- **HTTPS Enforcement** - Transport sécurisé
- **Token Storage** - Secure localStorage/cookies
- **API Key Protection** - Variables d'environnement
- **Input Sanitization** - Validation côté client

## 📈 Performance

### **Optimisations**
- **Code Splitting** - Chargement lazy
- **Tree Shaking** - Bundle optimization
- **Image Optimization** - Formats modernes
- **Caching Strategy** - Service workers
- **CDN Distribution** - Assets delivery

### **Monitoring**
- **Lighthouse Score** - Performance metrics
- **Core Web Vitals** - User experience
- **Bundle Analysis** - Size optimization
- **Error Tracking** - Sentry integration

## 📱 Progressive Web App

- **Service Workers** - Cache offline
- **App Manifest** - Install prompt
- **Push Notifications** - Engagement users
- **Responsive Design** - Multi-device
- **Offline Support** - Fonctionnalités critiques

## 🤝 Contributing

### **Development Workflow**
1. **Feature Branch** - `feature/frontend/description`
2. **Component Development** - Storybook first
3. **Unit Testing** - Test coverage > 80%
4. **E2E Testing** - Critical user journeys
5. **Code Review** - PR approval required

### **Coding Standards**
- **TypeScript Strict** - Type safety
- **ESLint + Prettier** - Code formatting
- **Conventional Commits** - Git messages
- **Component Documentation** - Props & usage

## 📄 License

Propriétaire et confidentiel © DreamScape 2025

