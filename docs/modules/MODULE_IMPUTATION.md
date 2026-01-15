# Imputation Budgétaire - Documentation Technique

> **Version**: 1.0 | **Dernière mise à jour**: 2026-01-15 | **Statut**: ✅ Opérationnel

## 1. Vue d'ensemble

L'**Imputation** est l'étape critique qui rattache une demande financière (Note AEF validée) à une ligne budgétaire spécifique. Elle vérifie la disponibilité des crédits et crée le dossier de dépense.

### Position dans la chaîne

```
Note SEF → Note AEF → [Imputation] → Expression Besoin → Marché → ...
```

### Rôle principal

- Rattacher la note à la hiérarchie programmatique (OS/Mission/Action/Activité)
- Affecter une ligne budgétaire avec les nomenclatures (NBE, SYSCO)
- Vérifier la disponibilité budgétaire avant engagement
- Créer automatiquement le dossier de dépense
- Construire le code d'imputation

---

## 2. Architecture

### 2.1 Tables concernées

| Table | Rôle dans l'imputation |
|-------|------------------------|
| `notes_dg` | Note source (mise à jour statut → `impute`) |
| `budget_lines` | Ligne budgétaire cible |
| `dossiers` | Dossier créé automatiquement |
| `dossier_etapes` | Étapes du dossier |
| `objectifs_strategiques` | Référentiel OS |
| `missions` | Référentiel Mission |
| `actions` | Référentiel Action |
| `activites` | Référentiel Activité |
| `sous_activites` | Référentiel Sous-activité |
| `nomenclature_nbe` | Nomenclature budgétaire |
| `plan_comptable_sysco` | Plan comptable SYSCOHADA |
| `directions` | Directions |

### 2.2 Données d'imputation

| Champ | Description | Obligatoire |
|-------|-------------|-------------|
| `os_id` | Objectif Stratégique | Non |
| `mission_id` | Mission | Non |
| `action_id` | Action | Non |
| `activite_id` | Activité | Non |
| `sous_activite_id` | Sous-activité | Non |
| `direction_id` | Direction | Non |
| `nbe_id` | Code NBE | Non |
| `sysco_id` | Compte SYSCO | Non |
| `source_financement` | Source des fonds | Oui |
| `montant` | Montant à imputer | Oui |

### 2.3 Sources de financement

```typescript
const SOURCES_FINANCEMENT = [
  { value: "budget_etat", label: "Budget de l'État" },
  { value: "ressources_propres", label: "Ressources propres" },
  { value: "subventions", label: "Subventions" },
  { value: "dons_legs", label: "Dons et legs" },
  { value: "emprunts", label: "Emprunts" },
  { value: "partenaires", label: "Partenaires techniques et financiers" },
];
```

---

## 3. Code d'imputation

### 3.1 Construction

Le code d'imputation est construit à partir des éléments sélectionnés :

```
{OS_CODE}-{MISSION_CODE}-{ACTION_CODE}-{ACTIVITE_CODE}-{NBE_CODE}-{SYSCO_CODE}
```

### 3.2 Exemple

```
OS01-M02-A03-ACT04-622-6241
```

### 3.3 Fonction de construction

```typescript
const buildImputationCode = (data: ImputationData): string => {
  const parts = [];
  if (data.os_id) parts.push(getOSCode(data.os_id));
  if (data.mission_id) parts.push(getMissionCode(data.mission_id));
  if (data.nbe_id) parts.push(getNBECode(data.nbe_id));
  if (data.sysco_id) parts.push(getSYSCOCode(data.sysco_id));
  return parts.length > 0 ? parts.join("-") : "N/A";
};
```

---

## 4. Calcul de disponibilité

### 4.1 Formule

```
Disponible = Dotation + Virements reçus - Virements émis - Engagements antérieurs
```

### 4.2 Interface de résultat

```typescript
interface BudgetAvailability {
  budget_line_id: string;
  budget_line_code: string;
  dotation_initiale: number;
  virements_recus: number;
  virements_emis: number;
  engagements_anterieurs: number;
  disponible: number;
  montant_demande: number;
  is_sufficient: boolean;
}
```

### 4.3 Affichage dans l'interface

```
┌────────────┬────────────┬────────────┬────────────┬────────────┐
│ (A) Dotat. │ (B) Vir +  │ (C) Vir -  │ (D) Eng.   │ (E) Dispo  │
│ 10 000 000 │ 1 000 000  │ 500 000    │ 3 000 000  │ 7 500 000  │
└────────────┴────────────┴────────────┴────────────┴────────────┘
```

---

## 5. Workflow d'imputation

### 5.1 Diagramme

```
┌─────────────────┐
│ Note AEF VALIDE │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│           Formulaire d'imputation           │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Rattachement    │  │ Nomenclatures    │  │
│  │ programmatique  │  │ NBE + SYSCO      │  │
│  │ OS/Mission/...  │  │                  │  │
│  └─────────────────┘  └──────────────────┘  │
└────────────────────────┬────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │ Calcul dispo ?   │
              └────────┬─────────┘
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
    ┌─────────────┐         ┌─────────────┐
    │ SUFFISANT   │         │ INSUFFISANT │
    │ → Imputer   │         │ → Bloquer   │
    └──────┬──────┘         │ ou Forcer   │
           │                └─────────────┘
           ▼
┌─────────────────────────────────────────────┐
│  1. Note → statut = "impute"                │
│  2. Création Dossier automatique            │
│  3. Création Dossier_Etape (imputation)     │
│  4. Audit log                               │
└─────────────────────────────────────────────┘
```

