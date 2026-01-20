/**
 * Service de génération PDF pour les Notes Direction Générale
 *
 * Format ARTI officiel avec:
 * - Page 1: En-tête ARTI, informations note, corps, imputations
 * - Page 2: Observations du DG avec QR Code de vérification
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { QRCodeCanvas } from "qrcode.react";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import {
  NoteDirectionGenerale,
  NoteDGImputation,
  INSTRUCTION_TYPES,
  PRIORITES,
  InstructionType,
  ImputationPriorite,
} from "@/hooks/useNotesDirectionGenerale";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import logoArti from "@/assets/logo-arti.jpg";

// Types
interface GeneratePdfOptions {
  note: NoteDirectionGenerale;
  imputations: NoteDGImputation[];
  qrToken: string;
  baseUrl?: string;
}

interface PdfGenerationResult {
  blob: Blob;
  filename: string;
}

// ============================================================================
// CONFIGURATION PDF
// ============================================================================

const PDF_CONFIG = {
  margins: {
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
  },
  colors: {
    primary: [0, 51, 102] as [number, number, number], // Bleu ARTI
    secondary: [128, 128, 128] as [number, number, number],
    headerBg: [240, 240, 240] as [number, number, number],
    tableBorder: [200, 200, 200] as [number, number, number],
    text: [0, 0, 0] as [number, number, number],
    lightGray: [245, 245, 245] as [number, number, number],
  },
  fonts: {
    title: 14,
    subtitle: 12,
    body: 10,
    small: 8,
  },
};

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Génère un canvas QR Code et retourne son data URL
 */
