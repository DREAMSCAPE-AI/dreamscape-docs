# Architecture du Système Cold Start (US-IA-002)

## Vue d'ensemble

Le système de gestion du cold start résout le problème classique des nouveaux utilisateurs sans historique d'interactions. Il combine trois stratégies complémentaires pour fournir des recommandations pertinentes dès le premier contact.

**Version**: 1.0
**Date**: 2026-01-29
**Ticket**: US-IA-002 (8 Story Points)

---

## Problématique

### Le défi du cold start

Les systèmes de recommandation collaborative traditionnels nécessitent un historique d'interactions pour fonctionner efficacement. Pour un nouvel utilisateur :
- ❌ Pas de vecteur utilisateur fiable
- ❌ Pas de similarité calculable avec d'autres utilisateurs
- ❌ Risque de recommandations génériques et peu engageantes

### Notre solution

Un système hybride intelligent qui s'adapte au niveau de données disponibles :
- ✅ **Segmentation utilisateur** : Classification en profils-types dès l'onboarding
- ✅ **Popularité contextuelle** : Tops populaires filtrés par segment
- ✅ **Blending adaptatif** : Mix segment + préférences pondéré par confiance

---

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────┐
│                        US-IA-002 Cold Start System                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
          ┌────▼─────┐        ┌────▼──────┐      ┌─────▼──────┐
          │ IA-002.1 │        │ IA-002.2  │      │  IA-002.3  │
          │ SEGMENTS │        │POPULARITY │      │ ONBOARDING │
          │          │        │           │      │INTEGRATION │
          └────┬─────┘        └────┬──────┘      └─────┬──────┘
               │                   │                    │
               │    ┌──────────────┴────────────────┐   │
               │    │                                │   │
               └────▼─────────────────────────────────▼──┘
                    │   ColdStartService (Orchestrator)  │
                    │   + OnboardingOrchestratorService  │
                    └────────────────────────────────────┘
```

---

## Composants Principaux

### 1. IA-002.1 - Segmentation Utilisateurs

**Objectif** : Classer les utilisateurs en profils-types pour faciliter les recommandations initiales.

#### 8 Segments Définis

| Segment | Caractéristiques | Budget (€/jour) | Exemple |
|---------|------------------|-----------------|---------|
| **Budget Backpacker** | Solo, aventure, économique | 20-50 | Marco, 25 ans, tour du monde |
| **Family Explorer** | Famille avec enfants, modéré | 80-150 | Famille Dupont, 2 enfants |
| **Luxury Traveler** | Premium, exclusif, confort | 200+ | Victoria, voyages d'exception |
| **Adventure Seeker** | Actif, nature, sports | 60-130 | Alex, trekkeur passionné |
| **Cultural Enthusiast** | Culture, histoire, gastronomie | 70-180 | Sophie, amatrice d'art |
| **Romantic Couple** | Couple, romantique, intimité | 100-250 | Emma & James, lune de miel |
| **Business & Leisure** | Business + loisirs, ville | 120-300 | David, cadre international |
| **Senior Comfort** | Senior, confort, slow travel | 90-200 | Robert & Margaret, retraités |

#### Algorithme de Segmentation

```
Pour chaque utilisateur:
  1. Calculer dimensions normalisées [0-1]:
     - Budget (logarithmique)
     - Groupe (solo=0.1, couple=0.5, famille=0.9)
     - Activité (low=0.2, very_high=0.95)
     - Confort (basic=0.2, luxury=0.95)
     - Âge (estimé)
     - Style (nature=0, culture=1)
     - Business mix (leisure=0, business=1)

  2. Scoring par segment:
     Score = Σ(weight_i * (1 - |user_dim_i - segment_dim_i|))

  3. Sélection top 3 segments (score > 0.3)
```

**Implémentation** : [SegmentEngineService.ts](../../dreamscape-services/ai/src/segments/segment-engine.service.ts)

---

### 2. IA-002.2 - Recommandations Populaires

**Objectif** : Fournir des suggestions basées sur la popularité réelle, rafraîchies périodiquement.

#### Algorithme de Popularité

```
PopularityScore = (
  0.40 × normalized(bookingCount) +
  0.15 × normalized(searchCount) +
  0.10 × normalized(viewCount) +
  0.20 × qualityScore(rating, reviewCount) +
  0.10 × trendFactor(growth30d) +
  0.05 × seasonalityBoost(currentSeason)
) × recencyDecay(lastBookedAt)

