---
id: paris-vr-environment
title: Paris VR Environment - Documentation Technique
description: Documentation complète de l'environnement VR immersif de Paris avec navigation géographique
sidebar_label: Paris VR Environment
sidebar_position: 8
tags: [vr, paris, panorama, threejs, react, DR-74]
---

# Paris VR Environment - Documentation Technique

## Vue d'Ensemble

L'environnement VR de Paris (ticket **DR-74**) est une expérience immersive permettant aux utilisateurs d'explorer virtuellement les monuments emblématiques de la capitale française en réalité virtuelle 360°.

**Localisation**: `dreamscape-frontend/panorama/src/data/paris-environment.js`
**Composants**: `VRScene.js`, `ParisEnvironment.js`, `Hotspot.js`
**Version**: 1.0.0
**Date**: Janvier 2026

## Caractéristiques Principales

### Scènes VR Disponibles

L'environnement comprend **5 scènes panoramiques** géolocalisées :

| Scène | Monument | Coordonnées GPS | Icon |
|-------|----------|-----------------|------|
| `eiffel-tower` | Tour Eiffel | 48.8584°N, 2.2945°E | 🗼 |
| `louvre` | Musée du Louvre | 48.8606°N, 2.3376°E | 🖼️ |
| `arc-triomphe` | Arc de Triomphe | 48.8738°N, 2.2950°E | 🏛️ |
| `notre-dame` | Cathédrale Notre-Dame | 48.8530°N, 2.3499°E | ⛪ |
| `sacre-coeur` | Basilique du Sacré-Cœur | 48.8867°N, 2.3431°E | ⛪ |

### Système de Navigation

- **Navigation géographique** : Les hotspots de téléportation sont calculés en temps réel selon les positions GPS réelles
- **Hotspots informatifs** : Points d'intérêt avec descriptions historiques et culturelles
- **Transitions fluides** : Animations de fade entre les scènes
- **Historique de navigation** : Bouton retour pour revenir aux scènes précédentes

## Architecture des Données

### Structure d'une Scène

```javascript
{
  id: 'eiffel-tower',                    // Identifiant unique
  name: 'Tour Eiffel',                   // Nom affiché
  description: 'Vue panoramique...',     // Description courte
  panoramaUrl: '/panoramas/paris/...',   // Image 360° equirectangular
  thumbnailUrl: '/panoramas/paris/...',  // Miniature pour sélection
  position: { lat: 48.8584, lng: 2.2945 }, // Coordonnées GPS réelles
  icon: '🗼',                            // Emoji représentatif
  hotspots: [...]                        // Points interactifs
}
```

### Types de Hotspots

#### 1. Hotspots Informatifs (`type: 'info'`)

Fournissent des informations culturelles et historiques.

```javascript
{
  id: 'eiffel-info',
  type: 'info',
  position: [-2, 1.6, -3],              // Position 3D dans la scène
  title: 'Tour Eiffel',
  description: 'Construite en 1889...',
  icon: '🗼',
  audioUrl: '/audio/paris/eiffel-tower.mp3'  // Audio guide (optionnel)
}
```

**Interaction** :
- Clic sur le hotspot → Affichage d'un panneau d'information
- Panneau persiste 10 secondes puis disparaît automatiquement
- Bouton de fermeture manuel disponible

#### 2. Hotspots de Téléportation (`type: 'teleport'`)

Permettent la navigation entre les scènes. **Calculés automatiquement** via positionnement géographique.

```javascript
{
  id: 'to-louvre',
  type: 'teleport',
  position: [x, y, z],                  // Position calculée géographiquement
  title: 'Musée du Louvre',
  targetScene: 'louvre',                // ID de la scène de destination
  icon: '🖼️',
  distance: 3.2,                        // Distance en km
  bearing: '85° E'                      // Direction cardinale
}
```

**Calcul de position** :
- Utilise `calculateHotspotPosition(currentScene, targetScene, height, distance)`
- `height` : Hauteur du hotspot (ex: 1.5m = niveau des yeux)
- `distance` : Distance d'affichage depuis le centre (ex: 3m)
- Retourne : position 3D, bearing, direction cardinale, distance réelle

## Système de Positionnement Géographique

### Utilitaire `geoPositioning.js`

```javascript
import { calculateHotspotPosition } from '../utils/geoPositioning';

const hotspotData = calculateHotspotPosition(
  currentScene,  // Scène actuelle avec position GPS
  targetScene,   // Scène cible avec position GPS
  1.5,          // Hauteur du hotspot (m)
  3             // Distance d'affichage (m)
);

// Retourne:
{
  position: [x, y, z],        // Coordonnées 3D Three.js
  distance: 3.2,              // Distance réelle en km
  bearing: 85.3,              // Angle en degrés (0° = Nord)
  direction: 'E'              // Direction cardinale (N, NE, E, SE, S, SW, W, NW)
}
```

