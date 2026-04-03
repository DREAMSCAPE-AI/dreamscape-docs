# Panorama VR Service

**Port** : 3006 | **Package** : `dreamscape-vr-poc` | **Pod** : Experience

## Responsabilités

- Expériences immersives 360° en navigateur (desktop, mobile, VR)
- Support WebXR pour casques (Meta Quest 3, Apple Vision Pro)
- Exploration panoramique de destinations de voyage
- Hotspots interactifs et guide audio

## Stack technique

| Dépendance | Version | Usage |
|------------|---------|-------|
| React | 18.2 | Framework UI |
| Three.js | 0.155 | Rendu 3D |
| @react-three/fiber | 8.13 | Bindings React Three.js |
| @react-three/drei | 9.83 | Helpers 3D (camera, loaders...) |
| @react-three/xr | 5.6 | WebXR, contrôleurs VR |
| react-scripts | 5.0 | Build (Create React App) |

## Démarrage

```bash
cd dreamscape-frontend/panorama

npm install
npm start          # Développement (port 3006)
npm run start-vr   # Mode VR dédié
npm run build      # Build production
```

## Destinations disponibles

| Destination | Scènes disponibles |
|-------------|-------------------|
| Paris | Tour Eiffel, Louvre, Arc de Triomphe, Notre-Dame, Sacré-Cœur |
| Barcelona | — |
| New York | — |
| Tokyo | — |
| Dubai | — |
| London | — |

## Images panoramiques

**Emplacement** : `public/panoramas/`

**Spécifications requises :**
- Format : JPEG
- Ratio : 2:1 (équirectangulaire)
- Résolution optimale : 8192×4096 px (min acceptable : 4096×2048 px)
- Qualité JPEG : 90-95%

**Formats sources acceptés :** Flickr, Google Street View, Adobe Stock, Pixabay (images sphériques équirectangulaires uniquement)

## Intégration avec le Web Client

### Accès depuis le frontend

La page VR est accessible via `/vr/:id` dans le Web Client. Elle inclut un système de protection par code PIN :

```
1. L'utilisateur visite une page destination
2. Un bouton "Visiter en VR" est affiché
3. L'utilisateur saisit un code PIN VR (géré par le Gateway)
4. Redirection vers le Panorama VR avec le paramètre de destination
```

### Sessions VR (DR-574)

Les sessions VR sont gérées localement par le Gateway (pas un service backend séparé) :

```
POST /api/v1/vr/sessions         # Créer une session avec PIN
GET  /api/v1/vr/sessions/:pin    # Valider un PIN
DELETE /api/v1/vr/sessions/:pin  # Invalider une session
```

### URL de navigation

```
http://localhost:3006?environment=paris
http://localhost:3006?environment=barcelona
```

## Architecture technique

```
App.tsx
├── <Canvas>                      # Contexte WebGL Three.js
│   ├── <XR>                      # Contexte WebXR (@react-three/xr)
│   ├── <PerspectiveCamera>       # Caméra 360°
│   ├── <PanoramaSphere>          # Sphère texturée avec l'image 360°
│   ├── <Hotspots>                # Points d'intérêt interactifs
│   └── <AudioGuide>             # Guide audio optionnel
└── <VRButton>                    # Bouton d'entrée en mode VR
```

## Support des appareils

| Appareil | Support | Notes |
|----------|---------|-------|
| Desktop (navigateur) | Complet | Souris pour naviguer |
| Mobile (smartphone) | Complet | Gyroscope + touch |
| Meta Quest 3 | WebXR | Controllers 6DoF |
| Apple Vision Pro | WebXR | Passthrough |
| HTC Vive / Valve Index | WebXR | Via SteamVR |

## Optimisation des performances

- **GPU memory management** : Les textures haute résolution sont chargées progressivement
- **LOD (Level of Detail)** : Basse résolution au chargement, haute résolution une fois en place
- **Compression** : Images JPEG optimisées (pas de PNG pour les panoramas)
- **Preloading** : Les scènes adjacentes sont préchargées

## Documentation additionnelle

Des fichiers README détaillés se trouvent dans le repo :
- `PANORAMAS_README.md` — Guide d'ajout de nouvelles images panoramiques
- `ENVIRONMENTS_README.md` — Configuration des environnements
- `DOWNLOAD_PANORAMAS.md` — Sources d'images recommandées
- `VR_RECOMMENDATIONS_INTEGRATION.md` — Intégration avec l'AI Service

Spécifications de l'environnement Paris : [paris-vr-spec.md](../reference/paris-vr-spec.md)
