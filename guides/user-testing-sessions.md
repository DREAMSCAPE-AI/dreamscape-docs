# Guide de Conduite des Sessions — Tests Utilisateurs DreamScape

**Référence** : DR-85 / DR-227  
**Version** : 1.0  
**Date** : 2026-04-09

---

## 1. Préparation de la session

### Checklist modérateur (J-1)
- [ ] Environnement de test démarré et vérifié (`make health`)
- [ ] Base de données seedée (`npm run db:seed`)
- [ ] Compte test fonctionnel : `testeur@dreamscape.io` / `TestDream2026!`
- [ ] Enregistrement écran configuré (OBS / Loom)
- [ ] Grille d'observation imprimée ou ouverte
- [ ] Questionnaire SUS prêt (papier ou formulaire)
- [ ] Consentement de participation envoyé au participant

### Checklist modérateur (J0 — 15 min avant)
- [ ] Navigateur Chrome ouvert sur `http://localhost:5173`
- [ ] Historique et cookies vidés
- [ ] Enregistrement démarré (test 30s)
- [ ] Salle / appel calme, pas d'interruption
- [ ] Chronomètre prêt

---

## 2. Déroulé type d'une session (75 min)

| Étape | Durée | Description |
|-------|-------|-------------|
| Accueil & introduction | 5 min | Script d'introduction, consentement oral |
| Échauffement | 5 min | Questions sur habitudes de voyage |
| Scénarios 1–6 | 50–55 min | Think aloud, observation silencieuse |
| Questionnaire SUS | 5 min | 10 questions écrit |
| Débriefing ouvert | 10 min | Questions ouvertes, impressions globales |

---

## 3. Sessions réalisées

### Session 1 — P1 Sophie M.
- **Date** : 2026-04-10
- **Durée** : 68 min
- **Modérateur** : Kevin C.
- **Environnement** : Local Chrome — tous services UP

#### Observations par scénario

| Scénario | Complété | Temps | Erreurs | Aide demandée | Sévérité |
|----------|----------|-------|---------|---------------|----------|
| S1 — Inscription | Oui | 2m45 | 1 (validation pwd) | Non | 3 |
| S2 — Recherche vol | Oui | 3m10 | 0 | Non | 4 |
| S3 — Hôtel + panier | Oui | 5m20 | 1 (panier groupé non vu) | Non | 2 |
| S4 — Paiement | Oui | 3m00 | 0 | Non | 4 |
| S5 — Recommandations | Oui | 4m15 | 0 | Non | 4 |
| S6 — Profil | Oui | 2m50 | 0 | Non | 4 |

**Score SUS** : 72/100  
**Citations clés** :
- *"Je ne réalisais pas que vol et hôtel étaient dans le même panier."*
- *"Les recommandations sont sympas, ça m'a donné envie d'explorer."*

---

### Session 2 — P2 Julien R.
- **Date** : 2026-04-10
- **Durée** : 61 min
- **Modérateur** : Kevin C.
- **Environnement** : Local Chrome — tous services UP

#### Observations par scénario

| Scénario | Complété | Temps | Erreurs | Aide demandée | Sévérité |
|----------|----------|-------|---------|---------------|----------|
| S1 — Inscription | Oui | 1m30 | 0 | Non | 4 |
| S2 — Recherche vol | Oui | 2m00 | 0 | Non | 4 |
| S3 — Hôtel + panier | Oui | 3m45 | 0 | Non | 4 |
| S4 — Paiement | Oui | 4m10 | 1 (CVV peu visible) | Non | 2 |
| S5 — Recommandations | Oui | 3m00 | 0 | Non | 3 |
| S6 — Profil | Oui | 2m30 | 0 | Non | 4 |

**Score SUS** : 65/100  
**Citations clés** :
- *"Le champ CVV est trop petit, je l'ai raté au premier passage."*
- *"Les filtres vols sont basiques — pas d'alliance aérienne, pas de CO2."*

---

### Session 3 — P3 Marie-Claire D.
- **Date** : 2026-04-11
- **Durée** : 78 min
- **Modérateur** : Kevin C.
- **Environnement** : Local Chrome — tous services UP

#### Observations par scénario

| Scénario | Complété | Temps | Erreurs | Aide demandée | Sévérité |
|----------|----------|-------|---------|---------------|----------|
| S1 — Inscription | Oui | 5m20 | 2 (pwd, confirmation) | 1x | 1 |
| S2 — Recherche vol | Oui | 6m00 | 1 (dates mal saisies) | Non | 2 |
| S3 — Hôtel + panier | Oui | 8m10 | 1 | Non | 2 |
| S4 — Paiement | Oui | 5m30 | 0 | Non | 3 |
| S5 — Recommandations | Non | — | — | — | 1 |
| S6 — Profil | Oui | 4m00 | 0 | Non | 3 |

**Score SUS** : 52/100  
**Citations clés** :
- *"Je ne comprends pas pourquoi mon mot de passe est refusé, il n'y a pas d'explication claire."*
- *"Je n'ai pas trouvé les recommandations, il faudrait un bouton plus visible."*

---

### Session 4 — P4 Thomas B.
- **Date** : 2026-04-11
- **Durée** : 63 min
- **Modérateur** : Kevin C.
- **Environnement** : Local Firefox — tous services UP

#### Observations par scénario

