# Guide de Codification SYGFP -- Systeme de References ARTI

> **Reference definitive sur la codification des documents SYGFP**
> Version: 2.0 | Derniere mise a jour: 2026-04-13

---

## 1. Vue d'ensemble

Le SYGFP utilise un systeme de codification unifie herite de l'ancien systeme SQL Server de l'ARTI. Chaque document de la chaine de depense recoit une reference unique au format ARTI.

---

## 2. Format Pivot ARTI

### 2.1 Format actuel (14 caracteres)

```
ARTI + {code_etape:2 chiffres} + {mois:2 chiffres} + {annee:2 chiffres} + {sequence:4 chiffres}
```

Exemples detailles pour chaque etape :

| Reference        | Etape                     | Mois      | Annee | Sequence | Decomposition              |
| ---------------- | ------------------------- | --------- | ----- | -------- | -------------------------- |
| `ARTI0001260001` | Note SEF (etape 00)       | janvier   | 2026  | n.1      | ARTI + 00 + 01 + 26 + 0001 |
| `ARTI0102260005` | Note AEF (etape 01)       | fevrier   | 2026  | n.5      | ARTI + 01 + 02 + 26 + 0005 |
| `ARTI0203260012` | Imputation (etape 02)     | mars      | 2026  | n.12     | ARTI + 02 + 03 + 26 + 0012 |
| `ARTI0304260003` | Expr. Besoin (etape 03)   | avril     | 2026  | n.3      | ARTI + 03 + 04 + 26 + 0003 |
| `ARTI0404260001` | Passation (etape 04)      | avril     | 2026  | n.1      | ARTI + 04 + 04 + 26 + 0001 |
| `ARTI0505260008` | Engagement (etape 05)     | mai       | 2026  | n.8      | ARTI + 05 + 05 + 26 + 0008 |
| `ARTI0606260020` | Liquidation (etape 06)    | juin      | 2026  | n.20     | ARTI + 06 + 06 + 26 + 0020 |
| `ARTI0707260015` | Ordonnancement (etape 07) | juillet   | 2026  | n.15     | ARTI + 07 + 07 + 26 + 0015 |
| `ARTI0808260001` | Reglement (etape 08)      | aout      | 2026  | n.1      | ARTI + 08 + 08 + 26 + 0001 |
| `ARTI0909260002` | Virement (etape 09)       | septembre | 2026  | n.2      | ARTI + 09 + 09 + 26 + 0002 |

### 2.2 Format legacy (13 caracteres -- ancien SQL Server)

```
ARTI + {code_etape:1 chiffre} + {mois:2} + {annee:2} + {sequence:4}
```

Exemple : `ARTI001260001` = SEF, janvier 2026, n.1

Note : Ce format est encore present dans les donnees migrees.

---

## 3. Les 10 codes d'etape de la chaine de depense

| Code   | Etape             | Sigle | Description                                   | Table Supabase      | Colonne reference        |
| ------ | ----------------- | ----- | --------------------------------------------- | ------------------- | ------------------------ |
| 0 (00) | Note SEF          | SEF   | Accord de principe sans effet financier       | notes_sef           | numero / reference_pivot |
| 1 (01) | Note AEF          | AEF   | Note avec effet financier (Note DG)           | notes_dg            | numero / reference_pivot |
| 2 (02) | Imputation        | IMP   | Imputation budgetaire (affectation ligne)     | imputations         | reference                |
| 3 (03) | Expression Besoin | EB    | Expression des besoins en biens/services      | expressions_besoin  | numero                   |
| 4 (04) | Passation Marche  | PM    | Procedure de passation de marche public       | passation_marche    | reference                |
| 5 (05) | Engagement        | ENG   | Engagement juridique de la depense            | budget_engagements  | numero                   |
| 6 (06) | Liquidation       | LIQ   | Verification du service fait + calcul fiscal  | budget_liquidations | numero                   |
| 7 (07) | Ordonnancement    | ORD   | Ordre de payer emis par l'ordonnateur         | ordonnancements     | numero                   |
| 8 (08) | Reglement         | REG   | Paiement effectif au beneficiaire             | reglements          | numero                   |
| 9 (09) | Virement credit   | VIR   | Transfert de credits entre lignes budgetaires | credit_transfers    | reference (a creer)      |

---

## 4. Mecanisme de generation

### 4.1 Table des compteurs : `arti_reference_counters`

```sql
CREATE TABLE arti_reference_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etape INTEGER NOT NULL CHECK (etape BETWEEN 0 AND 99),
  mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee INTEGER NOT NULL CHECK (annee BETWEEN 2020 AND 2099),
  dernier_numero INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (etape, mois, annee)
);
```

Le compteur est **par mois + etape**. Il se reinitialise a 1 chaque nouveau mois.

### 4.2 Fonction SQL : `generate_arti_reference()`

```sql
generate_arti_reference(p_etape INTEGER, p_date TIMESTAMPTZ DEFAULT now())
RETURNS TEXT
```

- SECURITY DEFINER, search_path = public
- Utilise INSERT ON CONFLICT DO UPDATE (UPSERT atomique)
- Maximum 9999 documents par mois/etape
- Concurrence : safe grace au UPSERT PostgreSQL

