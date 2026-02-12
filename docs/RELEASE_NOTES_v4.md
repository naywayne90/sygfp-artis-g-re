# Release Notes SYGFP v4.1 - 13/02/2026

## Vue d'ensemble v4.1

Version de consolidation securite et qualite. Resolution de 3 gaps critiques (delegations, interims, notifications), ajout du panneau de detail Notes SEF, optimisations exports et performance, renforcement securite CSP et RLS.

### Nouvelles fonctionnalites (v4.1)

| Fonctionnalite           | Description                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| **NoteSEFDetailSheet**   | Sheet lateral 4 onglets (Infos/Contenu/PJ/Historique) avec QR code et lien AEF   |
| **Export Excel enrichi** | Colonne "Montant estime" ajoutee (22 colonnes) avec formatage FR                 |
| **CSP Headers**          | Content-Security-Policy meta tag (frame-src/object-src none)                     |
| **RLS DAAF**             | DAAF peut modifier notes soumises/a_valider (policy notes_sef_update_authorized) |
| **Limite 3 PJ**          | Trigger DB + frontend pour max 3 pieces jointes par note                         |
| **Badge Migre**          | Detection notes importees (MIG-_, NNNN-YYYY-_) avec badge visuel                 |
| **Compteur total**       | Affichage "190 note(s) trouvee(s) - Page 1/10"                                   |
| **Flag is_migrated**     | Colonne et mise a jour automatique pour notes migrees                            |
| **Vendor chunk QR**      | Code splitting isole pour qrcode.react                                           |

### Gaps resolus (v4.1)

| Gap       | Description                             | Migration                                    |
| --------- | --------------------------------------- | -------------------------------------------- |
| **Gap 2** | Delegations dans le workflow backend    | `20260212_unified_validation_permission.sql` |
| **Gap 3** | Interims connectes au RBAC              | `20260212_unified_validation_permission.sql` |
| **Gap 4** | Notifications avec delegations/interims | `20260213_fix_notifications_delegations.sql` |

### Migrations ajoutees (v4.1)

| Migration                                    | Description                               |
| -------------------------------------------- | ----------------------------------------- |
| `20260211_fix_reference_generator.sql`       | Format reference ARTI00MMYYNNNN           |
| `20260211_budget_perf_indexes.sql`           | Index performance budget                  |
| `20260211_notes_sef_missing_indexes.sql`     | Index manquants notes SEF                 |
| `20260211_elop_auto_step*.sql`               | Triggers ELOP automatiques (4 migrations) |
| `20260212_unified_validation_permission.sql` | Delegations + interims workflow           |
| `20260213_fix_notifications_delegations.sql` | Notifications delegations                 |
| `20260213_pj_limit_and_migrated_flag.sql`    | Limite 3 PJ + flag migrated               |
| `20260213_rls_daaf_update_soumis.sql`        | RLS DAAF update soumis                    |

### Etat des gaps

| Gap                         | Statut            |
| --------------------------- | ----------------- |
| Gap 1 (Direction filtering) | ✅ Corrige (v4.0) |
| Gap 2 (Delegations backend) | ✅ Corrige (v4.1) |
| Gap 3 (Interims RBAC)       | ✅ Corrige (v4.1) |
| Gap 4 (Notifications)       | ✅ Corrige (v4.1) |
| Gap 5 (P.I. dans PDFs)      | ✅ Deja en place  |
| Gap 6 (DashboardHR mocke)   | ⬜ Ouvert (BASSE) |
| Gap 7 (DossierDetails)      | ✅ Deja en place  |

---

# Release Notes SYGFP v4.0 - 06/02/2026

## Vue d'ensemble

Version majeure post-migration. Toutes les donnees metier de SQL Server (eARTI_DB2, eARTIDB_2025, eARTIDB_2026) ont ete migrees vers Supabase. Cette version consolide la migration, ameliore le module Reglements, ajoute des Edge Functions, et renforce les tests E2E.

---

## Migration SQL Server vers Supabase (100%)

### Donnees metier migrees

| Donnee                    | Source (SQL Server) | Cible (Supabase) | Statut      |
| ------------------------- | ------------------- | ---------------- | ----------- |
| Notes SEF                 | 4,823               | 4,836            | Termine     |
| Engagements               | ~1,700              | 2,805            | Termine     |
| Liquidations              | 2,954               | 3,633            | Termine     |
| Ordonnancements           | 2,726               | 3,501            | Termine     |
| Fournisseurs              | 426                 | 431              | Termine     |
| **Total enregistrements** | **~12,629**         | **14,806**       | **Termine** |

