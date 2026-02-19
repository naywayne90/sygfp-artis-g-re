import { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  Banknote,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  History,
  User,
} from 'lucide-react';
import {
  useEngagements,
  Engagement,
  BudgetAvailability,
  VALIDATION_STEPS,
} from '@/hooks/useEngagements';
import { useRBAC } from '@/contexts/RBACContext';
import { useCanValidateEngagement } from '@/hooks/useDelegations';
import { useExercice } from '@/contexts/ExerciceContext';
import { EngagementValidateDialog } from '@/components/engagement/EngagementValidateDialog';
import { EngagementRejectDialog } from '@/components/engagement/EngagementRejectDialog';
import { EngagementDetails } from '@/components/engagement/EngagementDetails';
import { EngagementValidationTimeline } from '@/components/engagement/EngagementValidationTimeline';
import { IndicateurBudget } from '@/components/engagement/IndicateurBudget';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

// Map profil_fonctionnel to validation step role
function getUserStepRole(profilFonctionnel: string): string | null {
  switch (profilFonctionnel) {
    case 'CB':
      return 'CB';
    case 'DAAF':
      return 'DAF';
    case 'DG':
      return 'DG';
    default:
      return null;
  }
}

// SAF is special — it's identified by user_roles table, not profil_fonctionnel
// We handle SAF through user_roles check in the hook

function getStepOrder(role: string): number {
  const step = VALIDATION_STEPS.find((s) => s.role === role);
  return step?.order ?? 0;
}

function getStepLabel(role: string): string {
  const step = VALIDATION_STEPS.find((s) => s.role === role);
  return step?.label ?? role;
}

interface ValidationStepData {
  step_order: number;
  role: string;
  status: string | null;
  validated_at: string | null;
  comments: string | null;
  validator?: { full_name: string | null } | null;
}

