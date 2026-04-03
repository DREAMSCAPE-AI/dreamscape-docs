# 🌍 DREAMSCAPE - ML Dataset Seeding

## Vue d'ensemble

Ce seed génère un dataset réaliste pour l'entraînement du modèle ML de recommandation.

## 📊 Dataset Généré

### Utilisateurs (100)
- **6 segments distincts** avec profils cohérents:
  - `ADVENTURE_SEEKER` (17%) - Jeunes aventuriers, budget moyen, activité élevée
  - `LUXURY_TRAVELER` (17%) - Voyageurs haut de gamme, budget élevé, confort premium
  - `BUDGET_BACKPACKER` (17%) - Backpackers, petit budget, forte mobilité
  - `FAMILY_EXPLORER` (17%) - Familles, budget moyen-élevé, destinations familiales
  - `BUSINESS_TRAVELER` (17%) - Voyageurs d'affaires, budget professionnel
  - `CULTURE_ENTHUSIAST` (17%) - Passionnés de culture, budget moyen

### Destinations (50)
- **Paris, Londres, NYC, Tokyo** (villes majeures)
- **Bali, Maldives, Santorini** (plages paradisiaques)
- **Islande, Patagonie, Alpes suisses** (nature/aventure)
- **Kyoto, Marrakech, Venise** (culture/patrimoine)

### Recommandations (1500-2000)
Distribution réaliste par statut:
- **60%** `NOT_VIEWED` - Recommandations non consultées
- **25%** `VIEWED` - Vues mais sans clic
- **10%** `CLICKED` - Cliquées (intérêt)
- **4%** `BOOKED` - Réservées (conversion)
- **1%** `REJECTED` - Rejetées explicitement

### Historique de recherche (500-800)
- 5-8 recherches par utilisateur
- Dates de départ réalistes (30-90 jours dans le futur)
- Origines variées (Paris, Londres, NYC, Tokyo, Berlin)

## 🎯 Cohérence des Données

### Vecteurs 8D
Les vecteurs utilisateur et destination sont alignés sémantiquement:

| Dimension | Index | Description | Exemple User | Exemple Destination |
|-----------|-------|-------------|--------------|---------------------|
| Climate | 0 | Préférence climat chaud | 0.8 (chaud) | Bali: 0.9 |
| Culture | 1 | Culture vs Nature | 0.9 (culture) | Paris: 0.9 |
| Budget | 2 | Niveau de budget | 0.7 (moyen-élevé) | Dubai: 0.9 |
| Activity | 3 | Niveau d'activité | 0.9 (très actif) | Patagonie: 0.95 |
| Group | 4 | Type de voyage | 0.9 (famille) | - |
| Urban | 5 | Urbain vs Rural | 0.9 (urbain) | NYC: 1.0 |
| Gastronomy | 6 | Importance gastronomie | 0.9 (important) | Tokyo: 1.0 |
| Popularity | 7 | Popularité préférée | 0.8 (populaire) | Paris: 0.9 |

### Exemple: ADVENTURE_SEEKER
```json
{
  "vector": [0.6, 0.7, 0.4, 0.9, 0.5, 0.3, 0.6, 0.4],
  "budget_range": {"min": 1000, "max": 3000},
  "travel_types": ["ADVENTURE", "NATURE"],
  "activity_level": "HIGH",
  "accommodation": "COMFORT"
}
```
→ Correspondance forte avec: Patagonie (0.95 activity), Banff, Islande

### Exemple: LUXURY_TRAVELER
```json
{
  "vector": [0.8, 0.6, 0.9, 0.3, 0.7, 0.8, 0.9, 0.8],
  "budget_range": {"min": 5000, "max": 15000},
  "travel_types": ["RELAXATION", "CULTURAL"],
  "activity_level": "LOW",
  "accommodation": "LUXURY"
}
```
→ Correspondance forte avec: Maldives, Dubai, Paris

## 🚀 Utilisation

### 1. Charger le seed

