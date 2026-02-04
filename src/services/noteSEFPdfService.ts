/**
 * Service de génération PDF pour les Notes SEF (PROMPT 30)
 *
 * Format ARTI officiel "ARTI_NOTE_DG_SYGFP" avec:
 * - Page 1: En-tête ARTI, informations note, Exposé/Avis/Recommandations, Imputations
 * - Page 2: Observations du Directeur Général avec QR Code de validation
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { QRCodeCanvas } from "qrcode.react";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { NoteSEF } from "@/hooks/useNotesSEF";
import {
  NoteImputation,
  NoteImputationLigne,
  INSTRUCTION_TYPE_LABELS,
  PRIORITE_LABELS,
  InstructionType,
  ImputationPriorite,
} from "@/hooks/useNoteImputations";
import {
  ValidationDG,
  VALIDATION_STATUS_LABELS,
} from "@/hooks/useValidationDG";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import logoArti from "@/assets/logo-arti.jpg";

// ============================================================================
// TYPES
// ============================================================================

export interface NoteSEFPdfOptions {
  note: NoteSEF;
  imputation?: NoteImputation | null;
  validation?: ValidationDG | null;
  attachmentsCount?: number;
  baseUrl?: string;
}

export interface PdfGenerationResult {
  blob: Blob;
  filename: string;
}

// ============================================================================
// CONFIGURATION PDF
// ============================================================================

const PDF_CONFIG = {
  margins: {
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
  },
  colors: {
    primary: [0, 51, 102] as [number, number, number], // Bleu ARTI
    secondary: [100, 100, 100] as [number, number, number],
    headerBg: [240, 240, 240] as [number, number, number],
    tableBorder: [200, 200, 200] as [number, number, number],
    text: [30, 30, 30] as [number, number, number],
    lightGray: [248, 248, 248] as [number, number, number],
    exposeBlue: [230, 240, 250] as [number, number, number],
    avisGreen: [230, 250, 240] as [number, number, number],
    recoAmber: [255, 248, 230] as [number, number, number],
  },
  fonts: {
    title: 14,
    subtitle: 11,
    body: 9,
    small: 8,
  },
};

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Génère un canvas QR Code et retourne son data URL
 */
async function generateQRCodeDataUrl(data: string, size: number = 150): Promise<string> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(
      createElement(QRCodeCanvas, {
        value: data,
        size: size,
        level: "H",
        includeMargin: true,
      })
    );

    setTimeout(() => {
      const canvas = container.querySelector("canvas");
      if (canvas) {
        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve("");
      }
      root.unmount();
      document.body.removeChild(container);
    }, 100);
  });
}

/**
 * Charge une image et retourne son data URL
 */
async function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Formatte une date en français
 */
function formatDateFr(date: string | Date | null): string {
  if (!date) return "-";
  try {
    return format(new Date(date), "dd MMMM yyyy", { locale: fr });
  } catch {
    return "-";
  }
}

/**
 * Formatte une date courte
 */
function formatDateShort(date: string | Date | null): string {
  if (!date) return "-";
  try {
    return format(new Date(date), "dd/MM/yyyy", { locale: fr });
  } catch {
    return "-";
  }
}

/**
 * Formatte un montant en FCFA
 */
function formatMontant(montant: number | null): string {
  if (!montant) return "-";
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
}

/**
 * Tronque le texte si trop long
 */