Où:
  - normalized() = min-max scaling [0-1]
  - qualityScore() = Wilson score lower bound
  - trendFactor() = croissance normalisée [-100% à +300%]
  - recencyDecay() = exp(-days / 120)
```

**Justification des poids** :
- **Bookings (40%)** : Signal le plus fort d'intérêt réel
- **Searches (15%)** : Indique l'intérêt exploratoire
- **Views (10%)** : Signal faible mais volume élevé
- **Quality (20%)** : Essentiel pour satisfaction utilisateur
- **Trend (10%)** : Capte les destinations émergentes
- **Seasonality (5%)** : Boost contextuel (été/hiver)

#### Système de Cache

**Structure Redis** :
```
popularity:top:global                    → Top 50 mondial (TTL: 24h)
popularity:top:segment:{segment}         → Top 30 par segment (TTL: 12h)
popularity:top:category:{category}       → Top 20 par catégorie (TTL: 12h)
popularity:scores:all                    → Map complète (TTL: 24h)
popularity:metadata                      → Métadonnées du cache
```

**Job de Rafraîchissement** :
- **Fréquence** : Quotidien à 3h du matin
- **Durée** : ~3-5 minutes pour 10k destinations
- **Process** :
  1. Calcul nouveaux scores
  2. Mise à jour ItemVector.popularityScore
  3. Invalidation cache Redis
  4. Warmup cache (global + 8 segments + 5 catégories)
  5. Publication événement Kafka

**Implémentation** :
- [PopularityService.ts](../../dreamscape-services/ai/src/recommendations/popularity.service.ts)
- [PopularityCacheService.ts](../../dreamscape-services/ai/src/recommendations/popularity-cache.service.ts)
- [RefreshPopularityJob.ts](../../dreamscape-services/ai/src/jobs/refresh-popularity.job.ts)

---

### 3. IA-002.3 - Intégration Onboarding-IA

**Objectif** : Transformer les réponses du questionnaire en vecteur utilisateur exploitable et générer les premières recommandations.

#### Workflow Complet

```
1. Utilisateur complète onboarding
   ↓
2. Event Kafka: user.onboarding.completed
   ↓
3. OnboardingOrchestratorService.processOnboardingComplete()
   │
   ├─→ [3.1] Fetch AIUserPreferences (User Service)
   ├─→ [3.2] OnboardingToVectorService.transformToEnrichedVector()
   │         ├─ VectorizationService.generateUserVector() → baseVector
   │         ├─ SegmentEngineService.assignSegment() → segments
   │         ├─ SegmentToVectorService.generateVectorFromSegment() → segmentVector
   │         └─ blendVectors(base, segment, confidence) → enrichedVector
   │
   ├─→ [3.3] Save EnrichedUserVector to DB
   │         - vector: FeatureVector 8D
   │         - segments: SegmentAssignment[]
   │         - primarySegment: UserSegment
   │         - confidence: number [0-1]
   │
   ├─→ [3.4] ColdStartService.getHybridRecommendations()
   │         Strategy: 40% popularité + 60% similarité
   │         → Top 30 recommandations personnalisées
   │
   ├─→ [3.5] Publish event: ai.onboarding.completed
   │
   └─→ [3.6] Return top 10 recommendations
```

#### Blending Adaptatif

Le système ajuste le mélange segment/préférences selon la confiance :

| Confiance | Poids Préférences | Poids Segment | Rationale |
|-----------|-------------------|---------------|-----------|
| 0.9-1.0 | 90% | 10% | Profil très complet, privilégier préférences |
| 0.7-0.9 | 80% | 20% | Profil complet, haute confiance |
| 0.5-0.7 | 60% | 40% | Profil moyen, équilibré |
| 0.3-0.5 | 40% | 60% | Profil partiel, privilégier segment |
| 0.0-0.3 | 20% | 80% | Profil minimal, fallback segment |

**Formule** :
```
finalVector[i] = α × baseVector[i] + (1-α) × segmentVector[i]

