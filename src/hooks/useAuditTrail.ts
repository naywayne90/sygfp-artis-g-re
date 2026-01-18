/**
 * useAuditTrail - Hook unifié pour la traçabilité complète
 *
 * Standard d'audit: QUI / QUOI / QUAND / OÙ / POURQUOI
 *
 * Génère des signatures QR à chaque validation avec:
 * - dossier_ref + étape + user + timestamp + hash intégrité
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { Json } from "@/integrations/supabase/types";

// ============================================
// TYPES
// ============================================

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "SUBMIT"
  | "VALIDATE"
  | "REJECT"
  | "DEFER"
  | "RESUME"
  | "SIGN"
  | "EXPORT"
  | "ARCHIVE"
  | "CLOSE"
  | "RENVOI"
  | "IMPUTE"
  | "TRANSFER"
  | "CANCEL"
  | "UPLOAD"
  | "DOWNLOAD";

export type WorkflowStep =
  | "creation"
  | "note_sef"
  | "note_aef"
  | "imputation"
  | "expression_besoin"
  | "passation_marche"
  | "engagement"
  | "liquidation"
  | "ordonnancement"
  | "reglement"
  | "cloture";

export interface AuditEventStandard {
  // QUI - Who
  userId: string;
  userName: string;
  userRole: string;
  userDirection?: string;

  // QUOI - What
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityCode?: string; // numero, reference, etc.

  // QUAND - When
  timestamp: string;
  exercice: number;

  // OÙ - Where
  module: string;
  step?: WorkflowStep;
  dossierRef?: string;

  // POURQUOI - Why
  reason?: string;
  justification?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;

  // Signature QR (pour validations)
  signatureData?: ValidationSignature;
}

export interface ValidationSignature {
  dossierRef: string;
  step: WorkflowStep;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  hash: string;
  qrPayload: string;
}

export interface LogEventParams {
  entityType: string;
  entityId: string;
  action: AuditAction;
  module?: string;
  entityCode?: string;
  dossierRef?: string;
  step?: WorkflowStep;
  reason?: string;
  justification?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  generateSignature?: boolean;
}

// ============================================
// CRYPTO UTILS
// ============================================

/**
 * Generate SHA-256 hash for integrity verification
 * Uses Web Crypto API for browser compatibility
 */
const generateIntegrityHash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Fallback for environments without crypto.subtle
    return btoa(data).replace(/[^a-zA-Z0-9]/g, "").slice(0, 64);
  }
};

/**
 * Generate QR code payload for validation proof
 */