function truncateText(text: string | null, maxLength: number): string {
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

// ============================================================================
// GÉNÉRATION PDF - PAGE 1
// ============================================================================

async function generatePage1(
  doc: jsPDF,
  note: NoteSEF,
  imputation: NoteImputation | null,
  qrDataUrl: string,
  logoDataUrl: string,
  attachmentsCount: number
): Promise<number> {
  const { margins, colors, fonts } = PDF_CONFIG;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = margins.top;

  // ─────────────────────────────────────────────────────────────────────────
  // EN-TÊTE ARTI
  // ─────────────────────────────────────────────────────────────────────────

  // Logo ARTI (gauche)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "JPEG", margins.left, yPos, 25, 25);
    } catch (e) {
      console.warn("Could not add logo:", e);
    }
  }

  // QR Code discret (droite - petit)
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", pageWidth - margins.right - 18, yPos, 18, 18);
    } catch (e) {
      console.warn("Could not add QR code:", e);
    }
  }

  // Texte en-tête (centré)
  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.secondary);
  doc.text("RÉPUBLIQUE DE CÔTE D'IVOIRE", pageWidth / 2, yPos + 4, { align: "center" });
  doc.setFontSize(fonts.small - 1);
  doc.text("Union - Discipline - Travail", pageWidth / 2, yPos + 8, { align: "center" });

  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("AUTORITÉ DE RÉGULATION DES", pageWidth / 2, yPos + 15, { align: "center" });
  doc.text("TÉLÉCOMMUNICATIONS DE CÔTE D'IVOIRE", pageWidth / 2, yPos + 19, { align: "center" });

  yPos += 28;

  // Ligne séparatrice
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(margins.left, yPos, pageWidth - margins.right, yPos);
  yPos += 8;

  // ─────────────────────────────────────────────────────────────────────────
  // TITRE
  // ─────────────────────────────────────────────────────────────────────────

  doc.setFontSize(fonts.title);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("NOTE SEF - SYGFP", pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  // ─────────────────────────────────────────────────────────────────────────
  // TABLEAU D'INFORMATIONS PRINCIPALES
  // ─────────────────────────────────────────────────────────────────────────

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      [
        "N° Référence",
        note.dossier_ref || note.reference_pivot || "-",
        "Date",
        formatDateShort(note.created_at),
      ],
      [
        "Direction",
        note.direction?.sigle || note.direction?.label || "-",
        "Urgence",
        note.urgence ? "OUI" : "Non",
      ],
      [
        "Demandeur",
        note.demandeur ? `${note.demandeur.first_name || ""} ${note.demandeur.last_name || ""}`.trim() || "-" : "-",
        "Montant",
        formatMontant(note.montant_estime),
      ],
      ["Objet", { content: note.objet || "-", colSpan: 3 }],
      [
        "Documents annexés",
        attachmentsCount > 0 ? `${attachmentsCount} pièce(s) jointe(s)` : "Aucun",
        "Nb. pages",
        "2",
      ],
    ],
    styles: {
      fontSize: fonts.body,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 32, fillColor: colors.lightGray },
      1: { cellWidth: 50 },
      2: { fontStyle: "bold", cellWidth: 28, fillColor: colors.lightGray },
      3: { cellWidth: 50 },
    },
    theme: "grid",
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ─────────────────────────────────────────────────────────────────────────
  // CORPS DE LA NOTE - EXPOSÉ / AVIS / RECOMMANDATIONS
  // ─────────────────────────────────────────────────────────────────────────

  const contentWidth = pageWidth - margins.left - margins.right;
  const maxContentHeight = pageHeight - yPos - 80; // Réserver de l'espace pour imputation + signature

  // Exposé
  if (note.expose) {
    doc.setFontSize(fonts.subtitle);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("EXPOSÉ", margins.left, yPos);
    yPos += 5;

    // Cadre coloré
    doc.setFillColor(...colors.exposeBlue);
    const exposeLines = doc.splitTextToSize(note.expose, contentWidth - 6);
    const exposeHeight = Math.min(exposeLines.length * 4 + 4, 40);
    doc.rect(margins.left, yPos, contentWidth, exposeHeight, "F");

    // Bordure gauche colorée
    doc.setFillColor(66, 133, 244); // Bleu
    doc.rect(margins.left, yPos, 2, exposeHeight, "F");

    doc.setFontSize(fonts.body);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.text(exposeLines.slice(0, 10), margins.left + 5, yPos + 4); // Max 10 lignes
    yPos += exposeHeight + 5;
  }

  // Avis
  if (note.avis && yPos < maxContentHeight) {
    doc.setFontSize(fonts.subtitle);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("AVIS", margins.left, yPos);
    yPos += 5;

    doc.setFillColor(...colors.avisGreen);
    const avisLines = doc.splitTextToSize(note.avis, contentWidth - 6);
    const avisHeight = Math.min(avisLines.length * 4 + 4, 30);
    doc.rect(margins.left, yPos, contentWidth, avisHeight, "F");

    doc.setFillColor(52, 168, 83); // Vert
    doc.rect(margins.left, yPos, 2, avisHeight, "F");

    doc.setFontSize(fonts.body);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.text(avisLines.slice(0, 7), margins.left + 5, yPos + 4);
    yPos += avisHeight + 5;
  }

  // Recommandations
  if (note.recommandations && yPos < maxContentHeight) {
    doc.setFontSize(fonts.subtitle);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("RECOMMANDATIONS", margins.left, yPos);
    yPos += 5;

    doc.setFillColor(...colors.recoAmber);
    const recoLines = doc.splitTextToSize(note.recommandations, contentWidth - 6);
    const recoHeight = Math.min(recoLines.length * 4 + 4, 30);
    doc.rect(margins.left, yPos, contentWidth, recoHeight, "F");

    doc.setFillColor(251, 188, 4); // Ambre
    doc.rect(margins.left, yPos, 2, recoHeight, "F");

    doc.setFontSize(fonts.body);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    doc.text(recoLines.slice(0, 7), margins.left + 5, yPos + 4);
    yPos += recoHeight + 8;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TABLEAU D'IMPUTATION
  // ─────────────────────────────────────────────────────────────────────────

  const lignes = imputation?.lignes || [];
  if (lignes.length > 0 && yPos < pageHeight - 60) {
    doc.setFontSize(fonts.subtitle);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("INFORMATIONS D'IMPUTATION", margins.left, yPos);
    yPos += 5;

    const imputationData = lignes.slice(0, 6).map((imp: NoteImputationLigne, idx: number) => [
      String(idx + 1),
      truncateText(imp.destinataire, 30),
      INSTRUCTION_TYPE_LABELS[imp.instruction_type as InstructionType] || imp.instruction_type,
      PRIORITE_LABELS[imp.priorite as ImputationPriorite] || imp.priorite,
      imp.delai || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["N°", "Destinataire", "Type", "Priorité", "Délai"]],
      body: imputationData,
      styles: {
        fontSize: fonts.small,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 55 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 35, halign: "center" },
      },
      theme: "grid",
      margin: { left: margins.left, right: margins.right },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PIED DE PAGE - SIGNATURE
  // ─────────────────────────────────────────────────────────────────────────

  const signatureY = pageHeight - 30;

  doc.setFontSize(fonts.body);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);

  // Lieu et date
  doc.text(`Abidjan, le ${formatDateFr(new Date())}`, pageWidth - margins.right - 55, signatureY);

  // Titre signataire
  doc.setFont("helvetica", "bold");
  doc.text("Le Directeur Général", pageWidth - margins.right - 55, signatureY + 6);

  // Pied de page
  doc.setFontSize(fonts.small - 1);
  doc.setTextColor(...colors.secondary);
  doc.text(
    "Document généré par SYGFP - Système de Gestion des Finances Publiques ARTI",
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  return yPos;
}

// ============================================================================
// GÉNÉRATION PDF - PAGE 2 (OBSERVATIONS DU DG)
// ============================================================================

async function generatePage2(
  doc: jsPDF,
  note: NoteSEF,
  validation: ValidationDG | null,
  qrDataUrl: string,
  validationUrl: string
): Promise<void> {
  const { margins, colors, fonts } = PDF_CONFIG;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = margins.top;

  doc.addPage();

  // ─────────────────────────────────────────────────────────────────────────
  // TITRE
  // ─────────────────────────────────────────────────────────────────────────

  doc.setFontSize(fonts.title + 2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("OBSERVATIONS DU DIRECTEUR GÉNÉRAL", pageWidth / 2, yPos + 10, { align: "center" });

  yPos += 20;

  // Ligne décorative
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(1);
  doc.line(margins.left + 30, yPos, pageWidth - margins.right - 30, yPos);
  yPos += 12;

  // Référence de la note
  doc.setFontSize(fonts.body);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);
  doc.text(`Réf: ${note.dossier_ref || note.reference_pivot || "N/A"}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 6;

  const objetTrunc = truncateText(note.objet, 80);
  doc.text(`Objet: ${objetTrunc}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // ─────────────────────────────────────────────────────────────────────────
  // TABLEAU DATE / OBSERVATIONS
  // ─────────────────────────────────────────────────────────────────────────

  const validationDate = validation?.validated_at
    ? formatDateFr(validation.validated_at)
    : formatDateFr(new Date());

  const validatorName = validation?.validated_by
    ? `${validation.validated_by.first_name || ""} ${validation.validated_by.last_name || ""}`.trim() ||
      "Le Directeur Général"
    : "Le Directeur Général";

  const statusText = validation?.status
    ? VALIDATION_STATUS_LABELS[validation.status]
    : "En attente";

  const observations = validation?.commentaire || "Aucune observation particulière.";

  autoTable(doc, {
    startY: yPos,
    head: [["Date de validation", "Informations sur la validation du DG"]],
    body: [
      [
        `Abidjan, le ${validationDate}`,
        `Validé par: ${validatorName}\n\nStatut: ${statusText.toUpperCase()}\n\n${observations}`,
      ],
    ],
    styles: {
      fontSize: fonts.body,
      cellPadding: 6,
      valign: "top",
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 45, halign: "center" },
      1: { cellWidth: 115 },
    },
    theme: "grid",
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // ─────────────────────────────────────────────────────────────────────────
  // QR CODE DE VÉRIFICATION
  // ─────────────────────────────────────────────────────────────────────────

  const qrSize = 45;
  const qrX = pageWidth / 2 - qrSize / 2;
  const qrY = Math.max(yPos + 20, pageHeight - margins.bottom - qrSize - 50);

  // Texte au-dessus du QR
  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.secondary);
  doc.text("Scannez ce QR Code pour vérifier l'authenticité", pageWidth / 2, qrY - 8, {
    align: "center",
  });

  // Cadre décoratif autour du QR
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6);

  // QR Code
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    } catch (e) {
      console.warn("Could not add QR code on page 2:", e);
    }
  }

  // URL de vérification sous le QR
  doc.setFontSize(fonts.small - 1);
  doc.setTextColor(...colors.primary);
  const urlTrunc = validationUrl.length > 60 ? validationUrl.substring(0, 57) + "..." : validationUrl;
  doc.text(urlTrunc, pageWidth / 2, qrY + qrSize + 8, { align: "center" });

  // Note de sécurité
  doc.setFontSize(fonts.small - 1);
  doc.setTextColor(...colors.secondary);
  doc.text(
    "Ce document est authentifié électroniquement. Toute falsification est passible de poursuites.",
    pageWidth / 2,
    qrY + qrSize + 16,
    { align: "center" }
  );

  // Pied de page
  doc.setFontSize(fonts.small - 1);
  doc.text(
    "ARTI - SYGFP | Document officiel généré automatiquement",
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );
}

