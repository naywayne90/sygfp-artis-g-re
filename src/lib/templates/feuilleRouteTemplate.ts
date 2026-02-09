/**
 * Generateur de template Excel pour les feuilles de route des directions
 * Format professionnel conforme a la charte ARTI
 */

import * as XLSX from 'xlsx';

interface ActionRef {
  code: string;
  libelle: string;
}

const PRIORITIES = ['Basse', 'Normale', 'Haute', 'Critique'] as const;

/**
 * Genere un template Excel de feuille de route pour une direction
 */
export function generateFeuilleRouteTemplate(
  directionCode: string,
  directionLabel: string,
  exercice: number,
  actions: ActionRef[]
): Blob {
  const wb = XLSX.utils.book_new();

  // --- Feuille 1: Feuille de Route ---
  const mainSheet = createMainSheet(directionCode, directionLabel, exercice, actions);
  XLSX.utils.book_append_sheet(wb, mainSheet, 'Feuille de Route');

  // --- Feuille 2: Instructions ---
  const instructionsSheet = createInstructionsSheet();
  XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');

  // --- Feuille 3: Referentiel Actions ---
  const refSheet = createReferentielSheet(actions);
  XLSX.utils.book_append_sheet(wb, refSheet, 'Referentiel Actions');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ============================================================================
// FEUILLE PRINCIPALE
// ============================================================================

function createMainSheet(
  directionCode: string,
  directionLabel: string,
  exercice: number,
  actions: ActionRef[]
): XLSX.WorkSheet {
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const rows: (string | number | null)[][] = [];

  // Header rows
  rows.push(['FEUILLE DE ROUTE - SYGFP']); // Row 0
  rows.push([`Direction: ${directionCode} - ${directionLabel}`]); // Row 1
  rows.push([`Exercice: ${exercice}`]); // Row 2
  rows.push([`Date de generation: ${dateStr}`]); // Row 3
  rows.push([]); // Row 4 - empty separator

  // Column headers
  const headers = [
    'Code Activite',
    'Libelle',
    'Code Action',
    'Description',
    'Responsable',
    'Date Debut',
    'Date Fin',
    'Montant Prevu (FCFA)',
    'Priorite',
  ];
  rows.push(headers); // Row 5

  // 3 example rows
  const firstActionCode = actions.length > 0 ? actions[0].code : 'ACT-001';
  const firstActionLabel = actions.length > 0 ? actions[0].libelle : 'Action exemple';

  rows.push([
    `${directionCode}-ACT-001`,
    'Activite exemple 1',
    firstActionCode,
    firstActionLabel,
    'Nom du responsable',
    '01/01/' + exercice,
    '31/03/' + exercice,
    5000000,
    'Haute',
  ]);

  rows.push([
    `${directionCode}-ACT-002`,
    'Activite exemple 2',
    actions.length > 1 ? actions[1].code : 'ACT-002',
    actions.length > 1 ? actions[1].libelle : 'Action exemple 2',
    'Nom du responsable',
    '01/04/' + exercice,
    '30/06/' + exercice,
    3000000,
    'Normale',
  ]);

  rows.push([
    `${directionCode}-ACT-003`,
    'Activite exemple 3',
    actions.length > 2 ? actions[2].code : 'ACT-003',
    actions.length > 2 ? actions[2].libelle : 'Action exemple 3',
    'Nom du responsable',
    '01/07/' + exercice,
    '30/09/' + exercice,
    2000000,
    'Basse',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 18 }, // Code Activite
    { wch: 30 }, // Libelle
    { wch: 15 }, // Code Action
    { wch: 35 }, // Description
    { wch: 22 }, // Responsable
    { wch: 14 }, // Date Debut
    { wch: 14 }, // Date Fin
    { wch: 22 }, // Montant Prevu
    { wch: 12 }, // Priorite
  ];

  // Row heights
  ws['!rows'] = [
    { hpt: 28 }, // Titre
    { hpt: 20 }, // Direction
    { hpt: 20 }, // Exercice
    { hpt: 20 }, // Date
    { hpt: 12 }, // Separator
    { hpt: 22 }, // Headers
  ];

  // Merge cells for header rows
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Titre
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Direction
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }, // Exercice
    { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } }, // Date
  ];

  // Data validation for Priorite column (column I = index 8)
  // xlsx community edition has limited validation support, but we set it up
  ws['!dataValidation'] = [
    {
      ref: 'I7:I1000',
      type: 'list',
      formula1: `"${PRIORITIES.join(',')}"`,
    },
  ];

  // Number format for Montant column
  for (let r = 6; r <= 8; r++) {
    const cell = XLSX.utils.encode_cell({ r, c: 7 });
    if (ws[cell]) {
      ws[cell].z = '#,##0';
    }
  }

  return ws;
}

