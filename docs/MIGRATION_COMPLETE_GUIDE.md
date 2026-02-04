# GUIDE COMPLET DE MIGRATION SYGFP

**Date de création:** 4 février 2026
**Auteur:** Claude Code (Opus 4.5)
**Projet:** SYGFP - Système de Gestion Financière et de Planification - ARTI Gabon

---

## 1. RÉSUMÉ DE LA MIGRATION

### Ce qui a été migré

#### A. Analyse de l'ancien système
- **Extraction complète des données** via scraping de l'interface web
- **Fichiers CSV exportés** dans `/migration_data/`:
  - `Direction.csv` - Structure organisationnelle
  - `Fournisseur.csv` - Liste des prestataires
  - `Budget.csv` - Données budgétaires
  - `Programmatique.csv` - Structure programmatique (Missions/Programmes/Actions/Activités)
  - `Engagement.csv` - Engagements financiers
  - `Liquidation.csv` - Liquidations
  - `Ordonnancement.csv` - Ordonnancements
  - `Nature.csv` / `NatureDepense.csv` - Nomenclature économique
  - `OrigineFonds.csv` - Sources de financement
  - `Utilisateur.csv` - Utilisateurs système

#### B. Scripts SQL générés
Dans `/migration_data/sql_output/`:
- `01_directions.sql` - Import des directions
- `02_fournisseurs.sql` - Import des fournisseurs/prestataires
- `03_budget_hierarchy.sql` - Hiérarchie budgétaire
- `04_engagements.sql` - Engagements
- `05_liquidations.sql` - Liquidations
- `06_ordonnancements.sql` - Ordonnancements

#### C. Nouvelles fonctionnalités implémentées
1. **Paiements partiels (Mouvements bancaires)**
   - Table `mouvements_bancaires`
   - Vue `v_mouvements_details`
   - Fonction RPC `add_mouvement_bancaire`
   - Fonction RPC `get_stats_paiements`

2. **Réaménagements budgétaires**
   - Table `reamenagements_budgetaires`
   - Vue `v_reamenagements_budgetaires`
   - Fonction RPC `validate_reamenagement`
   - Fonction RPC `reject_reamenagement`
   - Fonction RPC `create_reamenagement_budgetaire`

### Statistiques de migration
- **Tables analysées:** ~15 tables principales
- **Enregistrements extraits:** Variable selon les tables
- **Migrations SQL créées:** 4 fichiers dans `/supabase/migrations/`
- **Composants React créés:** 6 nouveaux fichiers
- **Hooks créés:** 2 nouveaux hooks

---

## 2. ACCÈS SERVEUR ANCIEN SYGFP

### URL et connexion
```
URL:        http://arti-ci.com:8001
Port:       8001
Protocole:  HTTP (non sécurisé)
```

### Identifiants de connexion (Interface Web)
```
Email:      artiabidjan@yahoo.com
Password:   VEGet@9008
```

### Base de données source
```
Type:       PostgreSQL (probable, basé sur l'analyse)
Accès:      Via API REST uniquement (pas d'accès direct DB)
ORM:        Django REST Framework (basé sur les endpoints)
```

### Endpoints API découverts
```
/api/directions/
/api/fournisseurs/
/api/budget/
/api/engagements/
/api/liquidations/
/api/ordonnancements/
/api/programmatique/
/api/utilisateurs/
```

### Session cookies (si besoin de reconnecter)
Le fichier `cookies.txt` à la racine contient les cookies de session.

---

## 3. CONFIGURATION NOUVEAU SYGFP (Supabase)

### URL et projet Supabase
```
URL Dashboard:  https://supabase.com/dashboard/project/[PROJECT_ID]
URL API:        https://[PROJECT_ID].supabase.co
```

### Identifiants Supabase (même compte)
```
Email:      artiabidjan@yahoo.com
Password:   VEGet@9008
```

### Clés API (dans .env ou .env.local)
```env
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON_KEY]
```

### Configuration R2 Cloudflare (Stockage fichiers)
```
Bucket:     sygfp-attachments (ou similaire)
Endpoint:   Configuré dans les Edge Functions Supabase
```

### Base de données
```
Type:       PostgreSQL 15+
Schéma:     public
RLS:        Activé sur toutes les tables sensibles
```

---

