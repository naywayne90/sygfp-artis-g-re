import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useExercice } from "@/contexts/ExerciceContext";
import { useImputation } from "@/hooks/useImputation";
import { ImputationList } from "@/components/imputation/ImputationList";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Tag, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  ArrowRight,
  Eye,
  HelpCircle,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WorkflowStepIndicator } from "@/components/workflow/WorkflowStepIndicator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Imputation() {
  const { exercice } = useExercice();
  const navigate = useNavigate();
  const { 
    notesAImputer, 
    notesImputees, 
    loadingNotes, 
    loadingImputees 
  } = useImputation();

  const [activeTab, setActiveTab] = useState("a_imputer");
  const [showHelp, setShowHelp] = useState(false);

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat("fr-FR").format(montant) + " FCFA" : "-";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicateur de workflow */}
      <WorkflowStepIndicator currentStep={2} />

      <div className="page-header">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">Imputation Budgétaire</h1>
            <p className="page-description">
              Affectation des notes AEF validées aux lignes budgétaires - Exercice {exercice}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowHelp(!showHelp)}>
            <HelpCircle className="h-4 w-4 mr-1" />
            Aide
          </Button>
        </div>
      </div>

      {/* Section d'aide */}
      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <CollapsibleContent>
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">Comment fonctionne l'imputation ?</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300 space-y-2">
              <p>L'imputation est l'étape 2 de la chaîne de dépense, juste après les Notes AEF.</p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li><strong>Notes à imputer :</strong> Les notes AEF validées apparaissent ici en attente d'imputation</li>
                <li><strong>Affectation :</strong> Cliquez sur "Imputer" pour affecter la note à une ligne budgétaire</li>
                <li><strong>Vérification :</strong> Le système vérifie la disponibilité budgétaire</li>
                <li><strong>Création du dossier :</strong> Un dossier de dépense est créé automatiquement</li>
              </ol>
              <p className="mt-2">
                <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => navigate("/notes-aef")}>
                  → Gérer les Notes AEF
                </Button>
              </p>
            </AlertDescription>
          </Alert>
        </CollapsibleContent>
      </Collapsible>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notes à imputer
            </CardTitle>
            <Tag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notesAImputer.length}</div>
            <p className="text-xs text-muted-foreground">En attente d'imputation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Imputées ce mois
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notesImputees.filter(n => {
                if (!n.imputed_at) return false;
                const impDate = new Date(n.imputed_at);
                const now = new Date();
                return impDate.getMonth() === now.getMonth() && 
                       impDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Traitées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total imputé
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notesImputees.length}</div>
            <p className="text-xs text-muted-foreground">Notes traitées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Urgentes
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notesAImputer.filter(n => n.priorite === "urgente").length}
            </div>
            <p className="text-xs text-muted-foreground">À traiter en priorité</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="a_imputer" className="gap-2">
            <Tag className="h-4 w-4" />
            À imputer
            <Badge variant="secondary" className="ml-1">{notesAImputer.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="imputees" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Imputées
            <Badge variant="secondary" className="ml-1">{notesImputees.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="a_imputer" className="mt-4">
          <ImputationList 
            notes={notesAImputer as any} 
            isLoading={loadingNotes}
          />
        </TabsContent>

        <TabsContent value="imputees" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Notes imputées
              </CardTitle>
              <CardDescription>
                Notes ayant reçu leur imputation budgétaire et dont le dossier est créé
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingImputees ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : notesImputees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune note imputée</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Ligne budgétaire</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Imputé le</TableHead>
                        <TableHead>Par</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notesImputees.map((note: any) => (
                        <TableRow key={note.id}>
                          <TableCell className="font-mono text-sm">
                            {note.numero || "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {note.objet}
                          </TableCell>
                          <TableCell>
                            {note.direction?.sigle || note.direction?.label || "-"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {note.budget_line?.code || "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontant(note.montant_estime)}
                          </TableCell>
                          <TableCell>
                            {note.imputed_at
                              ? format(new Date(note.imputed_at), "dd MMM yyyy", { locale: fr })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {note.imputed_by_profile?.first_name} {note.imputed_by_profile?.last_name}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/notes-aef?view=${note.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/marches`)}
                              >
                                Passer le marché
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
