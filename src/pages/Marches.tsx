import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useExercice } from "@/contexts/ExerciceContext";
import { useExerciceWriteGuard } from "@/hooks/useExerciceWriteGuard";
import { ExerciceSubtitle } from "@/components/exercice/ExerciceSubtitle";
import { useMarches, Marche } from "@/hooks/useMarches";
import { MarcheForm } from "@/components/marches/MarcheForm";
import { MarcheList } from "@/components/marches/MarcheList";
import { MarcheDetails } from "@/components/marches/MarcheDetails";
import { MarcheRejectDialog } from "@/components/marches/MarcheRejectDialog";
import { MarcheDeferDialog } from "@/components/marches/MarcheDeferDialog";
import { MarcheValidateDialog } from "@/components/marches/MarcheValidateDialog";
import { 
  Plus, 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Lock
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Marches() {
  const { exercice } = useExercice();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const {
    allMarches,
    marchesAValider,
    marchesValides,
    marchesRejetes,
    marchesDifferes,
    loadingAll,
    refetchMarches,
  } = useMarches();

  const [activeTab, setActiveTab] = useState("tous");
  const [showForm, setShowForm] = useState(false);
  const [selectedMarche, setSelectedMarche] = useState<Marche | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showDefer, setShowDefer] = useState(false);
  const [showValidate, setShowValidate] = useState(false);

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  const handleRefresh = () => {
    refetchMarches();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ExerciceSubtitle 
          title="Passation de Marchés (SDPM)" 
          description="Gestion des marchés et workflow de validation" 
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button 
                  onClick={() => setShowForm(true)} 
                  className="gap-2"
                  disabled={!canWrite}
                >
                  {!canWrite ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  Nouveau marché
                </Button>
              </span>
            </TooltipTrigger>
            {!canWrite && (
              <TooltipContent>
                <p>{getDisabledMessage()}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allMarches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">À valider</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{marchesAValider.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Validés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{marchesValides.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejetés</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{marchesRejetes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Différés</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{marchesDifferes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tous">Tous <Badge variant="secondary" className="ml-1">{allMarches.length}</Badge></TabsTrigger>
          <TabsTrigger value="a_valider">À valider <Badge variant="secondary" className="ml-1">{marchesAValider.length}</Badge></TabsTrigger>
          <TabsTrigger value="valides">Validés <Badge variant="secondary" className="ml-1">{marchesValides.length}</Badge></TabsTrigger>
          <TabsTrigger value="rejetes">Rejetés <Badge variant="secondary" className="ml-1">{marchesRejetes.length}</Badge></TabsTrigger>
          <TabsTrigger value="differes">Différés <Badge variant="secondary" className="ml-1">{marchesDifferes.length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="tous" className="mt-4">
          <MarcheList
            marches={allMarches}
            title="Tous les marchés"
            isLoading={loadingAll}
            onView={(m) => { setSelectedMarche(m); setShowDetails(true); }}
            onValidate={(m) => { setSelectedMarche(m); setShowValidate(true); }}
            onReject={(m) => { setSelectedMarche(m); setShowReject(true); }}
            onDefer={(m) => { setSelectedMarche(m); setShowDefer(true); }}
          />
        </TabsContent>

        <TabsContent value="a_valider" className="mt-4">
          <MarcheList
            marches={marchesAValider}
            title="Marchés à valider"
            description="Marchés en attente de validation dans le workflow"
            onView={(m) => { setSelectedMarche(m); setShowDetails(true); }}
            onValidate={(m) => { setSelectedMarche(m); setShowValidate(true); }}
            onReject={(m) => { setSelectedMarche(m); setShowReject(true); }}
            onDefer={(m) => { setSelectedMarche(m); setShowDefer(true); }}
          />
        </TabsContent>

        <TabsContent value="valides" className="mt-4">
          <MarcheList
            marches={marchesValides}
            title="Marchés validés"
            description="Marchés ayant complété le workflow de validation"
            showActions={false}
            onView={(m) => { setSelectedMarche(m); setShowDetails(true); }}
          />
        </TabsContent>

        <TabsContent value="rejetes" className="mt-4">
          <MarcheList
            marches={marchesRejetes}
            title="Marchés rejetés"
            description="Marchés rejetés avec motif obligatoire"
            showActions={false}
            onView={(m) => { setSelectedMarche(m); setShowDetails(true); }}
          />
        </TabsContent>

        <TabsContent value="differes" className="mt-4">
          <MarcheList
            marches={marchesDifferes}
            title="Marchés différés"
            description="Marchés mis en attente avec motif"
            onView={(m) => { setSelectedMarche(m); setShowDetails(true); }}
            onResume={(m) => { /* resume */ }}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau marché</DialogTitle>
          </DialogHeader>
          <MarcheForm
            onSuccess={() => { setShowForm(false); handleRefresh(); }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du marché</DialogTitle>
          </DialogHeader>
          {selectedMarche && <MarcheDetails marche={selectedMarche} />}
        </DialogContent>
      </Dialog>

      <MarcheValidateDialog
        marche={selectedMarche}
        open={showValidate}
        onOpenChange={setShowValidate}
        onSuccess={handleRefresh}
      />

      <MarcheRejectDialog
        marche={selectedMarche}
        open={showReject}
        onOpenChange={setShowReject}
        onSuccess={handleRefresh}
      />

      <MarcheDeferDialog
        marche={selectedMarche}
        open={showDefer}
        onOpenChange={setShowDefer}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