```bash
cd dreamscape-infra/docker

# Charger le seed ML réaliste
docker exec -i dreamscape-postgres psql -U dreamscape_user -d dreamscape < ../../dreamscape-services/db/seed_ml_realistic.sql
```

### 2. Vérifier les données

```sql
-- Statistiques par segment
SELECT
    uv."primarySegment",
    COUNT(*) as user_count,
    AVG((uv.vector->>2)::FLOAT) as avg_budget_pref,
    COUNT(DISTINCT r.id) as recommendations_count
FROM user_vectors uv
LEFT JOIN recommendations r ON r."userId" = uv."userId"
GROUP BY uv."primarySegment"
ORDER BY user_count DESC;

-- Distribution des statuts
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM recommendations
GROUP BY status
ORDER BY count DESC;

-- Destinations les plus recommandées
SELECT
    iv.name,
    iv."destinationType",
    COUNT(r.id) as rec_count,
    AVG(r.score) as avg_score,
    COUNT(CASE WHEN r.status = 'BOOKED' THEN 1 END) as bookings
FROM item_vectors iv
LEFT JOIN recommendations r ON r."itemVectorId" = iv.id
GROUP BY iv.id, iv.name, iv."destinationType"
ORDER BY rec_count DESC
LIMIT 10;
```

### 3. Lancer le pipeline ML

```bash
# Nettoyer les anciennes données
rm -rf dreamscape-services/ai/data/datasets/*

# Exécuter le pipeline ETL
docker-compose run --rm ai-ml-trainer

# Vérifier les résultats
ls -lh dreamscape-services/ai/data/datasets/v1.0/
```

## 📈 Résultats Attendus

Avec ce seed, le pipeline ML devrait générer:

- **Train samples**: ~1200-1400 (80%)
- **Test samples**: ~300-350 (20%)
- **Features**: 81 colonnes
- **Booking rate**: ~4-5% (réaliste)
- **Engagement distribution**:
  - 0.0 (NOT_VIEWED): ~60%
  - 1.0 (VIEWED): ~25%
  - 3.0 (CLICKED): ~10%
  - 5.0 (BOOKED): ~4%
  - -1.0 (REJECTED): ~1%

## 🔄 Regenerer les Données

Pour générer un nouveau dataset avec variation:

```bash
# Supprimer les anciennes données ML
docker exec -i dreamscape-postgres psql -U dreamscape_user -d dreamscape <<EOF
DELETE FROM recommendations;
DELETE FROM search_history;
DELETE FROM user_preferences;
DELETE FROM travel_onboarding_profiles;
DELETE FROM user_vectors;
DELETE FROM item_vectors;
DELETE FROM users WHERE email LIKE '%@dreamscape.test';
EOF

# Recharger le seed
docker exec -i dreamscape-postgres psql -U dreamscape_user -d dreamscape < ../../dreamscape-services/db/seed_ml_realistic.sql
```

## 📝 Notes

- Les vecteurs ont une **variance aléatoire de ±0.1** pour éviter les données trop uniformes
- Les scores de recommandation sont **corrélés au statut** (plus élevés pour BOOKED)
- Les dates sont **distribuées sur 90 jours** pour avoir un historique réaliste
- Les nationalités sont **cohérentes avec les segments** (ex: AE pour LUXURY_TRAVELER)

## 🎓 Utilisation pour l'Entraînement

Ce dataset permet d'entraîner:

1. **Collaborative Filtering** (ALS, SVD)
   - Matrice user-item basée sur engagement_score
   - Factorisation des vecteurs 8D

2. **Neural Collaborative Filtering**
   - Embeddings users/items
   - MLP pour prédiction d'engagement

3. **Hybrid Models**
   - Combine collaborative + content-based (vecteurs 8D)
   - Contexte temporel (seasonality, days_until_departure)

4. **Ranking Models**
   - Learning to Rank pour réorganiser les recommandations
   - Features: score, confidence, user_vector, item_vector
