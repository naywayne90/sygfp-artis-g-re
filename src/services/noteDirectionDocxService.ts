/**
 * Service de generation Word (.docx) pour les Notes Direction (canvas)
 *
 * Reproduit le format ARTI officiel avec:
 * - En-tete avec logos et devise
 * - Tableaux colores (bleu #1F4E79 / #D6E3F0)
 * - Sections structurees (identification, description, expose, avis, etc.)
 * - Zone observations DG + decision + signature
 */

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
  BorderStyle,
  ShadingType,
  TableLayoutType,
} from 'docx';
import { saveAs } from 'file-saver';
import { NoteDirection } from '@/hooks/useNotesDirection';
import { NoteCanvasMetadata } from '@/hooks/useNoteCanvas';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// TYPES
// ============================================================================

interface GenerateDocxOptions {
  note: NoteDirection;
  metadata: NoteCanvasMetadata;
  editorContent: string;
  directionLabel: string;
  directionSigle: string;
}

// ============================================================================
// COLORS
// ============================================================================

const COLORS = {
  primaryDark: '1F4E79',
  primaryLight: 'D6E3F0',
  white: 'FFFFFF',
  black: '000000',
};

// ============================================================================
// HELPERS
// ============================================================================

const THIN_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.primaryDark },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.primaryDark },
  left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.primaryDark },
  right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.primaryDark },
} as const;

function formatDateFr(date: string | Date | null): string {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
  } catch {
    return '-';
  }
}

function createLabelCell(text: string, colSpan?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20 })],
      }),
    ],
    shading: {
      type: ShadingType.CLEAR,
      fill: COLORS.primaryLight,
    },
    borders: THIN_BORDER,
    columnSpan: colSpan,
    width: colSpan ? undefined : { size: 2800, type: WidthType.DXA },
  });
}

function createValueCell(text: string, colSpan?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20 })],
      }),
    ],
    borders: THIN_BORDER,
    columnSpan: colSpan,
  });
}

function createHeaderCell(text: string, colSpan?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: COLORS.white, size: 22 })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: {
      type: ShadingType.CLEAR,
      fill: COLORS.primaryDark,
    },
    borders: THIN_BORDER,
    columnSpan: colSpan,
  });
}

/**
 * Extract sections from HTML content
 */
function extractSections(html: string): {
  expose: string;
  avis: string;
  recommandations: string;
  fullText: string;
} {
  const div = document.createElement('div');
  div.innerHTML = html;

  const sections: Record<string, string> = {};
  let currentSection = '';
  let fullText = '';

  for (const child of Array.from(div.childNodes)) {
    const el = child as HTMLElement;
    const text = el.textContent?.trim() || '';
    fullText += text + '\n';

    if (el.tagName === 'H2' || el.tagName === 'H1') {
      const sectionName = text.toLowerCase();
      if (sectionName.includes('expos')) currentSection = 'expose';
      else if (sectionName.includes('avis')) currentSection = 'avis';
      else if (sectionName.includes('recommandation')) currentSection = 'recommandations';
      else currentSection = sectionName;
    } else if (currentSection && text) {
      sections[currentSection] = (sections[currentSection] || '') + text + '\n';
    }
  }

  return {
    expose: sections['expose']?.trim() || '',
    avis: sections['avis']?.trim() || '',
    recommandations: sections['recommandations']?.trim() || '',
    fullText: fullText.trim(),
  };
}

/**
 * Convert a long text into multiple Paragraph objects
 */
function textToParagraphs(text: string): Paragraph[] {
  if (!text) return [new Paragraph({})];
  return text.split('\n').map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line, size: 20 })],
        spacing: { after: 100 },
      })
  );
}

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

function buildEnTete(): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
      children: [
        new TextRun({
          text: "REPUBLIQUE DE COTE D'IVOIRE",
          bold: true,
          size: 18,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: 'Union - Discipline - Travail',
          italics: true,
          size: 18,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
      children: [
        new TextRun({
          text: '-------------------------------------------',
          size: 16,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'AUTORITE DE REGULATION DU TRANSPORT INTERIEUR',
          bold: true,
          color: COLORS.primaryDark,
          size: 22,
        }),
      ],
    }),
  ];
}

function buildIdentificationTable(metadata: NoteCanvasMetadata, directionLabel: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      // Direction header row (full width, dark blue)
      new TableRow({
        children: [createHeaderCell(directionLabel.toUpperCase(), 2)],
      }),
      // Reference
      new TableRow({
        children: [createLabelCell('Reference plan'), createValueCell(metadata.reference || '-')],
      }),
      // Nom du plan
      new TableRow({
        children: [createLabelCell('Nom du plan'), createValueCell(metadata.objet || '-')],
      }),
      // Destinataire
      new TableRow({
        children: [createLabelCell('Destinataire'), createValueCell(metadata.destinataire || '-')],
      }),
    ],
  });
}

function buildDescriptionTable(metadata: NoteCanvasMetadata, directionLabel: string): Table | null {
  const rows: TableRow[] = [];

  if (directionLabel) {
    rows.push(
      new TableRow({
        children: [createLabelCell('Direction'), createValueCell(directionLabel)],
      })
    );
  }

  if (metadata.objectifsStrategiques) {
    rows.push(
      new TableRow({
        children: [createLabelCell('OS'), createValueCell(metadata.objectifsStrategiques)],
      })
    );
  }

  if (metadata.actionRattachement) {
    rows.push(
      new TableRow({
        children: [createLabelCell('ACTION'), createValueCell(metadata.actionRattachement)],
      })
    );
  }

  if (metadata.budgetPrevisionnel) {
    rows.push(
      new TableRow({
        children: [
          createLabelCell('Budget previsionnel du plan'),
          createValueCell(metadata.budgetPrevisionnel),
        ],
      })
    );
  }

  if (rows.length === 0) return null;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows,
  });
}

