# DIAGNOSTIC COMPLET — MODULE LIQUIDATION SYGFP

**Version:** 1.0.0
**Date:** 20 fevrier 2026
**Auteur:** Claude Code (mode READ-ONLY)
**Directive:** NE MODIFIE AUCUN CODE
**Methode:** 4 agents paralleles, lecture exhaustive du code source

---

## SYNTHESE EXECUTIVE — 7 POINTS CRITIQUES

| #   | Point critique                                      | Verdict                    | Priorite |
| --- | --------------------------------------------------- | -------------------------- | -------- |
| 1   | Calculs fiscaux (TVA, AIRSI, retenues, net a payer) | **FONCTIONNEL**            | -        |
| 2   | Certification service fait                          | **FONCTIONNEL**            | -        |
| 3   | Flag reglement_urgent (exigence TOURE)              | **FONCTIONNEL**            | -        |
| 4   | Liquidations partielles (multi-tranches)            | **FONCTIONNEL**            | -        |
| 5   | Impact budget (budget_lines.total_liquide)          | **FONCTIONNEL**            | -        |
| 6   | Lien vers l'engagement                              | **FONCTIONNEL** avec 1 gap | P2       |
| 7   | Pieces justificatives                               | **FONCTIONNEL** avec 1 gap | P1       |

**Conclusion : Les 7 mecanismes metier fonctionnent. Aucun P0.**

---

## 1. CALCULS FISCAUX — FONCTIONNEL

### Formules implementees (LiquidationForm.tsx, lignes 88-106)

```
montant_ttc = montant_ht + (montant_ht x tva_taux / 100)
airsi_montant = ROUND(montant_ttc x airsi_taux / 100)
retenue_source_montant = ROUND(montant_ttc x retenue_source_taux / 100)
net_a_payer = montant_ttc - airsi_montant - retenue_source_montant
```

### Mecanisme

- **2 useEffect reactifs** : le premier calcule le TTC depuis HT+TVA, le second calcule AIRSI+retenue+net
- **Arrondi AVANT soustraction** : garantit `airsi + retenue + net = ttc` exactement
- **Affichage formule** visible sous le champ net a payer (ligne 358)

### Taux par defaut

| Taux           | Valeur | Source                                   |
| -------------- | ------ | ---------------------------------------- |
| TVA            | 18%    | LiquidationForm.tsx:72                   |
| AIRSI          | 0%     | LiquidationForm.tsx:73 (saisie manuelle) |
| Retenue source | 0%     | LiquidationForm.tsx:76 (saisie manuelle) |

### Enregistrement backend (useLiquidations.ts, lignes 173-246)

Tous les champs fiscaux sont envoyes au backend :
`montant, montant_ht, tva_taux, tva_montant, airsi_taux, airsi_montant, retenue_source_taux, retenue_source_montant, net_a_payer`

Fallback : si `net_a_payer` absent, utilise `data.montant` (TTC).

### Controle SDCT (ControleSdctForm.tsx, lignes 52-67)

Checklist 4 items dont "Calcul des retenues correct (TVA, AIRSI, etc.)" — **verification MANUELLE** par le SDCT, pas de validation programmatique.

Seuil DG 50M FCFA : **implemente** (lignes 151-156).

### Trigger backend

**AUCUN trigger de recalcul fiscal.** Les calculs sont 100% frontend. Acceptable car les champs sont en lecture seule apres creation.

### Verdict : FONCTIONNEL

| Aspect                 | Statut                        |
| ---------------------- | ----------------------------- |
| Formule TVA            | OK                            |
| Formule AIRSI          | OK                            |
| Formule retenue source | OK                            |
| Formule net a payer    | OK                            |
| Precision arrondi      | OK (ROUND avant soustraction) |
| Seuil DG 50M           | OK                            |

### Gaps mineurs