## 4. SCRIPTS DE MIGRATION CRÉÉS

### Scripts Python (`/scripts/`)

#### `migrate_from_old_sygfp.py`
- **But:** Extraction des données de l'ancien SYGFP via web scraping
- **Utilisation:** `python scripts/migrate_from_old_sygfp.py`
- **Dépendances:** requests, beautifulsoup4, pandas

#### `import_to_supabase.py`
- **But:** Import des CSV dans Supabase
- **Utilisation:** `python scripts/import_to_supabase.py`
- **Dépendances:** supabase-py, pandas

#### `import_full_migration.py`
- **But:** Migration complète automatisée
- **Utilisation:** `python scripts/import_full_migration.py`

### Fichiers de mapping (`/migration_data/`)

#### `engagement_mapping.json`
Correspondance des IDs engagements ancien/nouveau système

#### `liquidation_mapping.json`
Correspondance des IDs liquidations ancien/nouveau système

#### `fournisseurs_reference.json` / `fournisseurs_complete.json`
Données complètes des fournisseurs avec mapping

#### `migration_report.json`
Rapport détaillé de la migration avec statistiques

### Migrations SQL (`/supabase/migrations/`)

#### `20260204_paiements_partiels.sql`
```sql
-- Crée la table mouvements_bancaires
-- Crée la vue v_mouvements_details
-- Crée les RLS policies
-- Crée les fonctions RPC
```

#### `20260204_reamenagement_budgetaire.sql`
```sql
-- Crée la table reamenagements_budgetaires
-- Crée la vue v_reamenagements_budgetaires
-- Crée les fonctions validate/reject
```

#### `20260204_fix_engagement_status_constraint.sql`
Correction des contraintes sur les statuts d'engagement

#### `20260204_seed_scanning_test_data.sql`
Données de test pour le module de numérisation

---

## 5. CE QUI RESTE À FAIRE

### A. Migrations SQL non appliquées
Les fichiers SQL dans `/supabase/migrations/` ont été créés mais certains nécessitent d'être appliqués manuellement via l'éditeur SQL de Supabase:

1. [ ] Vérifier que `mouvements_bancaires` est bien créé
2. [ ] Vérifier que `reamenagements_budgetaires` est bien créé
3. [ ] Vérifier les fonctions RPC existent
4. [ ] Tester les RLS policies

### B. Données à importer
1. [ ] Exécuter les scripts SQL dans `/migration_data/sql_output/`
2. [ ] Vérifier l'intégrité des données migrées
3. [ ] Valider les correspondances ID (mappings)

### C. Tests à exécuter
```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Vérification types
npm run typecheck

# Lint
npm run lint
```

### D. Fonctionnalités à tester manuellement
1. [ ] Page `/budget/reamenagements-imputations` - Créer un réaménagement
2. [ ] Page `/reglements` - Ouvrir un règlement et tester les mouvements bancaires
3. [ ] Workflow de validation des réaménagements
4. [ ] Export Excel des réaménagements

### E. Tables/vues potentiellement manquantes
- `imputations_budgetaires` - Utilisée par le hook mais peut ne pas exister
- `comptes_bancaires` - Pour les paiements partiels
- `v_reglements_paiements` - Vue pour statistiques paiements

### F. Régénération des types Supabase
```bash
# Nécessite CLI Supabase configuré
npx supabase gen types typescript --project-id [PROJECT_ID] > src/integrations/supabase/types.ts
```

---

## 6. PROBLÈMES RENCONTRÉS ET SOLUTIONS

### Problème 1: Enum values incorrect casing
**Erreur:** `invalid input value for enum role_hierarchique: "dg"`
**Solution:** Les enums PostgreSQL sont case-sensitive:
- Correct: `DG`, `Directeur`, `Sous-Directeur`, `Chef de Service`, `Agent`
- Correct: `Admin`, `Validateur`, `Operationnel`, `Controleur`, `Auditeur`

### Problème 2: Column profiles.user_id n'existe pas
**Erreur:** `column p.user_id does not exist`
**Solution:** Utiliser `p.id = auth.uid()` au lieu de `p.user_id = auth.uid()`

### Problème 3: RPC function parameter mismatch
**Erreur:** Paramètres incorrects pour `get_stats_paiements`
**Solution:** La fonction prend `p_exercice` (integer) pas `p_exercice_id` (UUID)