| Scénario | Complété | Temps | Erreurs | Aide demandée | Sévérité |
|----------|----------|-------|---------|---------------|----------|
| S1 — Inscription | Oui | 1m50 | 1 (message erreur incohérent) | Non | 3 |
| S2 — Recherche vol | Oui | 2m30 | 0 | Non | 4 |
| S3 — Hôtel + panier | Oui | 3m20 | 0 | Non | 4 |
| S4 — Paiement | Oui | 2m50 | 0 | Non | 4 |
| S5 — Recommandations | Oui | 3m30 | 0 | Non | 4 |
| S6 — Profil | Oui | 2m10 | 0 | Non | 4 |

**Score SUS** : 78/100  
**Citations clés** :
- *"Le chargement des résultats de vol prend un peu trop longtemps."*
- *"Les messages d'erreur du formulaire ne sont pas cohérents entre les champs."*

---

### Session 5 — P5 Aïcha K.
- **Date** : 2026-04-12
- **Durée** : 65 min
- **Modérateur** : Kevin C.
- **Environnement** : Local Chrome — tous services UP

#### Observations par scénario

| Scénario | Complété | Temps | Erreurs | Aide demandée | Sévérité |
|----------|----------|-------|---------|---------------|----------|
| S1 — Inscription | Oui | 1m40 | 0 | Non | 4 |
| S2 — Recherche vol | Oui | 2m10 | 0 | Non | 4 |
| S3 — Hôtel + panier | Oui | 3m50 | 0 | Non | 4 |
| S4 — Paiement | Oui | 3m00 | 0 | Non | 4 |
| S5 — Recommandations | Oui | 4m00 | 0 | Non | 4 |
| S6 — Profil | Oui | 2m30 | 0 | Non | 4 |

**Score SUS** : 74/100  
**Citations clés** :
- *"Les recommandations sont bien pour les loisirs mais pour le pro il manque un mode dédié."*
- *"J'aurais aimé voir directement la note de frais estimée."*

---

---

### Session 6 — P6 Lucas F.
- **Date** : 2026-04-13
- **Durée** : 71 min
- **Modérateur** : Kevin C.
- **Environnement** : Local Chrome mobile (simulé) — tous services UP

#### Observations par scénario

| Scénario | Complété | Temps | Erreurs | Aide demandée | Sévérité |
|----------|----------|-------|---------|---------------|----------|
| S1 — Inscription | Oui | 2m50 | 0 | Non | 4 |
| S2 — Recherche vol | Oui | 4m10 | 1 (sélecteur dates) | Non | 2 |
| S3 — Hôtel + panier | Oui | 5m30 | 0 | Non | 4 |
| S4 — Paiement | Oui | 3m20 | 0 | Non | 4 |
| S5 — Recommandations | Oui | 3m50 | 0 | Non | 4 |
| S6 — Profil | Oui | 3m00 | 0 | Non | 4 |

**Score SUS** : 69/100  
**Citations clés** :
- *"C'est vraiment bien fait visuellement. Le sélecteur de dates m'a un peu perdu au début."*
- *"Les recommandations IA m'ont vraiment donné envie de partir."*

---

### Session 7 — P7 Nathalie V.
- **Date** : 2026-04-14
- **Durée** : 66 min
- **Modérateur** : Kevin C.
- **Environnement** : Local Chrome — tous services UP

#### Observations par scénario

| Scénario | Complété | Temps | Erreurs | Aide demandée | Sévérité |
|----------|----------|-------|---------|---------------|----------|
| S1 — Inscription | Oui | 1m40 | 0 | Non | 4 |
| S2 — Recherche vol | Oui | 2m30 | 1 (pas de tri qualité/prix) | Non | 3 |
| S3 — Hôtel + panier | Oui | 3m40 | 0 | Non | 4 |
| S4 — Paiement | Oui | 2m50 | 0 | Non | 4 |
| S5 — Recommandations | Oui | 3m10 | 0 | Non | 4 |
| S6 — Profil | Oui | 2m20 | 0 | Non | 4 |

**Score SUS** : 71/100  
**Citations clés** :
- *"Bien structuré. Il me manque un tri intelligent sur les résultats, pas juste prix ou durée."*
- *"Le tunnel de paiement est clair et rassurant, je me suis sentie en confiance."*

---

### Session 8 — P8 Karim D.
- **Date** : 2026-04-14
- **Durée** : 74 min
- **Modérateur** : Kevin C.
- **Environnement** : Local Firefox mobile — tous services UP

#### Observations par scénario

| Scénario | Complété | Temps | Erreurs | Aide demandée | Sévérité |
|----------|----------|-------|---------|---------------|----------|
| S1 — Inscription | Oui | 2m10 | 0 | Non | 4 |
| S2 — Recherche vol | Oui | 3m50 | 0 | Non | 4 |
| S3 — Hôtel + panier | Oui | 5m00 | 0 | Non | 4 |
| S4 — Paiement | Oui | 3m30 | 0 | Non | 4 |
| S5 — Recommandations | Oui | 4m10 | 0 | Non | 4 |
| S6 — Profil | Oui | 5m20 | 1 (bouton sauvegarde non trouvé) | Non | 2 |

**Score SUS** : 67/100  
**Citations clés** :
- *"J'aime bien l'idée des recommandations personnalisées. Sur téléphone c'est un peu lent parfois."*
- *"Le bouton pour sauvegarder mon profil n'était pas évident à trouver."*
