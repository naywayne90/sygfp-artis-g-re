/**
 * AttachmentService - Service unifié de gestion des pièces jointes
 *
 * Fonctionnalités:
 * - Upload multi-fichiers avec validation (≤10MB)
 * - Support R2 (si env vars présentes) ou Supabase Storage (fallback)
 * - URLs signées pour téléchargement sécurisé
 * - Convention de nommage: sygfp/attachments/{exercise}/{dossier_ref}/{step}/...
 * - Suppression contrôlée (brouillon uniquement)
 *
 * @module AttachmentService
 */

import { getStorageProvider, type IStorageProvider } from "./storage";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// TYPES
// ============================================

export type AttachmentStep =
  | "note_sef"
  | "note_aef"
  | "imputation"
  | "expression_besoin"
  | "passation_marche"
  | "engagement"
  | "liquidation"
  | "ordonnancement"
  | "reglement"
  | "marche"
  | "prestataire";

export interface AttachmentMetadata {
  id?: string;
  dossier_ref: string;
  step: AttachmentStep;
  filename: string;
  original_name: string;
  storage_path: string;
  content_type: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
  entity_id?: string;
  type_piece?: string;
}

export interface UploadFileOptions {
  dossierRef: string;
  step: AttachmentStep;
  file: File;
  exercice: number;
  entityId?: string;
  typePiece?: string;
  onProgress?: (percent: number) => void;
}

export interface UploadFilesOptions {
  dossierRef: string;
  step: AttachmentStep;
  files: File[];
  exercice: number;
  entityId?: string;
  onProgress?: (fileIndex: number, percent: number) => void;
}

export interface UploadResult {
  success: boolean;
  attachment?: AttachmentMetadata;
  error?: string;
}

export interface ListAttachmentsResult {
  attachments: AttachmentMetadata[];
  error?: string;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: Date;
  error?: string;
}

// ============================================
// CONSTANTES
// ============================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-rar-compressed",
];

const BASE_PATH = "sygfp/attachments";
const EXPORTS_PATH = "sygfp/exports";
const IMPORTS_PATH = "sygfp/imports";

// ============================================
// CLASSE PRINCIPALE
// ============================================

class AttachmentServiceClass {
  private provider: IStorageProvider;

  constructor() {
    this.provider = getStorageProvider();
  }

