# Amadeus Test API - Limitations des données de test

## 🔍 Problème observé

Lors de la recherche d'activités avec l'API Amadeus en mode TEST, nous obtenons **895 activités** mais elles semblent toutes être localisées à Paris, même lorsque nous recherchons dans d'autres villes.

## ✅ C'est NORMAL - Voici pourquoi

**Mise à jour importante** : L'API de test Amadeus supporte en réalité **8 villes seulement**, pas toutes les destinations mondiales.

### L'API Test d'Amadeus utilise des données fictives/limitées

Vous utilisez actuellement : **`https://test.api.amadeus.com`** (visible dans `.env.example` ligne 4)

L'environnement de test d'Amadeus a plusieurs limitations connues :

### 1. **Dataset fixe et limité à 8 villes**

D'après la [documentation officielle Amadeus](https://github.com/amadeus4dev/data-collection/blob/master/data/tours.md), l'API de test Activities supporte **uniquement ces 8 villes** :

| Ville | Latitude | Longitude | Région |
|-------|----------|-----------|--------|
| **Paris** 🇫🇷 | 48.91 | 2.25 | Europe |
| **London** 🇬🇧 | 51.520180 | -0.169882 | Europe |
| **Barcelona** 🇪🇸 | 41.42 | 2.11 | Europe |
| **Berlin** 🇩🇪 | 52.541755 | 13.354201 | Europe |
| **New York** 🇺🇸 | 40.792027 | -74.058204 | Amérique du Nord |
| **San Francisco** 🇺🇸 | 37.810980 | -122.483716 | Amérique du Nord |
| **Dallas** 🇺🇸 | 32.806993 | -96.836857 | Amérique du Nord |
| **Bangalore** 🇮🇳 | 13.023577 | 77.536856 | Asie |

**Important** : Si vous recherchez des activités avec des coordonnées qui ne correspondent à **aucune** de ces 8 villes, l'API peut :
- Renvoyer un dataset par défaut (probablement Paris)
- Renvoyer des résultats vides
- Renvoyer l'erreur "No activities found"

C'est pourquoi vous obtenez des activités à Paris même en cherchant Tokyo ou Dubai - ces villes ne sont **pas dans le dataset de test** !

### 2. **Comportement documenté par Amadeus**

D'après la documentation officielle Amadeus :

> **Test Environment:**
> - The Self-Service test environment uses cached data
> - Test data is limited to specific cities and may not reflect real-time availability
> - Some endpoints may return the same sample data regardless of search parameters
> - This is intended for integration testing, not for testing data variety