### 5.2 Option de forçage

Si le disponible est insuffisant, un utilisateur autorisé peut "forcer" l'imputation avec justification :

```typescript
interface ImputationData {
  // ...
  forcer_imputation: boolean;
  justification_depassement: string;
}
```

---

## 6. Hooks React

### 6.1 Hook principal : `useImputation`

| Export | Type | Description |
|--------|------|-------------|
| `objectifsStrategiques` | `OS[]` | Liste des OS |
| `missions` | `Mission[]` | Liste des missions |
| `directions` | `Direction[]` | Liste des directions |
| `nomenclaturesNBE` | `NBE[]` | Nomenclature budgétaire |
| `planComptableSYSCO` | `SYSCO[]` | Plan comptable |
| `fetchActions` | `function` | Charger actions (dépend mission/OS) |
| `fetchActivites` | `function` | Charger activités (dépend action) |
| `fetchSousActivites` | `function` | Charger sous-activités |
| `calculateAvailability` | `function` | Calculer disponibilité |
| `buildImputationCode` | `function` | Construire code imputation |
| `imputeNote` | `function` | Exécuter l'imputation |
| `isImputing` | `boolean` | État en cours |

### 6.2 Fichiers sources

```
src/hooks/useImputation.ts     # Hook principal (~489 lignes)
```

---

## 7. Pages et Composants

### 7.1 Pages

| Route | Composant | Description |
|-------|-----------|-------------|
| `/imputation` | `Imputation.tsx` | Page d'imputation |

### 7.2 Composants

| Composant | Description |
|-----------|-------------|
| `ImputationForm.tsx` | Formulaire complet (~605 lignes) |
| `ImputationList.tsx` | Liste des imputations |

### 7.3 Arborescence

```
src/
├── pages/
│   └── execution/
│       └── Imputation.tsx
└── components/
    └── imputation/
        ├── ImputationForm.tsx
        └── ImputationList.tsx
```

---

## 8. Création automatique du Dossier

### 8.1 Lors de l'imputation

```typescript
const imputeNote = async (data: ImputationData) => {
  // 1. Créer le dossier
  const { data: dossier } = await supabase
    .from("dossiers")
    .insert({
      note_id: data.noteId,
      budget_line_id: budgetLineId,
      montant_initial: data.montant,
      statut_global: "en_cours",
      exercice: exercice,
    })
    .select()
    .single();

  // 2. Créer l'étape d'imputation
  await supabase
    .from("dossier_etapes")
    .insert({
      dossier_id: dossier.id,
      etape: "imputation",
      statut: "valide",
      montant: data.montant,
      validated_at: new Date().toISOString(),
    });

  // 3. Mettre à jour la note
  await supabase
    .from("notes_dg")
    .update({ statut: "impute" })
    .eq("id", data.noteId);

  return { dossier };
};
```

---

## 9. Sécurité (RLS)

### 9.1 Qui peut imputer ?

- Rôle `CB` (Contrôleur Budgétaire) : principal acteur
- Rôle `ADMIN` : accès complet

```sql
CREATE POLICY "cb_can_impute" ON notes_dg
FOR UPDATE USING (
  has_role(auth.uid(), 'CB') 
  OR has_role(auth.uid(), 'ADMIN')
);
```

---

## 10. API Supabase - Exemples

### 10.1 Récupérer les données pour le formulaire

```typescript
// Charger tous les référentiels en parallèle
const [os, missions, directions, nbe, sysco] = await Promise.all([
  supabase.from("objectifs_strategiques").select("*").eq("est_active", true),
  supabase.from("missions").select("*").eq("est_active", true),
  supabase.from("directions").select("*").eq("est_active", true),
  supabase.from("nomenclature_nbe").select("*"),
  supabase.from("plan_comptable_sysco").select("*"),
]);
```

### 10.2 Charger les actions filtrées

```typescript
const { data: actions } = await supabase
  .from("actions")
  .select("id, code, libelle")
  .eq("est_active", true)
  .or(`mission_id.eq.${missionId},os_id.eq.${osId}`);
```

---

## 11. Intégration avec autres modules

### 11.1 Entrées

| Module source | Données reçues |
|---------------|----------------|
| Notes AEF | Note validée avec montant estimé |

### 11.2 Sorties

| Module cible | Données envoyées |
|--------------|------------------|
| Dossiers | Dossier créé avec référence note |
| Budget Lines | Réservation prévisionnelle |
| Marchés | Dossier ID pour rattachement |

---

## 12. Points ouverts / TODOs

- [ ] Validation multi-niveaux avant imputation
- [ ] Alertes si seuil budgétaire atteint
- [ ] Historique des imputations modifiées
- [ ] Annulation d'imputation (avec conditions)
- [ ] Suggestion automatique de ligne budgétaire

---

## 13. Changelog

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-01-15 | 1.0 | Documentation initiale |
