
# Résumé de la Migration SYGFP

## Source: SQL Server (eARTIDB_2025)
## Destination: Supabase (PostgreSQL)

## Fichiers générés:
1. 01_directions.sql - Directions/Services
2. 02_fournisseurs.sql - Fournisseurs (table temporaire)
3. 03_budget_hierarchy.sql - Missions, Actions, Activités
4. 04_engagements.sql - Engagements budgétaires
5. 05_liquidations.sql - Liquidations
6. 06_ordonnancements.sql - Ordonnancements

## Instructions d'exécution:
1. Connectez-vous à Supabase SQL Editor
2. Exécutez les fichiers dans l'ordre (01 à 06)
3. Vérifiez les données importées
4. Supprimez les tables temporaires (migration_*)

## Notes:
- Les anciens IDs sont conservés dans migration_mapping pour référence
- Certaines données peuvent nécessiter un nettoyage manuel
- Les relations entre tables doivent être vérifiées
