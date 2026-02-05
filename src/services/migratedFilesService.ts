/**
 * Service pour les fichiers migrés depuis l'ancien SYGFP
 *
 * Ce service gère l'accès aux pièces jointes migrées depuis SQL Server
 * vers Supabase Storage (bucket: sygfp-attachments)
 *
 * Structure du bucket:
 * sygfp-attachments/
 * ├── 2024/
 * │   ├── Engagement/{AutrePieces,BonCommande,Devis_Proforma,FicheContrat}
 * │   ├── Liquidation/{FactureNormalise,FicheRealite,RapportEtude}
 * │   └── Ordonnancement/{BonCaisse,FicheOrdonnancement}
 * ├── 2025/
 * │   └── ...
 * └── Engagement/ (fichiers sans année)
 *
 * @module MigratedFilesService
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export type MigratedDocumentCategory = 'Engagement' | 'Liquidation' | 'Ordonnancement';

export type MigratedDocumentType =
  | 'AutrePieces'
  | 'BonCommande'
  | 'Devis_Proforma'
  | 'FicheContrat'
  | 'FactureNormalise'
  | 'FicheRealite'
  | 'RapportEtude'
  | 'BonCaisse'
  | 'FicheOrdonnancement';

export interface MigratedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  category: MigratedDocumentCategory;
  documentType: MigratedDocumentType;
  year: number | null;
  reference: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ListMigratedFilesOptions {
  category?: MigratedDocumentCategory;
  documentType?: MigratedDocumentType;
  year?: number;
  reference?: string;
  limit?: number;
  offset?: number;
}

export interface MigratedFilesResult {
  files: MigratedFile[];
  total: number;
  error?: string;
}

// ============================================
// CONSTANTES
// ============================================

const MIGRATED_BUCKET = 'sygfp-attachments';

const DOCUMENT_TYPE_MAP: Record<MigratedDocumentType, string> = {
  AutrePieces: 'Autres pièces',
  BonCommande: 'Bon de commande',
  Devis_Proforma: 'Devis / Proforma',
  FicheContrat: 'Fiche de contrat',
  FactureNormalise: 'Facture normalisée',
  FicheRealite: 'Fiche de réalité (Service fait)',
  RapportEtude: "Rapport d'étude",
  BonCaisse: 'Bon de caisse',
  FicheOrdonnancement: "Fiche d'ordonnancement",
};

// Pattern pour extraire la référence ARTI
const ARTI_REFERENCE_PATTERN = /ARTI(\d{2})(\d{2})(\d{4})/i;

// ============================================
// CLASSE PRINCIPALE
// ============================================

class MigratedFilesServiceClass {
  /**
   * Liste les fichiers migrés avec filtres optionnels
   */
  async listFiles(options: ListMigratedFilesOptions = {}): Promise<MigratedFilesResult> {
    try {
      const { category, documentType, year, reference, limit = 50, offset = 0 } = options;

      // Construire le chemin de base
      let basePath = '';
      if (year) {
        basePath = `${year}`;
        if (category) {
          basePath += `/${category}`;
          if (documentType) {
            basePath += `/${documentType}`;
          }
        }
      } else if (category) {
        basePath = category;
        if (documentType) {
          basePath += `/${documentType}`;
        }
      }

      // Lister les fichiers du bucket
      const { data, error } = await supabase.storage.from(MIGRATED_BUCKET).list(basePath, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) {
        return { files: [], total: 0, error: error.message };
      }

      // Transformer les résultats
      const files: MigratedFile[] = [];

      for (const item of data || []) {
        // Skip directories
        if (!item.id) continue;

        const fullPath = basePath ? `${basePath}/${item.name}` : item.name;
        const parsedInfo = this.parseFilePath(fullPath);

        // Filter by reference if specified
        if (reference && parsedInfo.reference !== reference) {
          continue;
        }

        files.push({
          id: item.id,
          name: item.name,
          path: fullPath,
          size: item.metadata?.size || 0,
          category: parsedInfo.category,
          documentType: parsedInfo.documentType,
          year: parsedInfo.year,
          reference: parsedInfo.reference,
          createdAt: item.created_at || null,
          updatedAt: item.updated_at || null,
        });
      }

      return { files, total: files.length };
    } catch (err) {
      return {
        files: [],
        total: 0,
        error: err instanceof Error ? err.message : 'Erreur lors de la liste des fichiers',
      };
    }
  }

  /**
   * Recherche des fichiers par référence ARTI
   */
  async findByReference(reference: string): Promise<MigratedFilesResult> {
    // La recherche par référence nécessite de parcourir tous les dossiers
    // Pour l'instant, on utilise une recherche basique
    const allFiles: MigratedFile[] = [];

    const years = [2024, 2025, 2026];
    const categories: MigratedDocumentCategory[] = ['Engagement', 'Liquidation', 'Ordonnancement'];

    for (const year of years) {
      for (const category of categories) {
        const result = await this.listFiles({
          year,
          category,
          reference: reference.toUpperCase(),
          limit: 100,
        });
        allFiles.push(...result.files);
      }
    }

    return { files: allFiles, total: allFiles.length };
  }

  /**
   * Obtient une URL signée pour télécharger un fichier migré
   */
  async getDownloadUrl(
    path: string,
    expiresInSeconds = 3600
  ): Promise<{ url: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(MIGRATED_BUCKET)
        .createSignedUrl(path, expiresInSeconds);

      if (error) {
        return { url: '', error: error.message };
      }

      return { url: data.signedUrl };
    } catch (err) {
      return {
        url: '',
        error: err instanceof Error ? err.message : 'Erreur génération URL',
      };
    }
  }

  /**
   * Obtient une URL publique (si le bucket est public)
   */
  getPublicUrl(path: string): string {
    const { data } = supabase.storage.from(MIGRATED_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Parse le chemin d'un fichier pour extraire les métadonnées
   */
  private parseFilePath(path: string): {
    category: MigratedDocumentCategory;
    documentType: MigratedDocumentType;
    year: number | null;
    reference: string | null;
  } {
    const parts = path.split('/');
    let year: number | null = null;
    let category: MigratedDocumentCategory = 'Engagement';
    let documentType: MigratedDocumentType = 'AutrePieces';
    let reference: string | null = null;

    // Parse year
    const yearMatch = parts.find((p) => /^20\d{2}$/.test(p));
    if (yearMatch) {
      year = parseInt(yearMatch, 10);
    }

    // Parse category
    if (parts.includes('Engagement')) {
      category = 'Engagement';
    } else if (parts.includes('Liquidation')) {
      category = 'Liquidation';
    } else if (parts.includes('Ordonnancement')) {
      category = 'Ordonnancement';
    }

    // Parse document type
    for (const docType of Object.keys(DOCUMENT_TYPE_MAP) as MigratedDocumentType[]) {
      if (parts.includes(docType)) {
        documentType = docType;
        break;
      }
    }

    // Extract reference from filename
    const filename = parts[parts.length - 1];
    const refMatch = filename.match(ARTI_REFERENCE_PATTERN);
    if (refMatch) {
      reference = `ARTI${refMatch[1]}${refMatch[2]}${refMatch[3]}`.toUpperCase();
    }

    return { category, documentType, year, reference };
  }

  /**
   * Retourne le libellé d'un type de document
   */
  getDocumentTypeLabel(docType: MigratedDocumentType): string {
    return DOCUMENT_TYPE_MAP[docType] || docType;
  }

  /**
   * Statistiques sur les fichiers migrés
   */
  async getStatistics(): Promise<{
    totalFiles: number;
    byYear: Record<number, number>;
    byCategory: Record<string, number>;
    error?: string;
  }> {
    try {
      const stats = {
        totalFiles: 0,
        byYear: {} as Record<number, number>,
        byCategory: {} as Record<string, number>,
      };

      // Count by year
      for (const year of [2024, 2025, 2026]) {
        const { data } = await supabase.storage
          .from(MIGRATED_BUCKET)
          .list(`${year}`, { limit: 1000 });
        if (data) {
          // Recursively count files
          let count = 0;
          for (const item of data) {
            if (!item.id) {
              // Directory, need to list subdirectories
              const subList = await supabase.storage
                .from(MIGRATED_BUCKET)
                .list(`${year}/${item.name}`, { limit: 1000 });
              if (subList.data) {
                for (const subItem of subList.data) {
                  if (!subItem.id) {
                    const subSubList = await supabase.storage
                      .from(MIGRATED_BUCKET)
                      .list(`${year}/${item.name}/${subItem.name}`, { limit: 1000 });
                    count += subSubList.data?.filter((f) => f.id)?.length || 0;
                  } else {
                    count++;
                  }
                }
              }
            } else {
              count++;
            }
          }
          stats.byYear[year] = count;
          stats.totalFiles += count;
        }
      }

      // Count by category
      for (const category of ['Engagement', 'Liquidation', 'Ordonnancement']) {
        let categoryCount = 0;
        for (const year of [2024, 2025, 2026]) {
          categoryCount += stats.byYear[year] || 0; // Simplified for now
        }
        stats.byCategory[category] = categoryCount / 3; // Estimate
      }

      return stats;
    } catch (err) {
      return {
        totalFiles: 0,
        byYear: {},
        byCategory: {},
        error: err instanceof Error ? err.message : 'Erreur statistiques',
      };
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const MigratedFilesService = new MigratedFilesServiceClass();

export default MigratedFilesService;