### Problème 4: useRBAC hasPermission n'existe pas
**Erreur:** `hasPermission is not a function`
**Solution:** Utiliser les fonctions correctes du hook:
```typescript
// Au lieu de:
const canCreate = hasPermission("budget", "create");

// Utiliser:
const { canCreate: rbacCanCreate, isAdmin, hasProfil } = useRBAC();
const canCreate = rbacCanCreate("budget");
const canValidate = isAdmin || hasProfil("Validateur");
```

### Problème 5: Monaco Editor SQL execution
**Contexte:** Pour exécuter les migrations SQL dans Supabase Dashboard
**Solution:** Utiliser Playwright pour:
1. Naviguer vers SQL Editor
2. Utiliser `page.evaluate()` avec `monaco.editor.getModels()[0].setValue(sql)`
3. Cliquer sur "Run" ou Ctrl+Enter

### Problème 6: Fichier types.ts corrompu
**Erreur:** Le fichier contenait du texte npm au lieu de TypeScript
**Solution:** `git checkout HEAD -- src/integrations/supabase/types.ts`

---

## 7. ARCHITECTURE DES NOUVEAUX COMPOSANTS

### Hooks créés
```
src/hooks/
├── usePaiementsPartiels.ts    # Gestion mouvements bancaires
│   ├── useComptesBancaires()
│   ├── useMouvementsBancaires()
│   ├── useReglementsAvecPaiement()
│   ├── useStatsPaiements()
│   ├── useAddMouvementBancaire()
│   └── useDeleteMouvementBancaire()
│
└── useReamenagementBudgetaire.ts  # Gestion réaménagements
    ├── useReamenagements()
    ├── useReamenementsEnAttente()
    ├── useEtatExecutionImputations()
    ├── useBudgetImputation()
    ├── useCreateReamenagement()
    ├── useValidateReamenagement()
    └── useImputationsDisponibles()
```

### Composants créés
```
src/components/
├── budget/
│   ├── ReamenagementForm.tsx      # Formulaire création
│   └── ReamenagementsList.tsx     # Liste avec validation
│
└── reglement/
    └── MouvementsBancairesDialog.tsx  # Dialog paiements partiels
```

### Pages créées
```
src/pages/
└── budget/
    └── ReamenementsImputations.tsx  # /budget/reamenagements-imputations
```

---

## 8. COMMANDES UTILES

### Développement
```bash
npm run dev           # Serveur dev sur port 8080
npm run build         # Build production
npm run typecheck     # Vérification TypeScript
npm run lint          # ESLint
npm run lint:fix      # Fix auto ESLint
```

### Tests
```bash
npm run test          # Tests unitaires Vitest
npm run test:e2e      # Tests E2E Playwright
npm run test:coverage # Couverture de code
```

### Git
```bash
git log --oneline -20                    # Historique récent
git diff HEAD~1                          # Voir derniers changements
git stash && git stash pop               # Sauvegarder temporairement
```

### Supabase
```bash
npx supabase login                       # Connexion CLI
npx supabase gen types typescript        # Régénérer types
npx supabase db push                     # Pousser migrations
```

---

## 9. CONTACTS ET RESSOURCES

### Documentation projet
- `/docs/ANALYSE_ANCIEN_SYGFP.md` - Analyse détaillée ancien système
- `/docs/ANALYSE_ANCIEN_SYGFP_COMPLETE.md` - Analyse exhaustive
- `/docs/GUIDE_SCANNING_WORKFLOW.md` - Guide numérisation
- `/CLAUDE.md` - Instructions pour Claude Code

### URLs importantes
- Ancien SYGFP: http://arti-ci.com:8001
- Nouveau SYGFP (dev): http://localhost:8080
- Supabase Dashboard: https://supabase.com/dashboard

---

## 10. CHECKLIST AVANT PRODUCTION

- [ ] Toutes les migrations SQL appliquées
- [ ] Types Supabase régénérés
- [ ] Tests E2E passent
- [ ] Données de test nettoyées
- [ ] Variables d'environnement production configurées
- [ ] RLS policies vérifiées
- [ ] Backup base de données créé
- [ ] Documentation utilisateur mise à jour

---

*Document généré automatiquement par Claude Code pour assurer la continuité du projet.*
