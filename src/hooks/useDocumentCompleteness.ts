/**
 * Hook pour vérifier la complétude des documents pour une étape
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getRequiredDocumentsForStep } from "@/lib/config/document-permissions";
import { parseStandardName } from "@/services/storage/namingService";

export interface DocumentStatus {
  typeDocument: string;
  label: string;
  required: boolean;
  ordre: number;
  isProvided: boolean;
  fileName?: string;
  filePath?: string;
  uploadedAt?: string;
}

export interface CompletenessStatus {
  isComplete: boolean;
  totalRequired: number;
  totalProvided: number;
  missingDocuments: string[];
  documents: DocumentStatus[];
}

interface UseDocumentCompletenessOptions {
  dossierId?: string;
  etape: string;
  entityType?: string;
  entityId?: string;
}

export function useDocumentCompleteness(options: UseDocumentCompletenessOptions) {
  const { dossierId, etape, entityType, entityId } = options;

  // Fetch documents from dossier_documents table
  const documentsQuery = useQuery({
    queryKey: ["dossier-documents", dossierId || entityId, etape],
    queryFn: async () => {
      if (!dossierId && !entityId) return [];

      const query = supabase
        .from("dossier_documents")
        .select("*")
        .order("created_at", { ascending: true });

      if (dossierId) {
        query.eq("dossier_id", dossierId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching dossier documents:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!(dossierId || entityId),
  });

  // Calculate completeness status
  const status = useMemo((): CompletenessStatus => {
    const requiredDocs = getRequiredDocumentsForStep(etape);
    const uploadedDocs = documentsQuery.data || [];

    // Map uploaded documents by type
    const uploadedByType = new Map<string, {
      fileName: string;
      filePath: string;
      uploadedAt: string;
    }>();

    for (const doc of uploadedDocs) {
      const docType = doc.type_document;
      if (docType) {
        uploadedByType.set(docType, {
          fileName: doc.file_name || '',
          filePath: doc.file_path || '',
          uploadedAt: doc.created_at || '',
        });
      }
    }

    // Also try to parse from file names (for R2/storage)
    for (const doc of uploadedDocs) {
      const fileName = doc.file_name || '';
      const parsed = parseStandardName(fileName);
      if (parsed && !uploadedByType.has(parsed.typePiece)) {
        uploadedByType.set(parsed.typePiece, {
          fileName,
          filePath: doc.file_path || '',
          uploadedAt: doc.created_at || '',
        });
      }
    }

    // Build document status list
    const documents: DocumentStatus[] = requiredDocs.map(req => {
      const uploaded = uploadedByType.get(req.typeDocument);
      return {
        typeDocument: req.typeDocument,
        label: req.label,
        required: req.required,
        ordre: req.ordre,
        isProvided: !!uploaded,
        fileName: uploaded?.fileName,
        filePath: uploaded?.filePath,
        uploadedAt: uploaded?.uploadedAt,
      };
    });

    // Sort by ordre
    documents.sort((a, b) => a.ordre - b.ordre);

    // Calculate totals
    const requiredDocuments = documents.filter(d => d.required);
    const totalRequired = requiredDocuments.length;
    const totalProvided = requiredDocuments.filter(d => d.isProvided).length;
    const missingDocuments = requiredDocuments
      .filter(d => !d.isProvided)
      .map(d => d.label);

    return {
      isComplete: totalProvided >= totalRequired,
      totalRequired,
      totalProvided,
      missingDocuments,
      documents,
    };
  }, [documentsQuery.data, etape]);

  return {
    ...status,
    isLoading: documentsQuery.isLoading,
    isError: documentsQuery.isError,
    refetch: documentsQuery.refetch,
  };
}

/**
 * Check if a transition can proceed based on document completeness
 */
export async function checkDocumentsForTransition(
  dossierId: string,
  targetEtape: string
): Promise<{ canProceed: boolean; missingDocuments: string[] }> {
  const requiredDocs = getRequiredDocumentsForStep(targetEtape);
  
  if (requiredDocs.length === 0) {
    return { canProceed: true, missingDocuments: [] };
  }

  // Fetch uploaded documents
  const { data: uploadedDocs, error } = await supabase
    .from("dossier_documents")
    .select("type_document, file_name")
    .eq("dossier_id", dossierId);

  if (error) {
    console.error("Error checking documents:", error);
    return { canProceed: false, missingDocuments: ["Erreur de vérification"] };
  }

  // Build set of uploaded types
  const uploadedTypes = new Set<string>();
  for (const doc of uploadedDocs || []) {
    const docType = doc.type_document;
    if (docType) {
      uploadedTypes.add(docType);
    }
    
    // Also parse from filename
    const fileName = doc.file_name || '';
    const parsed = parseStandardName(fileName);
    if (parsed) {
      uploadedTypes.add(parsed.typePiece);
    }
  }

  // Find missing required documents
  const missingDocuments = requiredDocs
    .filter(req => req.required && !uploadedTypes.has(req.typeDocument))
    .map(req => req.label);

  return {
    canProceed: missingDocuments.length === 0,
    missingDocuments,
  };
}
