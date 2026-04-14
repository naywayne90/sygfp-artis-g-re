import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Building2,
  CheckCircle2,
  AlertCircle,
  Users,
  Eye,
  FileCheck,
  FileWarning,
  Ban,
  Power,
  Copy,
  CreditCard,
  FileText,
  History,
  User,
  Upload,
  Pencil,
  ClipboardCheck,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileDown,
  Briefcase,
  MoreHorizontal,
  TrendingUp,
  Download,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { PageHeader } from '@/components/shared/PageHeader';
import { NotesPagination } from '@/components/shared/NotesPagination';
import { usePrestataires, usePrestaireRequests } from '@/hooks/usePrestataires';
import {
  useSupplierExpiredDocuments,
  useSupplierFinancials,
  useSupplierDocuments,
} from '@/hooks/useSupplierDocuments';
import { useSecteursActivite } from '@/hooks/useSecteursActivite';
import { useExercice } from '@/contexts/ExerciceContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { SecteurSelect } from '@/components/admin/programmatique/SecteurSelect';

// Sub-components for the details dialog tabs
import { SupplierIdentityTab } from '@/components/prestataires/SupplierIdentityTab';
import { SupplierBankTab } from '@/components/prestataires/SupplierBankTab';
import { SupplierDocumentsTab } from '@/components/prestataires/SupplierDocumentsTab';
import { SupplierHistoryTab } from '@/components/prestataires/SupplierHistoryTab';
import { SupplierQualificationDialog } from '@/components/prestataires/SupplierQualificationDialog';
import { PrestatairesImportDialog } from '@/components/prestataires/PrestatairesImportDialog';
import { PrestatairesExportButton } from '@/components/prestataires/PrestatairesExportButton';

const PAGE_SIZE_OPTIONS = [20, 50, 100];
type SortField = 'code' | 'raison_sociale' | 'statut' | 'created_at';
type SortDir = 'asc' | 'desc';

/** Supabase renvoie parfois les grands numeric comme string "2.72126e+009".
 *  On parse en Number d'abord pour obtenir l'entier, puis on reconvertit en string. */
function formatPhone(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(value);
  return isNaN(n) ? String(value) : String(Math.round(n));
}

