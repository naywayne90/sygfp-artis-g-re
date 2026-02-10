# SYGFP - Notes de Version

## Version 1.0.0 - Janvier 2026

**Système de Gestion des Finances Publiques - ARTI Côte d'Ivoire**

---

## Fonctionnalités Implémentées (Prompts 1-25)

### Chaîne de Dépense Complète

| Étape                | Fonctionnalité                                     | Statut     |
| -------------------- | -------------------------------------------------- | ---------- |
| 1. Note SEF          | Création, validation DG, workflow                  | Implémenté |
| 2. Note AEF          | Liaison automatique avec SEF, validation directeur | Implémenté |
| 3. Imputation        | Multi-lignes budgétaires, contrôle disponibilité   | Implémenté |
| 4. Expression Besoin | Formulaire avec pièces jointes                     | Implémenté |
| 5. Passation Marché  | Workflow simplifié ou complet                      | Implémenté |
| 6. Engagement        | Création, documents PJ, validation CB              | Implémenté |
| 7. Liquidation       | Service fait, pièces justificatives                | Implémenté |
| 8. Ordonnancement    | Signature DG avec QR code                          | Implémenté |
| 9. Règlement         | Exécution trésorerie, avis de crédit               | Implémenté |

### Traçabilité et Audit

- **QR Codes de Validation** : Signature cryptographique à chaque étape de validation
- **Hash SHA-256** : Intégrité vérifiable pour chaque validation
- **Historique Complet** : Composant `DossierAuditTrail` pour reconstruction complète
- **Double Système Audit** :
  - `useAuditLog` : Logging basique des actions
  - `useAuditTrail` : Logging avancé avec signatures QR

### Détection d'Anomalies et Cohérence

- **Règles de Validation** :
  - Activité doit appartenir à 1 Plan, 1 Direction, 1 Exercice
  - Dépense liée à une activité existante (si renseignée)
  - Montant ne dépassant pas le disponible (si renseigné)
  - Détection des doublons de référence
  - Contrôle des montants négatifs
- **Rapport de Cohérence** : Génération automatique ou à la demande
- **Interface Admin** : `/admin/anomalies` pour gestion des anomalies
- **Composants** :
  - `CoherenceReportCard` : Affichage du rapport complet
  - `CoherenceCheckButton` : Bouton de vérification rapide
  - `ImportValidationAlert` : Alerte pré-import
- **Hook** : `useCoherenceCheck` avec 5 règles de validation

### Sécurité

- **RLS (Row Level Security)** : Actif sur 18 tables critiques
- **Helpers de Permission** : `is_admin()`, `is_dg()`, `is_cb()`, `is_daaf()`, `is_tresorerie()`
- **ExerciceContext** : Mode lecture seule automatique pour exercices clôturés
- **Profils Fonctionnels** : Admin, CB, DAAF, DG, Trésorerie, Directeur, Opérateur, Auditeur

### Infrastructure Technique

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **Stockage** : Cloudflare R2 via Edge Function
- **Exports** : Excel/CSV/PDF via Edge Function `generate-export`
- **Emails** : Resend via Edge Function `send-notification-email`

---

## Architecture des Routes (50 routes)

```
/auth, /select-exercice
/, /recherche, /notifications, /alertes, /mon-profil, /taches
/notes-sef, /notes-sef/:id, /notes-sef/validation
/notes-aef, /notes-aef/:id, /notes-aef/validation
/execution/dashboard, /execution/imputation, /execution/expression-besoin, /execution/passation-marche
/engagements, /liquidations, /ordonnancements, /reglements
/planification/budget, /planification/physique, /planification/structure
/admin/exercices, /admin/utilisateurs, /admin/roles, /admin/parametres, /admin/journal-audit, /admin/anomalies
/contractualisation/prestataires, /contractualisation/contrats
/test-non-regression
```

---

## Test en 10 Minutes

### Prérequis