> Supabase contient davantage d'enregistrements car de nouvelles entrees ont ete creees en production depuis la migration.

### Pieces jointes

| Metrique        | Valeur              |
| --------------- | ------------------- |
| Fichiers totaux | 27,117              |
| Taille totale   | ~26 Go              |
| Bucket cible    | `sygfp-attachments` |
| Statut          | Upload en cours     |

### Scripts de migration

| Script                                  | Description                           |
| --------------------------------------- | ------------------------------------- |
| `scripts/migrate_engagements_2024.py`   | Engagements 2024 (ARTI20 vers ARTI10) |
| `scripts/migrate_liquidations.py`       | Liquidations toutes annees            |
| `scripts/migrate_ordonnancements.py`    | Ordonnancements toutes annees         |
| `scripts/upload_to_supabase_storage.py` | Upload fichiers vers Storage          |

---

## Nouvelles Fonctionnalites

### MIG-01 : Module Reglements ameliore

- Composants UI ameliores (formulaire, liste, details)
- Workflow de validation complet
- Integration avec la chaine de depense (ordonnancement vers reglement)

### MIG-02 : Edge Functions supplementaires

| Fonction     | Description                                       |
| ------------ | ------------------------------------------------- |
| `r2-storage` | Proxy vers Cloudflare R2 pour fichiers volumineux |

Les 4 Edge Functions operationnelles :

- `create-user` : Creation utilisateur avec profil
- `generate-export` : Export PDF/Excel
- `send-notification-email` : Emails de notification
- `r2-storage` : Stockage R2

### MIG-03 : Tests E2E renforces

- 22 fichiers de tests E2E (Playwright)
- Couverture du workflow complet de la chaine de depense
- Tests de navigation et d'authentification

---

## Metriques du Projet

| Metrique        | v3.0 | v4.0                       |
| --------------- | ---- | -------------------------- |
| Pages           | ~50  | 104 fichiers (12 sections) |
| Composants      | ~200 | 402 fichiers (46 modules)  |
| Hooks           | ~60  | 142                        |
| Migrations DB   | ~151 | 173                        |
| Edge Functions  | 3    | 4                          |
| Tests unitaires | -    | 22 fichiers                |
| Tests E2E       | -    | 22 fichiers                |
| Donnees en base | -    | 14,806 enregistrements     |

---

## Infrastructure

### Supabase

```
Project: tjagvgqthlibdpvztvaf
URL: https://tjagvgqthlibdpvztvaf.supabase.co
Bucket Storage: sygfp-attachments
```

### Bases SQL Server (source migration)

```
Serveur: 192.168.0.8:1433
Bases: eARTI_DB2 (2024), eARTIDB_2025, eARTIDB_2026
```

---

## Breaking Changes

Aucun breaking change dans cette version. La migration est transparente pour les utilisateurs.

---

## Corrections

- Amelioration de la pagination sur les listes volumineuses
- Correction des filtres par exercice sur les modules migres
- Meilleure gestion des references croisees entre engagements, liquidations et ordonnancements

---

## Documentation mise a jour

| Document                                                       | Changements                                                      |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| [ARCHITECTURE_TECHNIQUE.md](ARCHITECTURE_TECHNIQUE.md)         | Metriques actualisees, section migration ajoutee                 |
| [PROJECT_STATUS.md](PROJECT_STATUS.md)                         | Etat migration, modules Notifications/Workflows/Interims ajoutes |
| [ETAT_ACTUEL.md](ETAT_ACTUEL.md)                               | Edge Function r2-storage ajoutee                                 |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)                       | Port corrige (8080), commandes completes                         |
| [RAPPORT_MIGRATION_COMPLETE.md](RAPPORT_MIGRATION_COMPLETE.md) | Rapport detaille de la migration                                 |
| [AUDIT_MIGRATION_COMPLET.md](AUDIT_MIGRATION_COMPLET.md)       | Audit des donnees migrees                                        |

---

## Verification

| Verification             | Statut      |
| ------------------------ | ----------- |
| `npm run build`          | Succes      |
| `npm run typecheck`      | 0 erreurs   |
| Donnees migrees en base  | Verifie     |
| Edge Functions deployees | 4/4         |
| Tests E2E                | 22 fichiers |

---

## Prochaines etapes (v4.1)

1. Finaliser l'upload des 27,117 pieces jointes vers Supabase Storage
2. Mettre a jour les references fichiers en base apres upload
3. Verification d'integrite complete
4. Export PDF mandats et ordonnancements
5. Amelioration UX mobile

---

**Date de Release:** 06/02/2026
**Version:** 4.0.0
**Statut:** Production