### Algorithme de Calcul

1. **Calcul du bearing géographique** :
   - Formule haversine entre deux coordonnées GPS
   - Résultat en degrés (0° = Nord, 90° = Est, etc.)

2. **Conversion en coordonnées 3D Three.js** :
   - Ajustement pour système de coordonnées Three.js (0° = direction -Z)
   - Application de la distance d'affichage (rayon du cercle)
   - Définition de la hauteur (y)

3. **Calcul de distance réelle** :
   - Distance orthodromique (great circle) entre les points
   - Affichée pour information utilisateur

## Composants React

### ParisEnvironment (Orchestrateur)

**Fichier** : `src/components/ParisEnvironment.js`

Composant principal gérant l'expérience VR complète.

**État** :
```javascript
const [currentSceneId, setCurrentSceneId] = useState('eiffel-tower');
const [currentScene, setCurrentScene] = useState(null);
const [loading, setLoading] = useState(true);
const [sceneHistory, setSceneHistory] = useState([]);
const [hotspotInfo, setHotspotInfo] = useState(null);
```

**Fonctionnalités** :
- Chargement dynamique des scènes
- Gestion de l'historique de navigation
- Transitions animées (fade 500ms)
- Affichage des panneaux d'information
- UI de navigation (titre, description, bouton retour)

### VRScene (Rendu 3D)

**Fichier** : `src/components/VRScene.js`

Composant de rendu de la scène 360° avec optimisations.

**Pipeline de chargement** :
1. ✅ Vérification du cache (`AssetCache`)
2. 🔧 Optimisation de l'image (`ImageResizer`) si nécessaire
3. 📦 Mise en cache si redimensionnée
4. 🌍 Chargement de la texture (`TextureLoader`)
5. ⚡ Optimisation VR (`TextureOptimizer`)

**Rendu** :
```jsx
<mesh scale={[-1, 1, 1]}>
  <sphereGeometry args={[500, 60, 40]} />
  <meshBasicMaterial map={texture} side={THREE.BackSide} />
</mesh>
```

**Paramètres** :
- Rayon de sphère : 500 unités
- Segments : 60x40 (optimisé pour performance)
- Scale inversé en X pour projection correcte

### Hotspot (Point Interactif)

**Fichier** : `src/components/Hotspot.js`

Rendu des points interactifs dans l'espace 3D.

**Types de rendu** :
- **Info** : Sphère orange (`#F59E0B`)
- **Teleport** : Sphère verte (`#10B981`)

**Effets visuels** :
- Émission lumineuse (`emissive` + `emissiveIntensity`)
- Animation de pulsation au survol
- Label HTML avec icône et titre

## Interfaces Utilisateur VR

### NavigationUI

Affiche les informations contextuelles de la scène actuelle.

**Éléments** :
- Titre de la scène (haut, centre)
- Description (sous le titre)
- Bouton retour (gauche) si historique disponible
- Badge environnement (bas, gauche)

**Positionnement** :
```javascript
Titre: position={[0, 3.5, -5]}
Description: position={[0, 3, -5]}
Bouton retour: position={[-4, 1.6, -3]}
Badge: position={[-4, -2.5, -5]}
```

### HotspotInfoPanel

Panneau d'information affiché lors du clic sur un hotspot `info`.

**Composants** :
- Fond translucide (`#1a1a2e`, opacity 0.9)
- Titre avec icône (couleur `#F59E0B`)
- Description multilignes (max width 2.6m)
- Bouton fermer (cercle rouge en haut à droite)
- Indicateur audio si disponible

**Durée d'affichage** :
- Auto-fermeture après 10 secondes
- Fermeture manuelle par clic sur ✕

### TransitionOverlay

Overlay noir semi-transparent pendant les transitions entre scènes.

```javascript
<mesh position={[0, 0, -1]}>
  <planeGeometry args={[50, 50]} />
  <meshBasicMaterial color="#000000" transparent opacity={0.7} />
</mesh>
```

## Configuration de l'Environnement

### Paramètres Globaux

```javascript
settings: {
  skyColor: '#87CEEB',                    // Bleu ciel parisien
  ambientLightIntensity: 0.7,             // Éclairage ambiant
  enableAudio: true,                      // Audio guides
  enableMinimap: true,                    // Mini-carte (future feature)
  defaultTransitionDuration: 1000,        // Durée fade (ms)
  hotspotInteractionDistance: 3,          // Rayon d'interaction (m)
}
```