/** Onglet Contrats + Engagements interne à la fiche prestataire */
function SupplierContratsTab({ supplierId }: { supplierId: string }) {
  const { financials, isLoading } = useSupplierFinancials(supplierId);

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;

  const contrats = financials?.contrats ?? [];
  const engagements = financials?.engagements ?? [];
  const hasData = contrats.length > 0 || engagements.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun contrat ni engagement lié à ce prestataire</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Résumé financier */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground mb-1">Total contrats</p>
          <p className="text-lg font-bold">{formatCurrency(financials?.totalContrats ?? 0)}</p>
          <p className="text-xs text-muted-foreground">
            {contrats.length} contrat{contrats.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground mb-1">Total engagements</p>
          <p className="text-lg font-bold">{formatCurrency(financials?.totalEngagements ?? 0)}</p>
          <p className="text-xs text-muted-foreground">
            {engagements.length} engagement{engagements.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Contrats */}
      {contrats.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Briefcase className="h-4 w-4 text-primary" />
            Contrats
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Montant actuel</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contrats.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">
                    <Link
                      to="/contractualisation/contrats"
                      className="text-primary hover:underline"
                    >
                      {c.numero}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(c.montant_actuel ?? c.montant_initial ?? 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.statut}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Engagements */}
      {engagements.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            Engagements financiers
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {engagements.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-sm">
                    <Link to="/engagements" className="text-primary hover:underline">
                      {e.numero}
                    </Link>
                  </TableCell>
                  <TableCell>{formatCurrency(e.montant ?? 0)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.date_engagement ? format(new Date(e.date_engagement), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{e.statut}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function Prestataires() {
  const { exercice: _exercice } = useExercice();
  const {
    prestataires,
    prestatairesActifs: _prestatairesActifs,
    isLoading,
    stats,
    suspendSupplier,
    activateSupplier,
    evaluateSupplier,
    qualifySupplier,
    updatePrestataire,
    isUpdating,
    createPrestataire,
    isCreating,
    suspendBulk,
    qualifyBulk,
    isBulkPending,
  } = usePrestataires();
  const { stats: requestStats, requests } = usePrestaireRequests();
  const { secteurs } = useSecteursActivite();
  const { stats: docStats } = useSupplierExpiredDocuments();
  const { hasAnyRole } = usePermissions();
  const canCreateDirect = hasAnyRole(['DMG', 'DG', 'ADMIN', 'admin']);

  // ── Filtres ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('actifs');
  const [secteurFilter, setSecteurFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statutFiscalFilter, setStatutFiscalFilter] = useState('all');

  // ── Tri ───────────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>('raison_sociale');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // ── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Détails ───────────────────────────────────────────────────────────────
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPrestataire, setSelectedPrestataire] = useState<(typeof prestataires)[0] | null>(
    null
  );
  const [detailsTab, setDetailsTab] = useState('identite');

  // ── Mode édition ──────────────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    raison_sociale: '',
    sigle: '',
    ninea: '',
    nif: '',
    rccm: '',
    adresse: '',
    ville: '',
    email: '',
    telephone: '',
    secteur_principal_id: '',
    code_admission: '',
    code_comptable: '',
    statut_fiscal: '',
  });

  // ── Dialogs workflow ──────────────────────────────────────────────────────
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendMotif, setSuspendMotif] = useState('');
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [activateComment, setActivateComment] = useState('');
  const [showQualifDialog, setShowQualifDialog] = useState(false);
  const [qualifAction, setQualifAction] = useState<'evaluate' | 'qualify'>('evaluate');

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkSuspendDialog, setShowBulkSuspendDialog] = useState(false);
  const [bulkSuspendMotif, setBulkSuspendMotif] = useState('');

  // ── Import dialog ──────────────────────────────────────────────────────────
  const [showImportDialog, setShowImportDialog] = useState(false);

  // ── Création directe (DMG/DG/ADMIN) ──────────────────────────────────────
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    raison_sociale: '',
    email: '',
    telephone: '',
    adresse: '',
    ninea: '',
    rccm: '',
    cc: '',
    code_comptable: '',
    rib_banque: '',
    rib_numero: '',
    rib_cle: '',
    secteur_principal_id: null as string | null,
    secteur_secondaire_id: null as string | null,
  });

  // ── Docs expirés du prestataire sélectionné ───────────────────────────────
  const { documents: selectedDocs } = useSupplierDocuments(selectedPrestataire?.id);
  const hasExpiredDocs = (selectedDocs ?? []).some((d) => d.statut === 'expire');
  const hasRenewDocs = (selectedDocs ?? []).some((d) => d.statut === 'a_renouveler');

  // ── Types de prestataire uniques ──────────────────────────────────────────
  const typeOptions = useMemo(() => {
    const types = Array.from(
      new Set(prestataires.map((p) => p.type_prestataire).filter(Boolean))
    ) as string[];
    return types.sort();
  }, [prestataires]);

  // ── Statuts fiscaux uniques ───────────────────────────────────────────────
  const statutFiscalOptions = useMemo(() => {
    const statuts = Array.from(
      new Set(prestataires.map((p) => p.statut_fiscal).filter(Boolean))
    ) as string[];
    return statuts.sort();
  }, [prestataires]);

  // ── Prestataires avec demande en attente ──────────────────────────────────
  const pendingPrestatairesIds = useMemo(() => {
    const pending = requests.filter((r) => r.statut === 'ENREGISTRE' || r.statut === 'EN_VERIF');
    return new Set(pending.map((r) => r.prestataire_id).filter(Boolean) as string[]);
  }, [requests]);

  // ── Filtrage + Tri ────────────────────────────────────────────────────────
  const filteredPrestataires = useMemo(() => {
    const filtered = prestataires.filter((p) => {
      const matchSearch =
        p.raison_sociale.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.ninea?.toLowerCase().includes(search.toLowerCase());

      const matchSecteur = secteurFilter === 'all' || p.secteur_principal_id === secteurFilter;
      const matchType = typeFilter === 'all' || p.type_prestataire === typeFilter;
      const matchStatutFiscal =
        statutFiscalFilter === 'all' || p.statut_fiscal === statutFiscalFilter;

      const matchTab = (() => {
        if (selectedTab === 'actifs') return p.statut === 'ACTIF';
        if (selectedTab === 'suspendus') return p.statut === 'SUSPENDU';
        if (selectedTab === 'en_qualification') return p.statut === 'EN_QUALIFICATION';
        if (selectedTab === 'inactifs') return p.statut === 'INACTIF' || p.statut === 'NOUVEAU';
        return true;
      })();

      return matchSearch && matchSecteur && matchType && matchTab && matchStatutFiscal;
    });

    return [...filtered].sort((a, b) => {
      let valA = '';
      let valB = '';
      if (sortField === 'code') {
        valA = a.code;
        valB = b.code;
      } else if (sortField === 'raison_sociale') {
        valA = a.raison_sociale;
        valB = b.raison_sociale;
      } else if (sortField === 'statut') {
        valA = a.statut ?? '';
        valB = b.statut ?? '';
      } else if (sortField === 'created_at') {
        valA = a.created_at;
        valB = b.created_at;
      }
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [
    prestataires,
    search,
    secteurFilter,
    typeFilter,
    statutFiscalFilter,
    selectedTab,
    sortField,
    sortDir,
  ]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredPrestataires.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPrestataires = filteredPrestataires.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handlePageChange = (p: number) => setCurrentPage(p);
  const handlePageSizeChange = (s: number) => {
    setPageSize(s);
    setCurrentPage(1);
  };
  const handleSearchChange = (v: string) => {
    setSearch(v);
    setCurrentPage(1);
  };
  const handleSecteurChange = (v: string) => {
    setSecteurFilter(v);
    setCurrentPage(1);
  };
  const handleTypeChange = (v: string) => {
    setTypeFilter(v);
    setCurrentPage(1);
  };
  const handleStatutFiscalChange = (v: string) => {
    setStatutFiscalFilter(v);
    setCurrentPage(1);
  };
  const handleTabChange = (v: string) => {
    setSelectedTab(v);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-primary" />
    );
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getSecteurLibelle = (id: string | null) => {
    if (!id) return '-';
    return secteurs.find((s) => s.id === id)?.libelle ?? '-';
  };

  const getStatusBadge = (statut: string | null) => {
    switch (statut?.toUpperCase()) {
      case 'ACTIF':
        return <Badge className="bg-green-600">Actif</Badge>;
      case 'SUSPENDU':
        return <Badge variant="destructive">Suspendu</Badge>;
      case 'EN_QUALIFICATION':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            En qualification
          </Badge>
        );
      case 'NOUVEAU':
        return <Badge variant="outline">Nouveau</Badge>;
      default:
        return <Badge variant="secondary">Inactif</Badge>;
    }
  };

  // ── Ouvrir fiche ──────────────────────────────────────────────────────────
  const openDetails = (p: (typeof prestataires)[0]) => {
    setSelectedPrestataire(p);
    setDetailsTab('identite');
    setIsEditMode(false);
    setShowDetailsDialog(true);
  };

  // ── Mode édition ──────────────────────────────────────────────────────────
  const enterEditMode = () => {
    if (!selectedPrestataire) return;
    setEditForm({
      raison_sociale: selectedPrestataire.raison_sociale ?? '',
      sigle: selectedPrestataire.sigle ?? '',
      ninea: selectedPrestataire.ninea ?? '',
      nif: selectedPrestataire.nif ?? '',
      rccm: selectedPrestataire.rccm ?? '',
      adresse: selectedPrestataire.adresse ?? '',
      ville: selectedPrestataire.ville ?? '',
      email: selectedPrestataire.email ?? '',
      telephone: formatPhone(selectedPrestataire.telephone),
      secteur_principal_id: selectedPrestataire.secteur_principal_id ?? '',
      code_admission: selectedPrestataire.code_admission ?? '',
      code_comptable: selectedPrestataire.code_comptable ?? '',
      statut_fiscal: selectedPrestataire.statut_fiscal ?? '',
    });
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!selectedPrestataire) return;
    updatePrestataire(
      {
        id: selectedPrestataire.id,
        data: {
          raison_sociale: editForm.raison_sociale.trim(),
          sigle: editForm.sigle.trim() || null,
          ninea: editForm.ninea.trim() || null,
          nif: editForm.nif.trim() || null,
          rccm: editForm.rccm.trim() || null,
          adresse: editForm.adresse.trim() || null,
          ville: editForm.ville.trim() || null,
          email: editForm.email.trim() || null,
          telephone: editForm.telephone.trim() || null,
          secteur_principal_id: editForm.secteur_principal_id || null,
          code_admission: editForm.code_admission.trim() || null,
          code_comptable: editForm.code_comptable.trim() || null,
          statut_fiscal: editForm.statut_fiscal.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setIsEditMode(false);
          setShowDetailsDialog(false);
        },
      }
    );
  };

  // ── Export PDF fiche ──────────────────────────────────────────────────────
  const exportPDF = (p: (typeof prestataires)[0]) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Fiche Prestataire', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, margin, y);
    doc.setTextColor(0);
    y += 12;

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS GÉNÉRALES', margin + 2, y + 5.5);
    y += 12;
    doc.setFont('helvetica', 'normal');

    const fields: [string, string][] = [
      ['Code', p.code],
      ['Raison sociale', p.raison_sociale],
      ['Sigle', p.sigle ?? '-'],
      ['Type', p.type_prestataire ?? '-'],
      ['Statut', p.statut ?? '-'],
      ['NINEA', p.ninea ?? '-'],
      ['NIF', p.nif ?? '-'],
      ['RCCM', p.rccm ?? '-'],
      ['Email', p.email ?? '-'],
      ['Téléphone', formatPhone(p.telephone)],
      ['Adresse', p.adresse ?? '-'],
      ['Ville', p.ville ?? '-'],
      ['Secteur', getSecteurLibelle(p.secteur_principal_id)],
      [
        'Date qualification',
        p.date_qualification ? format(new Date(p.date_qualification), 'dd/MM/yyyy') : '-',
      ],
      ['Enregistré le', format(new Date(p.created_at), 'dd/MM/yyyy')],
    ];

    fields.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label + ' :', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 55, y);
      y += 6;
    });

    doc.save(`prestataire-${p.code}.pdf`);
    toast.success(`Fiche PDF générée : prestataire-${p.code}.pdf`);
  };

  const handleExportPDF = () => {
    if (!selectedPrestataire) return;
    exportPDF(selectedPrestataire);
  };

  // ── Suspension ────────────────────────────────────────────────────────────
  const handleSuspend = () => {
    if (!selectedPrestataire || !suspendMotif.trim()) return;
    suspendSupplier({ id: selectedPrestataire.id, motif: suspendMotif });
    setShowSuspendDialog(false);
    setSuspendMotif('');
    setShowDetailsDialog(false);
  };

  const handleActivate = () => {
    if (!selectedPrestataire) return;
    activateSupplier(selectedPrestataire.id);
    if (activateComment.trim()) toast.info(`Note : ${activateComment}`);
    setShowActivateDialog(false);
    setActivateComment('');
    setShowDetailsDialog(false);
  };

  // ── Qualification ─────────────────────────────────────────────────────────
  const handleQualification = (motif?: string) => {
    if (!selectedPrestataire) return;
    if (qualifAction === 'evaluate') {
      evaluateSupplier({ id: selectedPrestataire.id, motif });
    } else {
      qualifySupplier(selectedPrestataire.id);
    }
    setShowQualifDialog(false);
    setShowDetailsDialog(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié`);
  };

  // ── Bulk checkbox logic ───────────────────────────────────────────────────
  const allPageSelected =
    paginatedPrestataires.length > 0 &&
    paginatedPrestataires.every((p) => selectedIds.includes(p.id));
  const somePageSelected =
    !allPageSelected && paginatedPrestataires.some((p) => selectedIds.includes(p.id));
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleSelectAll = () => {
    const pageIds = paginatedPrestataires.map((p) => p.id);
    if (allPageSelected) setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    else setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
  };

  const handleBulkExportCSV = () => {
    const selected = prestataires.filter((p) => selectedIds.includes(p.id));
    const header =
      'Code,Raison sociale,Type,NINEA,Email,Téléphone,Statut,Statut fiscal,Code admission,Code comptable';
    const rows = selected.map((p) =>
      [
        p.code,
        `"${p.raison_sociale}"`,
        p.type_prestataire ?? '',
        p.ninea ?? '',
        p.email ?? '',
        formatPhone(p.telephone),
        p.statut ?? '',
        p.statut_fiscal ?? '',
        p.code_admission ?? '',
        p.code_comptable ?? '',
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prestataires-selection-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${selected.length} prestataires exportés`);
  };

  const handleBulkQualify = () => {
    const qualifiables = selectedIds.filter((id) => {
      const p = prestataires.find((x) => x.id === id);
      return p?.statut === 'EN_QUALIFICATION';
    });
    if (qualifiables.length === 0) {
      toast.error('Aucun prestataire en qualification sélectionné');
      return;
    }
    qualifyBulk(qualifiables);
    setSelectedIds([]);
  };

  const handleBulkSuspend = () => {
    if (!bulkSuspendMotif.trim()) return;
    const suspendables = selectedIds.filter((id) => {
      const p = prestataires.find((x) => x.id === id);
      return p?.statut === 'ACTIF';
    });
    suspendBulk({ ids: suspendables, motif: bulkSuspendMotif });
    setSelectedIds([]);
    setShowBulkSuspendDialog(false);
    setBulkSuspendMotif('');
  };

  // ── Actions rapides depuis le tableau ─────────────────────────────────────
  const quickAction = (
    p: (typeof prestataires)[0],
    action: 'suspend' | 'activate' | 'evaluate' | 'qualify'
  ) => {
    setSelectedPrestataire(p);
    if (action === 'suspend') {
      setShowSuspendDialog(true);
    } else if (action === 'activate') {
      setShowActivateDialog(true);
    } else if (action === 'evaluate') {
      setQualifAction('evaluate');
      setShowQualifDialog(true);
    } else if (action === 'qualify') {
      setQualifAction('qualify');
      setShowQualifDialog(true);
    }
  };

  // ── Création directe (DMG/DG/ADMIN) ────────────────────────────────────────
  const handleCreateDirect = async () => {
    if (!createForm.raison_sociale.trim()) {
      toast.error('La raison sociale est obligatoire');
      return;
    }
    if (!createForm.email && !createForm.telephone) {
      toast.error('Au moins un contact (email ou téléphone) est obligatoire');
      return;
    }
    await createPrestataire({
      raison_sociale: createForm.raison_sociale,
      email: createForm.email || null,
      telephone: createForm.telephone || null,
      adresse: createForm.adresse || null,
      ninea: createForm.ninea || null,
      rccm: createForm.rccm || null,
      cc: createForm.cc || null,
      code_comptable: createForm.code_comptable || null,
      rib_banque: createForm.rib_banque || null,
      rib_numero: createForm.rib_numero || null,
      rib_cle: createForm.rib_cle || null,
      secteur_principal_id: createForm.secteur_principal_id,
      secteur_secondaire_id: createForm.secteur_secondaire_id,
    });
    setShowCreateDialog(false);
    setCreateForm({
      raison_sociale: '',
      email: '',
      telephone: '',
      adresse: '',
      ninea: '',
      rccm: '',
      cc: '',
      code_comptable: '',
      rib_banque: '',
      rib_numero: '',
      rib_cle: '',
      secteur_principal_id: null,
      secteur_secondaire_id: null,
    });
  };

  const hasActiveFilters =
    search || secteurFilter !== 'all' || typeFilter !== 'all' || statutFiscalFilter !== 'all';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Prestataires"
        description="Gestion des fournisseurs et prestataires"
        icon={Building2}
        backUrl="/"
      />

      {/* ── KPIs cliquables ──────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleTabChange('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Référentiel officiel</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-green-200 hover:border-green-400"
          onClick={() => handleTabChange('actifs')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actifs</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.actifs}</div>
            <p className="text-xs text-muted-foreground">Qualifiés et validés</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 hover:border-blue-400"
          onClick={() => handleTabChange('en_qualification')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En qualification
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.en_qualification}</div>
            <p className="text-xs text-muted-foreground">En cours de validation</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Docs. Expirés
            </CardTitle>
            <FileWarning className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{docStats.expired}</div>
            <p className="text-xs text-muted-foreground">À renouveler : {docStats.toRenew}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleTabChange('inactifs')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nouveaux (30j)
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nouveaux}</div>
            <p className="text-xs text-muted-foreground">Ajoutés récemment</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-orange-200 hover:border-orange-400"
          onClick={() => handleTabChange('suspendus')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspendus</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.suspendus}</div>
            <p className="text-xs text-muted-foreground">Bloqués</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filtres ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, code, email, NINEA..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={secteurFilter} onValueChange={handleSecteurChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous secteurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les secteurs</SelectItem>
              {secteurs.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {typeOptions.length > 0 && (
            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tous types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {statutFiscalOptions.length > 0 && (
            <Select value={statutFiscalFilter} onValueChange={handleStatutFiscalChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut fiscal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts fiscaux</SelectItem>
                {statutFiscalOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleSearchChange('');
                handleSecteurChange('all');
                handleTypeChange('all');
                handleStatutFiscalChange('all');
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <PrestatairesExportButton
            prestataires={filteredPrestataires}
            filters={{ search, statut: selectedTab }}
          />
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button variant="outline" asChild>
            <Link to="/contractualisation/validation-prestataires">
              <FileCheck className="h-4 w-4 mr-2" />
              Panier ({requestStats.enregistre + requestStats.enVerif})
            </Link>
          </Button>
          {canCreateDirect ? (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau prestataire
            </Button>
          ) : (
            <Button asChild>
              <Link to="/contractualisation/demande-prestataire">
                <Plus className="h-4 w-4 mr-2" />
                Demander un prestataire
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Barre actions bulk ───────────────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-primary">
            {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
          </span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={handleBulkExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Exporter CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-green-700 border-green-400 hover:bg-green-50"
            onClick={handleBulkQualify}
            disabled={isBulkPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Qualifier
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowBulkSuspendDialog(true)}
            disabled={isBulkPending}
          >
            <Ban className="h-4 w-4 mr-1" />
            Suspendre
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
            <X className="h-4 w-4 mr-1" />
            Désélectionner
          </Button>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <Card>
        <Tabs value={selectedTab} onValueChange={handleTabChange}>
          <CardHeader className="pb-0">
            <TabsList>
              <TabsTrigger value="actifs">Actifs ({stats.actifs})</TabsTrigger>
              <TabsTrigger value="en_qualification">
                En qualification ({stats.en_qualification})
              </TabsTrigger>
              <TabsTrigger value="suspendus">Suspendus ({stats.suspendus})</TabsTrigger>
              <TabsTrigger value="inactifs">
                Inactifs (
                {
                  prestataires.filter((p) => p.statut === 'INACTIF' || p.statut === 'NOUVEAU')
                    .length
                }
                )
              </TabsTrigger>
              <TabsTrigger value="all">Tous ({stats.total})</TabsTrigger>
            </TabsList>
            <p className="text-xs text-muted-foreground pt-2">
              {filteredPrestataires.length} prestataire
              {filteredPrestataires.length !== 1 ? 's' : ''} trouvé
              {filteredPrestataires.length !== 1 ? 's' : ''}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Sélectionner tout"
                    />
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-foreground"
                      onClick={() => handleSort('code')}
                    >
                      Code <SortIcon field="code" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-foreground"
                      onClick={() => handleSort('raison_sociale')}
                    >
                      Raison sociale <SortIcon field="raison_sociale" />
                    </button>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>NINEA</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-foreground"
                      onClick={() => handleSort('statut')}
                    >
                      Statut <SortIcon field="statut" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center hover:text-foreground"
                      onClick={() => handleSort('created_at')}
                    >
                      Enregistré <SortIcon field="created_at" />
                    </button>
                  </TableHead>
                  <TableHead className="w-10 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : paginatedPrestataires.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun prestataire</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPrestataires.map((prestataire) => (
                    <TableRow
                      key={prestataire.id}
                      className={selectedIds.includes(prestataire.id) ? 'bg-primary/5' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(prestataire.id)}
                          onCheckedChange={() => toggleSelect(prestataire.id)}
                          aria-label={`Sélectionner ${prestataire.raison_sociale}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm">{prestataire.code}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(prestataire.code, 'Code')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{prestataire.raison_sociale}</p>
                            {pendingPrestatairesIds.has(prestataire.id) && (
                              <Badge
                                variant="outline"
                                className="text-orange-600 border-orange-400 text-xs gap-1 py-0"
                              >
                                <Clock className="h-3 w-3" />
                                En attente
                              </Badge>
                            )}
                          </div>
                          {prestataire.sigle && (
                            <p className="text-xs text-muted-foreground">{prestataire.sigle}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {prestataire.email && <div>{prestataire.email}</div>}
                          {prestataire.telephone && (
                            <div className="text-muted-foreground">
                              {formatPhone(prestataire.telephone)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {getSecteurLibelle(prestataire.secteur_principal_id)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {prestataire.ninea || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(prestataire.statut)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(prestataire.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetails(prestataire)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir la fiche
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportPDF(prestataire)}>
                              <FileDown className="h-4 w-4 mr-2" />
                              Exporter PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {prestataire.statut === 'NOUVEAU' && (
                              <DropdownMenuItem
                                onClick={() => quickAction(prestataire, 'evaluate')}
                              >
                                <ClipboardCheck className="h-4 w-4 mr-2 text-blue-600" />
                                <span className="text-blue-600">Passer en évaluation</span>
                              </DropdownMenuItem>
                            )}
                            {prestataire.statut === 'EN_QUALIFICATION' && (
                              <DropdownMenuItem onClick={() => quickAction(prestataire, 'qualify')}>
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                <span className="text-green-600">Qualifier</span>
                              </DropdownMenuItem>
                            )}
                            {prestataire.statut === 'ACTIF' && (
                              <DropdownMenuItem onClick={() => quickAction(prestataire, 'suspend')}>
                                <Ban className="h-4 w-4 mr-2 text-destructive" />
                                <span className="text-destructive">Suspendre</span>
                              </DropdownMenuItem>
                            )}
                            {prestataire.statut === 'SUSPENDU' && (
                              <DropdownMenuItem
                                onClick={() => quickAction(prestataire, 'activate')}
                              >
                                <Power className="h-4 w-4 mr-2 text-green-600" />
                                <span className="text-green-600">Réactiver</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Tabs>
      </Card>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      <NotesPagination
        page={safePage}
        pageSize={pageSize}
        total={filteredPrestataires.length}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
      />

      {/* ── Dialog Détails ────────────────────────────────────────────────── */}
      <Dialog
        open={showDetailsDialog}
        onOpenChange={(open) => {
          setShowDetailsDialog(open);
          if (!open) setIsEditMode(false);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Fiche Prestataire</span>
              {selectedPrestataire && getStatusBadge(selectedPrestataire.statut)}
            </DialogTitle>
            {selectedPrestataire && (
              <DialogDescription className="flex items-center gap-2">
                <span className="font-mono">{selectedPrestataire.code}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => copyToClipboard(selectedPrestataire.code, 'Code')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Alerte suspension */}
          {selectedPrestataire && !isEditMode && selectedPrestataire.statut === 'SUSPENDU' && (
            <Alert variant="destructive" className="bg-red-50 border-red-300 text-red-800">
              <Ban className="h-4 w-4" />
              <AlertDescription>
                <span className="font-semibold">Prestataire suspendu</span>
                {selectedPrestataire.motif_suspension && (
                  <> — {selectedPrestataire.motif_suspension}</>
                )}
                {selectedPrestataire.suspended_at && (
                  <span className="block text-xs mt-1 text-red-600">
                    Le{' '}
                    {format(new Date(selectedPrestataire.suspended_at), 'dd/MM/yyyy à HH:mm', {
                      locale: fr,
                    })}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Alerte documents expirés */}
          {selectedPrestataire && !isEditMode && (hasExpiredDocs || hasRenewDocs) && (
            <Alert
              variant={hasExpiredDocs ? 'destructive' : 'default'}
              className={!hasExpiredDocs ? 'border-orange-300 bg-orange-50' : ''}
            >
              <FileWarning className="h-4 w-4" />
              <AlertDescription>
                {hasExpiredDocs && 'Ce prestataire a des documents expirés. '}
                {hasRenewDocs && 'Certains documents sont à renouveler prochainement.'}
                <button
                  className="ml-2 underline text-sm"
                  onClick={() => setDetailsTab('documents')}
                >
                  Voir les documents
                </button>
              </AlertDescription>
            </Alert>
          )}

          {selectedPrestataire && (
            <>
              {isEditMode ? (
                <div className="space-y-4 py-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Modifier les informations
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Raison sociale *</Label>
                      <Input
                        value={editForm.raison_sociale}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, raison_sociale: e.target.value }))
                        }
                        placeholder="Nom de l'entreprise"
                      />
                    </div>
                    <div>
                      <Label>Sigle</Label>
                      <Input
                        value={editForm.sigle}
                        onChange={(e) => setEditForm((f) => ({ ...f, sigle: e.target.value }))}
                        placeholder="Abréviation"
                      />
                    </div>
                    <div>
                      <Label>NINEA</Label>
                      <Input
                        value={editForm.ninea}
                        onChange={(e) => setEditForm((f) => ({ ...f, ninea: e.target.value }))}
                        placeholder="Numéro NINEA"
                      />
                    </div>
                    <div>
                      <Label>NIF</Label>
                      <Input
                        value={editForm.nif}
                        onChange={(e) => setEditForm((f) => ({ ...f, nif: e.target.value }))}
                        placeholder="Numéro NIF"
                      />
                    </div>
                    <div>
                      <Label>RCCM</Label>
                      <Input
                        value={editForm.rccm}
                        onChange={(e) => setEditForm((f) => ({ ...f, rccm: e.target.value }))}
                        placeholder="Numéro RCCM"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="contact@entreprise.com"
                      />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input
                        value={editForm.telephone}
                        onChange={(e) => setEditForm((f) => ({ ...f, telephone: e.target.value }))}
                        placeholder="07 XX XX XX XX"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Adresse</Label>
                      <Input
                        value={editForm.adresse}
                        onChange={(e) => setEditForm((f) => ({ ...f, adresse: e.target.value }))}
                        placeholder="Adresse complète"
                      />
                    </div>
                    <div>
                      <Label>Ville</Label>
                      <Input
                        value={editForm.ville}
                        onChange={(e) => setEditForm((f) => ({ ...f, ville: e.target.value }))}
                        placeholder="Ville"
                      />
                    </div>
                    <div>
                      <Label>Secteur principal</Label>
                      <Select
                        value={editForm.secteur_principal_id || 'none'}
                        onValueChange={(v) =>
                          setEditForm((f) => ({
                            ...f,
                            secteur_principal_id: v === 'none' ? '' : v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un secteur" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Aucun —</SelectItem>
                          {secteurs.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.libelle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Code Admission</Label>
                      <Input
                        value={editForm.code_admission}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, code_admission: e.target.value }))
                        }
                        placeholder="Code admission"
                      />
                    </div>
                    <div>
                      <Label>Code Comptable</Label>
                      <Input
                        value={editForm.code_comptable}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, code_comptable: e.target.value }))
                        }
                        placeholder="Code comptable"
                      />
                    </div>
                    <div>
                      <Label>Statut fiscal</Label>
                      <Input
                        value={editForm.statut_fiscal}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, statut_fiscal: e.target.value }))
                        }
                        placeholder="Ex: Régulier"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <Tabs value={detailsTab} onValueChange={setDetailsTab}>
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="identite">
                      <User className="h-4 w-4 mr-1" />
                      Identité
                    </TabsTrigger>
                    <TabsTrigger value="contact">
                      <Users className="h-4 w-4 mr-1" />
                      Contacts
                    </TabsTrigger>
                    <TabsTrigger value="banque">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Banque
                    </TabsTrigger>
                    <TabsTrigger value="documents">
                      <FileText className="h-4 w-4 mr-1" />
                      Documents
                    </TabsTrigger>
                    <TabsTrigger value="contrats">
                      <Briefcase className="h-4 w-4 mr-1" />
                      Contrats
                    </TabsTrigger>
                    <TabsTrigger value="historique">
                      <History className="h-4 w-4 mr-1" />
                      Historique
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="identite" className="mt-4">
                    <SupplierIdentityTab
                      prestataire={selectedPrestataire}
                      getSecteurLibelle={getSecteurLibelle}
                    />
                  </TabsContent>

                  <TabsContent value="contact" className="mt-4">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-3">Contact principal</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Nom</p>
                            <p>{selectedPrestataire.contact_nom || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Fonction</p>
                            <p>{selectedPrestataire.contact_fonction || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Téléphone</p>
                            <p>
                              {formatPhone(
                                selectedPrestataire.contact_telephone ??
                                  selectedPrestataire.telephone
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p>
                              {selectedPrestataire.contact_email ||
                                selectedPrestataire.email ||
                                '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Adresse</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <p className="text-sm text-muted-foreground">Adresse</p>
                            <p>{selectedPrestataire.adresse || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Ville</p>
                            <p>{selectedPrestataire.ville || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="banque" className="mt-4">
                    <SupplierBankTab supplierId={selectedPrestataire.id} />
                  </TabsContent>

                  <TabsContent value="documents" className="mt-4">
                    <SupplierDocumentsTab supplierId={selectedPrestataire.id} />
                  </TabsContent>

                  <TabsContent value="contrats" className="mt-4">
                    <SupplierContratsTab supplierId={selectedPrestataire.id} />
                  </TabsContent>

                  <TabsContent value="historique" className="mt-4">
                    <SupplierHistoryTab
                      supplierId={selectedPrestataire.id}
                      supplierName={selectedPrestataire.raison_sociale}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}

          <DialogFooter className="mt-6 flex flex-wrap gap-2">
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editForm.raison_sociale.trim()}
                >
                  {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" onClick={enterEditMode}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                {/* Workflow : NOUVEAU → EN_QUALIFICATION */}
                {selectedPrestataire?.statut === 'NOUVEAU' && (
                  <Button
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setQualifAction('evaluate');
                      setShowQualifDialog(true);
                    }}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Passer en évaluation
                  </Button>
                )}
                {/* Workflow : EN_QUALIFICATION → ACTIF */}
                {selectedPrestataire?.statut === 'EN_QUALIFICATION' && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setQualifAction('qualify');
                      setShowQualifDialog(true);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Qualifier
                  </Button>
                )}
                {selectedPrestataire?.statut === 'ACTIF' && (
                  <Button variant="destructive" onClick={() => setShowSuspendDialog(true)}>
                    <Ban className="h-4 w-4 mr-2" />
                    Suspendre
                  </Button>
                )}
                {selectedPrestataire?.statut === 'SUSPENDU' && (
                  <Button onClick={() => setShowActivateDialog(true)}>
                    <Power className="h-4 w-4 mr-2" />
                    Réactiver
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Suspension ─────────────────────────────────────────────── */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspendre le prestataire</DialogTitle>
            <DialogDescription>
              Cette action bloquera la sélection de ce prestataire dans les marchés et engagements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Motif de suspension *</Label>
              <Textarea
                value={suspendMotif}
                onChange={(e) => setSuspendMotif(e.target.value)}
                placeholder="Indiquez le motif de la suspension..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={!suspendMotif.trim()}>
              Confirmer la suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Réactivation ───────────────────────────────────────────── */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réactiver le prestataire</DialogTitle>
            <DialogDescription>
              {selectedPrestataire?.raison_sociale} sera remis au statut <strong>Actif</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Commentaire (optionnel)</Label>
              <Textarea
                value={activateComment}
                onChange={(e) => setActivateComment(e.target.value)}
                placeholder="Raison de la réactivation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowActivateDialog(false);
                setActivateComment('');
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleActivate}>
              <Power className="h-4 w-4 mr-2" />
              Confirmer la réactivation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Qualification ──────────────────────────────────────────── */}
      {selectedPrestataire && (
        <SupplierQualificationDialog
          open={showQualifDialog}
          onOpenChange={setShowQualifDialog}
          prestataire={selectedPrestataire}
          action={qualifAction}
          onConfirm={handleQualification}
        />
      )}

      {/* ── Dialog Suspension en masse ────────────────────────────────────── */}
      <Dialog open={showBulkSuspendDialog} onOpenChange={setShowBulkSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Suspendre {selectedIds.length} prestataire{selectedIds.length > 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              Seuls les prestataires au statut <strong>Actif</strong> seront suspendus.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Motif de suspension *</Label>
              <Textarea
                value={bulkSuspendMotif}
                onChange={(e) => setBulkSuspendMotif(e.target.value)}
                placeholder="Indiquez le motif de la suspension..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkSuspendDialog(false);
                setBulkSuspendMotif('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkSuspend}
              disabled={!bulkSuspendMotif.trim() || isBulkPending}
            >
              <Ban className="h-4 w-4 mr-2" />
              Confirmer la suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import Dialog ─────────────────────────────────────────────────── */}
      <PrestatairesImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />

      {/* ── Création directe (DMG/DG/ADMIN) ──────────────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un prestataire</DialogTitle>
            <DialogDescription>
              Le prestataire sera directement activé dans le référentiel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Raison sociale */}
            <div className="grid gap-2">
              <Label htmlFor="create-raison">Raison sociale *</Label>
              <Input
                id="create-raison"
                value={createForm.raison_sociale}
                onChange={(e) => setCreateForm((f) => ({ ...f, raison_sociale: e.target.value }))}
                placeholder="Nom de l'entreprise"
              />
            </div>
            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@entreprise.ci"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-tel">Téléphone</Label>
                <Input
                  id="create-tel"
                  value={createForm.telephone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, telephone: e.target.value }))}
                  placeholder="0102030405"
                />
              </div>
            </div>
            {/* Adresse */}
            <div className="grid gap-2">
              <Label htmlFor="create-adresse">Adresse</Label>
              <Input
                id="create-adresse"
                value={createForm.adresse}
                onChange={(e) => setCreateForm((f) => ({ ...f, adresse: e.target.value }))}
                placeholder="Adresse complète"
              />
            </div>
            {/* Identifiants légaux */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-ninea">NINEA</Label>
                <Input
                  id="create-ninea"
                  value={createForm.ninea}
                  onChange={(e) => setCreateForm((f) => ({ ...f, ninea: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-rccm">RCCM</Label>
                <Input
                  id="create-rccm"
                  value={createForm.rccm}
                  onChange={(e) => setCreateForm((f) => ({ ...f, rccm: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-cc">CC</Label>
                <Input
                  id="create-cc"
                  value={createForm.cc}
                  onChange={(e) => setCreateForm((f) => ({ ...f, cc: e.target.value }))}
                />
              </div>
            </div>
            {/* Code comptable */}
            <div className="grid gap-2">
              <Label htmlFor="create-code-comptable">Code comptable</Label>
              <Input
                id="create-code-comptable"
                value={createForm.code_comptable}
                onChange={(e) => setCreateForm((f) => ({ ...f, code_comptable: e.target.value }))}
              />
            </div>
            {/* RIB */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-rib-banque">Banque</Label>
                <Input
                  id="create-rib-banque"
                  value={createForm.rib_banque}
                  onChange={(e) => setCreateForm((f) => ({ ...f, rib_banque: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-rib-numero">N° compte</Label>
                <Input
                  id="create-rib-numero"
                  value={createForm.rib_numero}
                  onChange={(e) => setCreateForm((f) => ({ ...f, rib_numero: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-rib-cle">Clé RIB</Label>
                <Input
                  id="create-rib-cle"
                  value={createForm.rib_cle}
                  onChange={(e) => setCreateForm((f) => ({ ...f, rib_cle: e.target.value }))}
                />
              </div>
            </div>
            {/* Secteurs d'activité */}
            <SecteurSelect
              secteurPrincipalId={createForm.secteur_principal_id}
              secteurSecondaireId={createForm.secteur_secondaire_id}
              onChangePrincipal={(id) => setCreateForm((f) => ({ ...f, secteur_principal_id: id }))}
              onChangeSecondaire={(id) =>
                setCreateForm((f) => ({ ...f, secteur_secondaire_id: id }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateDirect} disabled={isCreating}>
              {isCreating ? 'Création...' : 'Créer et activer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
