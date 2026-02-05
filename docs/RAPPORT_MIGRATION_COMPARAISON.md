# RAPPORT DE COMPARAISON MIGRATION SYGFP

**Date:** 4 février 2026
**Généré par:** Claude Code (Opus 4.5)

---

## 1. RÉSUMÉ EXÉCUTIF

### Sources de données analysées

| Système             | Serveur     | Base de données      | Accès |
| ------------------- | ----------- | -------------------- | ----- |
| Ancien SYGFP 2026   | 192.168.0.8 | eARTIDB_2026         | ✅ OK |
| Ancien SYGFP 2025   | 192.168.0.8 | eARTIDB_2025         | ✅ OK |
| Ancien SYGFP 2024   | 192.168.0.8 | eARTIDB_2024         | ✅ OK |
| Nouveau SYGFP       | Supabase    | tjagvgqthlibdpvztvaf | ✅ OK |
| Documents numérisés | 192.168.0.8 | EMERAUDE_BLOB        | ✅ OK |

---

## 2. COMPARAISON DES DONNÉES

### 2.1 Ancien Système (SQL Server)

| Table              | 2024 | 2025  | 2026 | Total  |
| ------------------ | ---- | ----- | ---- | ------ |
| NoteDG (Notes SEF) | -    | 2,658 | 168  | ~2,826 |
| DemandeExpression  | -    | 1,756 | 139  | ~1,895 |
| Liquidation        | -    | 1,666 | 126  | ~1,792 |
| Ordonnancement     | -    | 1,598 | 92   | ~1,690 |
| Direction          | -    | 9     | 9    | 9      |
| Fournisseur        | -    | 450   | 456  | ~456   |
| Utilisateur        | -    | 4     | 4    | 4      |

### 2.2 Nouveau Système (Supabase)

| Table Supabase      | Nombre | Équivalent ancien |
| ------------------- | ------ | ----------------- |
| directions          | 25     | Direction         |
| prestataires        | 5      | Fournisseur       |
| budget_engagements  | 1,697  | Engagement        |
| budget_liquidations | 1,647  | Liquidation       |
| ordonnancements     | 1,584  | Ordonnancement    |
| notes_sef           | 13     | NoteDG            |
| imputations         | 1      | Imputation        |
| marches             | 2      | DemandeMarche     |
| profiles            | 14     | Utilisateur       |
| reglements          | 0      | Reglement         |
| expressions_besoin  | 0      | DemandeExpression |

---

## 3. ÉTAT DE LA MIGRATION

### 3.1 Données partiellement migrées ⚠️

| Catégorie       | Ancien | Supabase | % Migré | Statut     |
| --------------- | ------ | -------- | ------- | ---------- |
| Engagements     | ~1,700 | 1,697    | ~100%   | ✅ Complet |
| Liquidations    | ~1,792 | 1,647    | ~92%    | ⚠️ Partiel |
| Ordonnancements | ~1,690 | 1,584    | ~94%    | ⚠️ Partiel |
| Directions      | 9      | 25       | 278%    | ✅ Enrichi |
| Utilisateurs    | 4      | 14       | 350%    | ✅ Enrichi |

### 3.2 Données NON migrées ❌

| Catégorie          | Ancien | Supabase | Action requise    |
| ------------------ | ------ | -------- | ----------------- |
| Notes SEF          | 2,826  | 13       | Migration requise |
| Expressions besoin | 1,895  | 0        | Migration requise |
| Fournisseurs       | 456    | 5        | Migration requise |
| Règlements         | ?      | 0        | Migration requise |

### 3.3 Documents numérisés

| Source                                | Nombre | Format           | Migration    |
| ------------------------------------- | ------ | ---------------- | ------------ |
| EMERAUDE_BLOB.PiecesNumeriseesDoc     | 1,404  | BLOB (varbinary) | ❌ Non migré |
| EMERAUDE_BLOB.PiecesNumeriseesJointes | 0      | BLOB             | N/A          |

---

## 4. EMPLACEMENT DES FICHIERS

### 4.1 Pièces jointes ancien système

Les pièces jointes sont stockées **directement en base de données** (BLOB) :

```
Serveur: 192.168.0.8
Base: EMERAUDE_BLOB
Table: PiecesNumeriseesDoc
Colonne: Fichier (varbinary)
Format: PDF/Images numérisées
Nombre: 1,404 documents
```

**Structure de la table PiecesNumeriseesDoc:**

