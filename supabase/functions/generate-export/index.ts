/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion, no-console */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
interface ExportRequest {
  type: 'excel' | 'csv' | 'pdf';
  entity_type: string;
  entity_id?: string;
  exercice: number;
  filters?: Record<string, unknown>;
  include_referentiels?: boolean;
}

interface BudgetLine {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  dotation_modifiee: number | null;
  disponible_calcule: number | null;
  total_engage: number | null;
  direction?: { code: string; sigle: string } | null;
  objectif_strategique?: { code: string; libelle: string } | null;
  mission?: { code: string; libelle: string } | null;
  action?: { code: string; libelle: string } | null;
  activite?: { code: string; libelle: string } | null;
  sous_activite?: { code: string; libelle: string } | null;
  nomenclature_nbe?: { code: string; libelle: string } | null;
  plan_comptable_sysco?: { code: string; libelle: string } | null;
  source_financement: string | null;
  commentaire: string | null;
  created_at: string;
}

// Helper to format amounts
const formatAmount = (amount: number | null): string => {
  if (amount === null || amount === undefined) return '0';
  return amount.toString();
};

// Helper to format date
const formatDate = (date: string | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR');
};

// Generate CSV content
function generateCSV(lines: BudgetLine[]): string {
  const headers = [
    'Code',
    'Libellé',
    'Dotation Initiale',
    'Dotation Modifiée',
    'Disponible',
    'Engagé',
    'Direction',
    'OS',
    'Mission',
    'Action',
    'Activité',
    'Sous-activité',
    'NBE',
    'SYSCO',
    'Source Financement',
    'Commentaire',
    'Date Création',
  ];

  const rows = lines.map((line) => [
    `"${line.code || ''}"`,
    `"${(line.label || '').replace(/"/g, '""')}"`,
    formatAmount(line.dotation_initiale),
    formatAmount(line.dotation_modifiee),
    formatAmount(line.disponible_calcule),
    formatAmount(line.total_engage),
    `"${line.direction?.sigle || ''}"`,
    `"${line.objectif_strategique?.code || ''}"`,
    `"${line.mission?.code || ''}"`,
    `"${line.action?.code || ''}"`,
    `"${line.activite?.code || ''}"`,
    `"${line.sous_activite?.code || ''}"`,
    `"${line.nomenclature_nbe?.code || ''}"`,
    `"${line.plan_comptable_sysco?.code || ''}"`,
    `"${line.source_financement || ''}"`,
    `"${(line.commentaire || '').replace(/"/g, '""')}"`,
    formatDate(line.created_at),
  ]);

  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
}

// Generate CSV for engagement list export
function generateEngagementCSV(engagements: any[]): string {
  const headers = [
    'N° Engagement',
    'Date',
    'Objet',
    'Fournisseur',
    'Montant TTC',
    'Montant HT',
    'TVA',
    'Type',
    'Statut',
    'Étape Workflow',
    'Imputation (Code)',
    'Imputation (Libellé)',
    'Direction',
    'Visa SAF',
    'Visa CB',
    'Visa DAAF',
    'Visa DG',
    'Montant Dégagé',
    'Motif Dégagement',
    'Créé par',
    'Date Création',
  ];

  const rows = engagements.map((e: any) => [
    `"${e.numero || ''}"`,
    formatDate(e.date_engagement),
    `"${(e.objet || '').replace(/"/g, '""')}"`,
    `"${(e.fournisseur || e.prestataire_nom || '').replace(/"/g, '""')}"`,
    formatAmount(e.montant),
    formatAmount(e.montant_ht),
    formatAmount(e.tva),
    `"${e.type_engagement === 'sur_marche' ? 'Sur marché' : 'Hors marché'}"`,
    `"${e.statut || ''}"`,
    `"${e.workflow_status || ''}"`,
    `"${e.budget_line_code || e.budget_line?.code || ''}"`,
    `"${(e.budget_line_label || e.budget_line?.label || '').replace(/"/g, '""')}"`,
    `"${e.direction_sigle || e.budget_line?.direction?.sigle || ''}"`,
    e.visa_saf_date ? `"${formatDate(e.visa_saf_date)} (${e.visa_saf_user || ''})"` : '""',
    e.visa_cb_date ? `"${formatDate(e.visa_cb_date)} (${e.visa_cb_user || ''})"` : '""',
    e.visa_daaf_date ? `"${formatDate(e.visa_daaf_date)} (${e.visa_daaf_user || ''})"` : '""',
    e.visa_dg_date ? `"${formatDate(e.visa_dg_date)} (${e.visa_dg_user || ''})"` : '""',
    formatAmount(e.montant_degage),
    `"${(e.motif_degage || e.motif_degagement || '').replace(/"/g, '""')}"`,
    `"${(e.created_by_name || e.creator?.full_name || '').replace(/"/g, '""')}"`,
    formatDate(e.created_at),
  ]);

  return [headers.join(';'), ...rows.map((r: string[]) => r.join(';'))].join('\n');
}

// Generate Excel-compatible CSV for engagement list export
function generateEngagementExcelCSV(engagements: any[]): string {
  const BOM = '\uFEFF';
  let content = BOM;
  content += '=== ENGAGEMENTS ===\n';
  content += generateEngagementCSV(engagements);
  return content;
}