// ============================================================================
// FONCTION PRINCIPALE DE GÉNÉRATION
// ============================================================================

export async function generateNoteSEFPdf(
  options: NoteSEFPdfOptions
): Promise<PdfGenerationResult> {
  const {
    note,
    imputation = null,
    validation = null,
    attachmentsCount = 0,
    baseUrl = window.location.origin,
  } = options;

  // URL de validation
  const validationUrl = validation?.token
    ? `${baseUrl}/dg/valider/${validation.token}`
    : `${baseUrl}/notes-sef/${note.id}`;

  // Générer le QR Code
  const qrDataUrl = await generateQRCodeDataUrl(validationUrl, 150);

  // Charger le logo
  let logoDataUrl = "";
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArti);
  } catch (e) {
    console.warn("Could not load logo:", e);
  }

  // Créer le document PDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Page 1: Informations principales
  await generatePage1(doc, note, imputation, qrDataUrl, logoDataUrl, attachmentsCount);

  // Page 2: Observations du DG
  await generatePage2(doc, note, validation, qrDataUrl, validationUrl);

  // Ajouter métadonnées
  const noteRef = note.dossier_ref || note.reference_pivot || "Brouillon";
  doc.setProperties({
    title: `ARTI_NOTE_DG_SYGFP - ${noteRef}`,
    subject: note.objet || "",
    author: "ARTI - SYGFP",
    creator: "SYGFP - Système de Gestion des Finances Publiques",
    keywords: "note, SEF, DG, ARTI, officiel, validation",
  });

  // Générer le blob
  const blob = doc.output("blob");
  const refClean = (noteRef || "DRAFT").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `ARTI_NOTE_DG_SYGFP_${refClean}_${format(
    new Date(),
    "yyyyMMdd_HHmmss"
  )}.pdf`;

  return { blob, filename };
}

// ============================================================================
// FONCTION DE TÉLÉCHARGEMENT DIRECT
// ============================================================================

export async function downloadNoteSEFPdf(options: NoteSEFPdfOptions): Promise<void> {
  const { blob, filename } = await generateNoteSEFPdf(options);

  // Créer un lien de téléchargement
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  generateNoteSEFPdf,
  downloadNoteSEFPdf,
};
