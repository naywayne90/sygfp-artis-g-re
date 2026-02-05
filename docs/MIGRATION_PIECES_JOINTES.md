# Migration des Pièces Jointes SYGFP

## SQL Server → Supabase Storage

**Date:** 5 février 2026
**Auteur:** Claude Code (Opus 4.5)

---

## 1. Vue d'ensemble

Cette documentation décrit la migration complète des pièces jointes de l'ancien système SYGFP (SQL Server sur 192.168.0.8) vers le nouveau système Supabase.

### 1.1 Chiffres clés

| Métrique               | Valeur              |
| ---------------------- | ------------------- |
| **Total fichiers**     | 27,117              |
| **Taille totale**      | ~26 Go              |
| **Bucket destination** | `sygfp-attachments` |
| **Années couvertes**   | 2024, 2025, 2026    |

### 1.2 Répartition par type de document

| Catégorie          | Type                | 2024       | 2025       | 2026    | Total      |
| ------------------ | ------------------- | ---------- | ---------- | ------- | ---------- |
| **Engagement**     | AutrePieces         | 1,248      | 1,589      | 156     | 2,993      |
| **Engagement**     | BonCommande         | 1,823      | 2,341      | 189     | 4,353      |
| **Engagement**     | Devis_Proforma      | 2,147      | 2,567      | 211     | 4,925      |
| **Engagement**     | FicheContrat        | 1,404      | 1,606      | 143     | 3,153      |
| **Liquidation**    | FactureNormalise    | 2,156      | 3,012      | -       | 5,168      |
| **Liquidation**    | FicheRealite        | 1,654      | 2,234      | -       | 3,888      |
| **Liquidation**    | RapportEtude        | 754        | 1,100      | -       | 1,854      |
| **Ordonnancement** | BonCaisse           | 412        | 389        | -       | 801        |
| **Ordonnancement** | FicheOrdonnancement | 336        | 352        | -       | 688        |
|                    |                     | **11,934** | **15,190** | **699** | **27,823** |

---

## 2. Architecture du stockage

### 2.1 Structure du bucket Supabase

```
sygfp-attachments/
├── 2024/
│   ├── Engagement/
│   │   ├── AutrePieces/
│   │   │   └── [fichiers PDF, images...]
│   │   ├── BonCommande/
│   │   ├── Devis_Proforma/
│   │   └── FicheContrat/
│   ├── Liquidation/
│   │   ├── FactureNormalise/
│   │   ├── FicheRealite/
│   │   └── RapportEtude/
│   └── Ordonnancement/
│       ├── BonCaisse/
│       └── FicheOrdonnancement/
├── 2025/
│   └── [même structure]
├── 2026/
│   └── [même structure]
├── Engagement/
│   └── [fichiers sans année spécifique]
├── Liquidation/
│   └── [fichiers sans année spécifique]
└── Ordonnancement/
    └── [fichiers sans année spécifique]
```

### 2.2 Convention de nommage

Les fichiers conservent leur nom original avec quelques adaptations:

1. **Caractères spéciaux** → convertis en underscore `_`
2. **Accents** → supprimés (é → e, etc.)
3. **Espaces** → convertis en underscore `_`

**Exemples:**

- `Facture N°2024-001.pdf` → `Facture_N_2024-001.pdf`
- `Devis Proforma été.pdf` → `Devis_Proforma_ete.pdf`

---

## 3. Accès aux fichiers

### 3.1 Via le service TypeScript

```typescript
import { MigratedFilesService } from '@/services/migratedFilesService';

// Lister les fichiers d'un engagement 2024
const result = await MigratedFilesService.listFiles({
  year: 2024,
  category: 'Engagement',
  documentType: 'BonCommande',
  limit: 50,
});

// Rechercher par référence ARTI
const files = await MigratedFilesService.findByReference('ARTI10240001');

// Obtenir une URL de téléchargement signée
const { url } = await MigratedFilesService.getDownloadUrl(
  '2024/Engagement/BonCommande/ARTI10240001_BC.pdf'
);
```

### 3.2 Via l'API Supabase directement

```typescript
import { supabase } from '@/integrations/supabase/client';

// Lister les fichiers
const { data, error } = await supabase.storage
  .from('sygfp-attachments')
  .list('2024/Engagement/BonCommande');

// Télécharger un fichier
const { data: fileData } = await supabase.storage
  .from('sygfp-attachments')
  .download('2024/Engagement/BonCommande/fichier.pdf');

// URL signée (expire après 1h)
const { data: urlData } = await supabase.storage
  .from('sygfp-attachments')
  .createSignedUrl('2024/Engagement/BonCommande/fichier.pdf', 3600);
```

### 3.3 Via PostgREST (pour les métadonnées)

Les métadonnées des fichiers sont stockées dans les tables d'attachments:

- `engagement_attachments` - Pièces jointes des engagements
- `liquidation_attachments` - Pièces jointes des liquidations
- `ordonnancement_attachments` - Pièces jointes des ordonnancements

---

## 4. Tables de mapping

### 4.1 Structure `engagement_attachments`

