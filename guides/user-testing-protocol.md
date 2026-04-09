# Protocole de Test Utilisateur — DreamScape MVP

**Référence** : DR-85 / TEST-001  
**Version** : 1.0  
**Date** : 2026-04-09  
**Responsable** : QA Engineer

---

## 1. Objectifs

Ce protocole définit le cadre des sessions de test utilisateurs menées sur le MVP de DreamScape. L'objectif est d'identifier :

- Les points de friction dans les parcours clés (recherche, réservation, profil)
- Les problèmes d'utilisabilité (compréhension, navigation, retours d'erreur)
- Les écarts entre l'intention de design et la perception réelle des utilisateurs
- Les fonctionnalités à prioriser pour les prochaines itérations

---

## 2. Périmètre du MVP testé

### Modules couverts

| Module | Service(s) | Criticité |
|--------|------------|-----------|
| Inscription / Connexion | auth-service (port 3001) | Haute |
| Recherche de vols et hôtels | voyage-service (port 3003) | Haute |
| Panier et réservation | voyage-service / payment-service | Haute |
| Profil utilisateur | user-service (port 3002) | Moyenne |
| Recommandations IA | ai-service (port 3005) | Moyenne |
| Expérience panoramique | panorama (port 3006) | Basse |

### Hors périmètre (V1)
- Administration back-office
- Fonctionnalités VR avancées (casque physique)
- Notifications email / push

---

## 3. Profil des participants

### Critères de recrutement

**Groupe A — Voyageurs occasionnels** (2–3 participants)
- 25–45 ans
- 1 à 3 voyages par an
- Habitué·es des sites de réservation en ligne (type Booking, Expedia)
- Niveau numérique : intermédiaire

**Groupe B — Voyageurs fréquents** (2–3 participants)
- 28–50 ans
- Plus de 5 voyages par an
- Exigences élevées sur la personnalisation et la rapidité
- Niveau numérique : avancé

**Groupe C — Primo-utilisateurs** (1–2 participants)
- Tout âge
- Peu habitué·es aux plateformes de voyage en ligne
- Niveau numérique : débutant à intermédiaire

### Critères d'exclusion
- Membres de l'équipe de développement DreamScape
- Personnes ayant déjà participé à un test DreamScape

---

## 4. Environnement de test

### Configuration technique

```bash
# Démarrer l'environnement de test
make start   # Lance DB + tous les services + frontend

# Ou sélectivement
make db        # PostgreSQL + Redis
make services  # auth, user, voyage, payment, ai
make frontend  # gateway, web-client, panorama

# Vérifier que tout est up
make health
```

**URL d'accès participant** : `http://localhost:5173`  
**URL gateway** : `http://localhost:4000`

### Pré-requis session
- [ ] Base de données initialisée avec données de test (`npm run db:seed`)
- [ ] Compte de test pré-créé : `testeur@dreamscape.io` / `TestDream2026!`
- [ ] Navigateur Chrome version récente (plein écran)
- [ ] Outil d'enregistrement écran actif (ex. : OBS, Loom)
- [ ] Fenêtre de modération séparée (observateur en silence)

---

## 5. Scénarios de test

Chaque scénario correspond à une tâche donnée au participant, sans aide du modérateur. Le temps est mesuré. Les erreurs et verbalisations sont notées.

---

### Scénario 1 — Création de compte et onboarding

**Objectif** : Évaluer la clarté du flux d'inscription et de configuration du profil.

**Instructions au participant** :
> « Vous venez de découvrir DreamScape. Créez un compte avec votre adresse email et configurez vos préférences de voyage. »

**Tâches** :
1. S'inscrire avec un email et un mot de passe
2. Compléter le questionnaire d'onboarding voyage
3. Accéder à la page d'accueil principale

**Critères de succès** :
- Inscription complétée sans aide en < 3 min
- Questionnaire rempli sans abandon
- Redirection vers le dashboard réussie

**Points d'observation** :
- Hésitations sur les champs du formulaire
- Clarté des messages d'erreur de validation
- Lisibilité du questionnaire d'onboarding

