/**
 * Service d'export pour les passations de marché
 * - Excel multi-feuilles (4 sheets)
 * - PDF individuel (fiche marché)
 * - PDF PV COJO
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { PassationMarche, LotMarche, Soumissionnaire } from '@/hooks/usePassationsMarche';
import { MODES_PASSATION, STATUTS } from '@/hooks/usePassationsMarche';

// ── Helpers ──

const fmt = (montant: number | null): string =>
  montant ? new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA' : '-';

const fmtDate = (d: string | null): string => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
};

const modeName = (v: string): string => MODES_PASSATION.find((m) => m.value === v)?.label || v;

const statutName = (v: string): string => STATUTS[v]?.label || v;

// ── Excel: 4 sheets ──

export function exportPassationsExcel(
  passations: PassationMarche[],
  exercice?: number,
  activeFilters?: Record<string, string>
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Passations
  const passRows = passations.map((p) => ({
    Référence: p.reference || '-',
    Objet: p.expression_besoin?.objet || '-',
    Mode: modeName(p.mode_passation),
    Statut: statutName(p.statut),
    'Montant retenu': p.montant_retenu || '',
    'Montant estimé': p.expression_besoin?.montant_estime || '',
    Direction: p.expression_besoin?.direction?.sigle || '-',
    'Créé le': fmtDate(p.created_at),
    'Publié le': fmtDate(p.publie_at),
    'Attribué le': fmtDate(p.attribue_at),
    'Approuvé le': fmtDate(p.approuve_at),
  }));
  const ws1 = XLSX.utils.json_to_sheet(passRows);
  ws1['!cols'] = [
    { wch: 18 },
    { wch: 40 },
    { wch: 25 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Passations');

  // Sheet 2: Lots
  const lotRows: Record<string, unknown>[] = [];
  for (const p of passations) {
    const lots = (p.lots || []) as LotMarche[];
    for (const lot of lots) {
      lotRows.push({
        'Réf. passation': p.reference || '-',
        'N° Lot': lot.numero,
        Désignation: lot.designation,
        Description: lot.description || '-',
        'Montant estimé': lot.montant_estime || '',
      });
    }
  }
  if (lotRows.length === 0) {
    lotRows.push({
      'Réf. passation': 'Aucun lot',
      'N° Lot': '',
      Désignation: '',
      Description: '',
      'Montant estimé': '',
    });
  }
  const ws2 = XLSX.utils.json_to_sheet(lotRows);
  ws2['!cols'] = [{ wch: 18 }, { wch: 8 }, { wch: 30 }, { wch: 30 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Lots');

  // Sheet 3: Soumissionnaires
  const soumRows: Record<string, unknown>[] = [];
  for (const p of passations) {
    const soums = (p.soumissionnaires || []) as Soumissionnaire[];
    for (const s of soums) {
      soumRows.push({
        'Réf. passation': p.reference || '-',
        Entreprise: s.raison_sociale,
        'Offre financière': s.offre_financiere || '',
        Statut: s.statut,
        'Note technique': s.note_technique ?? '',
        'Note financière': s.note_financiere ?? '',
        'Note finale': s.note_finale ?? '',
        Rang: s.rang_classement ?? '',
      });
    }
  }
  if (soumRows.length === 0) {
    soumRows.push({
      'Réf. passation': 'Aucun soumissionnaire',
      Entreprise: '',
      'Offre financière': '',
      Statut: '',
      'Note technique': '',
      'Note financière': '',
      'Note finale': '',
      Rang: '',
    });
  }
  const ws3 = XLSX.utils.json_to_sheet(soumRows);
  ws3['!cols'] = [
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 6 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Soumissionnaires');

  // Sheet 4: Évaluation (ranked soumissionnaires with scores)
  const evalRows: Record<string, unknown>[] = [];
  for (const p of passations) {
    const soums = (p.soumissionnaires || []) as Soumissionnaire[];
    const evaluated = soums
      .filter((s) => s.note_technique !== null || s.note_finale !== null)
      .sort((a, b) => (a.rang_classement ?? 999) - (b.rang_classement ?? 999));
    for (const s of evaluated) {
      evalRows.push({
        'Réf. passation': p.reference || '-',
        Rang: s.rang_classement ?? '-',
        Entreprise: s.raison_sociale,
        'Note technique': s.note_technique ?? '',
        Qualifié: (s.note_technique ?? 0) >= 70 ? 'Oui' : 'Non',
        'Note financière': s.note_financiere ?? '',
        'Note finale': s.note_finale != null ? Number(s.note_finale).toFixed(2) : '',
        Statut: s.statut,
        'Motif élimination': s.motif_elimination || '',
      });
    }
  }
  if (evalRows.length === 0) {
    evalRows.push({
      'Réf. passation': 'Aucune évaluation',
      Rang: '',
      Entreprise: '',
      'Note technique': '',
      Qualifié: '',
      'Note financière': '',
      'Note finale': '',
      Statut: '',
      'Motif élimination': '',
    });
  }
  const ws4 = XLSX.utils.json_to_sheet(evalRows);
  ws4['!cols'] = [
    { wch: 18 },
    { wch: 6 },
    { wch: 30 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, 'Évaluation');

  // Generate and download
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filterSuffix = activeFilters?.onglet ? `_${activeFilters.onglet}` : '';
  a.download = `passations_marche${filterSuffix}_${exercice || ''}_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF: fiche marché individuelle ──

export function exportPassationPDF(pm: PassationMarche): void {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Header
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('ARTI - Autorité de Régulation du Transport Intérieur', 105, 15, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Système de Gestion des Finances Publiques (SYGFP)', 105, 20, { align: 'center' });

  // Blue line
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.8);
  doc.line(20, 24, 190, 24);

  // Title
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.text('Fiche Passation de Marché', 105, 33, { align: 'center' });

  // Reference
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(pm.reference || 'N/A', 105, 40, { align: 'center' });

  // Info table
  const infoBody = [
    ['Objet', pm.expression_besoin?.objet || '-'],
    ['Mode de passation', modeName(pm.mode_passation)],
    ['Statut', statutName(pm.statut)],
    ['Direction', pm.expression_besoin?.direction?.sigle || '-'],
    ['Montant estimé', fmt(pm.expression_besoin?.montant_estime ?? null)],
    ['Montant retenu', fmt(pm.montant_retenu)],
    ['Date publication', fmtDate(pm.publie_at)],
    ['Date clôture', fmtDate(pm.date_cloture)],
    ['Date attribution', fmtDate(pm.attribue_at)],
    ['Date approbation', fmtDate(pm.approuve_at)],
    ['Date signature', fmtDate(pm.signe_at)],
    ['Allotissement', pm.allotissement ? 'Oui' : 'Non'],
    ['Nombre de lots', String(((pm.lots || []) as LotMarche[]).length)],
    [
      'Nombre de soumissionnaires',
      String(((pm.soumissionnaires || []) as Soumissionnaire[]).length),
    ],
  ];

  if (pm.prestataire_retenu?.raison_sociale) {
    infoBody.push(['Prestataire retenu', pm.prestataire_retenu.raison_sociale]);
  }

  autoTable(doc, {
    startY: 46,
    head: [['Champ', 'Valeur']],
    body: infoBody,
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
  });

  let yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Soumissionnaires table
  const soums = (pm.soumissionnaires || []) as Soumissionnaire[];
  if (soums.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.text('Soumissionnaires', 20, yPos);
    yPos += 4;

    const soumBody = soums
      .sort((a, b) => (a.rang_classement ?? 999) - (b.rang_classement ?? 999))
      .map((s) => [
        s.rang_classement ?? '-',
        s.raison_sociale,
        fmt(s.offre_financiere),
        s.note_technique?.toFixed(1) ?? '-',
        s.note_financiere?.toFixed(1) ?? '-',
        s.note_finale?.toFixed(2) ?? '-',
        s.statut,
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Rang', 'Entreprise', 'Offre', 'Note Tech.', 'Note Fin.', 'Note Finale', 'Statut']],
      body: soumBody,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `SYGFP - Généré le ${new Date().toLocaleDateString('fr-FR')} - Page ${i}/${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(
    `fiche_passation_${pm.reference || 'N_A'}_${new Date().toISOString().split('T')[0]}.pdf`
  );
}

// ── PDF: PV COJO ──

export function exportPVCojoPDF(
  pvText: string,
  passation: PassationMarche,
  evaluations: Array<{
    raison_sociale: string;
    rang: number | null;
    note_technique: number | null;
    note_financiere: number | null;
    note_finale: number | null;
    statut: string;
    offre_financiere: number | null;
  }>
): void {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Header
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('ARTI - Autorité de Régulation du Transport Intérieur', 105, 15, { align: 'center' });
  doc.setFontSize(8);
  doc.text("Commission d'Ouverture, de Jugement et d'Attribution (COJO)", 105, 20, {
    align: 'center',
  });

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.8);
  doc.line(20, 24, 190, 24);

  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.text("PV d'évaluation des offres", 105, 33, { align: 'center' });

  // Passation info
  const infoBody = [
    ['Référence', passation.reference || 'N/A'],
    ['Objet', passation.expression_besoin?.objet || '-'],
    ['Mode de passation', modeName(passation.mode_passation)],
    ['Date', new Date().toLocaleDateString('fr-FR')],
  ];

  autoTable(doc, {
    startY: 38,
    head: [],
    body: infoBody,
    theme: 'plain',
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
  });

  let yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Classement table
  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175);
  doc.text('Classement des soumissionnaires', 20, yPos);
  yPos += 4;

  const ranked = evaluations
    .filter((e) => e.rang !== null)
    .sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0));
  const unranked = evaluations.filter((e) => e.rang === null);

  const allEval = [...ranked, ...unranked];

  if (allEval.length > 0) {
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
          'Statut',
        ],
      ],
      body: allEval.map((e) => [
        e.rang ?? '-',
        e.raison_sociale,
        fmt(e.offre_financiere),
        e.note_technique?.toFixed(1) ?? '-',
        e.note_financiere?.toFixed(1) ?? '-',
        e.note_finale?.toFixed(2) ?? '-',
        e.statut,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // Retenu
  const retenu = evaluations.find((e) => e.statut === 'retenu');
  if (retenu) {
    doc.setFontSize(10);
    doc.setTextColor(0, 128, 0);
    doc.text(`ATTRIBUTAIRE PROPOSÉ : ${retenu.raison_sociale}`, 20, yPos);
    yPos += 5;
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(`Offre financière : ${fmt(retenu.offre_financiere)}`, 20, yPos);
    yPos += 5;
    doc.text(`Note finale : ${retenu.note_finale?.toFixed(2) ?? 'N/A'}`, 20, yPos);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `PV COJO - ${passation.reference || ''} - Généré le ${new Date().toLocaleDateString('fr-FR')} - Page ${i}/${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`pv_cojo_${passation.reference || 'N_A'}_${new Date().toISOString().split('T')[0]}.pdf`);
}
