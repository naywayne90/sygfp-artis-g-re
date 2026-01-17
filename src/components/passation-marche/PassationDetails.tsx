import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PassationChecklist } from "./PassationChecklist";
import { PassationMarche, MODES_PASSATION, STATUTS } from "@/hooks/usePassationsMarche";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Gavel,
  FileText,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  FolderOpen,
  Building2,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

interface PassationDetailsProps {
  passation: PassationMarche;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
  onValidate?: () => void;
  onReject?: () => void;
  onDefer?: () => void;
  canValidate?: boolean;
}

export function PassationDetails({
  passation,
  open,
  onOpenChange,
  onSubmit,
  onValidate,
  onReject,
  onDefer,
  canValidate = false,
}: PassationDetailsProps) {
  const [checklistComplete, setChecklistComplete] = useState(false);
  const [missingDocs, setMissingDocs] = useState<string[]>([]);

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat("fr-FR").format(montant) + " FCFA" : "-";

  const getModeName = (value: string) =>
    MODES_PASSATION.find((m) => m.value === value)?.label || value;

  const getStatusBadge = (statut: string) => {
    const config = STATUTS[statut as keyof typeof STATUTS] || STATUTS.brouillon;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const prestataires = passation.prestataires_sollicites || [];
  const criteres = passation.criteres_evaluation || [];

  // Calculer le score global des prestataires
  const getGlobalScore = (p: any) => {
    if (!p.note_technique || !p.note_financiere) return null;
    const techWeight = criteres.find((c: any) => c.nom?.includes("tech"))?.poids || 50;
    const finWeight = 100 - techWeight;
    return ((p.note_technique * techWeight + p.note_financiere * finWeight) / 100).toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Passation {passation.reference || ""}
            </DialogTitle>
            {getStatusBadge(passation.statut)}
          </div>
          <DialogDescription>
            {passation.expression_besoin?.objet || "Détails de la passation de marché"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="infos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="infos" className="gap-1">
              <ClipboardList className="h-3 w-3" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="prestataires" className="gap-1">
              <Users className="h-3 w-3" />
              Prestataires ({prestataires.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1">
              <FileText className="h-3 w-3" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="analyse" className="gap-1">
              <BarChart3 className="h-3 w-3" />
              Analyse
            </TabsTrigger>
          </TabsList>

          {/* Informations générales */}
          <TabsContent value="infos" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Expression de besoin source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Numéro EB:</span>{" "}
                    <span className="font-mono font-medium">
                      {passation.expression_besoin?.numero || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant estimé:</span>{" "}
                    <span className="font-medium">
                      {formatMontant(passation.expression_besoin?.montant_estime || null)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Objet:</span>{" "}
                    <span className="font-medium">{passation.expression_besoin?.objet}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Détails de la passation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Mode de passation:</span>{" "}
                    <Badge variant="outline">{getModeName(passation.mode_passation)}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type de procédure:</span>{" "}
                    <span className="font-medium">{passation.type_procedure || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Créé le:</span>{" "}
                    <span className="font-medium">
                      {format(new Date(passation.created_at), "dd MMMM yyyy", { locale: fr })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Par:</span>{" "}
                    <span className="font-medium">{passation.creator?.full_name || "-"}</span>
                  </div>
                  {passation.montant_retenu && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Montant retenu:</span>{" "}
                      <span className="font-bold text-primary">
                        {formatMontant(passation.montant_retenu)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Motif de rejet/différé */}
                {passation.statut === "rejete" && passation.rejection_reason && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">Motif de rejet</span>
                    </div>
                    <p className="text-sm">{passation.rejection_reason}</p>
                  </div>
                )}

                {passation.statut === "differe" && passation.motif_differe && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 text-orange-700 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Différé</span>
                    </div>
                    <p className="text-sm">{passation.motif_differe}</p>
                    {passation.date_reprise && (
                      <p className="text-xs text-orange-600 mt-1">
                        Reprise prévue: {format(new Date(passation.date_reprise), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prestataires sollicités */}
          <TabsContent value="prestataires" className="mt-4">
            {prestataires.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun prestataire sollicité</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestataire</TableHead>
                    <TableHead className="text-right">Offre (FCFA)</TableHead>
                    <TableHead className="text-center">Note Tech.</TableHead>
                    <TableHead className="text-center">Note Fin.</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Sélectionné</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prestataires.map((p: any, index: number) => (
                    <TableRow key={index} className={p.selectionne ? "bg-green-50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {p.raison_sociale}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {p.offre_montant ? formatMontant(p.offre_montant) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.note_technique ?? "-"}/100
                      </TableCell>
                      <TableCell className="text-center">
                        {p.note_financiere ?? "-"}/100
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {getGlobalScore(p) ?? "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.selectionne ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Prestataire retenu */}
            {passation.prestataire_retenu && (
              <Card className="mt-4 bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Prestataire retenu</span>
                  </div>
                  <p className="font-medium">{passation.prestataire_retenu.raison_sociale}</p>
                  {passation.motif_selection && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {passation.motif_selection}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents / Checklist */}
          <TabsContent value="documents" className="mt-4">
            <PassationChecklist
              passationId={passation.id}
              modePassation={passation.mode_passation}
              piecesJointes={passation.pieces_jointes || []}
              readOnly={passation.statut !== "brouillon"}
              onValidationChange={(complete, missing) => {
                setChecklistComplete(complete);
                setMissingDocs(missing);
              }}
            />
          </TabsContent>

          {/* Analyse */}
          <TabsContent value="analyse" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Critères d'évaluation</CardTitle>
              </CardHeader>
              <CardContent>
                {criteres.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun critère défini</p>
                ) : (
                  <div className="space-y-2">
                    {criteres.map((c: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm">{c.nom}</span>
                        <Badge variant="secondary">{c.poids}%</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PV et rapports */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Documents d'analyse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {passation.pv_ouverture && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">PV d'ouverture des plis</span>
                    <Badge variant="outline" className="ml-auto">Disponible</Badge>
                  </div>
                )}
                {passation.pv_evaluation && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">PV d'évaluation</span>
                    <Badge variant="outline" className="ml-auto">Disponible</Badge>
                  </div>
                )}
                {passation.rapport_analyse && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Rapport d'analyse</span>
                    <Badge variant="outline" className="ml-auto">Disponible</Badge>
                  </div>
                )}
                {!passation.pv_ouverture && !passation.pv_evaluation && !passation.rapport_analyse && (
                  <p className="text-muted-foreground text-sm">Aucun document d'analyse</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Actions selon le statut */}
          {passation.statut === "brouillon" && (
            <>
              {!checklistComplete && (
                <div className="flex items-center gap-2 text-sm text-orange-600 mr-auto">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Checklist incomplète - soumission bloquée</span>
                </div>
              )}
              <Button
                onClick={onSubmit}
                disabled={!checklistComplete}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Soumettre pour validation
              </Button>
            </>
          )}

          {passation.statut === "soumis" && canValidate && (
            <>
              <Button variant="outline" onClick={onDefer} className="gap-2">
                <Clock className="h-4 w-4" />
                Différer
              </Button>
              <Button variant="destructive" onClick={onReject} className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejeter
              </Button>
              <Button onClick={onValidate} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Valider
              </Button>
            </>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