async function generateQRCodeDataUrl(data: string, size: number = 100): Promise<string> {
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

    // Attendre le rendu
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

// ============================================================================
// GÉNÉRATION PDF - PAGE 1
// ============================================================================

async function generatePage1(
  doc: jsPDF,
  note: NoteDirectionGenerale,
  imputations: NoteDGImputation[],
  qrDataUrl: string,
  logoDataUrl: string
): Promise<number> {
  const { margins, colors, fonts } = PDF_CONFIG;
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = margins.top;

  // ─────────────────────────────────────────────────────────────────────────
  // EN-TÊTE ARTI
  // ─────────────────────────────────────────────────────────────────────────

  // Logo ARTI (gauche)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "JPEG", margins.left, yPos, 30, 30);
    } catch (e) {
      console.warn("Could not add logo:", e);
    }
  }

  // QR Code discret (droite - petit)
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", pageWidth - margins.right - 20, yPos, 20, 20);
    } catch (e) {
      console.warn("Could not add QR code:", e);
    }
  }

  // Texte en-tête (centré)
  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.secondary);
  doc.text("RÉPUBLIQUE DE CÔTE D'IVOIRE", pageWidth / 2, yPos + 5, { align: "center" });
  doc.text("Union - Discipline - Travail", pageWidth / 2, yPos + 10, { align: "center" });
  doc.setFontSize(fonts.small + 1);
  doc.setTextColor(...colors.primary);
  doc.text("AUTORITÉ DE RÉGULATION DES", pageWidth / 2, yPos + 18, { align: "center" });
  doc.text("TÉLÉCOMMUNICATIONS DE CÔTE D'IVOIRE", pageWidth / 2, yPos + 23, { align: "center" });

  yPos += 35;

  // Ligne séparatrice
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(margins.left, yPos, pageWidth - margins.right, yPos);
  yPos += 10;

  // ─────────────────────────────────────────────────────────────────────────
  // BLOC TABLEAU D'INFORMATIONS
  // ─────────────────────────────────────────────────────────────────────────

  // Titre
  doc.setFontSize(fonts.title);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("NOTE DE SERVICE", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Tableau d'informations principales
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ["N° Référence", note.reference || "-", "Date", formatDateFr(note.date_note)],
      [
        "Destinataire",
        note.destinataire || "-",
        "Direction",
        note.direction?.label || note.direction?.sigle || "-",
      ],
      ["Objet", { content: note.objet || "-", colSpan: 3 }],
      [
        "Nom & Prénoms",
        note.nom_prenoms || "Le Directeur Général",
        "Nb. pages",
        String(note.nb_pages || 1),
      ],
    ],
    styles: {
      fontSize: fonts.body,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 35, fillColor: colors.lightGray },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", cellWidth: 30, fillColor: colors.lightGray },
      3: { cellWidth: 50 },
    },
    theme: "grid",
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ─────────────────────────────────────────────────────────────────────────
  // CORPS DE LA NOTE
  // ─────────────────────────────────────────────────────────────────────────

  // Exposé
  if (note.expose) {
    doc.setFontSize(fonts.subtitle);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("EXPOSÉ", margins.left, yPos);
    yPos += 6;

    doc.setFontSize(fonts.body);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    const exposeLines = doc.splitTextToSize(
      note.expose,
      pageWidth - margins.left - margins.right
    );
    doc.text(exposeLines, margins.left, yPos);
    yPos += exposeLines.length * 5 + 8;
  }

  // Avis
  if (note.avis) {
    doc.setFontSize(fonts.subtitle);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("AVIS", margins.left, yPos);
    yPos += 6;

    doc.setFontSize(fonts.body);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    const avisLines = doc.splitTextToSize(note.avis, pageWidth - margins.left - margins.right);
    doc.text(avisLines, margins.left, yPos);
    yPos += avisLines.length * 5 + 8;
  }

  // Recommandations
  if (note.recommandations) {
    doc.setFontSize(fonts.subtitle);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("RECOMMANDATIONS", margins.left, yPos);
    yPos += 6;

    doc.setFontSize(fonts.body);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    const recoLines = doc.splitTextToSize(
      note.recommandations,
      pageWidth - margins.left - margins.right
    );
    doc.text(recoLines, margins.left, yPos);
    yPos += recoLines.length * 5 + 10;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TABLEAU D'IMPUTATION
  // ─────────────────────────────────────────────────────────────────────────

  if (imputations.length > 0) {
    // Vérifier si on a besoin d'une nouvelle page
    if (yPos > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      yPos = margins.top;
    }

    doc.setFontSize(fonts.subtitle);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("INFORMATIONS D'IMPUTATION", margins.left, yPos);
    yPos += 6;

    const imputationData = imputations.map((imp, idx) => [
      String(idx + 1),
      imp.destinataire,
      imp.direction?.sigle || imp.direction?.label || "-",
      INSTRUCTION_TYPES[imp.instruction_type as InstructionType] || imp.instruction_type,
      PRIORITES[(imp.priorite as ImputationPriorite) || "normale"],
      imp.delai ? formatDateShort(imp.delai) : "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["N°", "Destinataire", "Direction", "Instruction", "Priorité", "Délai"]],
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
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25, halign: "center" },
      },
      theme: "grid",
      margin: { left: margins.left, right: margins.right },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PIED DE PAGE - SIGNATURE
  // ─────────────────────────────────────────────────────────────────────────

  // Zone signature (bas de page)
  const signatureY = doc.internal.pageSize.getHeight() - 40;

  if (yPos < signatureY - 10) {
    doc.setFontSize(fonts.body);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);

    // Lieu et date
    const today = formatDateFr(new Date());
    doc.text(`Abidjan, le ${today}`, pageWidth - margins.right - 60, signatureY);

    // Titre signataire
    doc.setFont("helvetica", "bold");
    doc.text("Le Directeur Général", pageWidth - margins.right - 60, signatureY + 8);

    // Nom
    if (note.nom_prenoms) {
      doc.setFont("helvetica", "normal");
      doc.text(note.nom_prenoms, pageWidth - margins.right - 60, signatureY + 20);
    }
  }

  return yPos;
}

// ============================================================================
// GÉNÉRATION PDF - PAGE 2 (OBSERVATIONS DU DG)
// ============================================================================

