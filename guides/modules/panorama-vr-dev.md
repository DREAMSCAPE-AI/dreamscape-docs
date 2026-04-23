# Guide de développement — Panorama VR Service

**Port** : 3006 · **Pod** : Experience · **Stack** : React 18 / Three.js / @react-three/fiber / @react-three/xr

## 1. Vue d'ensemble

Application web immersive permettant la visite **360° panoramique** et **VR** (casques Meta Quest, Vision Pro, etc.) des destinations.

**Fonctions** :
- Visite panoramique 360° dans le navigateur (mouse + touch)
- Mode VR via WebXR (`@react-three/xr`)
- Navigation entre hotspots (transitions fluides)
- Sessions PIN pour basculer du web vers le casque (DR-574)
- Audio spatial (ambient sounds par destination)

## 2. Prérequis

| Outil | Version | Notes |
|-------|---------|-------|
| Node.js | >= 18 | |
| Casque VR | optionnel | Meta Quest 2/3, Vision Pro, ou WebXR API émulator (Chrome) |
| HTTPS local | recommandé pour WebXR | mkcert + vite https |

Variables d'environnement :
```bash
PORT=3006
REACT_APP_GATEWAY_URL=http://localhost:3000
REACT_APP_ASSETS_URL=http://localhost:3000/assets/panoramas
```

## 3. Démarrage local

```bash
cd dreamscape-frontend/panorama
npm install
npm start
# → http://localhost:3006
```

**Avec HTTPS (requis pour WebXR sur appareils réels)** :
```bash
mkcert -install
mkcert localhost
# Modifier vite.config.ts pour pointer vers les certs
npm start
# → https://localhost:3006
```

**Émulateur WebXR (Chrome)** :
1. Installer l'extension [WebXR API Emulator](https://chrome.google.com/webstore/detail/webxr-api-emulator/mjddjgeghkdijejnciaefnkjmkafnnje)
2. DevTools → onglet "WebXR" → choisir un device

## 4. Architecture du code

```
panorama/
├── src/
│   ├── components/
│   │   ├── Scene.tsx              # <Canvas> Three Fiber root
│   │   ├── Panorama.tsx           # sphère 360° avec texture
│   │   ├── Hotspot.tsx            # points cliquables
│   │   ├── VRController.tsx       # gestion contrôleurs VR
│   │   ├── AudioAmbient.tsx       # son spatial
│   │   └── PINEntry.tsx           # saisie du PIN sur casque
│   ├── scenes/                    # configurations par destination
│   │   ├── paris.ts
│   │   ├── tokyo.ts
│   │   └── santorini.ts
│   ├── hooks/
│   │   ├── useVRSession.ts        # cycle de vie XR
│   │   └── usePinSession.ts       # appel /api/v1/vr/sessions
│   ├── assets/
│   │   ├── panoramas/             # textures 4K-8K (.jpg/.webp)
│   │   └── audio/                 # ambiances spatiales (.mp3)
│   └── App.tsx
└── public/
```

**Fichiers clés** :
- `components/Scene.tsx` — `<Canvas><XR>...</XR></Canvas>` avec `<Controllers />`
- `scenes/<destination>.ts` — métadonnées : panorama URL, hotspots, audio, transitions
- `hooks/usePinSession.ts` — récupère la session VR via PIN, démarre la scène

## 5. Flow PIN (DR-574)

```
1. [Web client] User → "Voir en VR" sur une destination
2. [Web client] POST /api/v1/vr/sessions → reçoit PIN 4 chiffres
3. [User] Met le casque, ouvre panorama-service URL
4. [Casque] Saisit le PIN
5. [Casque] GET /api/v1/vr/sessions/:pin → reçoit destination + sessionId
6. [Casque] Charge la scène, entre en mode immersif (XR)
```

Voir [`api-reference/gateway-api.md`](../../api-reference/gateway-api.md#sessions-vr-dr-574) pour les endpoints.

## 6. Assets panoramiques

**Format recommandé** :
- Résolution : 4096×2048 (4K) min, 8192×4096 (8K) idéal
- Format : `.webp` (poids) ou `.jpg` (compatibilité)
- Projection : equirectangulaire (2:1)
- Poids cible : < 5 MB par image

**Pipeline d'upload** :
1. Source : photo 360° brute (Insta360, RICOH Theta, etc.)
2. Editing : Lightroom / Photoshop (correction couleur, raccord)
3. Compression : `cwebp -q 85`
4. Upload : bucket S3 (voir [`infrastructure/terraform.md`](../../infrastructure/terraform.md) module `storage`)
5. URL : `https://assets.dreamscape.app/panoramas/<destination>.webp`

## 7. Compatibilité WebXR

| Appareil | Statut | Notes |
|----------|--------|-------|
| Meta Quest 2/3 | ✅ | Browser intégré |
| Apple Vision Pro | ✅ | Safari WebXR |
| HTC Vive (PC) | ✅ | Edge / Chrome |
| iPhone/iPad | ⚠️ | Mode 360° uniquement (pas de VR) |
| Desktop browser | ✅ | Mode 360° avec souris |

## 8. Tests

```bash
npm test                    # Vitest
npm run test:e2e            # Cypress (mode 360°, pas VR)
```

Tests VR : pas automatisables faute d'émulateur fiable côté CI. Tests manuels documentés dans [`reference/paris-vr-spec.md`](../../reference/paris-vr-spec.md).

## 9. Performance

| Métrique | Cible | Outil |
|----------|-------|-------|
| FPS en VR | 90 fps (Quest 3) | Stats.js intégré |
| Time to first panorama | < 3s | Lighthouse |
| Bundle size | < 500 KB gzipped | `npm run build && du -sh dist/` |

Optimisations :
- `texture.minFilter = LinearMipMapLinearFilter` (mipmaps)
- Précharger les panoramas adjacents (transitions instantanées)
- `<Canvas dpr={[1, 2]}>` pour limiter le DPR sur mobile

## 10. Debug & pièges

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Mode VR ne se lance pas | HTTPS manquant | Toujours servir en HTTPS pour WebXR |
| Texture noire | URL CORS ou 404 | Vérifier headers `Access-Control-Allow-Origin` du bucket |
| Lag dans le casque | Texture trop lourde | Réduire à 4K, utiliser `.webp` |
| PIN expiré (404) | TTL 1h dépassé | Re-générer côté web |
| Audio spatial ne suit pas la tête | `<PositionalAudio>` mal configuré | Vérifier `distance` et `rolloffFactor` |

## 11. Contribution

Ajouter une nouvelle destination VR :
1. Créer `src/scenes/<destination>.ts` (cf. `paris.ts`)
2. Uploader les assets : panorama + audio
3. Référencer dans le selector de destinations (`web-client/src/pages/VRSelector.tsx`)
4. Ajouter au `gateway` dans la liste des destinations valides
5. Tests manuels en casque + screenshots dans la PR