// Generate simple XLSX-like format (CSV with proper encoding for Excel)
function generateExcelCSV(lines: BudgetLine[], referentiels?: Record<string, unknown[]>): string {
  // BOM for UTF-8 Excel compatibility
  const BOM = '\uFEFF';

  let content = BOM;

  // Main sheet - Budget Lines
  content += '=== LIGNES BUDGÉTAIRES ===\n';
  content += generateCSV(lines);

  // Add referentiels if requested
  if (referentiels) {
    if (referentiels.os && Array.isArray(referentiels.os)) {
      content += '\n\n=== OBJECTIFS STRATÉGIQUES ===\n';
      content += 'Code;Libellé\n';
      referentiels.os.forEach((os: any) => {
        content += `"${os.code || ''}";"${(os.libelle || '').replace(/"/g, '""')}"\n`;
      });
    }

    if (referentiels.actions && Array.isArray(referentiels.actions)) {
      content += '\n\n=== ACTIONS ===\n';
      content += 'Code;Libellé;Code OS\n';
      referentiels.actions.forEach((a: any) => {
        content += `"${a.code || ''}";"${(a.libelle || '').replace(/"/g, '""')}";"${a.os?.code || ''}"\n`;
      });
    }

    if (referentiels.directions && Array.isArray(referentiels.directions)) {
      content += '\n\n=== DIRECTIONS ===\n';
      content += 'Code;Libellé;Sigle\n';
      referentiels.directions.forEach((d: any) => {
        content += `"${d.code || ''}";"${(d.label || '').replace(/"/g, '""')}";"${d.sigle || ''}"\n`;
      });
    }

    if (referentiels.nbe && Array.isArray(referentiels.nbe)) {
      content += '\n\n=== NOMENCLATURE NBE ===\n';
      content += 'Code;Libellé\n';
      referentiels.nbe.forEach((n: any) => {
        content += `"${n.code || ''}";"${(n.libelle || '').replace(/"/g, '""')}"\n`;
      });
    }
  }

  return content;
}