// ============================================================================
// FEUILLE INSTRUCTIONS
// ============================================================================

function createInstructionsSheet(): XLSX.WorkSheet {
  const rows: string[][] = [
    ['INSTRUCTIONS DE REMPLISSAGE'],
    [''],
    [
      "Ce template permet de saisir la feuille de route de votre direction pour l'exercice budgetaire en cours.",
    ],
    ['Veuillez remplir chaque colonne selon les indications ci-dessous.'],
    [''],
    ['COLONNES', 'DESCRIPTION', 'FORMAT / CONTRAINTES'],
    [
      'Code Activite',
      "Identifiant unique de l'activite dans votre direction",
      'Format libre, ex: DSI-ACT-001',
    ],
    ['Libelle', "Intitule court de l'activite", 'Texte libre, maximum 200 caracteres'],
    [
      'Code Action',
      "Code de l'action budgetaire de reference (voir feuille Referentiel)",
      'Doit correspondre a un code existant dans le referentiel',
    ],
    ['Description', "Description detaillee de l'activite a realiser", 'Texte libre'],
    ['Responsable', "Nom et prenom de la personne en charge de l'activite", 'Texte libre'],
    ['Date Debut', "Date de debut prevue de l'activite", 'Format: JJ/MM/AAAA'],
    ['Date Fin', "Date de fin prevue de l'activite", 'Format: JJ/MM/AAAA'],
    [
      'Montant Prevu (FCFA)',
      'Budget previsionnel pour cette activite en Francs CFA',
      'Nombre entier, sans separateur de milliers',
    ],
    [
      'Priorite',
      "Niveau de priorite de l'activite",
      'Valeurs autorisees: Basse, Normale, Haute, Critique',
    ],
    [''],
    ['REGLES IMPORTANTES'],
    ['- Les dates de debut doivent etre anterieures aux dates de fin.'],
    [
      '- Le code action doit correspondre a un code existant dans la feuille "Referentiel Actions".',
    ],
    ['- Les montants doivent etre des nombres entiers positifs.'],
    ['- Le champ Priorite accepte uniquement: Basse, Normale, Haute, Critique.'],
    ["- Supprimez les lignes d'exemple avant de soumettre votre feuille de route."],
    [''],
    ['CONTACT'],
    ['Pour toute question, contactez la DAAF ou le service DSI.'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 25 }, // Colonne
    { wch: 50 }, // Description
    { wch: 45 }, // Format
  ];

  ws['!rows'] = [
    { hpt: 28 }, // Titre
  ];

  // Merge title
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

  return ws;
}

// ============================================================================
// FEUILLE REFERENTIEL ACTIONS
// ============================================================================

function createReferentielSheet(actions: ActionRef[]): XLSX.WorkSheet {
  const rows: string[][] = [['REFERENTIEL DES ACTIONS BUDGETAIRES'], [''], ['Code', 'Libelle']];

  if (actions.length > 0) {
    for (const action of actions) {
      rows.push([action.code, action.libelle]);
    }
  } else {
    rows.push([
      '(aucune action disponible)',
      "Contactez l'administrateur pour configurer les actions",
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 20 }, // Code
    { wch: 60 }, // Libelle
  ];

  ws['!rows'] = [
    { hpt: 28 }, // Titre
  ];

  // Merge title
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

  return ws;
}