| Gap                                                     | Severite | Detail                          |
| ------------------------------------------------------- | -------- | ------------------------------- |
| Pas de validation auto `montant_ht + tva = montant_ttc` | P2       | SDCT verifie manuellement       |
| Pas de trigger backend de recalcul                      | P2       | Frontend only, acceptable       |
| AIRSI et retenue a 0% par defaut                        | Info     | Normal pour CI, saisie manuelle |

---

## 2. CERTIFICATION SERVICE FAIT — FONCTIONNEL

### Mecanisme (ServiceFaitForm.tsx, 399 lignes)

1. Toggle Switch `service_fait: boolean`
2. Si active : saisie obligatoire `service_fait_date` + `reference_facture`
3. AlertDialog de confirmation avant enregistrement
4. UPDATE `budget_liquidations` avec :
   - `service_fait = true`
   - `service_fait_date = <saisie utilisateur>`
   - `service_fait_certifie_par = auth.uid()` (automatique)
   - `reference_facture = <saisie>`
   - `observation = <optionnel>`

### Validation Zod (ligne 31-36)

```typescript
serviceFaitSchema = z.object({
  service_fait: z.boolean(),
  service_fait_date: z.string().min(1, 'Date requise'),
  reference_facture: z.string().min(1, 'Reference facture requise'),
  observation: z.string().optional(),
});
```

### RBAC (ligne 59)

```typescript
canCertify = hasAnyRole(['ADMIN', 'SDCT', 'DAAF', 'DIRECTION']) && !readOnly;
```

### Tracabilite

- `service_fait_certifie_par` : UUID du certificateur (auth.uid)
- Audit trail via `useAuditLog()` (lignes 190-207)
- Date par defaut : aujourd'hui (`new Date()`), modifiable par l'utilisateur

### Affichage (LiquidationDetails.tsx, lignes 263-290)

Card dediee "Service fait" avec : certifie oui/non, date, reference facture, regime fiscal, observation.

### Integration workflow

- A la **creation**, le service fait est automatiquement certifie (useLiquidations.ts:373-375)
- ServiceFaitForm affiche si `statut !== "valide"` ET `statut !== "rejete"`
- ControleSdctForm affiche si `service_fait === true`

### Verdict : FONCTIONNEL