// Generate PDF content as HTML (will be converted client-side)
function generatePDFHTML(data: any, entityType: string): string {
  const logoUrl =
    'https://tjagvgqthlibdpvztvaf.supabase.co/storage/v1/object/public/assets/logo-arti.jpg';

  const styles = `
    <style>
      @page { size: A4; margin: 20mm; }
      body { font-family: Arial, sans-serif; font-size: 11pt; color: #333; }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
      .logo { height: 60px; }
      .title-section { text-align: right; }
      .title { font-size: 18pt; font-weight: bold; color: #1e40af; margin: 0; }
      .subtitle { font-size: 10pt; color: #666; margin: 5px 0 0 0; }
      .doc-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
      .doc-info h3 { margin: 0 0 10px 0; color: #1e40af; font-size: 12pt; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .info-item { display: flex; }
      .info-label { font-weight: bold; min-width: 150px; color: #666; }
      .info-value { color: #333; }
      .section { margin-bottom: 20px; }
      .section-title { font-size: 12pt; font-weight: bold; color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
      .amount-box { background: #1e40af; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
      .amount-label { font-size: 10pt; opacity: 0.9; }
      .amount-value { font-size: 24pt; font-weight: bold; }
      .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
      .signature-box { border: 1px solid #e5e7eb; padding: 15px; text-align: center; min-height: 80px; }
      .signature-title { font-weight: bold; margin-bottom: 50px; }
      .qr-code { text-align: center; margin: 20px 0; }
      .qr-code img { width: 100px; height: 100px; }
      .footer { position: fixed; bottom: 10mm; left: 0; right: 0; text-align: center; font-size: 9pt; color: #999; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
      th { background: #f3f4f6; font-weight: bold; }
    </style>
  `;

  let content = '';

  switch (entityType) {
    case 'engagement':
      content = generateEngagementPDF(data, logoUrl);
      break;
    case 'liquidation':
      content = generateLiquidationPDF(data, logoUrl);
      break;
    case 'ordonnancement':
      content = generateOrdonnancementPDF(data, logoUrl);
      break;
    case 'note_sef':
      content = generateNoteSEFPDF(data, logoUrl);
      break;
    case 'marche':
      content = generateMarchePDF(data, logoUrl);
      break;
    case 'pv_cojo':
      content = generatePVCOJOPDF(data, logoUrl);
      break;
    default:
      content = generateGenericPDF(data, entityType, logoUrl);
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${styles}</head><body>${content}</body></html>`;
}

function generateEngagementPDF(data: any, logoUrl: string): string {
  const qrData = encodeURIComponent(data.numero || '');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;

  return `
    <div class="header">
      <img src="${logoUrl}" alt="ARTI" class="logo" onerror="this.style.display='none'"/>
      <div class="title-section">
        <h1 class="title">FICHE D'ENGAGEMENT</h1>
        <p class="subtitle">Exercice ${data.exercice || new Date().getFullYear()}</p>
      </div>
    </div>
    
    <div class="doc-info">
      <h3>Informations Générales</h3>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">N° Engagement :</span><span class="info-value">${data.numero || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Date :</span><span class="info-value">${formatDate(data.date_engagement)}</span></div>
        <div class="info-item"><span class="info-label">Fournisseur :</span><span class="info-value">${data.fournisseur || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Statut :</span><span class="info-value">${data.statut || 'N/A'}</span></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Objet</div>
      <p>${data.objet || 'N/A'}</p>
    </div>
    
    <div class="section">
      <div class="section-title">Imputation Budgétaire</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Code Ligne :</span><span class="info-value">${data.budget_line?.code || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Libellé :</span><span class="info-value">${data.budget_line?.label || 'N/A'}</span></div>
      </div>
    </div>
    
    <div class="amount-box">
      <div class="amount-label">Montant TTC</div>
      <div class="amount-value">${new Intl.NumberFormat('fr-FR').format(data.montant || 0)} FCFA</div>
    </div>
    
    <div class="qr-code">
      <img src="${qrUrl}" alt="QR Code ${data.numero}" />
      <p style="font-size: 9pt; color: #666;">${data.numero}</p>
    </div>
    
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-title">Le Demandeur</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Le DAF</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Le DG</div>
        <div>Date: _______________</div>
      </div>
    </div>
    
    <div class="footer">
      Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} - ARTI SYGFP
    </div>
  `;
}

function generateLiquidationPDF(data: any, logoUrl: string): string {
  const qrData = encodeURIComponent(data.numero || '');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;

  return `
    <div class="header">
      <img src="${logoUrl}" alt="ARTI" class="logo" onerror="this.style.display='none'"/>
      <div class="title-section">
        <h1 class="title">FICHE DE LIQUIDATION</h1>
        <p class="subtitle">Exercice ${data.exercice || new Date().getFullYear()}</p>
      </div>
    </div>
    
    <div class="doc-info">
      <h3>Informations Générales</h3>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">N° Liquidation :</span><span class="info-value">${data.numero || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Date :</span><span class="info-value">${formatDate(data.date_liquidation)}</span></div>
        <div class="info-item"><span class="info-label">N° Engagement :</span><span class="info-value">${data.engagement?.numero || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Réf. Facture :</span><span class="info-value">${data.reference_facture || 'N/A'}</span></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Fournisseur</div>
      <p>${data.engagement?.fournisseur || 'N/A'}</p>
    </div>
    
    <div class="section">
      <div class="section-title">Détail des Montants</div>
      <table>
        <tr><th>Description</th><th style="text-align: right;">Montant (FCFA)</th></tr>
        <tr><td>Montant HT</td><td style="text-align: right;">${new Intl.NumberFormat('fr-FR').format(data.montant_ht || 0)}</td></tr>
        <tr><td>TVA (${data.tva_taux || 0}%)</td><td style="text-align: right;">${new Intl.NumberFormat('fr-FR').format(data.tva_montant || 0)}</td></tr>
        <tr><td>AIRSI</td><td style="text-align: right;">${new Intl.NumberFormat('fr-FR').format(data.airsi_montant || 0)}</td></tr>
        <tr><th>Montant TTC</th><th style="text-align: right;">${new Intl.NumberFormat('fr-FR').format(data.montant || 0)}</th></tr>
        <tr style="background: #1e40af; color: white;"><th>Net à Payer</th><th style="text-align: right;">${new Intl.NumberFormat('fr-FR').format(data.net_a_payer || data.montant || 0)}</th></tr>
      </table>
    </div>
    
    <div class="section">
      <div class="section-title">Certification Service Fait</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Date Service Fait :</span><span class="info-value">${formatDate(data.service_fait_date)}</span></div>
        <div class="info-item"><span class="info-label">Certifié :</span><span class="info-value">${data.service_fait ? 'Oui' : 'Non'}</span></div>
      </div>
    </div>
    
    <div class="qr-code">
      <img src="${qrUrl}" alt="QR Code ${data.numero}" />
      <p style="font-size: 9pt; color: #666;">${data.numero}</p>
    </div>
    
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-title">Le Comptable</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Le DAF</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Le DG</div>
        <div>Date: _______________</div>
      </div>
    </div>
    
    <div class="footer">
      Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} - ARTI SYGFP
    </div>
  `;
}

function generateOrdonnancementPDF(data: any, logoUrl: string): string {
  const qrData = encodeURIComponent(data.numero || '');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;

  return `
    <div class="header">
      <img src="${logoUrl}" alt="ARTI" class="logo" onerror="this.style.display='none'"/>
      <div class="title-section">
        <h1 class="title">MANDAT DE PAIEMENT</h1>
        <p class="subtitle">Exercice ${data.exercice || new Date().getFullYear()}</p>
      </div>
    </div>
    
    <div class="doc-info">
      <h3>Informations Générales</h3>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">N° Ordonnancement :</span><span class="info-value">${data.numero || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Date :</span><span class="info-value">${formatDate(data.created_at)}</span></div>
        <div class="info-item"><span class="info-label">N° Liquidation :</span><span class="info-value">${data.liquidation?.numero || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Mode Paiement :</span><span class="info-value">${data.mode_paiement || 'N/A'}</span></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Bénéficiaire</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Nom :</span><span class="info-value">${data.beneficiaire || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Banque :</span><span class="info-value">${data.banque || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">RIB :</span><span class="info-value">${data.rib || 'N/A'}</span></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Objet</div>
      <p>${data.objet || 'N/A'}</p>
    </div>
    
    <div class="amount-box">
      <div class="amount-label">Montant à Payer</div>
      <div class="amount-value">${new Intl.NumberFormat('fr-FR').format(data.montant || 0)} FCFA</div>
    </div>
    
    <div class="qr-code">
      <img src="${qrUrl}" alt="QR Code ${data.numero}" />
      <p style="font-size: 9pt; color: #666;">${data.numero}</p>
    </div>
    
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-title">L'Ordonnateur</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Le Contrôleur Financier</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Le Comptable</div>
        <div>Date: _______________</div>
      </div>
    </div>
    
    <div class="footer">
      Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} - ARTI SYGFP
    </div>
  `;
}

function generateNoteSEFPDF(data: any, logoUrl: string): string {
  const qrData = encodeURIComponent(data.numero || '');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;

  const getUrgenceLabel = (urgence: string | null) => {
    const labels: Record<string, string> = {
      basse: 'Basse',
      normale: 'Normale',
      haute: 'Haute',
      urgente: 'Urgente',
    };
    return labels[urgence || 'normale'] || 'Normale';
  };

  const getStatutLabel = (statut: string | null) => {
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      soumis: 'Soumis',
      a_valider: 'À valider',
      valide: 'Validé',
      rejete: 'Rejeté',
      differe: 'Différé',
    };
    return labels[statut || 'brouillon'] || 'Brouillon';
  };

  const directionName = data.direction?.label || data.direction?.sigle || 'Non spécifiée';
  const demandeurName = data.demandeur
    ? `${data.demandeur.first_name || ''} ${data.demandeur.last_name || ''}`.trim()
    : 'Non spécifié';
  const beneficiaireName =
    data.beneficiaire?.raison_sociale ||
    (data.beneficiaire_interne
      ? `${data.beneficiaire_interne.first_name || ''} ${data.beneficiaire_interne.last_name || ''}`.trim()
      : 'Non spécifié');

  return `
    <div class="header">
      <img src="${logoUrl}" alt="ARTI" class="logo" onerror="this.style.display='none'"/>
      <div class="title-section">
        <h1 class="title">NOTE D'ACCORD DE PRINCIPE (SEF)</h1>
        <p class="subtitle">Exercice ${data.exercice || new Date().getFullYear()}</p>
      </div>
    </div>
    
    <div class="doc-info">
      <h3>Informations Générales</h3>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">N° Note :</span><span class="info-value">${data.numero || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Statut :</span><span class="info-value">${getStatutLabel(data.statut)}</span></div>
        <div class="info-item"><span class="info-label">Direction :</span><span class="info-value">${directionName}</span></div>
        <div class="info-item"><span class="info-label">Urgence :</span><span class="info-value">${getUrgenceLabel(data.urgence)}</span></div>
        <div class="info-item"><span class="info-label">Demandeur :</span><span class="info-value">${demandeurName}</span></div>
        <div class="info-item"><span class="info-label">Date création :</span><span class="info-value">${formatDate(data.created_at)}</span></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Objet de la demande</div>
      <p style="font-size: 12pt; font-weight: 500;">${data.objet || 'N/A'}</p>
    </div>

    ${
      data.description
        ? `
    <div class="section">
      <div class="section-title">Description détaillée</div>
      <p style="white-space: pre-wrap;">${data.description}</p>
    </div>
    `
        : ''
    }
    
    <div class="section">
      <div class="section-title">Bénéficiaire</div>
      <p>${beneficiaireName}</p>
    </div>

    ${
      data.commentaire
        ? `
    <div class="section">
      <div class="section-title">Commentaire</div>
      <p style="white-space: pre-wrap;">${data.commentaire}</p>
    </div>
    `
        : ''
    }

    ${
      data.statut === 'valide' && data.validated_at
        ? `
    <div class="section" style="background: #d1fae5; padding: 15px; border-radius: 8px; border: 1px solid #10b981;">
      <div class="section-title" style="color: #059669; border: none;">✓ Validation</div>
      <p>Validée le ${formatDate(data.validated_at)}</p>
      ${data.dossier?.numero ? `<p>Dossier créé : <strong>${data.dossier.numero}</strong></p>` : ''}
    </div>
    `
        : ''
    }

    ${
      data.statut === 'rejete' && data.rejection_reason
        ? `
    <div class="section" style="background: #fee2e2; padding: 15px; border-radius: 8px; border: 1px solid #ef4444;">
      <div class="section-title" style="color: #dc2626; border: none;">✗ Rejet</div>
      <p><strong>Motif :</strong> ${data.rejection_reason}</p>
      <p style="font-size: 10pt; color: #666;">Rejetée le ${formatDate(data.rejected_at)}</p>
    </div>
    `
        : ''
    }

    ${
      data.statut === 'differe'
        ? `
    <div class="section" style="background: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b;">
      <div class="section-title" style="color: #d97706; border: none;">⏸ Report</div>
      ${data.differe_motif ? `<p><strong>Motif :</strong> ${data.differe_motif}</p>` : ''}
      ${data.differe_condition ? `<p><strong>Condition de reprise :</strong> ${data.differe_condition}</p>` : ''}
      ${data.differe_date_reprise ? `<p><strong>Date de reprise prévue :</strong> ${formatDate(data.differe_date_reprise)}</p>` : ''}
    </div>
    `
        : ''
    }
    
    <div class="qr-code">
      <img src="${qrUrl}" alt="QR Code ${data.numero}" />
      <p style="font-size: 9pt; color: #666;">${data.numero}</p>
    </div>
    
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-title">Le Demandeur</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Le Chef SEF</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Le DG</div>
        <div>Date: _______________</div>
      </div>
    </div>
    
    <div class="footer">
      Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} - ARTI SYGFP
    </div>
  `;
}

function generateMarchePDF(data: any, logoUrl: string): string {
  const m = data?.marche || {};
  const qrData = encodeURIComponent(m.numero || '');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;

  const getStatutLabel = (s: string | null) => {
    const labels: Record<string, string> = {
      en_preparation: 'En préparation',
      publie: 'Publié',
      cloture: 'Clôturé',
      en_evaluation: 'En évaluation',
      attribue: 'Attribué',
      approuve: 'Approuvé',
      rejete: 'Rejeté',
      signe: 'Signé',
      annule: 'Annulé',
      en_cours: 'En cours',
    };
    return labels[s || 'en_preparation'] || s || 'N/A';
  };

  const lots = data?.lots || [];
  const soumissions = data?.soumissions || [];
  const evaluations = data?.evaluations || [];
  const validations = data?.validations || [];

  return `
    <div class="header">
      <img src="${logoUrl}" alt="ARTI" class="logo" onerror="this.style.display='none'"/>
      <div class="title-section">
        <h1 class="title">FICHE DE MARCHÉ</h1>
        <p class="subtitle">Exercice ${m.exercice || new Date().getFullYear()}</p>
      </div>
    </div>

    <div class="doc-info">
      <h3>Informations Générales</h3>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">N° Marché :</span><span class="info-value">${m.numero || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Statut :</span><span class="info-value">${getStatutLabel(m.statut)}</span></div>
        <div class="info-item"><span class="info-label">Type :</span><span class="info-value">${m.type_marche || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Mode passation :</span><span class="info-value">${m.mode_passation || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Date lancement :</span><span class="info-value">${formatDate(m.date_lancement)}</span></div>
        <div class="info-item"><span class="info-label">Date clôture :</span><span class="info-value">${formatDate(m.date_cloture)}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Objet du marché</div>
      <p style="font-size: 12pt; font-weight: 500;">${m.objet || 'N/A'}</p>
    </div>

    ${
      data?.prestataire
        ? `
    <div class="section">
      <div class="section-title">Prestataire attributaire</div>
      <p>${data.prestataire.raison_sociale || 'N/A'}</p>
    </div>
    `
        : ''
    }

    ${
      data?.expression_besoin
        ? `
    <div class="section">
      <div class="section-title">Expression de besoin</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">N° :</span><span class="info-value">${data.expression_besoin.numero || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Objet :</span><span class="info-value">${data.expression_besoin.objet || 'N/A'}</span></div>
      </div>
    </div>
    `
        : ''
    }

    ${
      data?.budget_line
        ? `
    <div class="section">
      <div class="section-title">Ligne budgétaire</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Code :</span><span class="info-value">${data.budget_line.code || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Libellé :</span><span class="info-value">${data.budget_line.label || 'N/A'}</span></div>
      </div>
    </div>
    `
        : ''
    }

    <div class="section">
      <div class="section-title">Montants</div>
      <table>
        <tr><th>Description</th><th style="text-align: right;">Montant (FCFA)</th></tr>
        <tr><td>Montant estimé</td><td style="text-align: right;">${new Intl.NumberFormat('fr-FR').format(m.montant_estime || 0)}</td></tr>
        ${m.montant_attribue ? `<tr><td>Montant attribué</td><td style="text-align: right;">${new Intl.NumberFormat('fr-FR').format(m.montant_attribue)}</td></tr>` : ''}
        ${m.montant ? `<tr style="background: #1e40af; color: white;"><th>Montant final</th><th style="text-align: right;">${new Intl.NumberFormat('fr-FR').format(m.montant)}</th></tr>` : ''}
      </table>
    </div>

    ${
      lots.length > 0
        ? `
    <div class="section">
      <div class="section-title">Lots (${lots.length})</div>
      <table>
        <tr><th>N°</th><th>Intitulé</th><th style="text-align: right;">Montant est.</th><th style="text-align: right;">Montant att.</th><th>Statut</th></tr>
        ${lots
          .map(
            (l: any) => `
          <tr>
            <td>${l.numero_lot || ''}</td>
            <td>${l.intitule || ''}</td>
            <td style="text-align: right;">${new Intl.NumberFormat('fr-FR').format(l.montant_estime || 0)}</td>
            <td style="text-align: right;">${l.montant_attribue ? new Intl.NumberFormat('fr-FR').format(l.montant_attribue) : '-'}</td>
            <td>${l.statut || '-'}</td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
    `
        : ''
    }

    ${
      soumissions.length > 0
        ? `
    <div class="section">
      <div class="section-title">Soumissions (${soumissions.length})</div>
      <table>
        <tr><th>Entreprise</th><th style="text-align: right;">Montant offre</th><th>Statut</th><th>Date</th></tr>
        ${soumissions
          .map(
            (s: any) => `
          <tr>
            <td>${s.nom_entreprise || s.prestataire_nom || 'N/A'}</td>
            <td style="text-align: right;">${new Intl.NumberFormat('fr-FR').format(s.montant_offre || 0)}</td>
            <td>${s.statut || '-'}</td>
            <td>${formatDate(s.date_soumission)}</td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
    `
        : ''
    }

    ${
      evaluations.length > 0
        ? `
    <div class="section">
      <div class="section-title">Évaluations (${evaluations.length})</div>
      <table>
        <tr><th>Rang</th><th>Note tech.</th><th>Note fin.</th><th>Note finale</th><th>Qualifié</th><th>Évaluateur</th></tr>
        ${evaluations
          .map(
            (e: any) => `
          <tr>
            <td style="text-align: center;">${e.rang || '-'}</td>
            <td style="text-align: right;">${e.note_technique != null ? Number(e.note_technique).toFixed(2) : '-'}</td>
            <td style="text-align: right;">${e.note_financiere != null ? Number(e.note_financiere).toFixed(2) : '-'}</td>
            <td style="text-align: right; font-weight: bold;">${e.note_finale != null ? Number(e.note_finale).toFixed(2) : '-'}</td>
            <td style="text-align: center;">${e.qualifie_techniquement ? '✓' : '✗'}</td>
            <td>${e.evaluateur || '-'}</td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
    `
        : ''
    }

    ${
      validations.length > 0
        ? `
    <div class="section">
      <div class="section-title">Circuit de validation</div>
      <table>
        <tr><th>Étape</th><th>Rôle</th><th>Statut</th><th>Commentaire</th><th>Date</th></tr>
        ${validations
          .map(
            (v: any) => `
          <tr>
            <td>${v.step_order || ''}</td>
            <td>${v.role || ''}</td>
            <td>${v.status || ''}</td>
            <td>${v.comments || '-'}</td>
            <td>${formatDate(v.validated_at)}</td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
    `
        : ''
    }

    <div class="qr-code">
      <img src="${qrUrl}" alt="QR Code ${m.numero}" />
      <p style="font-size: 9pt; color: #666;">${m.numero || ''}</p>
    </div>

    <div class="signatures">
      <div class="signature-box">
        <div class="signature-title">Le DAAF</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Le Contrôleur Budgétaire</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Le DG</div>
        <div>Date: _______________</div>
      </div>
    </div>

    <div class="footer">
      Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} - ARTI SYGFP
    </div>
  `;
}

function generatePVCOJOPDF(data: any, logoUrl: string): string {
  const m = data?.marche || {};
  const lots = data?.lots || [];
  const soumissions = data?.soumissions || [];
  const evaluations = data?.evaluations || [];
  const qrData = encodeURIComponent(`PV-COJO-${m.numero || ''}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;

  // Separate qualified vs non-qualified
  const qualified = evaluations.filter((e: any) => e.qualifie_techniquement);
  const disqualified = evaluations.filter((e: any) => !e.qualifie_techniquement);

  return `
    <div class="header">
      <img src="${logoUrl}" alt="ARTI" class="logo" onerror="this.style.display='none'"/>
      <div class="title-section">
        <h1 class="title">PROCÈS-VERBAL</h1>
        <p class="subtitle">Commission d'Ouverture et de Jugement des Offres (COJO)</p>
      </div>
    </div>

    <div class="doc-info">
      <h3>Marché concerné</h3>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">N° Marché :</span><span class="info-value">${m.numero || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Exercice :</span><span class="info-value">${m.exercice || new Date().getFullYear()}</span></div>
        <div class="info-item"><span class="info-label">Objet :</span><span class="info-value">${m.objet || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Type :</span><span class="info-value">${m.type_marche || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Mode passation :</span><span class="info-value">${m.mode_passation || 'N/A'}</span></div>
        <div class="info-item"><span class="info-label">Montant estimé :</span><span class="info-value">${new Intl.NumberFormat('fr-FR').format(m.montant_estime || 0)} FCFA</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">1. Ouverture des plis</div>
      <p>La Commission d'Ouverture et de Jugement des Offres (COJO) s'est réunie pour procéder à l'ouverture des plis relatifs au marché <strong>${m.numero || 'N/A'}</strong> — "${m.objet || ''}".</p>
      <p><strong>${soumissions.length} offre(s)</strong> ont été réceptionnées${m.date_cloture ? ` à la date de clôture du ${formatDate(m.date_cloture)}` : ''}.</p>

      ${
        soumissions.length > 0
          ? `
      <table>
        <tr><th>N°</th><th>Soumissionnaire</th><th style="text-align: right;">Montant offre (FCFA)</th><th>Date dépôt</th><th>Statut</th></tr>
        ${soumissions
          .map(
            (s: any, i: number) => `
          <tr>
            <td>${i + 1}</td>
            <td>${s.nom_entreprise || s.prestataire_nom || 'N/A'}</td>
            <td style="text-align: right;">${new Intl.NumberFormat('fr-FR').format(s.montant_offre || 0)}</td>
            <td>${formatDate(s.date_soumission)}</td>
            <td>${s.statut || '-'}</td>
          </tr>
        `
          )
          .join('')}
      </table>
      `
          : '<p><em>Aucune soumission enregistrée.</em></p>'
      }
    </div>

    ${
      lots.length > 0
        ? `
    <div class="section">
      <div class="section-title">2. Allotissement</div>
      <table>
        <tr><th>Lot</th><th>Intitulé</th><th style="text-align: right;">Montant estimé (FCFA)</th></tr>
        ${lots
          .map(
            (l: any) => `
          <tr>
            <td style="text-align: center;">${l.numero_lot || ''}</td>
            <td>${l.intitule || ''}</td>
            <td style="text-align: right;">${new Intl.NumberFormat('fr-FR').format(l.montant_estime || 0)}</td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
    `
        : ''
    }

    <div class="section">
      <div class="section-title">${lots.length > 0 ? '3' : '2'}. Évaluation des offres</div>

      ${
        evaluations.length > 0
          ? `
      <p>Les offres ont été évaluées selon la méthode de notation pondérée :</p>
      <ul style="margin: 5px 0;">
        <li>Note technique : coefficient 70% — seuil de qualification : 70/100</li>
        <li>Note financière : coefficient 30% — uniquement pour les offres qualifiées techniquement</li>
      </ul>

      <table>
        <tr><th>Rang</th><th>Soumissionnaire</th><th style="text-align: right;">Note tech. /100</th><th style="text-align: right;">Note fin. /100</th><th style="text-align: right;">Note finale /100</th><th>Qualifié</th></tr>
        ${evaluations
          .map((e: any) => {
            const soum = soumissions.find((s: any) => s.id === e.soumission_id);
            return `
          <tr style="${e.rang === 1 ? 'background: #d1fae5; font-weight: bold;' : !e.qualifie_techniquement ? 'color: #999;' : ''}">
            <td style="text-align: center;">${e.rang || '-'}</td>
            <td>${soum?.nom_entreprise || soum?.prestataire_nom || e.evaluateur || 'N/A'}</td>
            <td style="text-align: right;">${e.note_technique != null ? Number(e.note_technique).toFixed(2) : '-'}</td>
            <td style="text-align: right;">${e.note_financiere != null ? Number(e.note_financiere).toFixed(2) : '-'}</td>
            <td style="text-align: right;">${e.note_finale != null ? Number(e.note_finale).toFixed(2) : '-'}</td>
            <td style="text-align: center;">${e.qualifie_techniquement ? '✓ Oui' : '✗ Non'}</td>
          </tr>`;
          })
          .join('')}
      </table>
      `
          : '<p><em>Aucune évaluation enregistrée.</em></p>'
      }
    </div>

    ${
      qualified.length > 0
        ? `
    <div class="section" style="background: #d1fae5; padding: 15px; border-radius: 8px; border: 1px solid #10b981;">
      <div class="section-title" style="color: #059669; border: none;">${lots.length > 0 ? '4' : '3'}. Résultat — Attribution recommandée</div>
      <p>Sur la base des évaluations ci-dessus, la Commission recommande l'attribution du marché au soumissionnaire classé <strong>premier</strong> :</p>
      <div style="padding: 10px; background: white; border-radius: 4px; margin: 10px 0;">
        <p style="margin: 5px 0;"><strong>Attributaire recommandé :</strong> ${data?.prestataire?.raison_sociale || qualified[0]?.evaluateur || 'N/A'}</p>
        ${qualified[0]?.note_finale ? `<p style="margin: 5px 0;"><strong>Note finale :</strong> ${Number(qualified[0].note_finale).toFixed(2)}/100</p>` : ''}
        ${m.montant_attribue ? `<p style="margin: 5px 0;"><strong>Montant attribué :</strong> ${new Intl.NumberFormat('fr-FR').format(m.montant_attribue)} FCFA</p>` : ''}
      </div>
      <p><strong>${qualified.length}</strong> offre(s) qualifiée(s) sur ${evaluations.length} évaluée(s).</p>
      ${disqualified.length > 0 ? `<p><strong>${disqualified.length}</strong> offre(s) éliminée(s) (note technique &lt; 70).</p>` : ''}
    </div>
    `
        : `
    <div class="section" style="background: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b;">
      <div class="section-title" style="color: #d97706; border: none;">Résultat</div>
      <p>Aucun soumissionnaire n'a été qualifié techniquement. La Commission recommande de déclarer l'appel d'offres infructueux.</p>
    </div>
    `
    }

    <div style="margin-top: 30px; font-size: 10pt; color: #666; font-style: italic;">
      <p>Le présent procès-verbal a été établi en séance et signé par les membres de la Commission.</p>
      <p>Fait à Abidjan, le ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>

    <div class="qr-code">
      <img src="${qrUrl}" alt="QR Code PV-COJO" />
      <p style="font-size: 9pt; color: #666;">PV-COJO ${m.numero || ''}</p>
    </div>

    <div class="signatures">
      <div class="signature-box">
        <div class="signature-title">Le Président de la COJO</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Le Rapporteur</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Le Membre</div>
        <div>Date: _______________</div>
      </div>
    </div>

    <div class="footer">
      Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} - ARTI SYGFP — PV COJO
    </div>
  `;
}

function generateGenericPDF(data: any, entityType: string, logoUrl: string): string {
  const title = entityType.toUpperCase().replace(/_/g, ' ');
  return `
    <div class="header">
      <img src="${logoUrl}" alt="ARTI" class="logo" onerror="this.style.display='none'"/>
      <div class="title-section">
        <h1 class="title">${title}</h1>
        <p class="subtitle">Exercice ${data.exercice || new Date().getFullYear()}</p>
      </div>
    </div>
    <div class="doc-info">
      <h3>Données</h3>
      <pre style="font-size: 10pt; overflow: auto;">${JSON.stringify(data, null, 2)}</pre>
    </div>
    <div class="footer">
      Document généré le ${new Date().toLocaleDateString('fr-FR')} - ARTI SYGFP
    </div>
  `;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check export permissions based on user profile
    const EXPORT_ROLES = ['ADMIN', 'DAAF', 'CB', 'DG', 'AUDITEUR', 'SAF'];
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('profil_fonctionnel, direction_id')
      .eq('id', user.id)
      .single();

    const userRole = (userProfile?.profil_fonctionnel || '').toUpperCase();
    if (!EXPORT_ROLES.includes(userRole)) {
      return new Response(JSON.stringify({ error: "Permissions insuffisantes pour l'export" }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ExportRequest = await req.json();
    console.log('Export request:', { userId: user.id, type: body.type, entity: body.entity_type });

    let content: string;
    let contentType: string;
    let fileName: string;

    const timestamp = Date.now();

    switch (body.type) {
      case 'csv':
      case 'excel': {
        // Branch by entity_type: engagement vs budget_lines (default)
        if (body.entity_type === 'engagement') {
          // Engagement list export via RPC
          const { data: engagements, error: engError } = await supabase
            .rpc('get_engagement_export_data', {
              p_exercice: body.exercice,
              p_direction_id:
                !['ADMIN', 'DG', 'AUDITEUR'].includes(userRole) && userProfile?.direction_id
                  ? userProfile.direction_id
                  : body.filters?.direction_id || null,
              p_statut: body.filters?.statut || null,
            })
            .limit(10000);
          if (engError) throw engError;

          if (body.type === 'csv') {
            content = generateEngagementCSV(engagements || []);
            contentType = 'text/csv; charset=utf-8';
            fileName = `engagements_${body.exercice}_${timestamp}.csv`;
          } else {
            content = generateEngagementExcelCSV(engagements || []);
            contentType = 'text/csv; charset=utf-8';
            fileName = `engagements_${body.exercice}_${timestamp}.csv`;
          }
        } else {
          // Default: budget lines export
          let query = supabase
            .from('budget_lines')
            .select(
              `
              id, code, label, dotation_initiale, dotation_modifiee, disponible_calcule, total_engage,
              source_financement, commentaire, created_at,
              direction:directions(code, sigle),
              objectif_strategique:objectifs_strategiques(code, libelle),
              mission:missions(code, libelle),
              action:actions(code, libelle),
              activite:activites(code, libelle),
              sous_activite:sous_activites(code, libelle),
              nomenclature_nbe(code, libelle),
              plan_comptable_sysco(code, libelle)
            `
            )
            .eq('exercice', body.exercice)
            .order('code');

          // Non-admin users can only export data from their own direction
          if (!['ADMIN', 'DG', 'AUDITEUR'].includes(userRole) && userProfile?.direction_id) {
            query = query.eq('direction_id', userProfile.direction_id);
          }

          // Apply filters
          if (body.filters?.direction_id) {
            query = query.eq('direction_id', body.filters.direction_id);
          }
          if (body.filters?.os_id) {
            query = query.eq('os_id', body.filters.os_id);
          }
          if (body.filters?.statut) {
            query = query.eq('statut', body.filters.statut);
          }
          if (body.filters?.search) {
            query = query.or(
              `code.ilike.%${body.filters.search}%,label.ilike.%${body.filters.search}%`
            );
          }

          const { data: lines, error: linesError } = await query;
          if (linesError) throw linesError;

          let referentiels = undefined;

          if (body.include_referentiels && body.type === 'excel') {
            const [osRes, actionsRes, directionsRes, nbeRes] = await Promise.all([
              supabase.from('objectifs_strategiques').select('code, libelle').order('code'),
              supabase
                .from('actions')
                .select('code, libelle, os:objectifs_strategiques(code)')
                .order('code'),
              supabase.from('directions').select('code, label, sigle').order('code'),
              supabase.from('nomenclature_nbe').select('code, libelle').order('code'),
            ]);

            referentiels = {
              os: osRes.data || [],
              actions: actionsRes.data || [],
              directions: directionsRes.data || [],
              nbe: nbeRes.data || [],
            };
          }

          if (body.type === 'csv') {
            content = generateCSV(lines as unknown as BudgetLine[]);
            contentType = 'text/csv; charset=utf-8';
            fileName = `budget_${body.exercice}_${timestamp}.csv`;
          } else {
            content = generateExcelCSV(lines as unknown as BudgetLine[], referentiels);
            contentType = 'text/csv; charset=utf-8';
            fileName = `budget_${body.exercice}_${timestamp}.csv`;
          }
        }
        break;
      }

      case 'pdf': {
        // Fetch entity data based on type
        let entityData: any = null;

        switch (body.entity_type) {
          case 'engagement': {
            const { data, error } = await supabase
              .from('budget_engagements')
              .select(
                `
                *,
                budget_line:budget_lines(id, code, label)
              `
              )
              .eq('id', body.entity_id!)
              .single();
            if (error) throw error;
            entityData = data;
            break;
          }
          case 'liquidation': {
            const { data, error } = await supabase
              .from('budget_liquidations')
              .select(
                `
                *,
                engagement:budget_engagements(numero, objet, fournisseur)
              `
              )
              .eq('id', body.entity_id!)
              .single();
            if (error) throw error;
            entityData = data;
            break;
          }
          case 'ordonnancement': {
            const { data, error } = await supabase
              .from('ordonnancements')
              .select(
                `
                *,
                liquidation:budget_liquidations(numero, montant)
              `
              )
              .eq('id', body.entity_id!)
              .single();
            if (error) throw error;
            entityData = data;
            break;
          }
          case 'note_sef': {
            const { data, error } = await supabase
              .from('notes_sef')
              .select(
                `
                *,
                direction:directions(id, label, sigle),
                demandeur:profiles!notes_sef_demandeur_id_fkey(id, first_name, last_name),
                beneficiaire:prestataires(id, raison_sociale),
                beneficiaire_interne:profiles!notes_sef_beneficiaire_interne_id_fkey(id, first_name, last_name),
                dossier:dossiers(id, numero)
              `
              )
              .eq('id', body.entity_id!)
              .single();
            if (error) throw error;
            entityData = data;
            break;
          }
          case 'marche': {
            const { data: rpcResult, error: rpcError } = await supabase.rpc(
              'fn_get_marche_detail',
              { p_marche_id: body.entity_id! }
            );
            if (rpcError) throw rpcError;
            entityData = rpcResult;
            break;
          }
          case 'pv_cojo': {
            // PV COJO = Procès-Verbal de la Commission d'Ouverture et de Jugement des Offres
            const { data: rpcResult, error: rpcError } = await supabase.rpc(
              'fn_get_marche_detail',
              { p_marche_id: body.entity_id! }
            );
            if (rpcError) throw rpcError;
            entityData = rpcResult;
            break;
          }
          default:
            entityData = { id: body.entity_id, type: body.entity_type };
        }

        content = generatePDFHTML(entityData, body.entity_type);
        contentType = 'text/html; charset=utf-8';
        fileName = `${body.entity_type}_${entityData?.numero || body.entity_id}_${timestamp}.html`;
        break;
      }

      default:
        throw new Error("Type d'export non supporté");
    }

    // Create export job record
    const { data: job, error: jobError } = await supabase
      .from('export_jobs')
      .insert({
        user_id: user.id,
        type: body.type,
        entity_type: body.entity_type,
        entity_id: body.entity_id || null,
        filters: body.filters || null,
        status: 'completed',
        file_name: fileName,
        file_size: new TextEncoder().encode(content).length,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating export job:', jobError);
    }

    console.log('Export completed:', { fileName, size: content.length, jobId: job?.id });

    // Return the file content directly
    return new Response(content, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