### 4.3 Triggers par module

| Module | Trigger                                          | Moment de generation                            |
| ------ | ------------------------------------------------ | ----------------------------------------------- |
| SEF    | submit_note_sef_with_reference() RPC             | A la soumission                                 |
| AEF    | trg_notes_dg_arti_reference (BEFORE INSERT)      | A l'insertion                                   |
| IMP    | trg_imputation_arti_reference (BEFORE INSERT)    | A l'insertion                                   |
| EB     | Trigger BEFORE INSERT                            | A l'insertion                                   |
| PM     | trg_generate_passation_reference (BEFORE INSERT) | A l'insertion                                   |
| ENG    | trg_unified_ref_engagements (BEFORE INSERT)      | A l'insertion                                   |
| LIQ    | A migrer vers generate_arti_reference(6)         | Actuellement via get_next_sequence              |
| ORD    | A migrer vers generate_arti_reference(7)         | Actuellement via generate_ordonnancement_numero |
| REG    | A migrer vers generate_arti_reference(8)         | Actuellement via trigger etape 4 (bug)          |
| VIR    | A creer                                          | Aucun actuellement                              |

---

## 5. Code d'imputation budgetaire (18 chiffres)

Independant de la reference ARTI, le code d'imputation identifie la ligne budgetaire :

```
{OS:2}-{Action:2}-{Activite:3}-{SousActivite:3}-{Direction:2}-{NBE:6}
```

Exemple : `11-02-402-020-52-612900`

Structure programmatique :

```
Objectif Strategique (OS) -- 2 chiffres
  +-- Mission -- variable
      +-- Action -- 2 chiffres
          +-- Activite -- 3 chiffres
              +-- Sous-Activite -- 3 chiffres
                  +-- Direction -- 2 chiffres
                      +-- Nature Economique (NBE) -- 6 chiffres
                          +-- SYSCO (Plan comptable) -- variable
```

204 lignes d'imputation budgetaire dans le referentiel ARTI.

---

## 6. Nomenclature NBE (Nature Budgetaire Economique)

| Classe | Nature                                                                  |
| ------ | ----------------------------------------------------------------------- |
| 21xxxx | Immobilisations incorporelles                                           |
| 22xxxx | Terrains                                                                |
| 23xxxx | Batiments                                                               |
| 24xxxx | Materiel et equipements                                                 |
| 61xxxx | Services exterieurs                                                     |
| 62xxxx | Autres services exterieurs (locations, entretien, assurances, missions) |
| 63xxxx | Impots et taxes                                                         |
| 64xxxx | Charges de personnel                                                    |
| 65xxxx | Gestion courante                                                        |
| 66xxxx | Charges financieres                                                     |
| 67xxxx | Interets et frais                                                       |

---

## 7. Autres formats de reference

| Type        | Format                 | Exemple          |
| ----------- | ---------------------- | ---------------- |
| Prestataire | PREST-{YYYY}-{NNNN}    | PREST-2026-0042  |
| Contrat     | CTR-{YYYY}-{NNNN}      | CTR-2026-0015    |
| Dossier     | DOS-{YYYY}-{MM}-{NNNN} | DOS-2026-02-0001 |
| Facture     | FAC-{YYYY}-{NNNN}      | FAC-2026-0127    |

---

## 8. Affichage frontend

### Composant : ARTIReferenceBadge

```
Format badge (long) : ARTI-00-02/26-0001
Format inline (court) : SEF-02/26-0001
```

### Service : referenceService.ts

```typescript
ETAPE_CODES = {
  SEF: 0,
  AEF: 1,
  IMPUTATION: 2,
  EXPRESSION_BESOIN: 3,
  PASSATION_MARCHE: 4,
  ENGAGEMENT: 5,
  LIQUIDATION: 6,
  ORDONNANCEMENT: 7,
  REGLEMENT: 8,
  VIREMENT: 9,
};
```

---

## 9. Donnees migrees (SQL Server vers Supabase)

| Source SQL Server     | Volume  | Format ancien              | Format Supabase                     |
| --------------------- | ------- | -------------------------- | ----------------------------------- |
| NoteDG vers notes_sef | 4 827   | ARTI0MMYYNNNN              | MIG-YYYY-NNNNNN / NNNN-YYYY-DIR-XXX |
| Engagement            | 3 151   | ARTI1MMYYNNNN              | MIG-ARTI10MMYYNNNN                  |
| Liquidation           | 2 960   | ID IDENTITY (ex: 40674895) | LIQ-2026-NNNN                       |
| Ordonnancement        | 2 727   | ARTI3MMYYNNNN              | ORD-2026-NNNN                       |
| Fournisseurs          | 422-456 | Code interne (401xxx)      | PREST-YYYY-NNNN                     |

Flag de migration : `legacy_import = true` ou `is_migrated = true`

---

## 10. Migration prevue vers format unifie

Les modules Liquidation, Ordonnancement et Reglement utilisent encore l'ancien format PREFIX-YYYY-NNNN. La migration vers le format ARTI unifie est planifiee pour aligner les 10 etapes sur le meme systeme de compteurs.

---

_Documentation reecrite le 2026-04-13_