---

### Scénario 2 — Recherche de vol

**Objectif** : Évaluer la facilité de recherche et la pertinence des résultats.

**Instructions au participant** :
> « Vous souhaitez partir à Tokyo depuis Paris pour une semaine au mois de juin. Trouvez un vol qui vous convient. »

**Tâches** :
1. Localiser et utiliser la barre de recherche
2. Filtrer les résultats (prix, compagnie, escales)
3. Sélectionner un vol

**Critères de succès** :
- Recherche lancée sans aide en < 2 min
- Au moins un filtre utilisé
- Vol sélectionné

**Points d'observation** :
- Compréhension des filtres disponibles
- Lisibilité des résultats (prix, horaires, durée)
- Réaction aux temps de chargement

---

### Scénario 3 — Recherche d'hôtel et ajout au panier

**Objectif** : Évaluer la cohérence du parcours vol + hôtel.

**Instructions au participant** :
> « Maintenant trouvez un hôtel à Tokyo pour les mêmes dates, et ajoutez le vol et l'hôtel à votre panier. »

**Tâches** :
1. Effectuer une recherche d'hôtel
2. Consulter la fiche d'un hôtel
3. Ajouter le vol et l'hôtel au panier

**Critères de succès** :
- Panier contient vol + hôtel
- Aucune confusion entre les deux recherches
- Accès au panier retrouvé sans aide

**Points d'observation** :
- Clarté du lien entre recherche vol et hôtel
- Compréhension du panier multi-articles
- Retours visuels lors de l'ajout

---

### Scénario 4 — Finalisation de réservation (paiement simulé)

**Objectif** : Évaluer la confiance et la clarté du tunnel de paiement.

**Instructions au participant** :
> « Finalisez votre réservation. Utilisez le numéro de carte test : 4242 4242 4242 4242. »

**Tâches** :
1. Accéder au récapitulatif du panier
2. Renseigner les informations de paiement (carte Stripe test)
3. Confirmer la réservation

**Critères de succès** :
- Paiement simulé réussi
- Page de confirmation affichée
- Email de confirmation reçu (si activé)

**Points d'observation** :
- Niveau de confiance exprimé sur le paiement
- Clarté du récapitulatif (prix total, détails)
- Réaction à la page de confirmation

---

### Scénario 5 — Recommandations IA

**Objectif** : Évaluer la pertinence perçue et la valeur ajoutée des recommandations.

**Instructions au participant** :
> « Explorez les destinations que DreamScape vous suggère. Dites-nous ce que vous en pensez. »

**Tâches** :
1. Trouver la section recommandations
2. Explorer au moins 2 destinations suggérées
3. Réagir à la pertinence des suggestions

**Critères de succès** :
- Section recommandations trouvée sans aide
- Interaction avec au moins 1 destination
- Feedback verbal sur la pertinence

**Points d'observation** :
- Découvrabilité de la section
- Perception de la personnalisation
- Compréhension de l'algorithme (ou non)

---

### Scénario 6 — Gestion du profil

**Objectif** : Évaluer l'accessibilité et la lisibilité des paramètres utilisateur.

**Instructions au participant** :
> « Modifiez vos préférences de voyage et vérifiez votre historique de réservations. »

**Tâches** :
1. Accéder aux paramètres du profil
2. Modifier une préférence de voyage
3. Consulter l'historique de réservations

**Critères de succès** :
- Modification sauvegardée avec succès
- Historique affiché et compris

**Points d'observation** :
- Navigation vers le profil (menu, raccourci)
- Clarté des options de paramétrage
- Retour de confirmation de sauvegarde

---

## 6. Grille d'observation

Pour chaque scénario, l'observateur complète la grille suivante :

| Critère | 1 - Critique | 2 - Majeur | 3 - Mineur | 4 - OK | Notes |
|---------|-------------|------------|------------|--------|-------|
| Tâche complétée | | | | | |
| Temps de complétion | | | | | |
| Erreurs commises | | | | | |
| Demande d'aide | | | | | |
| Verbalisations négatives | | | | | |
| Hésitations > 5s | | | | | |
| Retour en arrière inattendu | | | | | |

