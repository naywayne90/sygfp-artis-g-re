import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExercice } from "@/contexts/ExerciceContext";
import { usePassationsMarche, PassationMarche, MODES_PASSATION, STATUTS, EBValidee } from "@/hooks/usePassationsMarche";
import { 
  PassationMarcheForm,
  PassationDetails,
  PassationValidateDialog,
  PassationRejectDialog,
  PassationDeferDialog,
} from "@/components/passation-marche";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { WorkflowStepIndicator } from "@/components/workflow/WorkflowStepIndicator";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Search,
  Loader2,
  ShoppingCart,
  Tag,
  Eye,
  Send,
  MoreHorizontal,
  FolderOpen,
  Trash2,
  Gavel,
} from "lucide-react";

const getStatusBadge = (statut: string) => {
  const config = STATUTS[statut as keyof typeof STATUTS] || STATUTS.brouillon;
  return <Badge className={config.color}>{config.label}</Badge>;
};

const getModeName = (value: string) => {
  return MODES_PASSATION.find((m) => m.value === value)?.label || value;
};

export default function PassationMarchePage() {
  const { exercice } = useExercice();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    passations,
    ebValidees,
    counts,
    isLoading,
    refetch,
    submitPassation,
    validatePassation,
    rejectPassation,
    deferPassation,
    deletePassation,
  } = usePassationsMarche();

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("a_traiter");
  const [sourceEB, setSourceEB] = useState<EBValidee | null>(null);
  const [isLoadingSource, setIsLoadingSource] = useState(false);

  // Dialogs
  const [selectedPassation, setSelectedPassation] = useState<PassationMarche | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deferOpen, setDeferOpen] = useState(false);

  // Gérer sourceEB depuis l'URL
  useEffect(() => {
    const sourceEBId = searchParams.get("sourceEB");
    if (sourceEBId) {
      setIsLoadingSource(true);
      supabase
        .from("expressions_besoin")
        .select(`
          id, numero, objet, montant_estime, dossier_id, direction_id,
          direction:directions(id, label, sigle)
        `)
        .eq("id", sourceEBId)
        .single()
        .then(({ data, error }) => {
          setIsLoadingSource(false);
          if (error) {
            toast.error("Impossible de charger l'EB source");
            searchParams.delete("sourceEB");
            setSearchParams(searchParams, { replace: true });
          } else if (data) {
            setSourceEB(data as unknown as EBValidee);
            setShowForm(true);
          }
        });
    }
  }, [searchParams, setSearchParams]);

  const handleCloseForm = () => {
    setShowForm(false);
    setSourceEB(null);
    searchParams.delete("sourceEB");
    setSearchParams(searchParams, { replace: true });
  };

  const handleViewDetails = (pm: PassationMarche) => {
    setSelectedPassation(pm);
    setDetailsOpen(true);
  };

  const handleValidateClick = (pm: PassationMarche) => {
    setSelectedPassation(pm);
    setValidateOpen(true);
  };

  const handleRejectClick = (pm: PassationMarche) => {
    setSelectedPassation(pm);
    setRejectOpen(true);
  };

  const handleDeferClick = (pm: PassationMarche) => {
    setSelectedPassation(pm);
    setDeferOpen(true);
  };

  const handleConfirmValidate = async () => {
    if (selectedPassation) {
      await validatePassation(selectedPassation.id);
      setValidateOpen(false);
      setSelectedPassation(null);
      refetch();
    }
  };

  const handleConfirmReject = async (motif: string) => {
    if (selectedPassation) {
      await rejectPassation({ id: selectedPassation.id, motif });
      setRejectOpen(false);
      setSelectedPassation(null);
      refetch();
    }
  };

  const handleConfirmDefer = async (motif: string, dateReprise?: string) => {
    if (selectedPassation) {
      await deferPassation({ id: selectedPassation.id, motif, dateReprise });
      setDeferOpen(false);
      setSelectedPassation(null);
      refetch();
    }
  };

  const handleGoToDossier = (dossierId: string) => {
    navigate(`/recherche?dossier=${dossierId}`);
  };

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat("fr-FR").format(montant) + " FCFA" : "-";

  const filteredPassations = passations.filter(
    (p) =>
      p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.expression_besoin?.objet?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const passationsByTab = {
    a_traiter: ebValidees,
    brouillon: filteredPassations.filter((p) => p.statut === "brouillon"),
    soumis: filteredPassations.filter((p) => p.statut === "soumis"),
    valide: filteredPassations.filter((p) => p.statut === "valide"),
    rejete: filteredPassations.filter((p) => p.statut === "rejete"),
    differe: filteredPassations.filter((p) => p.statut === "differe"),
  };

  if (isLoading || isLoadingSource) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <WorkflowStepIndicator currentStep={3} />

      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">Passation de Marché</h1>
          <p className="page-description">
            Gestion des procédures de passation depuis les EB validées - Exercice {exercice}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Gavel className="mr-2 h-4 w-4" />
          Nouvelle passation
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              À traiter
            </CardTitle>
            <Tag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ebValidees.length}</div>
            <p className="text-xs text-muted-foreground">EB validées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Brouillons
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.brouillon}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Soumis
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.soumis}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Validés
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.valide}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejetés
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.rejete}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Différés
            </CardTitle>
            <PauseCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.differe}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par référence ou objet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="a_traiter" className="gap-1">
                <Tag className="h-3 w-3" />
                À traiter
                <Badge variant="secondary" className="ml-1 text-xs">{ebValidees.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="brouillon">
                Brouillons ({counts.brouillon})
              </TabsTrigger>
              <TabsTrigger value="soumis">
                Soumis ({counts.soumis})
              </TabsTrigger>
              <TabsTrigger value="valide">
                Validés ({counts.valide})
              </TabsTrigger>
              <TabsTrigger value="rejete">
                Rejetés ({counts.rejete})
              </TabsTrigger>
              <TabsTrigger value="differe">
                Différés ({counts.differe})
              </TabsTrigger>
            </TabsList>

            {/* Onglet EB à traiter */}
            <TabsContent value="a_traiter" className="mt-4">
              {ebValidees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune expression de besoin à traiter</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Objet</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Montant estimé</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ebValidees.map((eb: any) => (
                      <TableRow key={eb.id}>
                        <TableCell className="font-mono text-sm">{eb.numero || "-"}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{eb.objet}</TableCell>
                        <TableCell>{eb.direction?.sigle || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMontant(eb.montant_estime)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSourceEB(eb);
                              setShowForm(true);
                            }}
                          >
                            <Gavel className="mr-2 h-4 w-4" />
                            Passation
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Autres onglets passations */}
            {["brouillon", "soumis", "valide", "rejete", "differe"].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                {passationsByTab[tab as keyof typeof passationsByTab].length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune passation dans cet onglet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>EB Source</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead className="text-right">Montant retenu</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Créé le</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(passationsByTab[tab as keyof typeof passationsByTab] as PassationMarche[]).map(
                        (pm) => (
                          <TableRow key={pm.id}>
                            <TableCell className="font-mono text-sm">{pm.reference || "-"}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {pm.expression_besoin?.numero || pm.expression_besoin?.objet || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{getModeName(pm.mode_passation)}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatMontant(pm.montant_retenu)}
                            </TableCell>
                            <TableCell>{getStatusBadge(pm.statut)}</TableCell>
                            <TableCell>
                              {format(new Date(pm.created_at), "dd MMM yyyy", { locale: fr })}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover">
                                  <DropdownMenuItem onClick={() => handleViewDetails(pm)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir détails
                                  </DropdownMenuItem>

                                  {pm.dossier_id && (
                                    <DropdownMenuItem onClick={() => handleGoToDossier(pm.dossier_id!)}>
                                      <FolderOpen className="mr-2 h-4 w-4" />
                                      Voir le dossier
                                    </DropdownMenuItem>
                                  )}

                                  {pm.statut === "brouillon" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => submitPassation(pm.id)}>
                                        <Send className="mr-2 h-4 w-4" />
                                        Soumettre
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => deletePassation(pm.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {pm.statut === "soumis" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleValidateClick(pm)}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Valider
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeferClick(pm)}>
                                        <Clock className="mr-2 h-4 w-4" />
                                        Différer
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleRejectClick(pm)}
                                        className="text-destructive"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Rejeter
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {pm.statut === "valide" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => navigate(`/engagements?sourcePM=${pm.id}`)}
                                      >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Créer engagement
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Form dialog */}
      <PassationMarcheForm
        open={showForm}
        onOpenChange={handleCloseForm}
        sourceEB={sourceEB}
        onSuccess={() => setActiveTab("brouillon")}
      />

      {/* Details dialog */}
      {selectedPassation && (
        <PassationDetails
          passation={selectedPassation}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onSubmit={() => {
            submitPassation(selectedPassation.id);
            setDetailsOpen(false);
            refetch();
          }}
          onValidate={() => {
            setDetailsOpen(false);
            setValidateOpen(true);
          }}
          onReject={() => {
            setDetailsOpen(false);
            setRejectOpen(true);
          }}
          onDefer={() => {
            setDetailsOpen(false);
            setDeferOpen(true);
          }}
          canValidate={true}
        />
      )}

      {/* Validate dialog */}
      <PassationValidateDialog
        passation={selectedPassation}
        open={validateOpen}
        onOpenChange={setValidateOpen}
        onConfirm={handleConfirmValidate}
      />

      {/* Reject dialog */}
      <PassationRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleConfirmReject}
        reference={selectedPassation?.reference || undefined}
      />

      {/* Defer dialog */}
      <PassationDeferDialog
        open={deferOpen}
        onOpenChange={setDeferOpen}
        onConfirm={handleConfirmDefer}
        reference={selectedPassation?.reference || undefined}
      />
    </div>
  );
}