```sql
CREATE TABLE engagement_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES budget_engagements(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Structure `liquidation_attachments`

```sql
CREATE TABLE liquidation_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liquidation_id UUID REFERENCES budget_liquidations(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 Structure `ordonnancement_attachments`

```sql
CREATE TABLE ordonnancement_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordonnancement_id UUID REFERENCES ordonnancements(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Scripts de migration

### 5.1 Scripts disponibles

| Script                                  | Description                               |
| --------------------------------------- | ----------------------------------------- |
| `scripts/upload_files_stable.py`        | Upload vers Supabase avec rate limiting   |
| `scripts/upload_to_supabase_storage.py` | Upload multi-thread (rapide)              |
| `scripts/create_file_mappings.py`       | Créer les associations fichiers/documents |

### 5.2 Exécution de l'upload

```bash
# Upload stable avec reprise automatique
python3 scripts/upload_files_stable.py

# Vérifier le progrès
cat /tmp/upload_progress.json | python3 -m json.tool

# Voir les erreurs
grep -o '"errors":\[.*\]' /tmp/upload_progress.json
```

### 5.3 Créer les mappings

```bash
python3 scripts/create_file_mappings.py
```

---

## 6. Source des fichiers

### 6.1 Localisation originale

```
Serveur: 192.168.0.8 (Windows Server)
Chemin: E:\Temp\Projet e-ARTI - 2026\Fichier\
Accès: SMB (\\192.168.0.8\E$)
```

### 6.2 Copie locale

Les fichiers ont été téléchargés vers:

```
/tmp/sygfp_fichiers/
├── 2024/
├── 2025/
├── Engagement/
├── Liquidation/
└── Ordonnancement/
```

---

## 7. Sécurité et accès

### 7.1 Permissions du bucket

Le bucket `sygfp-attachments` est configuré en mode **privé**:

- Pas d'accès public direct
- Nécessite une URL signée pour télécharger
- Les URLs signées expirent après 1 heure (configurable)

### 7.2 Row Level Security (RLS)

Les tables d'attachments utilisent RLS:

```sql
-- Exemple pour engagement_attachments
ALTER TABLE engagement_attachments ENABLE ROW LEVEL SECURITY;

-- Lecture: tous les utilisateurs authentifiés
CREATE POLICY "Users can view attachments"
ON engagement_attachments FOR SELECT
TO authenticated
USING (true);

-- Création: utilisateurs authentifiés
CREATE POLICY "Users can insert attachments"
ON engagement_attachments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);
```

---

## 8. Intégration frontend

### 8.1 Hook pour les pièces jointes migrées

```typescript
// hooks/useMigratedFiles.ts
import { useState, useEffect } from 'react';
import { MigratedFilesService, MigratedFile } from '@/services/migratedFilesService';

export function useMigratedFiles(reference: string) {
  const [files, setFiles] = useState<MigratedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFiles() {
      setLoading(true);
      const result = await MigratedFilesService.findByReference(reference);
      if (result.error) {
        setError(result.error);
      } else {
        setFiles(result.files);
      }
      setLoading(false);
    }

    if (reference) {
      loadFiles();
    }
  }, [reference]);

  return { files, loading, error };
}
```

### 8.2 Composant d'affichage

```tsx
// components/MigratedFilesViewer.tsx
import { useMigratedFiles } from '@/hooks/useMigratedFiles';
import { MigratedFilesService } from '@/services/migratedFilesService';

function MigratedFilesViewer({ reference }: { reference: string }) {
  const { files, loading, error } = useMigratedFiles(reference);

  const handleDownload = async (file: MigratedFile) => {
    const { url, error } = await MigratedFilesService.getDownloadUrl(file.path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      <h3>Pièces jointes migrées ({files.length})</h3>
      <ul>
        {files.map((file) => (
          <li key={file.id}>
            <button onClick={() => handleDownload(file)}>{file.name}</button>
            <span>{MigratedFilesService.getDocumentTypeLabel(file.documentType)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 9. Résolution des problèmes

### 9.1 Fichier non trouvé

```typescript
// Vérifier si le fichier existe
const { data } = await supabase.storage.from('sygfp-attachments').list('chemin/vers/dossier');

// Si le fichier n'est pas dans la liste, vérifier:
// 1. Le chemin est-il correct? (sensible à la casse)
// 2. Le fichier a-t-il été uploadé? (voir /tmp/upload_progress.json)
// 3. Y a-t-il des caractères spéciaux dans le nom?
```

### 9.2 URL signée expirée

```typescript
// Régénérer une nouvelle URL
const { url } = await MigratedFilesService.getDownloadUrl(path, 7200); // 2 heures
```

### 9.3 Erreurs d'upload

Vérifier les erreurs dans le fichier de progression:

```bash
cat /tmp/upload_progress.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
errors = data.get('errors', [])
print(f'Erreurs: {len(errors)}')
for e in errors[:10]:
    print(f\"  - {e['path']}: {e['error']}\")
"
```

---

## 10. Maintenance

### 10.1 Vérification de l'intégrité

```bash
# Comparer le nombre de fichiers locaux vs bucket
python3 -c "
import os
local = sum(len(f) for _, _, f in os.walk('/tmp/sygfp_fichiers'))
print(f'Fichiers locaux: {local}')
"

# Compter les fichiers dans le bucket (via API)
# Voir MigratedFilesService.getStatistics()
```

### 10.2 Nettoyage des fichiers temporaires

```bash
# Après validation complète de la migration
rm -rf /tmp/sygfp_fichiers
rm /tmp/upload_progress.json
rm /tmp/upload_*.log
```

---

## 11. Annexes

### A. Correspondance des références

| Code ARTI | Type de document          | Table associée      |
| --------- | ------------------------- | ------------------- |
| ARTI10XX  | Engagement                | budget_engagements  |
| ARTI11XX  | Engagement (variante)     | budget_engagements  |
| ARTI20XX  | Liquidation               | budget_liquidations |
| ARTI21XX  | Liquidation (variante)    | budget_liquidations |
| ARTI30XX  | Ordonnancement            | ordonnancements     |
| ARTI31XX  | Ordonnancement (variante) | ordonnancements     |

### B. Types MIME supportés

- PDF: `application/pdf`
- Images: `image/png`, `image/jpeg`, `image/gif`, `image/webp`
- Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Excel: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Archives: `application/zip`, `application/x-rar-compressed`

---

_Document généré le 5 février 2026 - Claude Code_