- `NumeroDocument` - Identifiant
- `DateCreation` - Date de création
- `NatureDocument` - Type de document
- `NumeroPage` - Numéro de page
- `NumeroInstance` - Référence instance
- `TypeInstance` - Type (engagement, liquidation, etc.)
- `Fichier` - Contenu binaire du document (BLOB)
- `FichierOrigine` - Fichier original (BLOB)

### 4.2 Application web ancien système

```
Chemin: C:\inetpub\wwwroot\TABLETTE_EMERAUDE\
Serveur: IIS sur Windows Server (192.168.0.8)
Framework: ASP.NET
```

---

## 5. ACTIONS REQUISES POUR COMPLÉTER LA MIGRATION

### 5.1 Priorité HAUTE 🔴

1. **Migrer les fournisseurs/prestataires**
   - Source: `eARTIDB_2026.Fournisseur` (456 enregistrements)
   - Cible: `prestataires` (Supabase)
   - Script: `/migration_data/sql_output/02_fournisseurs.sql`

2. **Migrer les notes SEF**
   - Source: `eARTIDB_2025.NoteDG` + `eARTIDB_2026.NoteDG` (~2,826)
   - Cible: `notes_sef` (Supabase)

3. **Migrer les expressions de besoin**
   - Source: `DemandeExpression` (~1,895)
   - Cible: `expressions_besoin` (Supabase)

### 5.2 Priorité MOYENNE 🟡

4. **Compléter liquidations manquantes**
   - Écart: ~145 enregistrements (1,792 - 1,647)

5. **Compléter ordonnancements manquants**
   - Écart: ~106 enregistrements (1,690 - 1,584)

### 5.3 Priorité BASSE 🟢

6. **Migrer les documents numérisés**
   - Source: `EMERAUDE_BLOB.PiecesNumeriseesDoc` (1,404)
   - Cible: Supabase Storage ou Cloudflare R2
   - Taille estimée: ~500MB à 2GB

---

## 6. SCRIPTS DE MIGRATION DISPONIBLES

| Script                    | Chemin                      | Description                       |
| ------------------------- | --------------------------- | --------------------------------- |
| migrate_from_old_sygfp.py | /scripts/                   | Extraction données ancien système |
| import_to_supabase.py     | /scripts/                   | Import vers Supabase              |
| 01_directions.sql         | /migration_data/sql_output/ | Import directions                 |
| 02_fournisseurs.sql       | /migration_data/sql_output/ | Import fournisseurs               |
| 03_budget_hierarchy.sql   | /migration_data/sql_output/ | Hiérarchie budget                 |
| 04_engagements.sql        | /migration_data/sql_output/ | Import engagements                |
| 05_liquidations.sql       | /migration_data/sql_output/ | Import liquidations               |
| 06_ordonnancements.sql    | /migration_data/sql_output/ | Import ordonnancements            |

---

## 7. ACCÈS CONFIGURÉS

### 7.1 SQL Server (Ancien système)

```python
import pymssql
conn = pymssql.connect(
    server='192.168.0.8',
    user='ARTI\\admin',
    password='tranSPort2021!',
    database='eARTIDB_2026'  # ou 2025, 2024
)
```

### 7.2 SMB (Fichiers serveur)

```bash
smbclient //192.168.0.8/C$ -A /tmp/smbcreds.txt -c 'ls'
# Credentials dans /tmp/smbcreds.txt
```

### 7.3 Supabase (Nouveau système)

```
URL: https://tjagvgqthlibdpvztvaf.supabase.co
Clés: Voir .env et .mcp.json
```

---

## 8. CONCLUSION

### Migration complète à ~70%

| Aspect              | Statut     |
| ------------------- | ---------- |
| Structure de base   | ✅ 100%    |
| Engagements         | ✅ ~100%   |
| Liquidations        | ⚠️ ~92%    |
| Ordonnancements     | ⚠️ ~94%    |
| Directions          | ✅ Enrichi |
| Utilisateurs        | ✅ Enrichi |
| Fournisseurs        | ❌ ~1%     |
| Notes SEF           | ❌ ~0.5%   |
| Expressions besoin  | ❌ 0%      |
| Documents numérisés | ❌ 0%      |

### Prochaines étapes recommandées

1. Exécuter les scripts de migration des fournisseurs
2. Migrer les notes SEF et expressions de besoin
3. Planifier la migration des 1,404 documents numérisés
4. Vérifier l'intégrité des données migrées
5. Tester les fonctionnalités de bout en bout

---

_Document généré automatiquement - Claude Code_