async function generatePage2(
  doc: jsPDF,
  note: NoteDirectionGenerale,
  qrDataUrl: string,
  qrVerificationUrl: string
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

  yPos += 25;

  // Ligne décorative
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(1);
  doc.line(margins.left + 40, yPos, pageWidth - margins.right - 40, yPos);
  yPos += 15;

  // Référence de la note
  doc.setFontSize(fonts.body);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);
  doc.text(`Réf: ${note.reference || "N/A"}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;
  doc.text(`Objet: ${note.objet || "N/A"}`, pageWidth / 2, yPos, { align: "center" });

  yPos += 20;

  // ─────────────────────────────────────────────────────────────────────────
  // TABLEAU DATE / OBSERVATIONS
  // ─────────────────────────────────────────────────────────────────────────

  const validationDate = note.signed_at ? formatDateFr(note.signed_at) : formatDateFr(new Date());
  const validatorName =
    note.signed_by_profile?.first_name && note.signed_by_profile?.last_name
      ? `${note.signed_by_profile.first_name} ${note.signed_by_profile.last_name}`
      : "Le Directeur Général";

  autoTable(doc, {
    startY: yPos,
    head: [["Date", "Informations sur la validation du DG"]],
    body: [
      [
        `Abidjan, le ${validationDate}`,
        `Note validée par: ${validatorName}\n\nStatut: ${
          note.statut === "dg_valide" || note.statut === "diffusee" ? "VALIDÉE" : note.statut?.toUpperCase()
        }\n\n${note.observations_dg || "Aucune observation particulière."}`,
      ],
    ],
    styles: {
      fontSize: fonts.body,
      cellPadding: 8,
      valign: "top",
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 50, halign: "center" },
      1: { cellWidth: 120 },
    },
    theme: "grid",
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // ─────────────────────────────────────────────────────────────────────────
  // QR CODE DE VÉRIFICATION (VISIBLE)
  // ─────────────────────────────────────────────────────────────────────────

  // Cadre pour le QR
  const qrSize = 50;
  const qrX = pageWidth / 2 - qrSize / 2;
  const qrY = pageHeight - margins.bottom - qrSize - 40;

  // Texte au-dessus du QR
  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.secondary);
  doc.text("Scannez ce QR Code pour vérifier l'authenticité", pageWidth / 2, qrY - 10, {
    align: "center",
  });

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
  doc.setTextColor(...colors.secondary);
  doc.text(qrVerificationUrl, pageWidth / 2, qrY + qrSize + 8, { align: "center" });

  // Note de sécurité
  doc.setFontSize(fonts.small - 1);
  doc.text(
    "Ce document est authentifié électroniquement. Toute falsification est passible de poursuites.",
    pageWidth / 2,
    qrY + qrSize + 16,
    { align: "center" }
  );
}

// ============================================================================
// FONCTION PRINCIPALE DE GÉNÉRATION
// ============================================================================

export async function generateNoteDGPdf(
  options: GeneratePdfOptions
): Promise<PdfGenerationResult> {
  const { note, imputations, qrToken, baseUrl = window.location.origin } = options;

  // URL de vérification
  const verificationUrl = `${baseUrl}/verification/note-dg/${qrToken}`;

  // Générer le QR Code
  const qrDataUrl = await generateQRCodeDataUrl(verificationUrl, 150);

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
  await generatePage1(doc, note, imputations, qrDataUrl, logoDataUrl);

  // Page 2: Observations du DG
  await generatePage2(doc, note, qrDataUrl, verificationUrl);

  // Ajouter métadonnées
  doc.setProperties({
    title: `Note DG - ${note.reference || "Brouillon"}`,
    subject: note.objet || "",
    author: "ARTI - SYGFP",
    creator: "SYGFP - Système de Gestion des Finances Publiques",
    keywords: "note, DG, ARTI, officiel",
  });

  // Générer le blob
  const blob = doc.output("blob");
  const filename = `ARTI_NOTE_DG_${note.reference || "DRAFT"}_${format(
    new Date(),
    "yyyyMMdd_HHmmss"
  )}.pdf`;

  return { blob, filename };
}

// ============================================================================
// FONCTION DE TÉLÉCHARGEMENT DIRECT
// ============================================================================

export async function downloadNoteDGPdf(options: GeneratePdfOptions): Promise<void> {
  const { blob, filename } = await generateNoteDGPdf(options);

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
// HOOK POUR UTILISATION DANS LES COMPOSANTS
// ============================================================================

export { type GeneratePdfOptions, type PdfGenerationResult };