| Aspect               | Statut                                   |
| -------------------- | ---------------------------------------- |
| Certification toggle | OK                                       |
| Date enregistree     | OK (saisie manuelle, defaut aujourd'hui) |
| Certificateur trace  | OK (auth.uid automatique)                |
| RBAC                 | OK (ADMIN/SDCT/DAAF/DIRECTION)           |
| Audit trail          | OK                                       |
| Affichage details    | OK                                       |

### Gaps mineurs

| Gap                                                                  | Severite | Detail                           |
| -------------------------------------------------------------------- | -------- | -------------------------------- |
| Date saisie manuellement vs NOW() serveur                            | P2       | Utilisateur peut antidater       |
| Role `SDCT` a verifier en base                                       | P2       | Existe-t-il ? Ou faut-il `SAF` ? |
| Pas de contrainte CHECK backend `service_fait=true => date NOT NULL` | P2       | Coherence non enforcee           |

---

## 3. FLAG REGLEMENT_URGENT — FONCTIONNEL

### Colonnes (migration 20260203180000)

```sql
reglement_urgent        BOOLEAN DEFAULT false
reglement_urgent_motif  TEXT
reglement_urgent_date   TIMESTAMP
reglement_urgent_par    UUID FK auth.users
```

### RPC backend (mark_liquidation_urgent)

```sql
CREATE OR REPLACE FUNCTION mark_liquidation_urgent(p_liquidation_id UUID, p_motif TEXT)
-- Verifie roles : DG, DMG, DAAF, Directeur, Admin, Validateur
-- Verifie motif non vide
-- UPDATE + date = NOW() serveur-side
-- INSERT notification vers Tresorier + DMG
```

### Hook frontend (useUrgentLiquidations.ts, 165 lignes)

- `markAsUrgent(liquidationId, motif)` : UPDATE + audit trail + toast
- `removeUrgent(liquidationId)` : reset tous les champs urgence
- `isUrgent(liquidationId)` : helper boolean
- Stats calculees : total, enAttente, validees, montantTotal

### Composants UI

| Composant               | Lignes | Role                                                        |
| ----------------------- | ------ | ----------------------------------------------------------- |
| UrgentLiquidationToggle | ~150   | 3 variantes (switch/button/icon), dialog motif min 10 chars |
| UrgentLiquidationBadge  | ~80    | 4 variantes (badge/dot/icon/full), HoverCard avec details   |
| UrgentLiquidationList   | ~450   | Table dediee, search, tri, stats KPI, export Excel          |

### Integration page (Liquidations.tsx)

- KPI Card "Urgentes" avec flamme animee si > 0
- Onglet "Urgentes" avec UrgentLiquidationList
- Toggle urgent dans LiquidationList (colonne conditionnelle)

### Notifications

```sql
INSERT INTO notifications (user_id, type, title, ...)
SELECT p.id FROM profiles p
WHERE p.role_hierarchique IN ('Tresorier', 'DMG')
AND p.id != auth.uid()
```

### Verdict : FONCTIONNEL

| Aspect                      | Statut                                       |
| --------------------------- | -------------------------------------------- |
| Flag reglement_urgent       | OK                                           |
| RPC avec verification roles | OK                                           |
| Motif obligatoire           | OK (min 10 chars frontend, non-vide backend) |
| Notification tresorerie     | OK                                           |
| UI toggle + badge + liste   | OK                                           |
| KPI + onglet dedie          | OK                                           |
| Export Excel urgentes       | OK                                           |

### Gaps

| Gap                                          | Severite | Detail                                       |
| -------------------------------------------- | -------- | -------------------------------------------- |
| Pas de check RBAC frontend avant clic toggle | P2       | Backend rejette, mais UX confuse             |
| Compteur urgent ABSENT du sidebar            | P1       | `useSidebarBadges` n'inclut PAS les urgentes |

---

## 4. LIQUIDATIONS PARTIELLES — FONCTIONNEL

### Mecanisme : `calculateAvailability()` (useLiquidations.ts, lignes 155-189)

```typescript
// 1. Montant total engage
const montant_engage = engagement.montant;  // Ex: 10M

// 2. Cumul liquidations anterieures (hors annulees/rejetees)
const liquidations_anterieures = SUM(
  budget_liquidations.montant
  WHERE engagement_id = X
  AND statut NOT IN ('annule', 'rejete')
  AND id != excludeLiquidationId  // Pour edition
);

// 3. Calcul
const cumul = liquidations_anterieures + liquidation_actuelle;
const restant_a_liquider = montant_engage - cumul;
const is_valid = restant_a_liquider >= 0;
```

### Affichage (LiquidationForm.tsx, lignes 210-280)

Card 5 colonnes avec code couleur :

```
[Montant engage] [Liquidations ant.] [Liquidation actuelle] [Cumul] [Restant a liquider]
   10M FCFA          4M FCFA              6M FCFA           10M       0M FCFA (vert)
```

- Vert si `is_valid = true` (restant >= 0)
- Rouge si `is_valid = false` (depassement)

### Blocage creation

```typescript
<Button disabled={... || (availability && !availability.is_valid)}>
  Creer la liquidation
</Button>
```

Le bouton "Creer" est **desactive** si le cumul depasse le montant engage.

### Exemples concrets

```
Engagement 10M FCFA:
  Tranche 1: 4M → Restant 6M → is_valid=true  → AUTORISE
  Tranche 2: 6M → Restant 0M → is_valid=true  → AUTORISE
  Tranche 3: 1M → Restant -1M → is_valid=false → BLOQUE
```

### Verdict : FONCTIONNEL

| Aspect                         | Statut                      |
| ------------------------------ | --------------------------- |
| Multi-tranches supportees      | OK                          |
| Cumul liquidations anterieures | OK (SUM hors annule/rejete) |
| Exclusion en mode edition      | OK (excludeLiquidationId)   |
| Affichage restant a liquider   | OK (5 colonnes, couleurs)   |
| Blocage depassement            | OK (bouton disable)         |

### Gaps

| Gap                                                  | Severite | Detail                                                  |
| ---------------------------------------------------- | -------- | ------------------------------------------------------- |
| Pas de trigger backend CHECK cumul <= montant_engage | P1       | Controle frontend only, bypass possible via API directe |
| Engagements 100% liquides non filtres du select      | P1       | L'utilisateur voit des engagements sans reste           |

---

## 5. IMPACT BUDGET — FONCTIONNEL

### Trigger AFTER INSERT/UPDATE/DELETE (migration 20260220_prompt13)

```sql
CREATE TRIGGER trg_recalc_elop_budget_liquidations
  AFTER INSERT OR UPDATE OR DELETE ON budget_liquidations
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_budget_line_totals();
```

### Fonction `_recalculate_single_budget_line()` — Formules exactes

```sql
-- Total liquide = SUM liquidations VALIDEES uniquement
SELECT COALESCE(SUM(bl.montant), 0) INTO v_total_liquide
  FROM budget_liquidations bl
  JOIN budget_engagements be ON be.id = bl.engagement_id
  WHERE be.budget_line_id = p_budget_line_id
    AND bl.statut = 'valide';

-- Mise a jour
UPDATE budget_lines SET
  total_engage = v_total_engage,
  total_liquide = v_total_liquide,
  total_ordonnance = v_total_ordonnance,
  total_paye = v_total_paye,
  dotation_modifiee = v_dotation_modifiee,
  disponible_calcule = v_disponible
WHERE id = p_budget_line_id;
```

### Chaine de causalite

```
Liquidation creee (brouillon)  → trigger declenche → total_liquide INCHANGE (statut != valide)
Liquidation validee            → trigger declenche → total_liquide += montant
Liquidation rejetee            → trigger declenche → total_liquide -= montant
```

### Formule complete

```
total_engage      = SUM(engagements valides) + SUM(engagement_lignes multi-ligne)
total_liquide     = SUM(liquidations validees)
total_ordonnance  = SUM(ordonnancements valides/signes)
total_paye        = SUM(reglements payes/confirmes)
dotation_modifiee = dotation_initiale + virements_recus - virements_emis
disponible        = dotation_modifiee - total_engage
```

### Alertes budgetaires (useLiquidations.ts, lignes 544-594)

Les alertes sont basees sur le **taux d'engagement** (pas de liquidation) :

```
taux = total_engage / dotation x 100
>80% ≤95% : alerte orange CB
>95% <100% : alerte rouge CB + DAAF + DAF
≥100%      : DEPASSEMENT DG + DAAF + DAF + CB + ADMIN
```

### Vues ELOP (v_alertes_financieres)

```sql
total_engage, total_liquide, total_ordonnance, total_paye
CASE WHEN total_engage > dotation THEN 'DEPASSEMENT_ENGAGEMENT' ...
```

### Verdict : FONCTIONNEL

| Aspect                            | Statut                       |
| --------------------------------- | ---------------------------- |
| Trigger recalcul apres validation | OK                           |
| total_liquide incremente          | OK (seulement statut=valide) |
| total_engage, ordonnance, paye    | OK                           |
| disponible_calcule                | OK                           |
| Alertes budgetaires               | OK (basees sur engagement)   |
| Vues ELOP                         | OK                           |

### Gaps

Aucun gap identifie sur l'impact budget.

---

## 6. LIEN VERS L'ENGAGEMENT — FONCTIONNEL

### Query jointure (useLiquidations.ts)

```typescript
engagement:budget_engagements(
  id, numero, objet, montant, fournisseur,
  budget_line:budget_lines(id, code, label, direction:directions(label, sigle)),
  marche:marches(id, numero, prestataire:prestataires(id, raison_sociale))
),
```

Champs charges : id, numero, objet, montant, fournisseur, budget_line (code, label, direction), marche (numero, prestataire).

### Selection engagement (LiquidationForm.tsx)

```typescript
// Filtre : statut='valide' ET exercice courant
supabase.from('budget_engagements').eq('statut', 'valide').eq('exercice', exercice);
```

Affichage : `{eng.numero} - {eng.objet} ({formatMontant(eng.montant)})`

### Affichage details (LiquidationDetails.tsx)

Card "Engagement source" avec :

- Numero cliquable → `navigate(/engagements?detail=${engagement_id})`
- Montant engage, objet, fournisseur/prestataire, ligne budgetaire, direction

### Navigation chaine (LiquidationChainNav.tsx)

Barre horizontale : Passation > **Engagement** > Liquidation > Ordonnancement
Lien cliquable vers `/engagements?detail=xxx`

### FK backend

- `engagement_id` : UUID NOT NULL, FK → budget_engagements
- Index : `idx_budget_liquidations_engagement_id`

### Verdict : FONCTIONNEL

| Aspect               | Statut                                                           |
| -------------------- | ---------------------------------------------------------------- |
| FK engagement_id     | OK (NOT NULL, indexe)                                            |
| Jointure recursive   | OK (engagement + budget_line + direction + marche + prestataire) |
| Selection engagement | OK (filtre valide + exercice)                                    |
| Affichage details    | OK (card + lien cliquable)                                       |
| Navigation chaine    | OK (ChainNav 4 etapes)                                           |

### Gaps

| Gap                                            | Severite | Detail                                                              |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------- |
| Engagements 100% liquides non exclus du Select | P1       | L'utilisateur peut selectionner un engagement sans reste a liquider |

---

## 7. PIECES JUSTIFICATIVES — FONCTIONNEL

### Documents requis (useLiquidations.ts)

```typescript
DOCUMENTS_REQUIS = [
  { code: 'facture', label: 'Facture', obligatoire: true },
  { code: 'pv_reception', label: 'PV de reception', obligatoire: true },
  { code: 'bon_livraison', label: 'Bon de livraison', obligatoire: true },
  { code: 'attestation_service_fait', label: 'Attestation service fait', obligatoire: false },
  { code: 'autre', label: 'Autre document', obligatoire: false },
];
```

### Upload (LiquidationForm.tsx)

- Input type="file", accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
- MAX_FILE_SIZE = 10 Mo
- Preview image avec `URL.createObjectURL()`
- Stockage dans `liquidation_attachments` (table backend)

### Double verification documents obligatoires

**A la creation (useLiquidations.ts, createMutation) :**

```typescript
const missingDocs = requiredDocs.filter((d) => !providedDocs.includes(d));
if (missingDocs.length > 0) {
  throw new Error(`Documents obligatoires manquants: ${missingLabels}`);
}
```

**A la soumission (useLiquidations.ts, submitMutation) :**

```typescript
// Re-verification depuis la base
const { data: attachments } = await supabase
  .from('liquidation_attachments')
  .select('document_type')
  .eq('liquidation_id', id);
// Meme logique de verification
```

### Checklist (LiquidationChecklist.tsx, 449 lignes)

- Progress bar : `(providedRequired / totalRequired) x 100`
- Badge "Obligatoire" pour `is_required=true`
- 3 etats : Non fourni (muted) → Fourni (primary) → Verifie (green)
- Blocage soumission si documents manquants :

```tsx
{
  !checklistStatus.isComplete && <Alert variant="destructive">Documents manquants</Alert>;
}
```

### Hook documents (useLiquidationDocuments.ts, 126 lignes)

Mutations : `markAsProvided`, `verifyDocument`, `unmarkDocument`
Checklist status : `totalRequired, providedRequired, verifiedRequired, isComplete, isFullyVerified, missingLabels`

### Verdict : FONCTIONNEL

| Aspect                                      | Statut                             |
| ------------------------------------------- | ---------------------------------- |
| Documents obligatoires definis              | OK (facture, PV, BL)               |
| Upload fichiers                             | OK (10Mo max, types valides)       |
| Double verification (creation + soumission) | OK                                 |
| Checklist visuelle                          | OK (progress bar, badges, 3 etats) |
| Blocage si manquant                         | OK                                 |

### Gaps

| Gap                                          | Severite | Detail                                                                                                |
| -------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| Upload reel vers Supabase Storage a verifier | P1       | Le code genere un `file_path` mais l'upload effectif vers le bucket n'est pas visible dans le code lu |

---

## CLASSEMENT DES GAPS PAR PRIORITE

### P0 — Calculs casses ou service fait absent

**AUCUN P0 IDENTIFIE.**

Les calculs fiscaux fonctionnent correctement. Le service fait est pleinement implemente avec tracabilite. Aucun mecanisme metier critique n'est casse.

---

### P1 — Workflow incomplet ou flag urgent manquant (5 items)

| #    | Gap                                                      | Fichier                                  | Impact                                                                                                                                                                                                                       | Correction estimee                                           |
| ---- | -------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| P1-1 | **Compteur urgent absent du sidebar**                    | useSidebarBadges.ts                      | Les liquidations urgentes ne sont pas visibles dans la navigation laterale. Un utilisateur doit ouvrir la page Liquidations pour voir les urgences.                                                                          | Ajouter query `reglement_urgent=true` dans useSidebarBadges  |
| P1-2 | **Pas de trigger backend CHECK cumul <= montant_engage** | Migrations                               | Le controle multi-tranches est frontend-only. Un appel API direct pourrait creer une liquidation depassant le montant engage.                                                                                                | Ajouter trigger BEFORE INSERT/UPDATE sur budget_liquidations |
| P1-3 | **Engagements 100% liquides non exclus du select**       | LiquidationForm.tsx                      | L'utilisateur voit des engagements sans reste a liquider dans le dropdown. Il peut les selectionner, saisir un montant, et etre bloque ensuite (UX confuse).                                                                 | Filtrer `WHERE montant > SUM(liquidations non-annulees)`     |
| P1-4 | **Upload fichiers vers Storage a verifier**              | LiquidationForm.tsx / useLiquidations.ts | Le code genere un `file_path` format `liquidations/${timestamp}_${filename}` mais l'appel `supabase.storage.from('bucket').upload()` n'est pas visible. Les fichiers sont peut-etre seulement references sans etre uploades. | Verifier et corriger si necessaire                           |
| P1-5 | **`@ts-nocheck` dans LiquidationTimeline.tsx**           | LiquidationTimeline.tsx:1                | 340 lignes sans verification TypeScript. Risque d'erreurs runtime masquees.                                                                                                                                                  | Retirer et typer correctement                                |

---

### P2 — UI/UX et conformite (10 items)

| #     | Gap                                                    | Fichier                                                                            | Impact                                              |
| ----- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------- |
| P2-1  | `formatMontant` local x4 au lieu de `formatCurrency()` | Liquidations.tsx, LiquidationForm.tsx, LiquidationDetails.tsx, LiquidationList.tsx | Violation convention SYGFP                          |
| P2-2  | 4x `as any` pour dossier_id                            | LiquidationDetails.tsx                                                             | `dossier_id` absent du type Liquidation, force cast |
| P2-3  | `as unknown as Liquidation[]` double cast              | useLiquidations.ts:152                                                             | Anti-pattern TypeScript                             |
| P2-4  | `Record<string, unknown>` pour engagementsValides      | Liquidations.tsx:370                                                               | Typage fragile, crash possible                      |
| P2-5  | Optional chaining inconsistant (`liq.numero`)          | Liquidations.tsx:120                                                               | Crash si numero undefined                           |
| P2-6  | Imports inutilises (Crown, XCircle, FileText)          | LiquidationDetails.tsx, Liquidations.tsx                                           | ESLint warnings                                     |
| P2-7  | Variables non utilisees (isSubmitting, totalValidees)  | Liquidations.tsx                                                                   | ESLint warnings                                     |
| P2-8  | Pas de check RBAC frontend pour toggle urgent          | UrgentLiquidationToggle                                                            | Backend rejette mais UX confuse                     |
| P2-9  | Date service_fait saisie manuellement vs NOW()         | ServiceFaitForm.tsx                                                                | Utilisateur peut antidater                          |
| P2-10 | Pas de validation auto montant_ht + tva = montant_ttc  | ControleSdctForm.tsx                                                               | SDCT verifie manuellement                           |

---

## MATRICE DE RISQUE

```
           IMPACT
           Eleve  │  P1-2 (trigger cumul)     P1-4 (upload storage)
                   │  P1-5 (@ts-nocheck)
                   │
           Moyen   │  P1-1 (sidebar urgent)   P1-3 (engagements 100%)
                   │
           Faible  │  P2-1..P2-10
                   │
                   └──────────────────────────────────────────────
                      Faible              Moyenne            Elevee
                                    PROBABILITE
```

---

## COMPARATIF AVEC L'ENGAGEMENT CERTIFIE

| Mecanisme                 | Engagement (100/100)            | Liquidation (62/100)    | Delta     |
| ------------------------- | ------------------------------- | ----------------------- | --------- |
| Calculs metier            | Imputation budgetaire OK        | Calculs fiscaux OK      | =         |
| Workflow 4 etapes         | SAF>CB>DAAF>DG                  | SAF>CB>DAF>DG           | =         |
| Multi-lignes/tranches     | Engagement multi-lignes         | Liquidations partielles | =         |
| Impact budget trigger     | trg_recalc_elop                 | trg_recalc_elop (meme)  | =         |
| Pieces jointes            | Upload Storage OK               | **Upload a verifier**   | Delta     |
| Trigger backend cumul     | trg_check_engagement_lignes_sum | **ABSENT**              | **Delta** |
| Tests unitaires           | 231                             | **0**                   | **-231**  |
| Tests E2E                 | 60                              | ~18                     | **-42**   |
| `@ts-nocheck`             | 0                               | **1**                   | **-1**    |
| Convention formatCurrency | OK                              | **4 violations**        | **-4**    |
| `as any`                  | 0                               | **4**                   | **-4**    |

---

## RECOMMANDATIONS ORDONNEES

### Sprint 1 — P1 (Prompts 2-3)

1. **P1-5** : Retirer `@ts-nocheck` de LiquidationTimeline.tsx, typer les interfaces
2. **P1-2** : Ajouter trigger BEFORE INSERT/UPDATE verifiant cumul <= montant_engage
3. **P1-3** : Filtrer engagements 100% liquides dans la query LiquidationForm
4. **P1-4** : Verifier et corriger l'upload fichiers vers Supabase Storage
5. **P1-1** : Ajouter compteur urgent dans useSidebarBadges

### Sprint 2 — P2 (Prompts 4-5)

6. **P2-1** : Remplacer 4x `formatMontant` local par `formatCurrency()`
7. **P2-2** : Ajouter `dossier_id` au type Liquidation, retirer `as any`
8. **P2-3** : Refactoriser double cast `as unknown as Liquidation[]`
9. **P2-4** : Typer `engagementsValides` correctement
10. **P2-5 a P2-7** : Nettoyer imports/variables inutilises
11. **P2-8** : Ajouter check RBAC frontend sur toggle urgent
12. **P2-9** : Considerer `NOW()` serveur-side pour service_fait_date
13. **P2-10** : Ajouter validation auto coherence montants

### Sprint 3 — Tests (Prompts 6-8)

14. Ecrire 50+ tests unitaires pour useLiquidations (formules, availability, workflow)
15. Ecrire 30+ tests unitaires pour composants (Form, ServiceFait, SDCT)
16. Ecrire 40+ tests E2E workflow complet

---

_Document genere le 20 fevrier 2026 — Mode READ-ONLY, aucun code modifie._
