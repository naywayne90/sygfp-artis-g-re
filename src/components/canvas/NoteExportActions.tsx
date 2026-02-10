/**
 * NoteExportActions - Actions d'export pour le canvas de notes
 * Export PDF (jsPDF), Export Word (.docx), Impression directe
 */

import { useCallback, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import logoArtiSrc from '@/assets/logo-arti.jpg';
import type { NoteCanvasMetadata } from './NoteCanvasSidebar';

// ============================================
// TYPES
// ============================================

interface ExportOptions {
  content: string;
  metadata: NoteCanvasMetadata;
  directionLabel?: string;
}

// ============================================
// PDF EXPORT
// ============================================

async function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2d context unavailable'));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export async function exportNotePdf({ content, metadata, directionLabel }: ExportOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Load logo
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArtiSrc);
  } catch {
    // Logo unavailable, skip
  }

  // Header row
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'JPEG', margin, y, 30, 12);
  }

  // Center: ARTI name
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORITE DE REGULATION', pageWidth / 2, y + 4, { align: 'center' });
  doc.text('DU TRANSPORT INTERIEUR', pageWidth / 2, y + 8, { align: 'center' });

  // Right: Republic
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("REPUBLIQUE DE COTE D'IVOIRE", pageWidth - margin, y + 4, { align: 'right' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('Union - Discipline - Travail', pageWidth - margin, y + 8, { align: 'right' });

  y += 16;

  // Blue separator line
  doc.setDrawColor(31, 78, 121);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 3;

  // Direction label banner
  if (directionLabel) {
    doc.setFillColor(31, 78, 121);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(directionLabel.toUpperCase(), pageWidth / 2, y + 5, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 10;
  }

  // Metadata table
  const metaRows: [string, string][] = [];
  if (metadata.reference) metaRows.push(['Reference', metadata.reference]);
  if (metadata.dateNote) metaRows.push(['Date', metadata.dateNote]);
  if (metadata.expediteur) metaRows.push(['De', metadata.expediteur]);
  if (metadata.destinataire) metaRows.push(['A', metadata.destinataire]);
  if (metadata.objet) metaRows.push(['Objet', metadata.objet]);

  if (metaRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [],
      body: metaRows,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: {
          fontStyle: 'bold',
          cellWidth: 35,
          fillColor: [214, 227, 240] as [number, number, number],
        },
      },
      margin: { left: margin, right: margin },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // Body content (plain text)
  const plainText = stripHtml(content);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(plainText, contentWidth);
  for (const line of lines) {
    if (y > 270) {
      doc.addPage();
      y = margin;
    }
    doc.text(line as string, margin, y);
    y += 5;
  }

  // Observations DG section
  y += 8;
  if (y > 240) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(31, 78, 121);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVATIONS DU DIRECTEUR GENERAL', margin + 3, y + 5);
  doc.setTextColor(0, 0, 0);
  y += 7;

  // Empty box for observations
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, y, contentWidth, 30);
  y += 35;

  // Decision/Signature table
  autoTable(doc, {
    startY: y,
    head: [['DATE', 'DECISION', 'SIGNATURE']],
    body: [['Abidjan, le', '', '']],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3, minCellHeight: 20 },
    headStyles: {
      fillColor: [214, 227, 240] as [number, number, number],
      textColor: [0, 0, 0] as [number, number, number],
      fontStyle: 'bold',
    },
    margin: { left: margin, right: margin },
  });

  // Save
  const fileName = metadata.reference
    ? `${metadata.reference.replace(/\//g, '_')}.pdf`
    : `note_${metadata.objet?.substring(0, 30).replace(/\s+/g, '_') || 'arti'}.pdf`;
  doc.save(fileName);
  return fileName;
}

// ============================================
// WORD EXPORT
// ============================================

export async function exportNoteDocx({ content, metadata, directionLabel }: ExportOptions) {
  const plainText = stripHtml(content);

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      ...(metadata.reference ? [createMetaRow('Reference', metadata.reference)] : []),
      ...(metadata.dateNote ? [createMetaRow('Date', metadata.dateNote)] : []),
      ...(metadata.expediteur ? [createMetaRow('De', metadata.expediteur)] : []),
      ...(metadata.destinataire ? [createMetaRow('A', metadata.destinataire)] : []),
      ...(metadata.objet ? [createMetaRow('Objet', metadata.objet)] : []),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [
          // Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'AUTORITE DE REGULATION DU TRANSPORT INTERIEUR',
                bold: true,
                size: 22,
                color: '1F4E79',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: "REPUBLIQUE DE COTE D'IVOIRE",
                bold: true,
                size: 18,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Union - Discipline - Travail',
                italics: true,
                size: 18,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          // Direction label
          ...(directionLabel
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  shading: { type: ShadingType.SOLID, color: '1F4E79' },
                  children: [
                    new TextRun({
                      text: directionLabel.toUpperCase(),
                      bold: true,
                      size: 20,
                      color: 'FFFFFF',
                    }),
                  ],
                }),
              ]
            : []),
          new Paragraph({ text: '' }),
          // Metadata table
          metaTable,
          new Paragraph({ text: '' }),
          // Body content
          ...plainText
            .split('\n')
            .filter(Boolean)
            .map(
              (line) =>
                new Paragraph({
                  children: [new TextRun({ text: line, size: 22 })],
                  spacing: { after: 120 },
                })
            ),
          new Paragraph({ text: '' }),
          // Observations DG
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: '1F4E79' },
            children: [
              new TextRun({
                text: 'OBSERVATIONS DU DIRECTEUR GENERAL',
                bold: true,
                size: 20,
                color: 'FFFFFF',
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          // Decision table
          createDecisionTable(),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = metadata.reference
    ? `${metadata.reference.replace(/\//g, '_')}.docx`
    : `note_${metadata.objet?.substring(0, 30).replace(/\s+/g, '_') || 'arti'}.docx`;
  saveAs(blob, fileName);
  return fileName;
}

function createMetaRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: 'D6E3F0' },
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 20 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 75, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            children: [new TextRun({ text: value, size: 20 })],
          }),
        ],
      }),
    ],
  });
}

function createDecisionTable(): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ['DATE', 'DECISION', 'SIGNATURE'].map(
          (text) =>
            new TableCell({
              shading: { type: ShadingType.SOLID, color: 'D6E3F0' },
              children: [
                new Paragraph({
                  children: [new TextRun({ text, bold: true, size: 20 })],
                }),
              ],
            })
        ),
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Abidjan, le', size: 20 })],
              }),
            ],
          }),
          new TableCell({ children: [new Paragraph({ text: '' })] }),
          new TableCell({ children: [new Paragraph({ text: '' })] }),
        ],
      }),
    ],
  });
}

// ============================================
// PRINT
// ============================================

export function printNote() {
  window.print();
}

// ============================================
// REACT HOOK
// ============================================

export function useNoteExportActions(options: ExportOptions) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = useCallback(async () => {
    setIsExporting(true);
    try {
      const fileName = await exportNotePdf(options);
      toast.success(`PDF exporte: ${fileName}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Erreur export PDF: ${msg}`);
    } finally {
      setIsExporting(false);
    }
  }, [options]);

  const handleExportWord = useCallback(async () => {
    setIsExporting(true);
    try {
      const fileName = await exportNoteDocx(options);
      toast.success(`Document Word exporte: ${fileName}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Erreur export Word: ${msg}`);
    } finally {
      setIsExporting(false);
    }
  }, [options]);

  const handlePrint = useCallback(() => {
    printNote();
  }, []);

  return {
    isExporting,
    handleExportPdf,
    handleExportWord,
    handlePrint,
  };
}