- Node.js 18+
- Compte Supabase configuré
- Variables d'environnement définies

### Étapes

1. **Cloner et installer**

   ```bash
   git clone <repo>
   cd sygfp-artis-g-re
   npm install
   ```

2. **Appliquer les migrations**

   ```bash
   npx supabase db push
   ```

3. **Lancer en développement**

   ```bash
   npm run dev
   ```

4. **Se connecter**
   - URL : http://localhost:5173
   - Sélectionner exercice 2026

5. **Lancer les tests automatisés**
   - Aller sur `/test-non-regression`
   - Cliquer "Lancer le test"
   - Vérifier 15/15 étapes au vert

---

## Données de Démo

La migration `20260119100000_seed_demo_data.sql` crée :

| Élément          | Détail                                         |
| ---------------- | ---------------------------------------------- |
| Exercice         | 2026 (ouvert)                                  |
| Ligne budgétaire | DEMO-2026-001 (100M FCFA)                      |
| Tiers            | DEMO-001, DEMO-002                             |
| Dossier 1        | DEMO-SEF-001 (brouillon)                       |
| Dossier 2        | DEMO-SEF-002 + DEMO-AEF-002 (validés)          |
| Dossier 3        | DEMO-SEF-003 → DEMO-REG-003 (workflow complet) |

---

## Checklist Non-Régression

| Critère                 | Statut               |
| ----------------------- | -------------------- |
| Aucun doublon de route  | 50 routes uniques    |
| Aucun doublon de module | 69 modules uniques   |
| TypeScript build        | `npm run build` OK   |
| Audit logs partout      | Double système actif |
| Messages erreurs clairs | Sonner toasts        |
| RLS actif               | 18 tables protégées  |

---

## Points d'Attention

### Configuration requise

1. **Cloudflare R2** (stockage)
   - Bucket : `lovable-storage`
   - Prefix : `sygfp/`
   - CORS : Configurer pour le domaine

2. **Edge Functions**
   - `create-user` : Création utilisateurs
   - `r2-storage` : Upload/download fichiers
   - `generate-export` : Export Excel/PDF
   - `send-notification-email` : Notifications

3. **Variables d'environnement**
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   RESEND_API_KEY=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   ```

### Limitations connues

- Les exports Excel nécessitent l'Edge Function `generate-export` déployée
- Le stockage R2 nécessite une configuration CORS correcte
- Les emails nécessitent une clé API Resend valide

---

## Convention de Référence ARTI

**Format** : `ARTI{MM}{YY}{XXXXXX}`

| Composant | Description                    |
| --------- | ------------------------------ |
| `ARTI`    | Préfixe fixe                   |
| `MM`      | Mois (01-12)                   |
| `YY`      | Année (26 pour 2026)           |
| `XXXXXX`  | Numéro séquentiel (6 chiffres) |

**Exemple** : `ARTI012600001`

Cette référence est **immuable** et suit le dossier à travers toutes les étapes du workflow.

---

## Structure des Modules (69 modules)

Les modules sont définis dans `src/config/modules.registry.ts` :

- **Accueil** : Dashboard, recherche, notifications
- **Programmation** : Budget, physique, structure
- **Exécution** : SEF, AEF, imputation, engagement, liquidation, ordonnancement, règlement
- **Suivi** : États, rapports, alertes
- **Administration** : Utilisateurs, rôles, paramètres, audit
- **Contractualisation** : Prestataires, contrats, comptabilité matière

---

## Équipe

- **Développement** : Claude Code (Anthropic)
- **Architecture** : SYGFP Team
- **Client** : ARTI Côte d'Ivoire

---

## Changelog

### v1.0.0 (Janvier 2026)

- Implémentation complète de la chaîne de dépense (Prompts 1-25)
- Système de traçabilité avec QR codes
- Tests de non-régression automatisés (15 étapes)
- Seed de données de démonstration
- Documentation complète

---

_Généré automatiquement - SYGFP v1.0.0_
