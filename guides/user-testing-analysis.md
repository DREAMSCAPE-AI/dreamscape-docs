# Rapport d'Analyse — Tests Utilisateurs DreamScape MVP

**Référence** : DR-85 / DR-228  
**Version** : 1.0  
**Date** : 2026-04-09  
**Basé sur** : 8 sessions (P1–P8)

---

## 1. Résultats SUS

| Participant | Groupe | Score SUS | Appréciation |
|-------------|--------|-----------|--------------|
| P1 — Sophie M. | A | 72 | Acceptable |
| P2 — Julien R. | B | 65 | Limite |
| P3 — Marie-Claire D. | C | 52 | Problématique |
| P4 — Thomas B. | A | 78 | Bonne |
| P5 — Aïcha K. | B | 74 | Acceptable |
| P6 — Lucas F. | C | 69 | Acceptable |
| P7 — Nathalie V. | B | 71 | Acceptable |
| P8 — Karim D. | A | 67 | Limite |
| **Moyenne globale** | — | **68.5** | **Seuil acceptable** |

**Référence SUS** :
- < 51 : Inacceptable
- 51–67 : Mauvaise
- 68–80 : Acceptable
- 81–90 : Bonne
- > 90 : Excellente

---

## 2. Problèmes identifiés

### Sévérité 1 — Critique (blocage)

| ID | Scénario | Description | Participants | Occurences |
|----|----------|-------------|--------------|------------|
| BUG-001 | S1 — Inscription | Messages d'erreur de mot de passe inexpliqués — l'utilisateur ne comprend pas les règles de validation | P3 | 1/5 |
| BUG-002 | S5 — Recommandations | Section recommandations IA introuvable sans aide — icône ou lien non découvrable | P3 | 1/5 |

### Sévérité 2 — Majeur (forte friction)

| ID | Scénario | Description | Participants | Occurrences |
|----|----------|-------------|--------------|------------|
| UX-001 | S3 — Panier | Regroupement vol + hôtel dans le panier non intuitif — les utilisateurs pensent avoir deux paniers séparés | P1, P3 | 2/5 |
| UX-002 | S4 — Paiement | Champ CVV peu visible / mal libellé dans le formulaire de paiement Stripe | P2 | 1/5 |

### Sévérité 3 — Mineur (légère friction)

| ID | Scénario | Description | Participants | Occurrences |
|----|----------|-------------|--------------|------------|
| UX-003 | S1 — Inscription | Incohérence entre les messages d'erreur selon les champs du formulaire | P4 | 1/5 |
| UX-004 | S2 — Recherche vol | Temps de chargement des résultats perçu comme long (pas de skeleton loader) | P4 | 1/5 |
| UX-005 | S5 — Recommandations | Recommandations perçues comme génériques par les voyageurs fréquents | P2, P5 | 2/5 |
| UX-006 | S6 — Profil | Absence de mode "voyage d'affaires" avec facturation automatique | P5, P7 | 2/8 |
| UX-007 | S2 — Recherche vol | Sélecteur de dates peu intuitif (format inattendu sur mobile) | P6, P8 | 2/8 |
| UX-008 | S6 — Profil | Bouton de sauvegarde profil difficile à trouver | P8 | 1/8 |
| UX-009 | S2 — Recherche vol | Absence de tri "meilleur rapport qualité/prix" dans les résultats | P7 | 1/8 |

---

## 3. Taux de complétion par scénario

| Scénario | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | Taux |
|----------|----|----|----|----|----|----|----|----|------|
| S1 — Inscription | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 100% |
| S2 — Recherche vol | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 100% |
| S3 — Hôtel + panier | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 100% |
| S4 — Paiement | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 100% |
| S5 — Recommandations | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | 87.5% |
| S6 — Profil | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 100% |

---

## 4. Recommandations priorisées

### P0 — À corriger avant les sessions réelles

| # | Problème | Action recommandée | Composant |
|---|----------|--------------------|-----------|
| 1 | BUG-001 — Validation mot de passe opaque | Afficher les règles en temps réel sous le champ (ex : 8 cars, 1 majuscule, 1 chiffre) | auth-service / web-client |
| 2 | BUG-002 — Recommandations IA introuvables | Ajouter un accès depuis la navbar et la page d'accueil | web-client / ai-service |
| 3 | UX-001 — Panier groupé non intuitif | Ajouter un indicateur visuel "Vol + Hôtel" dans le panier, avec récapitulatif unifié | voyage-service / web-client |

### P1 — Itération prochaine

| # | Problème | Action recommandée | Composant |
|---|----------|--------------------|-----------|
| 4 | UX-002 — CVV peu visible | Agrandir le champ CVV, ajouter une infobulle d'aide | web-client (Stripe) |
| 5 | UX-003 — Messages d'erreur incohérents | Harmoniser les messages de validation sur tout le formulaire d'inscription | web-client |
| 6 | UX-004 — Pas de skeleton loader | Ajouter des skeleton loaders sur la page résultats de recherche | web-client |

### P2 — Backlog

| # | Problème | Action recommandée | Composant |
|---|----------|--------------------|-----------|
| 7 | UX-005 — Recommandations génériques | Enrichir le profil utilisateur avec plus de signaux comportementaux | ai-service |
| 8 | UX-006 — Pas de mode pro | Étudier un profil "voyage d'affaires" avec gestion de notes de frais | user-service / voyage-service |

---

## 5. Synthèse des retours qualitatifs

### Points forts perçus
- Design général apprécié (aspect visuel, clarté des résultats de vol)
- Tunnel de réservation globalement fluide (P1, P4, P5)
- Recommandations IA perçues comme un atout différenciant (P1, P5)
- Navigation dans le profil intuitive (P2, P4, P5)

### Points de friction récurrents
- Découvrabilité des recommandations IA faible
- Règles de validation du mot de passe invisibles (problème d'accessibilité)
- Perception du panier multi-articles non évidente
- Filtres de recherche vols insuffisants pour les power users

---

## 6. Prochaines étapes

- [x] 8 sessions complétées (P1–P8)
- [x] Score SUS global calculé : 68.5/100
- [ ] Créer des tickets de bug/amélioration dans Jira pour P0 et P1
- [ ] Présenter le rapport à l'équipe produit