**Échelle de sévérité** :
- **1 – Critique** : blocage total, tâche impossible sans aide
- **2 – Majeur** : forte friction, complétion avec difficulté
- **3 – Mineur** : légère confusion, complétion correcte
- **4 – OK** : tâche fluide, pas de problème notable

---

## 7. Guide de modération

### Rôle du modérateur
- Introduire la session et rassurer le participant
- Rappeler la méthode "think aloud" (verbaliser à voix haute)
- **Ne jamais aider** sur les tâches (rester neutre)
- Prendre des notes sur les comportements et verbalisations
- Gérer le timing de la session

### Script d'introduction (5 min)

> « Bonjour et merci de participer à cette session. Nous testons une application de voyage appelée DreamScape. Nous ne testons pas vos compétences, nous testons l'application — il n'y a donc pas de bonnes ou mauvaises réponses.
>
> Pendant la session, je vous demanderai de penser à voix haute : dites ce que vous voyez, ce que vous comprenez, ce que vous ressentez. Si vous êtes bloqué·e, c'est l'application qui a un problème, pas vous.
>
> Avez-vous des questions avant de commencer ? »

### Relances autorisées
- « Qu'est-ce que vous pensez de ce que vous voyez ? »
- « Que cherchez-vous à faire en ce moment ? »
- « Qu'attendez-vous qu'il se passe ? »
- « Comment vous sentez-vous par rapport à ça ? »

### Ce qu'il ne faut PAS dire
- « Cliquez sur... »
- « Regardez en haut à droite... »
- « C'est normal, continuez... »

---

## 8. Questionnaire post-test

### System Usability Scale (SUS) — 10 questions

Chaque question est notée de 1 (Pas du tout d'accord) à 5 (Tout à fait d'accord).

1. Je pense que j'utiliserais volontiers cette application régulièrement.
2. J'ai trouvé l'application inutilement complexe.
3. J'ai trouvé l'application facile à utiliser.
4. Je pense que j'aurais besoin d'aide pour utiliser cette application.
5. J'ai trouvé que les différentes fonctionnalités étaient bien intégrées.
6. J'ai trouvé trop d'incohérences dans cette application.
7. J'imagine que la plupart des gens apprendraient vite à utiliser cette application.
8. J'ai trouvé l'application très lourde à utiliser.
9. Je me suis senti·e confiant·e en utilisant cette application.
10. J'ai dû apprendre beaucoup de choses avant de pouvoir utiliser cette application.

**Calcul du score SUS** :
- Questions impaires (1,3,5,7,9) : score = valeur - 1
- Questions paires (2,4,6,8,10) : score = 5 - valeur
- Score total = somme × 2.5 (sur 100)
- Référence : score ≥ 68 = utilisabilité acceptable

### Questions ouvertes

1. Quelle fonctionnalité vous a semblé la plus utile ?
2. Qu'est-ce qui vous a le plus frustré ou dérangé ?
3. Manque-t-il quelque chose d'important selon vous ?
4. Recommanderiez-vous cette application ? Pourquoi ?

---

## 9. Planning prévisionnel

| Étape | Sous-tâche Jira | Durée estimée |
|-------|-----------------|---------------|
| Finalisation protocole | DR-225 | Fait |
| Recrutement participants | DR-226 | 1 semaine |
| Sessions de test (5–8 participants) | DR-227 | 3–5 jours |
| Analyse et rapport | DR-228 | 3 jours |

**Durée d'une session** : 60–75 minutes  
**Nombre de sessions recommandé** : 5 minimum (règle de Nielsen : 5 participants détectent ~85% des problèmes)

---

## 10. Livrables attendus

- [ ] Ce protocole validé (DR-225)
- [ ] Liste des participants recrutés (DR-226)
- [ ] Enregistrements vidéo des sessions (DR-227)
- [ ] Grilles d'observation remplies (DR-227)
- [ ] Rapport d'analyse avec recommandations priorisées (DR-228)