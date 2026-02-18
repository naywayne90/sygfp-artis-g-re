/**
 * Générateur de PV COJO PDF professionnel
 * Avec en-tête ARTI, notes complètes, et proposition d'attribution
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { generatePDFHeader, loadImageAsDataUrl } from '@/lib/pdf/pdfHeader';
import { generatePDFFooter, generateSignatureTable } from '@/lib/pdf/pdfFooter';
import {
  PDF_COLORS,
  PDF_FONTS,
  PDF_MARGINS,
  PDF_PAGE,
  TABLE_STYLES,
  ORG_INFO,
} from '@/lib/pdf/pdfStyles';
import { computeEvaluations } from '@/components/passation-marche/EvaluationCOJO';
import type { PassationMarche, Soumissionnaire } from '@/hooks/usePassationsMarche';
import { MODES_PASSATION, STATUTS_SOUMISSIONNAIRE } from '@/hooks/usePassationsMarche';
import logoArtiUrl from '@/assets/logo-arti.jpg';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtCurrency = (n: number | null): string =>
  n ? new Intl.NumberFormat('fr-FR').format(n) + ' FCFA' : '-';

const modeName = (v: string): string => MODES_PASSATION.find((m) => m.value === v)?.label || v;

/**
 * Génère un canvas QR Code et retourne son data URL (PNG)
 */
async function generateQRCodeDataUrl(data: string, size: number = 150): Promise<string> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(
      createElement(QRCodeCanvas, {
        value: data,
        size: size,
        level: 'H',
        includeMargin: true,
      })
    );

    setTimeout(() => {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve('');
      }
      root.unmount();
      document.body.removeChild(container);
    }, 100);
  });
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

