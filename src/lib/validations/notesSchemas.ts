import { z } from "zod";

// ============================================
// SCHÉMAS DE VALIDATION POUR NOTES SEF/AEF
// Messages en français
// ============================================

/**
 * Schéma de validation pour une Note SEF (Sans Engagement Financier)
 */
export const noteSEFSchema = z.object({
  objet: z
    .string({ required_error: "L'objet est obligatoire" })
    .min(1, "L'objet est obligatoire")
    .max(500, "L'objet ne peut dépasser 500 caractères"),
  
  direction_id: z
    .string({ required_error: "La direction est obligatoire" })
    .uuid("La direction sélectionnée est invalide"),
  
  demandeur_id: z
    .string({ required_error: "Le demandeur est obligatoire" })
    .uuid("Le demandeur sélectionné est invalide"),
  
  urgence: z.enum(["basse", "normale", "haute", "urgente"], {
    errorMap: () => ({ message: "Veuillez sélectionner un niveau d'urgence valide" }),
  }),
  
  justification: z
    .string({ required_error: "La justification est obligatoire" })
    .min(10, "La justification doit contenir au moins 10 caractères")
    .max(2000, "La justification ne peut dépasser 2000 caractères"),
  
  date_souhaitee: z.date({
    required_error: "La date souhaitée est obligatoire",
    invalid_type_error: "La date souhaitée est invalide",
  }),
  
  description: z.string().optional().nullable(),
  commentaire: z.string().optional().nullable(),
  
  beneficiaire_id: z.string().uuid().optional().nullable(),
  beneficiaire_interne_id: z.string().uuid().optional().nullable(),
});

export type NoteSEFFormData = z.infer<typeof noteSEFSchema>;

/**
 * Schéma de validation pour une Note AEF (Avec Engagement Financier)
 */
export const noteAEFSchema = z.object({
  objet: z
    .string({ required_error: "L'objet est obligatoire" })
    .min(1, "L'objet est obligatoire")
    .max(500, "L'objet ne peut dépasser 500 caractères"),
  
  direction_id: z
    .string({ required_error: "La direction est obligatoire" })
    .uuid("La direction sélectionnée est invalide"),
  
  priorite: z.enum(["basse", "normale", "haute", "urgente"], {
    errorMap: () => ({ message: "Veuillez sélectionner un niveau de priorité valide" }),
  }),
  
  montant_estime: z
    .number({
      required_error: "Le montant estimé est obligatoire",
      invalid_type_error: "Le montant doit être un nombre",
    })
    .min(1, "Le montant estimé doit être supérieur à 0"),
  
  contenu: z
    .string({ required_error: "La description est obligatoire" })
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(5000, "La description ne peut dépasser 5000 caractères"),
  
  type_depense: z.enum(["fonctionnement", "investissement", "transfert"], {
    errorMap: () => ({ message: "Veuillez sélectionner un type de dépense valide" }),
  }),
  
  note_sef_id: z.string().uuid().optional().nullable(),
  
  is_direct_aef: z.boolean().default(false),
  
  justification_dg: z.string().optional().nullable(),
}).refine(
  (data) => data.is_direct_aef || data.note_sef_id,
  { 
    message: "Une Note SEF validée est obligatoire (sauf AEF directe DG)", 
    path: ["note_sef_id"] 
  }
).refine(
  (data) => !data.is_direct_aef || (data.justification_dg && data.justification_dg.length >= 10),
  { 
    message: "La justification est obligatoire pour une AEF directe (min. 10 caractères)", 
    path: ["justification_dg"] 
  }
);

export type NoteAEFFormData = z.infer<typeof noteAEFSchema>;

/**
 * Schéma pour l'imputation
 */
export const imputationSchema = z.object({
  ligne_budgetaire_id: z
    .string({ required_error: "La ligne budgétaire est obligatoire" })
    .uuid("La ligne budgétaire sélectionnée est invalide"),
  
  montant: z
    .number({
      required_error: "Le montant est obligatoire",
      invalid_type_error: "Le montant doit être un nombre",
    })
    .min(1, "Le montant doit être supérieur à 0"),
  
  observation: z.string().optional().nullable(),
});

export type ImputationFormData = z.infer<typeof imputationSchema>;

/**
 * Schéma pour l'expression de besoin
 */
export const expressionBesoinSchema = z.object({
  objet: z
    .string({ required_error: "L'objet est obligatoire" })
    .min(1, "L'objet est obligatoire"),
  
  description: z
    .string({ required_error: "La description est obligatoire" })
    .min(10, "La description doit contenir au moins 10 caractères"),
  
  quantite: z
    .number({
      required_error: "La quantité est obligatoire",
      invalid_type_error: "La quantité doit être un nombre",
    })
    .min(1, "La quantité doit être au moins 1"),
  
  unite: z.string().min(1, "L'unité est obligatoire"),
  
  prix_unitaire_estime: z.number().optional().nullable(),
  
  date_souhaitee: z.date({
    required_error: "La date souhaitée est obligatoire",
  }),
  
  priorite: z.enum(["basse", "normale", "haute", "urgente"]),
});

export type ExpressionBesoinFormData = z.infer<typeof expressionBesoinSchema>;