const generateQRPayload = (data: {
  type: string;
  dossierRef: string;
  step: string;
  user: string;
  role: string;
  timestamp: string;
  hash: string;
}): string => {
  return JSON.stringify({
    t: data.type,
    ref: data.dossierRef,
    s: data.step,
    u: data.user,
    r: data.role,
    ts: data.timestamp,
    h: data.hash,
    v: "2.0", // Version du format
    sys: "SYGFP",
  });
};

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useAuditTrail() {
  const { exercice } = useExercice();

  /**
   * Get current user info for audit
   */
  const getCurrentUserInfo = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, role_hierarchique, profil_fonctionnel, direction_id, direction:directions(code, libelle)")
      .eq("id", user.id)
      .single();

    return profile ? {
      userId: profile.id,
      userName: profile.full_name || profile.email || "Inconnu",
      userRole: profile.profil_fonctionnel || profile.role_hierarchique || "User",
      userDirection: (profile.direction as any)?.code || undefined,
    } : null;
  }, []);

  /**
   * Generate validation signature with QR payload
   */
  const generateValidationSignature = useCallback(async (
    dossierRef: string,
    step: WorkflowStep,
    userInfo: { userId: string; userName: string; userRole: string }
  ): Promise<ValidationSignature> => {
    const timestamp = new Date().toISOString();

    // Data to hash for integrity
    const dataToHash = `${dossierRef}|${step}|${userInfo.userId}|${timestamp}|SYGFP`;
    const hash = await generateIntegrityHash(dataToHash);

    // Generate QR payload
    const qrPayload = generateQRPayload({
      type: "VALIDATION",
      dossierRef,
      step,
      user: userInfo.userName,
      role: userInfo.userRole,
      timestamp,
      hash: hash.slice(0, 16), // Shortened hash for QR
    });

    return {
      dossierRef,
      step,
      userId: userInfo.userId,
      userName: userInfo.userName,
      userRole: userInfo.userRole,
      timestamp,
      hash,
      qrPayload,
    };
  }, []);

  /**
   * Log an audit event (main function)
   */
  const logEvent = useCallback(async ({
    entityType,
    entityId,
    action,
    module,
    entityCode,
    dossierRef,
    step,
    reason,
    justification,
    oldValues,
    newValues,
    generateSignature = false,
  }: LogEventParams): Promise<{ success: boolean; signature?: ValidationSignature }> => {
    try {
      const userInfo = await getCurrentUserInfo();
      if (!userInfo) {
        console.warn("No user info for audit log");
        return { success: false };
      }

      let signature: ValidationSignature | undefined;

      // Generate signature for validation actions
      if (generateSignature && dossierRef && step) {
        signature = await generateValidationSignature(dossierRef, step, userInfo);
      }

      // Build the full audit event
      const auditEvent: AuditEventStandard = {
        // QUI
        userId: userInfo.userId,
        userName: userInfo.userName,
        userRole: userInfo.userRole,
        userDirection: userInfo.userDirection,

        // QUOI
        action,
        entityType,
        entityId,
        entityCode,

        // QUAND
        timestamp: new Date().toISOString(),
        exercice: exercice || new Date().getFullYear(),

        // OÙ
        module: module || entityType,
        step,
        dossierRef,

        // POURQUOI
        reason,
        justification,
        oldValues,
        newValues,

        // Signature
        signatureData: signature,
      };

      // Store in audit_logs table
      const newValuesJson = {
        ...newValues,
        _audit_standard: auditEvent,
        _timestamp: auditEvent.timestamp,
        _action_type: action,
        ...(signature ? {
          _signature_hash: signature.hash,
          _signature_qr: signature.qrPayload,
        } : {}),
      } as Json;

      // Try RPC first
      const { error: rpcError } = await supabase.rpc("log_audit_action", {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_action: action,
        p_module: module || entityType,
        p_entity_code: entityCode || null,
        p_resume: reason || justification || null,
        p_old_values: (oldValues || null) as Json,
        p_new_values: newValuesJson,
        p_justification: justification || null,
        p_exercice: exercice,
      });

      if (rpcError) {
        // Fallback to direct insert
        const { error } = await supabase.from("audit_logs").insert([{
          entity_type: entityType,
          entity_id: entityId,
          action,
          old_values: (oldValues || null) as Json,
          new_values: newValuesJson,
          exercice: exercice,
        }]);

        if (error) {
          console.error("Audit log error:", error);
          return { success: false };
        }
      }

      return { success: true, signature };
    } catch (err) {
      console.error("Audit trail error:", err);
      return { success: false };
    }
  }, [exercice, getCurrentUserInfo, generateValidationSignature]);

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  const logCreate = useCallback((params: Omit<LogEventParams, "action">) =>
    logEvent({ ...params, action: "CREATE" }), [logEvent]);

  const logUpdate = useCallback((params: Omit<LogEventParams, "action">) =>
    logEvent({ ...params, action: "UPDATE" }), [logEvent]);

  const logDelete = useCallback((params: Omit<LogEventParams, "action">) =>
    logEvent({ ...params, action: "DELETE" }), [logEvent]);

  const logSubmit = useCallback((params: Omit<LogEventParams, "action">) =>
    logEvent({ ...params, action: "SUBMIT" }), [logEvent]);

  const logExport = useCallback((params: Omit<LogEventParams, "action">) =>
    logEvent({ ...params, action: "EXPORT" }), [logEvent]);

  /**
   * Log a validation with automatic signature generation
   */
  const logValidation = useCallback(async (params: Omit<LogEventParams, "action" | "generateSignature"> & {
    dossierRef: string;
    step: WorkflowStep;
  }) => {
    return logEvent({
      ...params,
      action: "VALIDATE",
      generateSignature: true,
    });
  }, [logEvent]);

  /**
   * Log a rejection with justification
   */
  const logRejection = useCallback((params: Omit<LogEventParams, "action"> & {
    justification: string;
  }) => logEvent({ ...params, action: "REJECT" }), [logEvent]);

  /**
   * Log a deferral (report)
   */
  const logDefer = useCallback((params: Omit<LogEventParams, "action"> & {
    reason: string;
  }) => logEvent({ ...params, action: "DEFER" }), [logEvent]);

  /**
   * Log a signature action with QR generation
   */
  const logSignature = useCallback(async (params: Omit<LogEventParams, "action" | "generateSignature"> & {
    dossierRef: string;
    step: WorkflowStep;
  }) => {
    return logEvent({
      ...params,
      action: "SIGN",
      generateSignature: true,
    });
  }, [logEvent]);

  /**
   * Log a renvoi (send back to previous step)
   */
  const logRenvoi = useCallback((params: Omit<LogEventParams, "action"> & {
    fromStep: WorkflowStep;
    toStep: WorkflowStep;
    justification: string;
  }) => logEvent({
    ...params,
    action: "RENVOI",
    newValues: {
      ...params.newValues,
      from_step: params.fromStep,
      to_step: params.toStep,
    },
  }), [logEvent]);

  // ============================================
  // HISTORY RETRIEVAL
  // ============================================

  /**
   * Get full audit history for an entity
   */
  const getEntityHistory = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<AuditEventStandard[]> => {
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        *,
        user:profiles!audit_logs_user_id_fkey(full_name, email, role_hierarchique, profil_fonctionnel)
      `)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching audit history:", error);
      return [];
    }

    return (data || []).map(log => {
      const newValues = log.new_values as Record<string, unknown> | null;
      const auditStandard = newValues?._audit_standard as AuditEventStandard | undefined;

      return auditStandard || {
        userId: log.user_id || "unknown",
        userName: (log.user as any)?.full_name || "Système",
        userRole: (log.user as any)?.profil_fonctionnel || "User",
        action: log.action as AuditAction,
        entityType: log.entity_type,
        entityId: log.entity_id || "",
        timestamp: log.created_at,
        exercice: log.exercice || new Date().getFullYear(),
        module: log.entity_type,
        oldValues: log.old_values as Record<string, unknown> | undefined,
        newValues: newValues as Record<string, unknown> | undefined,
      };
    });
  }, []);

  /**
   * Get full dossier history (across all steps)
   */
  const getDossierHistory = useCallback(async (
    dossierRef: string
  ): Promise<AuditEventStandard[]> => {
    // Query audit_logs where new_values contains dossier_ref
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        *,
        user:profiles!audit_logs_user_id_fkey(full_name, email, role_hierarchique, profil_fonctionnel)
      `)
      .or(`new_values->dossier_ref.eq.${dossierRef},new_values->_audit_standard->dossierRef.eq.${dossierRef}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching dossier history:", error);
      return [];
    }

    return (data || []).map(log => {
      const newValues = log.new_values as Record<string, unknown> | null;
      const auditStandard = newValues?._audit_standard as AuditEventStandard | undefined;

      return auditStandard || {
        userId: log.user_id || "unknown",
        userName: (log.user as any)?.full_name || "Système",
        userRole: (log.user as any)?.profil_fonctionnel || "User",
        action: log.action as AuditAction,
        entityType: log.entity_type,
        entityId: log.entity_id || "",
        timestamp: log.created_at,
        exercice: log.exercice || new Date().getFullYear(),
        module: log.entity_type,
        dossierRef,
        oldValues: log.old_values as Record<string, unknown> | undefined,
        newValues: newValues as Record<string, unknown> | undefined,
      };
    });
  }, []);

  /**
   * Get all validation signatures for a dossier
   */
  const getDossierSignatures = useCallback(async (
    dossierRef: string
  ): Promise<ValidationSignature[]> => {
    const history = await getDossierHistory(dossierRef);

    return history
      .filter(event => event.signatureData)
      .map(event => event.signatureData!)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [getDossierHistory]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Main event logging
    logEvent,

    // Convenience methods
    logCreate,
    logUpdate,
    logDelete,
    logSubmit,
    logExport,
    logValidation,
    logRejection,
    logDefer,
    logSignature,
    logRenvoi,

    // History retrieval
    getEntityHistory,
    getDossierHistory,
    getDossierSignatures,

    // Utils
    generateValidationSignature,
    generateIntegrityHash,
  };
}

export default useAuditTrail;
