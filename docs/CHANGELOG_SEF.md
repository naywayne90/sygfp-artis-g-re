# CHANGELOG - Module Notes SEF

## [2026-02-13] Optimisations exports, sécurité et performance

### Panneau de détail NoteSEFDetailSheet (4 onglets)

- **Nouveau composant** : `NoteSEFDetailSheet.tsx` — Sheet latéral avec 4 onglets
  - **Infos** : QR code (notes validées), identification, acteurs, budget, détails
  - **Contenu** : Exposé, avis, recommandations, commentaire
  - **Pièces jointes** : Compteur X/3, téléchargement, aperçu images
  - **Historique** : Timeline, chaîne de dépense, note AEF liée
- **Nouveau hook** : `useNoteSEFDetail.ts` — 3 requêtes React Query (PJ, historique, AEF)
- **NoteSEFList.tsx** : Clic sur ligne ouvre le Sheet au lieu de naviguer
- **NotesSEF.tsx** : Intégration du Sheet, remplacement du PreviewDrawer

### Export Excel : colonne Montant estimé ajoutée

- **`useNotesSEFExport.ts`** : Ajout de la colonne "Montant estimé" (22e colonne)
- Champ `montant_estime` ajouté à la requête SELECT d'export
- Formatage FR avec séparateur de milliers

### Performance : vendor chunk QR Code

- **`vite.config.ts`** : Ajout `vendor-qrcode: ["qrcode.react"]` pour isolation du chunk

### Sécurité : Content-Security-Policy

- **`index.html`** : Ajout meta CSP (default-src 'self', connect-src Supabase, frame-src 'none', object-src 'none')

### RLS : DAAF peut modifier les notes soumises

- **Migration** : `20260213_rls_daaf_update_soumis.sql`
- Policy `notes_sef_update_authorized` étendue : DAAF peut UPDATE les notes `soumis` et `a_valider`
- Utilise `user_roles` avec `app_role` enum (schéma réel, pas `is_admin()`/`is_dg()`/`is_daaf()`)
- Appliquée sur Supabase le 13/02/2026
- Préserve : Admin/DG tout, créateur ses propres notes

---

## [2026-02-13] Corrections multi-agents (Prompt 4)

### Gap 4 : Notifications délégations et intérims

- **Migration** : `20260213_fix_notifications_delegations.sql`
- Créé `get_users_who_can_act_as_role(role, scope)` → retourne user_ids via UNION (direct + délégation + intérim)
- Mis à jour `notify_role()` pour utiliser cette fonction (corrige TOUS les modules : Notes AEF, Engagements, Ordonnancements, Feuilles de route, Tâches)
- Mis à jour `notify_on_notes_sef_status_change()` avec nom du validateur et mode (direct/délégation/intérim)
- Supprimé le trigger doublon `notify_note_sef_soumise`
- **Frontend** : `useNotesSEFAudit.ts` — `getValidators()` et `sendNotifications()` convertis en no-ops (les triggers DB gèrent tout)

### Limite 3 pièces jointes par note

- **Migration** : `20260213_pj_limit_and_migrated_flag.sql`
- Trigger `trg_check_max_pieces` bloque INSERT quand >= 3 PJ
- **Frontend NoteSEFDetail** : validation avant upload, bouton désactivé à 3/3, compteur "(X/3)"
- **Frontend NoteSEFForm** : déjà protégé (MAX_ATTACHMENTS_PER_NOTE = 3)

### Compteur total notes

- **`NotesSEF.tsx`** : affiche `190 note(s) trouvée(s) • Page 1/10` au lieu de `20 note(s)`

### Badge "Migré" pour notes importées

- **`NoteSEFList.tsx`** : détecte `MIG-*` ET format legacy `NNNN-YYYY-*` → affiche badge "Migré" dans les colonnes Direction et Demandeur

### Flag is_migrated

- Colonne `is_migrated` ajoutée si absente
- Mise à jour automatique pour notes `MIG-*` et format legacy `NNNN-YYYY-*`
- Synchronisation du compteur de références pour le mois courant

---

## [2026-02-12] Résolution Gap 2 + Gap 3

- **Migration** : `20260212_unified_validation_permission.sql`
- `check_validation_permission()` vérifie rôle direct + délégation + intérim
- Colonnes `validation_mode` et `validated_on_behalf_of` sur notes_sef

---

## [2026-02-11] Corrections référence et performance

- **Migration** : `20260211_fix_reference_generator.sql` — format ARTI00MMYYNNNN (14 chars, pas de "/" ni "-")
- **Migration** : `20260211_budget_perf_indexes.sql` — index de performance
- **Migration** : `20260211_notes_sef_missing_indexes.sql` — index manquants

---

## Règles immuables

1. **Jamais supprimer** de notes existantes (4 836 notes migrées)
2. **Anciennes références** (MIG-_, SEF-_, NNNN-YYYY-\*) restent telles quelles
3. **Nouvelles références** : ARTI + XX(étape) + MM + YY + NNNN = 14 caractères
4. **Référence générée** uniquement à la SOUMISSION (pas en brouillon)
5. **Maximum 3 PJ** par note (TDR, devis, etc.)