function buildContentTable(editorContent: string): Table {
  const sections = extractSections(editorContent);

  const rows: TableRow[] = [];

  const addRow = (label: string, content: string) => {
    if (!content) return;
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: label, bold: true, size: 20 })],
              }),
            ],
            shading: {
              type: ShadingType.CLEAR,
              fill: COLORS.primaryLight,
            },
            borders: THIN_BORDER,
            verticalAlign: 'top' as unknown as undefined,
            width: { size: 2800, type: WidthType.DXA },
          }),
          new TableCell({
            children: textToParagraphs(content),
            borders: THIN_BORDER,
          }),
        ],
      })
    );
  };

  addRow('Expose', sections.expose);
  addRow('Avis', sections.avis);
  addRow('Recommandations', sections.recommandations);

  // If no structured sections, use full text
  if (rows.length === 0 && sections.fullText) {
    addRow('Contenu', sections.fullText);
  }

  // Fallback empty row
  if (rows.length === 0) {
    rows.push(
      new TableRow({
        children: [createLabelCell('Contenu'), createValueCell('')],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows,
  });
}

function buildObservationsDGTable(metadata: NoteCanvasMetadata): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [createHeaderCell('OBSERVATIONS DU DIRECTEUR GENERAL')],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: metadata.observationsDg
              ? textToParagraphs(metadata.observationsDg)
              : [new Paragraph({}), new Paragraph({}), new Paragraph({}), new Paragraph({})],
            borders: THIN_BORDER,
          }),
        ],
      }),
    ],
  });
}

function buildDecisionSignatureTable(metadata: NoteCanvasMetadata): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'DATE', bold: true, size: 20 })],
              }),
            ],
            shading: { type: ShadingType.CLEAR, fill: COLORS.primaryLight },
            borders: THIN_BORDER,
            width: { size: 3000, type: WidthType.DXA },
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'DECISION', bold: true, size: 20 })],
              }),
            ],
            shading: { type: ShadingType.CLEAR, fill: COLORS.primaryLight },
            borders: THIN_BORDER,
            width: { size: 4000, type: WidthType.DXA },
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'SIGNATURE', bold: true, size: 20 })],
              }),
            ],
            shading: { type: ShadingType.CLEAR, fill: COLORS.primaryLight },
            borders: THIN_BORDER,
            width: { size: 3000, type: WidthType.DXA },
          }),
        ],
      }),
      // Values row
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: metadata.dateDecision
                      ? `Abidjan, le ${formatDateFr(metadata.dateDecision)}`
                      : 'Abidjan, le',
                    size: 20,
                  }),
                ],
              }),
            ],
            borders: THIN_BORDER,
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: metadata.decisionDg || '', size: 20 })],
              }),
            ],
            borders: THIN_BORDER,
          }),
          new TableCell({
            children: [
              ...(metadata.signataireTitre
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: metadata.signataireTitre, size: 20 })],
                    }),
                  ]
                : []),
              new Paragraph({}),
              new Paragraph({}),
              ...(metadata.signataireNom
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({ text: metadata.signataireNom, bold: true, size: 20 }),
                      ],
                    }),
                  ]
                : []),
            ],
            borders: THIN_BORDER,
          }),
        ],
      }),
    ],
  });
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

export async function generateNoteDirectionDocx(options: GenerateDocxOptions): Promise<Blob> {
  const { metadata, editorContent, directionLabel } = options;

  const children: (Paragraph | Table)[] = [];

  // En-tete ARTI
  children.push(...buildEnTete());

  // Identification
  children.push(buildIdentificationTable(metadata, directionLabel));
  children.push(new Paragraph({ spacing: { after: 200 } }));

  // Description (if any metadata fields are filled)
  const descTable = buildDescriptionTable(metadata, directionLabel);
  if (descTable) {
    children.push(descTable);
    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // Expose / Avis / Recommandations
  children.push(buildContentTable(editorContent));
  children.push(new Paragraph({ spacing: { after: 200 } }));

  // PJ mention
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({ text: 'PJ : ', bold: true, size: 20 }),
        new TextRun({
          text: 'Le plan detaille par activites et taches',
          size: 20,
        }),
      ],
    })
  );

  // Page break before observations
  children.push(
    new Paragraph({
      pageBreakBefore: true,
      children: [],
    })
  );

  // Observations DG
  children.push(buildObservationsDGTable(metadata));
  children.push(new Paragraph({ spacing: { after: 200 } }));

  // Decision / Signature
  children.push(buildDecisionSignatureTable(metadata));

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

// ============================================================================
// DOWNLOAD
// ============================================================================

export async function downloadNoteDirectionDocx(options: GenerateDocxOptions): Promise<void> {
  const { metadata, directionSigle } = options;
  const blob = await generateNoteDirectionDocx(options);

  const filename = `ARTI_NOTE_${directionSigle}_${metadata.reference || 'DRAFT'}_${format(
    new Date(),
    'yyyyMMdd_HHmmss'
  )}.docx`;

  saveAs(blob, filename);
}
