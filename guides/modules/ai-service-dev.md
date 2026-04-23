# Guide de développement — AI Service

**Port** : 3005 · **Pod** : Business · **Stack** : Node 18+ / Express / Prisma / OpenAI / Kafka

## 1. Vue d'ensemble

Système de recommandations basé sur des **vecteurs de similarité** (UserVector × ItemVector) avec stratégies adaptées (cold start, segmentation comportementale, prédictions).

**Fonctions** :
- Génération de recommandations personnalisées
- Recommandations populaires (par segment)
- Cold start (4 stratégies)
- Tracking d'interactions (view, click, book, dismiss)
- Segmentation comportementale (8 segments)
- Prédictions (likelihood, churn, booking probability)
- Initialisation du UserVector depuis l'onboarding

## 2. Prérequis

```bash
NODE_ENV=development
PORT=3005
DATABASE_URL=postgresql://...
JWT_SECRET=<partagé>
KAFKA_BROKERS=localhost:9092

# OpenAI (compte sur platform.openai.com)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini               # défaut

# Recommandation
RECOMMENDATION_CACHE_TTL=3600          # secondes
COLD_START_DEFAULT_STRATEGY=adaptive
```

## 3. Démarrage local

```bash
cd dreamscape-services/ai
npm install
npx prisma generate
npm run db:seed                        # seed UserVector + ItemVector de démo
npm run dev
# → http://localhost:3005/health
```

Tester une recommandation :
```bash
curl -X POST http://localhost:3000/api/v1/ai/recommendations/generate \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<uuid>", "limit": 5}'
```

## 4. Architecture du code

```
ai/
├── src/
│   ├── services/
│   │   ├── RecommendationService.ts        # logique principale
│   │   ├── ColdStartService.ts             # 4 stratégies
│   │   ├── SegmentationService.ts          # k-means simplifié
│   │   ├── VectorService.ts                # création/MAJ UserVector
│   │   ├── PredictionService.ts            # likelihood, churn
│   │   └── OpenAIService.ts                # appels OpenAI (explanations)
│   ├── algorithms/
│   │   ├── cosineSimilarity.ts
│   │   ├── popularityScoring.ts
│   │   └── diversityFilter.ts
│   ├── routes/
│   ├── middleware/
│   └── server.ts
└── tests/
```

**Fichiers clés** :
- `services/VectorService.ts` — `initializeFromOnboarding()` : transforme un onboarding profile en vecteur 8-dim
- `services/SegmentationService.ts` — assign le segment (`CULTURAL_ENTHUSIAST`, etc.)
- `algorithms/cosineSimilarity.ts` — calcul du score de matching User × Item

## 5. Base de données

Modèles :
- `UserVector` — vecteur 8-dim normalisé [0-1]
- `ItemVector` — caractéristiques destination (climat, culture, prix, etc.)
- `Recommendation` — résultats générés (avec scoring + tracking)
- `PredictionData`, `Analytics`

Vecteurs (8 dimensions) :
1. Budget (low → luxury)
2. Aventure
3. Culture
4. Détente
5. Gastronomie
6. Nature
7. Vie nocturne
8. Famille

## 6. Endpoints

Spec : [`api-reference/openapi/ai.openapi.yaml`](../../api-reference/openapi/ai.openapi.yaml)
Markdown : [`api-reference/ai-api.md`](../../api-reference/ai-api.md)

**Stratégies cold start** :
| Stratégie | Quand l'utiliser |
|-----------|-----------------|
| `popularity_only` | Aucune donnée user (rare, fallback) |
| `hybrid_segment` | User a un segment mais pas de comportement |
| `hybrid_preferences` | User a complété l'onboarding (recommandé) |
| `adaptive` | Auto-détecte la meilleure stratégie |

## 7. Événements Kafka

**Publiés** :
- `dreamscape.ai.recommendation.generated`
- `dreamscape.ai.user.segmented`
- `dreamscape.ai.prediction.computed`

**Consommés** :
- `dreamscape.user.onboarding.completed` → init UserVector + segment
- `dreamscape.user.preferences.updated` → recalcul UserVector
- `dreamscape.voyage.booking.confirmed` → boost score destination
- `dreamscape.voyage.search.performed` → enrichit le UserVector

Voir [`events/ai-events.md`](../../events/ai-events.md).

## 8. Tests

```bash
npm test
npm run test:unit                        # algorithmes (cosine, scoring)
npm run test:integration                 # avec DB seedée
```

Conseils :
- Mocker OpenAI dans les tests unitaires (pas d'appels réels)
- Pour les tests E2E, créer des users avec onboarding complet en `beforeEach`

## 9. Debug & pièges

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Reco vides pour un user | Pas de UserVector | Appeler `/onboarding/initialize` ou seed |
| Score toujours 0 | ItemVector non normalisé | Vérifier que toutes les dimensions ∈ [0,1] |
| OpenAI rate limit | Appels trop fréquents pour les explanations | Cacher les explications par (userId, destinationId) |
| Cold start renvoie populaires | Segment mal détecté | Vérifier `SegmentationService.assignSegment()` |
| Recos toujours identiques | `diversityFilter` désactivé | Augmenter `diversityFactor` (0.3 → 0.5) |

**Inspecter un UserVector** :
```bash
psql $DATABASE_URL -c "SELECT * FROM \"UserVector\" WHERE \"userId\" = '<uuid>';"
```

## 10. Performance

- Cache des `popular` recommendations : Redis 1h
- Cache des UserVector : in-memory LRU (1000 users)
- Calcul cosine en batch : éviter les boucles N×M (utiliser matrices)
- Si > 10k items : envisager pgvector ou Pinecone

## 11. Contribution

Ajouter une nouvelle dimension au vecteur :
1. ⚠️ Migration : tous les `UserVector` et `ItemVector` doivent être recalculés
2. Mettre à jour `VectorService.DIMENSIONS = 9`
3. Mettre à jour `OnboardingProfile → UserVector` dans `initializeFromOnboarding()`
4. Re-seed les ItemVectors (`npm run db:seed`)
5. Tests des algos avec la nouvelle dimension