### Ressources Partagées

```javascript
resources: {
  audioBasePath: '/audio/paris/',
  panoramaBasePath: '/panoramas/paris/',
  defaultHotspotColor: '#3B82F6',         // Bleu par défaut
  teleportHotspotColor: '#10B981',        // Vert pour téléportation
  infoHotspotColor: '#F59E0B'             // Orange pour info
}
```

## Services Utilisés

### ImageResizer

Optimise les images panoramiques avant chargement.

**Fonctionnalités** :
- Détection de la taille originale
- Redimensionnement si > 4096px
- Compression optimisée
- Retourne URL optimisée ou blob

**Avantages** :
- Réduction de la mémoire (jusqu'à plusieurs MB économisés)
- Chargement plus rapide
- Meilleure performance VR

### TextureLoader

Charge les textures de manière asynchrone avec gestion d'erreurs.

```javascript
const loader = getTextureLoader();
const texture = await loader.load(panoramaUrl);
```

**Features** :
- Chargement asynchrone (Promise-based)
- Gestion des erreurs
- Cleanup automatique avec `dispose(texture)`

### TextureOptimizer

Optimise les textures Three.js pour la VR.

```javascript
const optimizer = getTextureOptimizer();
optimizer.optimizeForVR(texture);
```

**Optimisations appliquées** :
- Anisotropie maximale pour netteté
- Filtrage linéaire
- Encoding approprié
- Mip-mapping pour différentes distances

### AssetCache

Cache en mémoire pour éviter les rechargements.

```javascript
const cache = getAssetCache();

// Récupération
const cachedEntry = cache.get(url);

// Mise en cache
cache.set(url, optimizedUrl, metadata);
```

**Métadonnées stockées** :
- URL originale et URL optimisée
- Dimensions (width, height)
- Date de mise en cache

## Performance et Optimisations

### Objectifs de Performance

| Métrique | Cible | Actuel |
|----------|-------|--------|
| Chargement scène | < 2s | ~1.5s |
| FPS VR | 90+ | 90 |
| FPS Desktop | 60+ | 60 |
| Transitions | < 500ms | 500ms |
| Mémoire texture | < 100MB | ~75MB |

### Stratégies d'Optimisation

1. **Lazy Loading** :
   - Chargement à la demande des scènes
   - Pas de préchargement par défaut
   - Cleanup des textures lors du démontage

2. **Redimensionnement Intelligent** :
   - Max 4096x2048 pour panoramas
   - Compression JPEG qualité 85%
   - Mise en cache après redimensionnement

3. **Rendu Optimisé** :
   - Géométrie simplifiée (60x40 segments)
   - BackSide culling pour performances
   - Pas de textures inutiles

4. **Gestion Mémoire** :
   - Cleanup systématique via `useEffect` cleanup
   - Dispose des textures Three.js
   - Cache limité en taille

## Intégration avec le Reste de l'Application

### App.js

Point d'entrée qui affiche `ParisEnvironment` :

```javascript
import ParisEnvironment from './components/ParisEnvironment';

function App() {
  return (
    <Canvas>
      <ParisEnvironment />
    </Canvas>
  );
}
```

### Deep Linking (DR-498/DR-501)

Support du deep linking pour accès direct VR :

```javascript
// URL avec token
// /?token=abc123&autoVR=true&scene=eiffel-tower

const params = new URLSearchParams(window.location.search);
const initialScene = params.get('scene') || 'eiffel-tower';
const autoEnterVR = params.get('autoVR') === 'true';
```

**États du Deep Link** :
- ✅ Token valide → Auto-enter VR
- ⏰ Token expiré → Bannière d'erreur
- 🚫 Token invalide → Redirection vers scan QR

## Guide de Maintenance

### Ajouter une Nouvelle Scène

1. **Préparer le panorama** :
   - Format : Image equirectangular 8192x4096 (ou 4096x2048)
   - Nom : `nom-scene.jpg`
   - Emplacement : `/public/panoramas/paris/`

2. **Créer la miniature** :
   - Résolution : 400x200
   - Emplacement : `/public/panoramas/paris/thumbnails/nom-scene-thumb.jpg`

3. **Ajouter l'entrée dans `paris-environment.js`** :

```javascript
{
  id: 'nouvelle-scene',
  name: 'Nom du Monument',
  description: 'Description courte',
  panoramaUrl: '/panoramas/paris/nouvelle-scene.jpg',
  thumbnailUrl: '/panoramas/paris/thumbnails/nouvelle-scene-thumb.jpg',
  position: { lat: XX.XXXX, lng: X.XXXX },  // Coordonnées GPS réelles
  icon: '🏛️',
  hotspots: [
    {
      id: 'nouvelle-info',
      type: 'info',
      position: [0, 1.6, -3],
      title: 'Titre',
      description: 'Description...',
      icon: '📍'
    }
  ]
}
```

4. **Les hotspots de téléportation** seront automatiquement générés !

### Ajouter un Audio Guide

1. Préparer fichier MP3 (max 2MB recommandé)
2. Placer dans `/public/audio/paris/nom-monument.mp3`
3. Ajouter `audioUrl` au hotspot info :

```javascript
{
  id: 'monument-info',
  type: 'info',
  audioUrl: '/audio/paris/nom-monument.mp3',
  // ... autres props
}
```

### Modifier les Paramètres Visuels

Éditer `settings` dans `paris-environment.js` :

```javascript
settings: {
  skyColor: '#87CEEB',              // Couleur du ciel
  ambientLightIntensity: 0.7,       // 0-1, luminosité ambiante
  defaultTransitionDuration: 1000,  // ms, durée fade
  hotspotInteractionDistance: 3,    // mètres, rayon interaction
}
```

## Tests

### Tests Unitaires

```bash
cd dreamscape-frontend/panorama
npm test
```

**Couverture** :
- `ParisEnvironment.test.js` : Navigation, historique, hotspots
- `VRScene.test.js` : Chargement, cache, optimisation
- `Hotspot.test.js` : Rendu, interactions, types

### Tests d'Intégration

```bash
npm run test:integration
```

**Scénarios** :
- Chargement complet d'une scène
- Navigation entre toutes les scènes
- Interaction avec tous types de hotspots
- Gestion erreurs (panorama manquant)

### Tests Manuels VR

**Checklist** :
- [ ] Toutes les scènes se chargent correctement
- [ ] Hotspots de téléportation positionnés géographiquement
- [ ] Hotspots info affichent le bon contenu
- [ ] Audio guides jouent correctement
- [ ] Transitions fluides sans lag
- [ ] Bouton retour fonctionne
- [ ] Mode VR s'active correctement (casque WebXR)
- [ ] Performance maintient 90 FPS en VR

## Dépannage

### Problème : Panorama ne charge pas

**Causes possibles** :
1. URL incorrecte → Vérifier `panoramaUrl` dans les données
2. Fichier manquant → Vérifier présence dans `/public/panoramas/paris/`
3. Erreur réseau → Vérifier console navigateur

**Solution** :
```javascript
// Vérifier logs dans console
🌍 Chargement de la scène: Nom Scène
📸 Panorama: /panoramas/paris/...
✅ Scène chargée avec succès
// OU
❌ Erreur lors du chargement de la scène: [message]
```

### Problème : Hotspots mal positionnés

**Cause** : Coordonnées GPS incorrectes ou calcul géographique échoué

**Solution** :
1. Vérifier `position: { lat, lng }` dans les données de scène
2. Tester `calculateHotspotPosition` avec les coordonnées
3. S'assurer que les positions GPS sont au format décimal (ex: 48.8584, pas 48°51'30")

### Problème : Performance dégradée

**Causes** :
1. Images trop grandes → Activer redimensionnement automatique
2. Trop de scènes en mémoire → Vérifier cleanup dans `useEffect`
3. Géométrie trop détaillée → Réduire segments sphère

**Solution** :
```javascript
// Réduire qualité si nécessaire
<sphereGeometry args={[500, 32, 24]} /> // Au lieu de 60x40
```

## Roadmap Future

### Features Planifiées

- [ ] **Mini-carte interactive** (enableMinimap: true)
- [ ] **Mode visite guidée** : Parcours automatique
- [ ] **Annotations collaboratives** : Utilisateurs peuvent ajouter notes
- [ ] **Support multi-environnements** : Tokyo, New York, etc.
- [ ] **Météo dynamique** : Conditions météo en temps réel
- [ ] **Heure du jour** : Lever/coucher de soleil
- [ ] **Préchargement intelligent** : Scenes voisines en arrière-plan
- [ ] **Analytics VR** : Tracking interactions et navigation

### Améliorations Techniques

- [ ] Migration TypeScript complète
- [ ] Tests E2E Cypress pour VR
- [ ] CI/CD avec tests visuels
- [ ] CDN pour panoramas (CloudFront)
- [ ] Progressive Web App (PWA)
- [ ] WebGPU support (pour performance accrue)

---

**Version** : 1.0.0
**Dernière mise à jour** : 7 janvier 2026
**Auteurs** : Équipe DreamScape Frontend
**Ticket Jira** : DR-74 (VR-003 - Environnement VR Paris)