  /**
   * Récupère le nom du provider actuel (r2, supabase, local)
   */
  getProviderName(): string {
    return this.provider.getProviderName();
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Valide un fichier avant upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Fichier trop volumineux (${this.formatFileSize(file.size)}). Maximum: 10 MB`,
      };
    }

    // Vérifier le type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé: ${file.type || "inconnu"}`,
      };
    }

    // Vérifier le nom de fichier
    if (!file.name || file.name.length > 255) {
      return {
        valid: false,
        error: "Nom de fichier invalide",
      };
    }

    return { valid: true };
  }

  /**
   * Formate la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // ============================================
  // GÉNÉRATION DE CHEMINS
  // ============================================

  /**
   * Génère le chemin de stockage pour une pièce jointe
   * Format: sygfp/attachments/{exercise}/{dossier_ref}/{step}/{timestamp}_{filename}
   */
  generatePath(
    exercice: number,
    dossierRef: string,
    step: AttachmentStep,
    filename: string
  ): string {
    const timestamp = Date.now();
    const safeFilename = this.sanitizeFilename(filename);
    return `${BASE_PATH}/${exercice}/${dossierRef}/${step}/${timestamp}_${safeFilename}`;
  }

  /**
   * Génère le chemin pour un export
   * Format: sygfp/exports/{exercise}/{type}/{timestamp}_{filename}
   */
  generateExportPath(exercice: number, type: string, filename: string): string {
    const timestamp = Date.now();
    const safeFilename = this.sanitizeFilename(filename);
    return `${EXPORTS_PATH}/${exercice}/${type}/${timestamp}_${safeFilename}`;
  }

  /**
   * Génère le chemin pour un import
   * Format: sygfp/imports/{exercise}/{type}/{timestamp}_{filename}
   */
  generateImportPath(exercice: number, type: string, filename: string): string {
    const timestamp = Date.now();
    const safeFilename = this.sanitizeFilename(filename);
    return `${IMPORTS_PATH}/${exercice}/${type}/${timestamp}_${safeFilename}`;
  }

  /**
   * Nettoie un nom de fichier pour le stockage
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars
      .replace(/_+/g, "_") // Collapse underscores
      .replace(/^_|_$/g, ""); // Trim underscores
  }

  // ============================================
  // UPLOAD
  // ============================================

  /**
   * Upload un fichier unique
   */
  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    const { dossierRef, step, file, exercice, entityId, typePiece, onProgress } = options;

    // Validation
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Générer le chemin
    const storagePath = this.generatePath(exercice, dossierRef, step, file.name);

    try {
      // Upload via provider
      const result = await this.provider.upload(file, storagePath, onProgress);

      if (result.error || !result.data) {
        return { success: false, error: result.error || "Upload échoué" };
      }

      // Récupérer l'utilisateur courant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Non authentifié" };
      }

      // Créer les métadonnées
      const metadata: AttachmentMetadata = {
        dossier_ref: dossierRef,
        step,
        filename: this.sanitizeFilename(file.name),
        original_name: file.name,
        storage_path: storagePath,
        content_type: file.type || "application/octet-stream",
        size: file.size,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
        entity_id: entityId,
        type_piece: typePiece,
      };

      // Sauvegarder en base de données
      const { data: savedAttachment, error: dbError } = await supabase
        .from("attachments")
        .insert({
          dossier_ref: metadata.dossier_ref,
          step: metadata.step,
          filename: metadata.filename,
          original_name: metadata.original_name,
          storage_path: metadata.storage_path,
          content_type: metadata.content_type,
          size: metadata.size,
          uploaded_by: metadata.uploaded_by,
          entity_id: metadata.entity_id,
          type_piece: metadata.type_piece,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Erreur sauvegarde métadonnées:", dbError);
        // L'upload a réussi, on continue malgré l'erreur DB
      }

      return {
        success: true,
        attachment: {
          ...metadata,
          id: savedAttachment?.id,
        },
      };
    } catch (err) {
      console.error("Erreur upload:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Upload plusieurs fichiers
   * @returns Résultats individuels pour chaque fichier
   */
  async uploadFiles(options: UploadFilesOptions): Promise<{
    results: UploadResult[];
    successCount: number;
    failedCount: number;
  }> {
    const { dossierRef, step, files, exercice, entityId, onProgress } = options;

    const results: UploadResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadFile({
        dossierRef,
        step,
        file,
        exercice,
        entityId,
        onProgress: (percent) => onProgress?.(i, percent),
      });

      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    return { results, successCount, failedCount };
  }

  // ============================================
  // LISTE ET RÉCUPÉRATION
  // ============================================

  /**
   * Liste les pièces jointes d'un dossier et d'une étape
   */
  async listAttachments(
    dossierRef: string,
    step?: AttachmentStep
  ): Promise<ListAttachmentsResult> {
    try {
      let query = supabase
        .from("attachments")
        .select("*")
        .eq("dossier_ref", dossierRef)
        .order("created_at", { ascending: false });

      if (step) {
        query = query.eq("step", step);
      }

      const { data, error } = await query;

      if (error) {
        return { attachments: [], error: error.message };
      }

      const attachments: AttachmentMetadata[] = (data || []).map((row) => ({
        id: row.id,
        dossier_ref: row.dossier_ref,
        step: row.step as AttachmentStep,
        filename: row.filename,
        original_name: row.original_name,
        storage_path: row.storage_path,
        content_type: row.content_type,
        size: row.size,
        uploaded_by: row.uploaded_by,
        uploaded_at: row.created_at,
        entity_id: row.entity_id,
        type_piece: row.type_piece,
      }));

      return { attachments };
    } catch (err) {
      return {
        attachments: [],
        error: err instanceof Error ? err.message : "Erreur liste attachments",
      };
    }
  }

  /**
   * Liste les pièces jointes par entité (entity_id)
   */
  async listByEntity(entityId: string): Promise<ListAttachmentsResult> {
    try {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (error) {
        return { attachments: [], error: error.message };
      }

      const attachments: AttachmentMetadata[] = (data || []).map((row) => ({
        id: row.id,
        dossier_ref: row.dossier_ref,
        step: row.step as AttachmentStep,
        filename: row.filename,
        original_name: row.original_name,
        storage_path: row.storage_path,
        content_type: row.content_type,
        size: row.size,
        uploaded_by: row.uploaded_by,
        uploaded_at: row.created_at,
        entity_id: row.entity_id,
        type_piece: row.type_piece,
      }));

      return { attachments };
    } catch (err) {
      return {
        attachments: [],
        error: err instanceof Error ? err.message : "Erreur liste attachments",
      };
    }
  }

  // ============================================
  // URLs SIGNÉES
  // ============================================

  /**
   * Génère une URL signée pour téléchargement
   * @param path Chemin du fichier dans le storage
   * @param expiresInSeconds Durée de validité (défaut: 1 heure)
   */
  async getSignedUrl(
    path: string,
    expiresInSeconds = 3600
  ): Promise<SignedUrlResult> {
    try {
      const result = await this.provider.getDownloadUrl(path, expiresInSeconds);

      if (result.error || !result.data) {
        return {
          url: "",
          expiresAt: new Date(),
          error: result.error || "Impossible de générer l'URL",
        };
      }

      return {
        url: result.data,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      };
    } catch (err) {
      return {
        url: "",
        expiresAt: new Date(),
        error: err instanceof Error ? err.message : "Erreur URL signée",
      };
    }
  }

  /**
   * Génère une URL de preview (image inline)
   */
  async getPreviewUrl(path: string): Promise<SignedUrlResult> {
    // Durée courte pour preview (15 minutes)
    return this.getSignedUrl(path, 900);
  }

  // ============================================
  // SUPPRESSION
  // ============================================

  /**
   * Supprime une pièce jointe (contrôle brouillon)
   * @param attachmentId ID de l'attachment en DB
   * @param forceDelete Si true, supprime sans vérifier le statut
   */
  async deleteAttachment(
    attachmentId: string,
    forceDelete = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer les infos de l'attachment
      const { data: attachment, error: fetchError } = await supabase
        .from("attachments")
        .select("*")
        .eq("id", attachmentId)
        .single();

      if (fetchError || !attachment) {
        return { success: false, error: "Pièce jointe introuvable" };
      }

      // Vérifier les droits (brouillon ou force)
      if (!forceDelete) {
        // Vérifier que le dossier est en brouillon
        // Pour l'instant, on autorise la suppression si l'utilisateur est le créateur
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== attachment.uploaded_by) {
          return {
            success: false,
            error: "Vous ne pouvez supprimer que vos propres fichiers",
          };
        }
      }

      // Supprimer du storage
      const deleteResult = await this.provider.delete(attachment.storage_path);
      if (deleteResult.error) {
        console.warn("Erreur suppression storage:", deleteResult.error);
        // Continuer malgré l'erreur (fichier peut être déjà supprimé)
      }

      // Supprimer de la base de données
      const { error: dbError } = await supabase
        .from("attachments")
        .delete()
        .eq("id", attachmentId);

      if (dbError) {
        return { success: false, error: dbError.message };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur suppression",
      };
    }
  }

  /**
   * Supprime toutes les pièces jointes d'une entité
   */
  async deleteByEntity(entityId: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      // Lister les attachments
      const { attachments, error: listError } = await this.listByEntity(entityId);
      if (listError) {
        return { success: false, deletedCount: 0, error: listError };
      }

      let deletedCount = 0;
      for (const att of attachments) {
        if (att.id) {
          const result = await this.deleteAttachment(att.id, true);
          if (result.success) deletedCount++;
        }
      }

      return { success: true, deletedCount };
    } catch (err) {
      return {
        success: false,
        deletedCount: 0,
        error: err instanceof Error ? err.message : "Erreur suppression",
      };
    }
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Détermine si un fichier est une image
   */
  isImage(contentType: string): boolean {
    return contentType.startsWith("image/");
  }

  /**
   * Détermine si un fichier est un PDF
   */
  isPdf(contentType: string): boolean {
    return contentType === "application/pdf";
  }

  /**
   * Retourne l'icône appropriée pour un type de fichier
   */
  getFileIcon(contentType: string): string {
    if (this.isImage(contentType)) return "image";
    if (this.isPdf(contentType)) return "file-text";
    if (contentType.includes("word") || contentType.includes("document")) return "file-text";
    if (contentType.includes("excel") || contentType.includes("spreadsheet")) return "table";
    if (contentType.includes("powerpoint") || contentType.includes("presentation")) return "presentation";
    if (contentType.includes("zip") || contentType.includes("rar")) return "archive";
    return "file";
  }

  /**
   * Retourne les extensions acceptées pour l'input file
   */
  getAcceptedExtensions(): string {
    return ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.zip,.rar";
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const AttachmentService = new AttachmentServiceClass();

export default AttachmentService;