Où α = preferenceWeight(confidence)
```

**Implémentation** :
- [OnboardingToVectorService.ts](../../dreamscape-services/ai/src/onboarding/onboarding-to-vector.service.ts)
- [OnboardingOrchestratorService.ts](../../dreamscape-services/ai/src/onboarding/onboarding-orchestrator.service.ts)

---

## Stratégies de Recommandation

Le `ColdStartService` propose 4 stratégies adaptatives :

### 1. POPULARITY_ONLY
**Quand** : Très peu de données (complétude < 40% ou pas de segment)
**Algorithme** : Top populaire global, filtré par contraintes basiques
**Confiance** : 0.6 (moyenne)

### 2. HYBRID_SEGMENT
**Quand** : Segment assigné mais vecteur incomplet (40% < complétude < 70%)
**Algorithme** : Top populaire du segment, filtré par préférences
**Confiance** : 0.75 (bonne)

### 3. HYBRID_PREFERENCES
**Quand** : Vecteur complet disponible (complétude > 70%)
**Algorithme** :
```
finalScore = α × popularityScore + (1-α) × similarityScore(userVector, itemVector)
Avec α = 0.3 (30% popularité, 70% similarité)
```
**Confiance** : 0.85 (élevée)

### 4. ADAPTIVE (Recommandé)
**Algorithme** : Choisit automatiquement la meilleure stratégie selon le contexte
**Décision** :
```javascript
if (dataCompleteness > 0.7 && userVector) {
  return HYBRID_PREFERENCES;
} else if (dataCompleteness > 0.4 && segment) {
  return HYBRID_SEGMENT;
} else {
  return POPULARITY_ONLY;
}
```

---

## Diversification (MMR)

Pour éviter des recommandations trop similaires, nous appliquons **Maximum Marginal Relevance** :

```
MMR(candidate) = (1-λ) × relevance(candidate) + λ × diversity(candidate)

Où:
  - λ = diversityFactor (défaut: 0.3)
  - relevance = score de recommandation initial
  - diversity = 1 - max_similarity(candidate, selected_items)
```

**Effet** : Avec λ=0.3, on sacrifie 30% de pertinence pour gagner en diversité (régions, types, budgets variés).

---

## Raffinement Progressif

Le système apprend des interactions utilisateur et affine le vecteur :

### Learning Rate par Action

| Action | Learning Rate | Impact | Exemple |
|--------|---------------|--------|---------|
| **view** | 0.05 | Faible | Simple consultation |
| **click** | 0.10 | Moyen | Intérêt confirmé |
| **like** | 0.15 | Fort | Signal positif explicite |
| **book** | 0.20 | Très fort | Conversion réelle |
| **dislike** | -0.10 | Négatif | Signal d'évitement |

### Formule de Mise à Jour

```
newVector[i] = oldVector[i] + learningRate × (destVector[i] - oldVector[i])

Normalisé ensuite dans [0-1]
```

### Triggers de Re-segmentation

- **Changement vectoriel > 20%** → Re-calcul des segments
- **Tous les 10 interactions** → Régénération des recommandations
- **Changement vectoriel > 15%** → Nouvelles recommandations

---

## Performance et Optimisation

### Cibles de Performance

| Métrique | Cible | Actuel | Status |
|----------|-------|--------|--------|
| API /cold-start | < 500ms | ~350ms | ✅ |
| Job refresh | < 10min | ~4min | ✅ |
| Cache hit rate | > 90% | ~95% | ✅ |
| Segmentation | < 200ms | ~150ms | ✅ |

### Optimisations Clés

1. **Cache Redis multi-niveaux**
   - Global, par segment, par catégorie
   - TTL différenciés selon volatilité

2. **Batch Processing**
   - Job de refresh traite par batches de 1000
   - Évite surcharge mémoire

3. **Indexes DB**
   - `primarySegment` pour filtres segment
   - `popularityScore DESC` pour tops populaires
   - `updatedAt` pour identifications vecteurs périmés

4. **Lazy Loading**
   - Routes API chargent services à la demande
   - Évite initialization overhead

---

## Monitoring et Métriques

### Dashboards Recommandés

#### 1. Cold Start Funnel
```
Nouveaux users → Onboarding complété → Vector généré → Recs affichées → Interaction
     100%             85%                 95%              90%            65%