export default function EngagementApprobation() {
  const navigate = useNavigate();
  const { exercice } = useExercice();
  const rbac = useRBAC();
  const {
    canValidate: canValidateViaDelegation,
    viaDelegation,
    delegatorInfo,
  } = useCanValidateEngagement();

  const {
    engagements,
    isLoading,
    validateEngagement,
    rejectEngagement,
    isValidating,
    getValidationSteps,
    calculateAvailability,
  } = useEngagements();

  // Determine which step role the current user can validate
  const userStepRole = useMemo(() => {
    if (rbac.isAdmin) return 'ALL';
    const role = getUserStepRole(rbac.user?.profilFonctionnel || '');
    if (role) return role;
    // Check SAF — SAF users have profil_fonctionnel=OPERATEUR typically, identified through canValidate
    if (canValidateViaDelegation && delegatorInfo) {
      // If user validates via delegation, use the delegator's role
      return getUserStepRole(delegatorInfo.role || '') || null;
    }
    return null;
  }, [rbac.isAdmin, rbac.user?.profilFonctionnel, canValidateViaDelegation, delegatorInfo]);

  // Check user_roles table for validation roles (SAF, CB, DAF, DG)
  const [userRoleFromDB, setUserRoleFromDB] = useState<string | null>(null);
  useEffect(() => {
    if (!rbac.user?.id) return;
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', rbac.user?.id ?? '')
        .in('role', ['SAF', 'CB', 'DAF', 'DG', 'ADMIN'])
        .then(({ data }) => {
          if (data && data.length > 0) {
            // Priority: ADMIN > DG > DAF > CB > SAF
            const roles = data.map((r) => r.role);
            if (roles.includes('ADMIN')) setUserRoleFromDB('ALL');
            else if (roles.includes('DG')) setUserRoleFromDB('DG');
            else if (roles.includes('DAF')) setUserRoleFromDB('DAF');
            else if (roles.includes('CB')) setUserRoleFromDB('CB');
            else if (roles.includes('SAF')) setUserRoleFromDB('SAF');
          }
        });
    });
  }, [rbac.user?.id]);

  const effectiveRole = useMemo(() => {
    if (userStepRole === 'ALL') return 'ALL';
    if (userStepRole) return userStepRole;
    if (userRoleFromDB) return userRoleFromDB;
    return null;
  }, [userStepRole, userRoleFromDB]);

  const effectiveStepOrder = effectiveRole === 'ALL' ? 0 : getStepOrder(effectiveRole || '');

  // Can this user access this page?
  const canAccess = rbac.isAdmin || effectiveRole !== null;

  // Engagements pending THIS user's specific visa
  const engagementsForMyVisa = useMemo(() => {
    if (!effectiveRole) return [];
    // All statuts that mean "in validation pipeline"
    const validationStatuts = ['soumis', 'visa_saf', 'visa_cb', 'visa_daaf'];
    return engagements.filter((eng) => {
      if (!validationStatuts.includes(eng.statut)) return false;
      if (effectiveRole === 'ALL') return true;
      return eng.current_step === effectiveStepOrder;
    });
  }, [engagements, effectiveRole, effectiveStepOrder]);

  // Historically validated/rejected by this role (for history tab)
  const [allValidationSteps, setAllValidationSteps] = useState<Map<string, ValidationStepData[]>>(
    new Map()
  );

  // Fetch validation steps for engagements in view
  useEffect(() => {
    const engagementIds = [
      ...engagementsForMyVisa.map((e) => e.id),
      ...engagements
        .filter((e) => e.statut === 'valide' || e.statut === 'rejete')
        .slice(0, 20)
        .map((e) => e.id),
    ];
    const uniqueIds = [...new Set(engagementIds)];

    const fetchSteps = async () => {
      const map = new Map<string, ValidationStepData[]>();
      for (const id of uniqueIds) {
        try {
          const steps = await getValidationSteps(id);
          map.set(id, steps);
        } catch {
          // ignore individual failures
        }
      }
      setAllValidationSteps(map);
    };

    if (uniqueIds.length > 0) {
      fetchSteps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementsForMyVisa.length, engagements.length]);

  // CB special: budget availability per engagement
  const [budgetAvailabilities, setBudgetAvailabilities] = useState<Map<string, BudgetAvailability>>(
    new Map()
  );
  const [loadingBudgets, setLoadingBudgets] = useState<Set<string>>(new Set());

  const isCBRole = effectiveRole === 'CB';

  useEffect(() => {
    if (!isCBRole || engagementsForMyVisa.length === 0) return;

    const fetchBudgets = async () => {
      const newMap = new Map<string, BudgetAvailability>();
      const loading = new Set<string>();

      for (const eng of engagementsForMyVisa) {
        loading.add(eng.id);
        setLoadingBudgets(new Set(loading));
        try {
          const avail = await calculateAvailability(eng.budget_line_id, eng.montant, eng.id);
          newMap.set(eng.id, avail);
        } catch {
          // ignore
        }
        loading.delete(eng.id);
        setLoadingBudgets(new Set(loading));
      }

      setBudgetAvailabilities(newMap);
    };

    fetchBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCBRole, engagementsForMyVisa.length, calculateAvailability]);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEngagement, setSelectedEngagement] = useState<Engagement | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [expandedBudget, setExpandedBudget] = useState<string | null>(null);

  // KPIs
  const totalEnAttente = engagementsForMyVisa.length;
  const montantTotal = engagementsForMyVisa.reduce((acc, e) => acc + e.montant, 0);

  // Search filter
  const filterBySearch = (list: Engagement[]) =>
    list.filter(
      (eng) =>
        eng.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eng.objet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eng.fournisseur?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false
    );

  const filteredForMyVisa = filterBySearch(engagementsForMyVisa);

  // History: engagements that passed through this step
  const historique = useMemo(() => {
    if (!effectiveRole || effectiveRole === 'ALL') {
      return engagements.filter((e) => e.statut === 'valide' || e.statut === 'rejete').slice(0, 50);
    }
    return engagements.filter((eng) => {
      const steps = allValidationSteps.get(eng.id) || [];
      return steps.some(
        (s) =>
          s.step_order === effectiveStepOrder && (s.status === 'valide' || s.status === 'rejete')
      );
    });
  }, [engagements, effectiveRole, effectiveStepOrder, allValidationSteps]);

  const filteredHistorique = filterBySearch(historique);

  // Handlers
  const handleValidate = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowValidateDialog(true);
  };

  const handleReject = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowRejectDialog(true);
  };

  const handleView = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowDetails(true);
  };

  const confirmValidate = async (id: string, comments?: string) => {
    await validateEngagement({ id, comments });
    setShowValidateDialog(false);
    setSelectedEngagement(null);
  };

  const confirmReject = async (id: string, reason: string) => {
    await rejectEngagement({ id, reason });
    setShowRejectDialog(false);
    setSelectedEngagement(null);
  };

  // Check if CB can approve (budget sufficient)
  const canCBApprove = (engId: string): boolean => {
    if (!isCBRole) return true;
    const avail = budgetAvailabilities.get(engId);
    if (!avail) return true; // Allow if not yet loaded
    return avail.is_sufficient;
  };

  // Role label for display
  const roleLabel =
    effectiveRole === 'ALL' ? 'Administrateur' : effectiveRole ? getStepLabel(effectiveRole) : '';

  // Access denied
  if (!rbac.isLoading && !canAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldCheck className="h-16 w-16 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold text-muted-foreground">Acces restreint</h2>
        <p className="text-sm text-muted-foreground">
          Cette page est reservee aux valideurs d'engagements (SAF, CB, DAAF, DG)
        </p>
        <Button variant="outline" onClick={() => navigate('/engagements')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux engagements
        </Button>
      </div>
    );
  }

  if (isLoading || rbac.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/engagements')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Validation des engagements</h1>
            <p className="text-muted-foreground">
              Espace {roleLabel} — Exercice {exercice}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viaDelegation && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <User className="h-3 w-3 mr-1" />
              Par delegation
              {delegatorInfo ? ` du ${delegatorInfo.role}` : ''}
            </Badge>
          )}
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            {totalEnAttente} en attente
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            {effectiveRole === 'ALL' ? 'Admin' : effectiveRole}
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente de mon visa
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEnAttente}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalEnAttente === 0
                ? 'Aucun engagement en attente'
                : `${totalEnAttente} engagement${totalEnAttente > 1 ? 's' : ''} a traiter`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant total
            </CardTitle>
            <Banknote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatCurrency(montantTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Valeur cumulee des engagements en attente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par numero, objet ou fournisseur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="en_attente">
            <TabsList>
              <TabsTrigger value="en_attente" className="gap-2">
                <Clock className="h-3.5 w-3.5" />
                En attente ({totalEnAttente})
              </TabsTrigger>
              <TabsTrigger value="historique" className="gap-2">
                <History className="h-3.5 w-3.5" />
                Historique ({filteredHistorique.length})
              </TabsTrigger>
            </TabsList>

            {/* En attente */}
            <TabsContent value="en_attente" className="mt-4">
              {filteredForMyVisa.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Aucun engagement en attente de votre visa</p>
                  <p className="text-sm mt-1">Tous les engagements ont ete traites.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numero</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Progression</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForMyVisa.map((eng) => {
                        const steps = allValidationSteps.get(eng.id) || [];
                        const cbCanApprove = canCBApprove(eng.id);
                        const isBudgetLoading = loadingBudgets.has(eng.id);
                        const availability = budgetAvailabilities.get(eng.id) || null;

                        return (
                          <Fragment key={eng.id}>
                            <TableRow>
                              <TableCell className="font-mono text-sm font-medium">
                                {eng.numero}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">{eng.objet}</TableCell>
                              <TableCell>{eng.fournisseur || '-'}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(eng.montant)}
                              </TableCell>
                              <TableCell>
                                <EngagementValidationTimeline
                                  currentStep={eng.current_step || 1}
                                  statut={eng.statut}
                                  validationSteps={steps}
                                  compact
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleView(eng)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {isCBRole && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setExpandedBudget(expandedBudget === eng.id ? null : eng.id)
                                      }
                                    >
                                      <Banknote className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {isCBRole && !cbCanApprove ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span>
                                          <Button size="sm" disabled>
                                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                            Viser
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Credits insuffisants — visa impossible</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleValidate(eng)}
                                      disabled={isBudgetLoading && isCBRole}
                                    >
                                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                      Viser
                                    </Button>
                                  )}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleReject(eng)}
                                  >
                                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                    Rejeter
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {/* CB: Expanded budget indicator */}
                            {isCBRole && expandedBudget === eng.id && (
                              <TableRow>
                                <TableCell colSpan={6} className="bg-muted/30 p-4">
                                  <IndicateurBudget
                                    availability={availability}
                                    isLoading={isBudgetLoading}
                                    budgetLine={
                                      eng.budget_line
                                        ? {
                                            code: eng.budget_line.code,
                                            label: eng.budget_line.label,
                                          }
                                        : null
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Historique */}
            <TabsContent value="historique" className="mt-4">
              {filteredHistorique.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune decision enregistree</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead>Objet</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Progression</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Historique des visas</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistorique.map((eng) => {
                      const steps = allValidationSteps.get(eng.id) || [];
                      return (
                        <TableRow key={eng.id}>
                          <TableCell className="font-mono text-sm font-medium">
                            {eng.numero}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate">{eng.objet}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(eng.montant)}
                          </TableCell>
                          <TableCell>
                            <EngagementValidationTimeline
                              currentStep={eng.current_step || 1}
                              statut={eng.statut}
                              validationSteps={steps}
                              compact
                            />
                          </TableCell>
                          <TableCell>
                            {eng.statut === 'valide' ? (
                              <Badge className="bg-green-100 text-green-700">Valide</Badge>
                            ) : eng.statut === 'rejete' ? (
                              <Badge className="bg-red-100 text-red-700">Rejete</Badge>
                            ) : (
                              <Badge variant="outline">{eng.statut}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {steps
                                .filter((s) => s.status === 'valide' || s.status === 'rejete')
                                .map((s) => (
                                  <div
                                    key={s.step_order}
                                    className="flex items-center gap-1.5 text-xs"
                                  >
                                    {s.status === 'valide' ? (
                                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <XCircle className="h-3 w-3 text-destructive" />
                                    )}
                                    <span className="font-medium">{s.role}</span>
                                    {s.validated_at && (
                                      <span className="text-muted-foreground">
                                        {format(new Date(s.validated_at), 'dd/MM/yy', {
                                          locale: fr,
                                        })}
                                      </span>
                                    )}
                                    {s.validator?.full_name && (
                                      <span className="text-muted-foreground">
                                        — {s.validator.full_name}
                                      </span>
                                    )}
                                    {s.comments && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-muted-foreground cursor-help underline decoration-dotted">
                                            (motif)
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="max-w-xs">{s.comments}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                ))}
                              {steps.filter((s) => s.status === 'valide' || s.status === 'rejete')
                                .length === 0 && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleView(eng)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EngagementValidateDialog
        engagement={selectedEngagement}
        open={showValidateDialog}
        onOpenChange={setShowValidateDialog}
        onConfirm={confirmValidate}
        isLoading={isValidating}
      />

      <EngagementRejectDialog
        engagement={selectedEngagement}
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={confirmReject}
      />

      <EngagementDetails
        engagement={selectedEngagement}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </div>
  );
}