export async function generatePVCOJO(passation: PassationMarche): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let logoDataUrl: string | undefined;
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArtiUrl);
  } catch {
    // continue without logo
  }

  // QR Code pour marchés signés (contient référence, objet, prestataire, montant, date signature)
  let qrDataUrl = '';
  if (passation.statut === 'signe' && passation.reference) {
    try {
      const qrPayload = JSON.stringify({
        ref: passation.reference,
        objet: passation.expression_besoin?.objet || '',
        prestataire: passation.prestataire_retenu?.raison_sociale || '',
        montant: passation.montant_retenu || 0,
        date_signature: passation.signe_at || '',
        type: 'PV_COJO',
      });
      qrDataUrl = await generateQRCodeDataUrl(qrPayload, 150);
    } catch {
      // continue without QR code
    }
  }

  // ── 1. En-tête ARTI ──
  const { endY } = generatePDFHeader({ doc, logoDataUrl });
  let yPos = endY;

  // ── 2. Titre ──
  doc.setFontSize(PDF_FONTS.size.title);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text("PROCÈS-VERBAL DE LA COMMISSION D'OUVERTURE", PDF_PAGE.width / 2, yPos, {
    align: 'center',
  });
  yPos += 6;
  doc.text('ET DE JUGEMENT DES OFFRES (COJO)', PDF_PAGE.width / 2, yPos, { align: 'center' });
  yPos += 10;

  // ── 3. Référence et objet ──
  doc.setFontSize(PDF_FONTS.size.body);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.text);

  const infoLines = [
    [`Référence :`, passation.reference || 'N/A'],
    [`Objet :`, passation.expression_besoin?.objet || 'N/A'],
    [`Mode de passation :`, modeName(passation.mode_passation)],
    [
      `Date :`,
      passation.attribue_at
        ? new Date(passation.attribue_at).toLocaleDateString('fr-FR')
        : new Date().toLocaleDateString('fr-FR'),
    ],
  ];

  for (const [label, value] of infoLines) {
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.text(label, PDF_MARGINS.left, yPos);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
    doc.text(value, PDF_MARGINS.left + 42, yPos);
    yPos += 6;
  }
  yPos += 4;

  // ── 4. Membres du COJO ──
  doc.setDrawColor(...PDF_COLORS.primary);
  doc.setLineWidth(0.3);
  doc.line(PDF_MARGINS.left, yPos, PDF_PAGE.width - PDF_MARGINS.right, yPos);
  yPos += 6;

  doc.setFontSize(PDF_FONTS.size.subtitle);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('I. MEMBRES DE LA COMMISSION', PDF_MARGINS.left, yPos);
  yPos += 7;

  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.text);
  const membresText =
    "La Commission d'Ouverture et de Jugement des Offres (COJO) s'est réunie conformément " +
    "aux dispositions du Code des Marchés Publics. La commission a procédé à l'ouverture " +
    "et à l'évaluation des offres reçues dans le cadre de la présente consultation.";
  const membresLines = doc.splitTextToSize(
    membresText,
    PDF_PAGE.width - PDF_MARGINS.left - PDF_MARGINS.right
  );
  doc.text(membresLines, PDF_MARGINS.left, yPos);
  yPos += membresLines.length * 4.5 + 6;

  // ── 5. Tableau des notes ──
  doc.setFontSize(PDF_FONTS.size.subtitle);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text("II. TABLEAU D'ÉVALUATION DES OFFRES", PDF_MARGINS.left, yPos);
  yPos += 7;

  const soumissionnaires = (passation.soumissionnaires || []) as Soumissionnaire[];
  const evaluations = computeEvaluations(soumissionnaires);

  const tableBody = evaluations.map((ev) => {
    const s = ev.soumissionnaire;
    const statutLabel = STATUTS_SOUMISSIONNAIRE[s.statut]?.label || s.statut;
    return [
      ev.rang !== null ? String(ev.rang) : '-',
      s.raison_sociale,
      fmtCurrency(s.offre_financiere),
      s.note_technique !== null ? s.note_technique.toFixed(1) : '-',
      s.note_financiere !== null ? s.note_financiere.toFixed(1) : '-',
      ev.noteFinale !== null ? ev.noteFinale.toFixed(2) : '-',
      ev.isQualifie ? 'Oui' : 'Non',
      statutLabel,
    ];
  });

  const qualifiedCount = evaluations.filter((e) => e.isQualifie).length;
  const totalCount = evaluations.length;

  autoTable(doc, {
    startY: yPos,
    head: [
      [
        'Rang',
        'Entreprise',
        'Offre financière',
        'Note Tech.',
        'Note Fin.',
        'Note Finale',
        'Qualifié',
        'Statut',
      ],
    ],
    body: tableBody,
    foot: [['', `${qualifiedCount} qualifié(s) / ${totalCount} total`, '', '', '', '', '', '']],
    theme: 'grid',
    styles: {
      fontSize: TABLE_STYLES.compact.fontSize,
      cellPadding: TABLE_STYLES.compact.cellPadding,
      lineWidth: TABLE_STYLES.default.lineWidth,
      lineColor: TABLE_STYLES.default.lineColor,
      textColor: TABLE_STYLES.default.textColor,
    },
    headStyles: {
      fillColor: TABLE_STYLES.head.fillColor,
      textColor: TABLE_STYLES.head.textColor,
      fontStyle: TABLE_STYLES.head.fontStyle,
      halign: TABLE_STYLES.head.halign,
    },
    footStyles: {
      fillColor: PDF_COLORS.headerBg,
      textColor: PDF_COLORS.text,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 35 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 16 },
      7: { cellWidth: 22 },
    },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 30;
  yPos += 10;

  // ── 6. Proposition d'attribution ──
  if (yPos > PDF_PAGE.height - 80) {
    generatePDFFooter({ doc, pageNumber: doc.getNumberOfPages(), totalPages: 0 });
    doc.addPage();
    const { endY: newEndY } = generatePDFHeader({ doc, logoDataUrl });
    yPos = newEndY;
  }

  doc.setFontSize(PDF_FONTS.size.subtitle);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text("III. PROPOSITION D'ATTRIBUTION", PDF_MARGINS.left, yPos);
  yPos += 8;

  const retenu = evaluations.find((e) => e.soumissionnaire.statut === 'retenu');

  doc.setFontSize(PDF_FONTS.size.body);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.text);

  if (retenu) {
    const propositionText =
      `Au vu des résultats ci-dessus, la Commission propose d'attribuer le marché à : ` +
      `${retenu.soumissionnaire.raison_sociale} pour un montant de ` +
      `${fmtCurrency(retenu.soumissionnaire.offre_financiere)}.`;

    const propLines = doc.splitTextToSize(
      propositionText,
      PDF_PAGE.width - PDF_MARGINS.left - PDF_MARGINS.right
    );
    doc.text(propLines, PDF_MARGINS.left, yPos);
    yPos += propLines.length * 5 + 4;

    const motivationText =
      `Cette proposition est motivée par l'obtention de la meilleure note finale ` +
      `(${retenu.noteFinale?.toFixed(2) ?? 'N/A'}) et la satisfaction de tous les critères de qualification.`;

    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.italic);
    const motLines = doc.splitTextToSize(
      motivationText,
      PDF_PAGE.width - PDF_MARGINS.left - PDF_MARGINS.right
    );
    doc.text(motLines, PDF_MARGINS.left, yPos);
    yPos += motLines.length * 5 + 4;
  } else {
    doc.text(
      "Aucun attributaire n'a encore été désigné pour cette passation.",
      PDF_MARGINS.left,
      yPos
    );
    yPos += 8;
  }

  yPos += 6;

  // ── 6b. QR Code de vérification (marchés signés uniquement) ──
  if (qrDataUrl) {
    if (yPos > PDF_PAGE.height - 80) {
      generatePDFFooter({ doc, pageNumber: doc.getNumberOfPages(), totalPages: 0 });
      doc.addPage();
      const { endY: newEndY } = generatePDFHeader({ doc, logoDataUrl });
      yPos = newEndY;
    }

    doc.setFontSize(PDF_FONTS.size.subtitle);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text('IV. VÉRIFICATION DU DOCUMENT', PDF_MARGINS.left, yPos);
    yPos += 7;

    try {
      doc.addImage(qrDataUrl, 'PNG', PDF_MARGINS.left, yPos, 30, 30);
    } catch {
      // QR image failed
    }

    doc.setFontSize(PDF_FONTS.size.small);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
    doc.setTextColor(...PDF_COLORS.text);
    const qrInfoX = PDF_MARGINS.left + 35;
    doc.text(`Référence : ${passation.reference || 'N/A'}`, qrInfoX, yPos + 6);
    if (passation.prestataire_retenu) {
      doc.text(`Attributaire : ${passation.prestataire_retenu.raison_sociale}`, qrInfoX, yPos + 12);
    }
    doc.text(`Montant : ${fmtCurrency(passation.montant_retenu)}`, qrInfoX, yPos + 18);
    if (passation.signe_at) {
      doc.text(
        `Signé le : ${new Date(passation.signe_at).toLocaleDateString('fr-FR')}`,
        qrInfoX,
        yPos + 24
      );
    }
    doc.setFontSize(PDF_FONTS.size.small - 1);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text("Scannez ce QR code pour vérifier l'authenticité du document", qrInfoX, yPos + 30);
    yPos += 38;
  }

  // ── 7. Signature DG ──
  if (yPos > PDF_PAGE.height - 60) {
    generatePDFFooter({ doc, pageNumber: doc.getNumberOfPages(), totalPages: 0 });
    doc.addPage();
    const { endY: newEndY } = generatePDFHeader({ doc, logoDataUrl });
    yPos = newEndY;
  }

  generateSignatureTable({
    doc,
    startY: yPos,
    signataires: [
      {
        titre: 'Le Président de la COJO',
        direction: 'Président COJO',
      },
      {
        titre: 'Le Directeur Général',
        direction: `Le Directeur Général de l'${ORG_INFO.shortName}`,
      },
    ],
  });

  // ── 8. Footers on all pages ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    generatePDFFooter({
      doc,
      pageNumber: p,
      totalPages,
      qrCodeDataUrl: qrDataUrl || undefined,
      showSecurityNote: p === totalPages && !!qrDataUrl,
    });
  }

  doc.save(`PV_COJO_${passation.reference || 'N_A'}_${new Date().toISOString().split('T')[0]}.pdf`);
}