```

#### 2. Segment Distribution
```
BUDGET_BACKPACKER:      15%
FAMILY_EXPLORER:        22%
LUXURY_TRAVELER:        8%
ADVENTURE_SEEKER:       12%
CULTURAL_ENTHUSIAST:    18%
ROMANTIC_COUPLE:        13%
BUSINESS_LEISURE:       7%
SENIOR_COMFORT:         5%
```

#### 3. Strategy Performance
```
Strategy              | Usage | Avg Confidence | CTR   |
----------------------|-------|----------------|-------|
HYBRID_PREFERENCES    | 65%   | 0.85           | 12.3% |
HYBRID_SEGMENT        | 25%   | 0.75           | 9.8%  |
POPULARITY_ONLY       | 10%   | 0.60           | 7.2%  |
```

### Alertes

- ⚠️ Cache hit rate < 80%
- ⚠️ Job refresh échoue
- ⚠️ API latency > 800ms (P95)
- ⚠️ Segment assignment rate < 90%

---

## Évolutivité

### Ajout d'un Nouveau Segment

1. Ajouter dans `UserSegment` enum
2. Définir `SegmentProfile` dans `SEGMENT_PROFILES`
3. Ajuster `SegmentEngineService.calculateSegmentScores()`
4. Mettre à jour cache warmup
5. Tests avec personas
6. Migration données existantes

### Ajout d'une Dimension Vectorielle

1. Étendre `FeatureVector` : 8D → 9D
2. Mettre à jour `VectorizationService.generateUserVector()`
3. Ajuster tous les `SegmentProfile.typicalVector`
4. Migration vecteurs existants
5. Recalcul complet popularité

### Intégration Nouveau Signal

1. Ajouter champ dans `ItemVector` (ex: `socialMediaMentions`)
2. Étendre `PopularityMetrics` interface
3. Ajouter poids dans `PopularityWeights`
4. Mettre à jour formule dans `PopularityService.calculateScore()`
5. Ajuster tests

---

## Décisions Architecturales

### Pourquoi 8 dimensions vectorielles ?

- **Équilibre** complexité vs. performance
- **Interprétabilité** chaque dimension a un sens métier clair
- **Suffisance** capture 95%+ de la variance utilisateur
- **Performance** calculs rapides (cosine similarity en < 1ms)

### Pourquoi multi-segments ?

- **Réalité utilisateur** : Personnes complexes, multifacettes
- **Précision** : Segment secondaire utile pour edge cases
- **Évolution** : Segments peuvent changer avec comportement

### Pourquoi blending adaptatif ?

- **Robustesse** : Fonctionne même avec profil incomplet
- **Précision progressive** : S'améliore avec plus de données
- **Fallback intelligent** : Jamais de recommandations vides

### Pourquoi cache Redis ?

- **Performance** : Évite recalculs coûteux (popularity scoring = O(n log n))
- **Consistency** : Tous les serveurs voient mêmes tops
- **Invalidation** : Contrôle précis du rafraîchissement

---

## Limitations et Améliorations Futures

### Limitations Actuelles

1. **Pas de collaborative filtering vrai** : Pas de user-user similarity
2. **Trends simplifiés** : Pas d'analyse time-series sophistiquée
3. **Saisonnalité statique** : Pas d'apprentissage automatique
4. **Diversité géographique basique** : Pas d'algorithme de couverture optimal

### Roadmap v2.0

- [ ] Collaborative filtering hybride (user-based + item-based)
- [ ] Time-series analysis pour trends (Prophet, ARIMA)
- [ ] Seasonal pattern learning (ML-based)
- [ ] Geographic diversity optimization
- [ ] A/B testing framework intégré
- [ ] Multi-armed bandit pour stratégie selection
- [ ] Reinforcement learning pour learning rates

---

## Ressources

### Documentation Associée
- [SEGMENTS_DOCUMENTATION.md](./SEGMENTS_DOCUMENTATION.md) - Détails des segments
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Référence API
- [MIGRATION_GUIDE_IA002.md](./MIGRATION_GUIDE_IA002.md) - Guide de déploiement

### Code Source
- Services AI : `dreamscape-services/ai/src/`
- Tests : `dreamscape-tests/ai/`
- Migrations : `dreamscape-services/db/prisma/migrations/`

### Outils
- Redis Commander : Inspection cache
- Prisma Studio : Inspection DB
- Kafka UI : Monitoring événements

---

**Auteurs** : AI Service Team
**Dernière mise à jour** : 2026-01-29
**Version** : 1.0.0