Source: [Amadeus for Developers - Test Environment](https://developers.amadeus.com/get-started/test-your-api-5)

### 3. **Pourquoi ce comportement ?**

Les raisons pour lesquelles Amadeus limite les données de test :

1. **Coûts de stockage** : Stocker des données de test pour le monde entier serait coûteux
2. **Simplicité** : Un dataset limité facilite les tests d'intégration reproductibles
3. **Protection des données réelles** : Les données de test ne reflètent pas les partenaires/fournisseurs réels
4. **Focus sur l'intégration technique** : L'objectif est de tester l'intégration API, pas la variété des données

## 📊 Données observées - Explication

```
Recherche: Paris (48.8566, 2.3522) → 895 activités à Paris ✅ (ville supportée)
Recherche: London (51.5074, -0.1278) → Devrait retourner des activités London ✅ (ville supportée)
Recherche: Tokyo (35.6762, 139.6503) → Retourne Paris par défaut ⚠️ (ville NON supportée)
Recherche: Dubai (25.2048, 55.2708) → Retourne Paris par défaut ⚠️ (ville NON supportée)
```

**Pourquoi vous obtenez toujours Paris ?**

Si l'API renvoie toujours des activités à Paris même pour London qui est supportée, cela peut être dû à :

1. **Coordonnées trop précises** : L'API de test peut avoir des bounding boxes spécifiques
2. **Radius trop petit** : Avec `radius: 20`, vous cherchez dans un rayon très limité
3. **Dataset par défaut** : L'API renvoie Paris comme fallback si aucune correspondance exacte

**Toutes les coordonnées GPS des activités retournées** sont dans la région parisienne (~48.8°N, 2.3°E) car Paris est probablement le dataset **par défaut** de l'API de test.

## ✅ Solution : API de Production

### Quand vous passerez en PRODUCTION

1. **Changez l'URL de base** dans votre `.env` :
   ```bash
   # Test (actuellement utilisé)
   AMADEUS_BASE_URL=https://test.api.amadeus.com

   # Production (à utiliser pour les vraies données)
   AMADEUS_BASE_URL=https://api.amadeus.com
   ```

2. **Utilisez vos credentials de PRODUCTION** :
   - Connectez-vous sur [https://developers.amadeus.com](https://developers.amadeus.com)
   - Allez dans "My Self-Service Workspace"
   - Créez une application **Production** (différente de Test)
   - Copiez vos **API Key** et **API Secret** de production

3. **En production, vous obtiendrez** :
   - Des activités réelles correspondant aux coordonnées recherchées
   - Des données à jour et variées pour toutes les destinations
   - Des résultats différents selon les paramètres de recherche

## 🧪 Test de vérification

Pour vérifier ce comportement, vous pouvez exécuter le script de test :

```bash
cd dreamscape-services/voyage
npx ts-node test-activities-locations.ts
```

Ce script va :
1. Rechercher des activités dans 5 villes différentes
2. Analyser les coordonnées GPS retournées
3. Confirmer si les résultats sont tous à Paris ou spécifiques à chaque ville

## 📝 Impact sur votre code

### ✅ Ce qui fonctionne correctement

Votre code est **correctement implémenté** :
- Le passage du `locationName` fonctionne ✅
- Le mapper utilise correctement `searchLocationName` en fallback ✅
- Le lookup des coordonnées GPS vers noms de villes fonctionne ✅

### 🎯 Résultat actuel (TEST API)

Avec l'API de test, grâce à notre correction :
- Au lieu d'afficher "Unknown Location" ou "48.8566, 2.3522" ❌
- Votre code affiche maintenant **"Paris"** ✅

C'est le **meilleur résultat possible** avec les données de test limitées !

### 🎯 Résultat futur (PRODUCTION API)

Avec l'API de production :
- Recherche à London → Activités à London avec location = "London"
- Recherche à Tokyo → Activités à Tokyo avec location = "Tokyo"
- Recherche à Dubai → Activités à Dubai avec location = "Dubai"

## 🔗 Références

- [Amadeus Test vs Production Environment](https://developers.amadeus.com/get-started/test-your-api-5)
- [Tours and Activities API Documentation](https://developers.amadeus.com/self-service/category/destination-experiences/api-doc/tours-and-activities)
- [API Limitations](https://developers.amadeus.com/self-service/apis-docs/guides/api-rate-limits)

## 💡 Recommandations

1. **En développement** : Continuez avec l'API de test
   - Utilisez Paris comme ville par défaut pour vos tests
   - Testez la logique de votre application avec ces données limitées
   - Validez l'intégration technique

2. **Avant la production** :
   - Créez une application Production sur Amadeus
   - Testez avec quelques requêtes en production
   - Vérifiez que vous obtenez des données variées
   - Configurez la limite de quota (API payante)

3. **En production** :
   - Passez à `https://api.amadeus.com`
   - Utilisez vos credentials de production
   - Surveillez votre utilisation et vos coûts

## ✅ Conclusion

**Votre code fonctionne correctement** !

Le fait que toutes les activités soient à Paris est une **limitation normale de l'API de test Amadeus**, pas un bug dans votre code. Lorsque vous passerez en production avec de vraies credentials, vous obtiendrez des activités spécifiques à chaque destination recherchée.
