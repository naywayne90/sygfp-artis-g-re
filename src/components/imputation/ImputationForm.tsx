import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CreditCard, 
  Loader2, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Calculator,
  Building,
  Target,
  FileText,
  Banknote
} from "lucide-react";
import { useImputation, BudgetAvailability, ImputationData } from "@/hooks/useImputation";
import { useNavigate } from "react-router-dom";

interface Note {
  id: string;
  numero: string | null;
  objet: string;
  montant_estime: number | null;
  direction?: { id: string; label: string; sigle: string | null } | null;
  created_by_profile?: { first_name: string | null; last_name: string | null } | null;
}

interface ImputationFormProps {
  note: Note;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SOURCES_FINANCEMENT = [
  { value: "budget_etat", label: "Budget de l'État" },
  { value: "ressources_propres", label: "Ressources propres" },
  { value: "subventions", label: "Subventions" },
  { value: "dons_legs", label: "Dons et legs" },
  { value: "emprunts", label: "Emprunts" },
  { value: "partenaires", label: "Partenaires techniques et financiers" },
];

export function ImputationForm({ note, onSuccess, onCancel }: ImputationFormProps) {
  const navigate = useNavigate();
  const {
    objectifsStrategiques,
    missions,
    directions,
    nomenclaturesNBE,
    planComptableSYSCO,
    fetchActions,
    fetchActivites,
    fetchSousActivites,
    calculateAvailability,
    buildImputationCode,
    imputeNote,
    isImputing,
    isReadOnly,
    getDisabledMessage,
  } = useImputation();

  // État du formulaire
  const [formData, setFormData] = useState<Partial<ImputationData>>({
    noteId: note.id,
    montant: note.montant_estime || 0,
    os_id: null,
    mission_id: null,
    action_id: null,
    activite_id: null,
    sous_activite_id: null,
    direction_id: note.direction?.id || null,
    nbe_id: null,
    sysco_id: null,
    source_financement: "budget_etat",
    justification_depassement: "",
    forcer_imputation: false,
  });

  // Listes dépendantes
  const [actions, setActions] = useState<{ id: string; code: string; libelle: string }[]>([]);
  const [activites, setActivites] = useState<{ id: string; code: string; libelle: string }[]>([]);
  const [sousActivites, setSousActivites] = useState<{ id: string; code: string; libelle: string }[]>([]);

  // Recherche
  const [nbeSearch, setNbeSearch] = useState("");
  const [syscoSearch, setSyscoSearch] = useState("");

  // Disponibilité budgétaire
  const [availability, setAvailability] = useState<BudgetAvailability | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Charger les actions quand mission ou OS change
  useEffect(() => {
    if (formData.mission_id || formData.os_id) {
      fetchActions(formData.mission_id || undefined, formData.os_id || undefined)
        .then(setActions);
    } else {
      setActions([]);
    }
    setFormData(prev => ({ ...prev, action_id: null, activite_id: null, sous_activite_id: null }));
    setActivites([]);
    setSousActivites([]);
  }, [formData.mission_id, formData.os_id, fetchActions]);

  // Charger les activités quand action change
  useEffect(() => {
    if (formData.action_id) {
      fetchActivites(formData.action_id).then(setActivites);
    } else {
      setActivites([]);
    }
    setFormData(prev => ({ ...prev, activite_id: null, sous_activite_id: null }));
    setSousActivites([]);
  }, [formData.action_id, fetchActivites]);

  // Charger les sous-activités quand activité change
  useEffect(() => {
    if (formData.activite_id) {
      fetchSousActivites(formData.activite_id).then(setSousActivites);
    } else {
      setSousActivites([]);
    }
    setFormData(prev => ({ ...prev, sous_activite_id: null }));
  }, [formData.activite_id, fetchSousActivites]);

  // Calculer la disponibilité
  const handleCalculateAvailability = useCallback(async () => {
    if (!formData.montant) return;

    setIsCalculating(true);
    try {
      const result = await calculateAvailability({
        direction_id: formData.direction_id,
        os_id: formData.os_id,
        mission_id: formData.mission_id,
        action_id: formData.action_id,
        activite_id: formData.activite_id,
        sous_activite_id: formData.sous_activite_id,
        nbe_id: formData.nbe_id,
        sysco_id: formData.sysco_id,
        montant_actuel: formData.montant,
      });
      setAvailability(result);
    } catch (error) {
      console.error("Erreur calcul disponibilité:", error);
    } finally {
      setIsCalculating(false);
    }
  }, [formData, calculateAvailability]);

  // Recalculer quand le montant ou les sélections changent
  useEffect(() => {
    if (formData.montant && formData.montant > 0) {
      const timer = setTimeout(handleCalculateAvailability, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.montant, formData.direction_id, formData.os_id, formData.nbe_id, formData.sysco_id, handleCalculateAvailability]);

  // Soumettre l'imputation
  const handleSubmit = async () => {
    if (!formData.montant) {
      return;
    }

    try {
      const result = await imputeNote(formData as ImputationData);
      onSuccess?.();
      // Proposer de passer au marché
      navigate(`/marches?dossier=${result.dossier.id}`);
    } catch (error) {
      // L'erreur est gérée par le hook
    }
  };

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  // Code d'imputation construit
  const imputationCode = buildImputationCode(formData as ImputationData);

  // Filtrer NBE
  const filteredNBE = nomenclaturesNBE.filter(
    n => n.code.toLowerCase().includes(nbeSearch.toLowerCase()) ||
         n.libelle.toLowerCase().includes(nbeSearch.toLowerCase())
  );

  // Filtrer SYSCO
  const filteredSYSCO = (planComptableSYSCO as any[]).filter(
    (s: any) => s.code?.toLowerCase().includes(syscoSearch.toLowerCase()) ||
         s.libelle?.toLowerCase().includes(syscoSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* En-tête de la note */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {note.numero || "Sans numéro"}
              </CardTitle>
              <CardDescription className="mt-1">{note.objet}</CardDescription>
            </div>
            {imputationCode !== "N/A" && (
              <Badge variant="outline" className="font-mono text-sm">
                Code: {imputationCode}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Demandeur:</span>
              <p className="font-medium">
                {note.created_by_profile?.first_name} {note.created_by_profile?.last_name}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Direction:</span>
              <p className="font-medium">{note.direction?.sigle || note.direction?.label || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Montant estimé:</span>
              <p className="font-medium">{formatMontant(note.montant_estime || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rattachement programmatique */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Rattachement programmatique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Objectif Stratégique */}
              <div>
                <Label>Objectif Stratégique</Label>
                <Select
                  value={formData.os_id || ""}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, os_id: v || null }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Sélectionner OS" />
                  </SelectTrigger>
                  <SelectContent>
                    {objectifsStrategiques.map(os => (
                      <SelectItem key={os.id} value={os.id}>
                        <span className="font-mono text-xs">{os.code}</span> - {os.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mission */}
              <div>
                <Label>Mission</Label>
                <Select
                  value={formData.mission_id || ""}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, mission_id: v || null }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Sélectionner mission" />
                  </SelectTrigger>
                  <SelectContent>
                    {missions.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        <span className="font-mono text-xs">{m.code}</span> - {m.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action */}
              <div>
                <Label>Action</Label>
                <Select
                  value={formData.action_id || ""}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, action_id: v || null }))}
                  disabled={actions.length === 0}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder={actions.length ? "Sélectionner action" : "Choisir mission/OS d'abord"} />
                  </SelectTrigger>
                  <SelectContent>
                    {actions.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="font-mono text-xs">{a.code}</span> - {a.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Direction */}
              <div>
                <Label>Direction</Label>
                <Select
                  value={formData.direction_id || ""}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, direction_id: v || null }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Sélectionner direction" />
                  </SelectTrigger>
                  <SelectContent>
                    {directions.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.sigle ? `${d.sigle} - ` : ""}{d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Activité */}
              <div>
                <Label>Activité</Label>
                <Select
                  value={formData.activite_id || ""}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, activite_id: v || null }))}
                  disabled={activites.length === 0}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder={activites.length ? "Sélectionner activité" : "Choisir action d'abord"} />
                  </SelectTrigger>
                  <SelectContent>
                    {activites.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="font-mono text-xs">{a.code}</span> - {a.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sous-activité */}
              <div>
                <Label>Sous-activité</Label>
                <Select
                  value={formData.sous_activite_id || ""}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, sous_activite_id: v || null }))}
                  disabled={sousActivites.length === 0}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder={sousActivites.length ? "Sélectionner sous-activité" : "Choisir activité d'abord"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sousActivites.map(sa => (
                      <SelectItem key={sa.id} value={sa.id}>
                        <span className="font-mono text-xs">{sa.code}</span> - {sa.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nomenclatures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5" />
              Nomenclatures comptables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* NBE */}
            <div>
              <Label>Nomenclature Budgétaire de l'État (NBE)</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={nbeSearch}
                  onChange={(e) => setNbeSearch(e.target.value)}
                  placeholder="Rechercher NBE..."
                  className="pl-9"
                />
              </div>
              <Select
                value={formData.nbe_id || ""}
                onValueChange={(v) => setFormData(prev => ({ ...prev, nbe_id: v || null }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionner NBE" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredNBE.slice(0, 50).map(n => (
                    <SelectItem key={n.id} value={n.id}>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{n.code}</span>
                        <span className="text-sm truncate max-w-[300px]">{n.libelle}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SYSCO */}
            <div>
              <Label>Plan Comptable SYSCOHADA (SYSCO)</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={syscoSearch}
                  onChange={(e) => setSyscoSearch(e.target.value)}
                  placeholder="Rechercher compte SYSCO..."
                  className="pl-9"
                />
              </div>
              <Select
                value={formData.sysco_id || ""}
                onValueChange={(v) => setFormData(prev => ({ ...prev, sysco_id: v || null }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionner compte SYSCO" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredSYSCO.slice(0, 50).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{s.code}</span>
                        <span className="text-sm truncate max-w-[300px]">{s.libelle}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source de financement */}
            <div>
              <Label>Source de financement</Label>
              <Select
                value={formData.source_financement}
                onValueChange={(v) => setFormData(prev => ({ ...prev, source_financement: v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES_FINANCEMENT.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Montant et disponibilité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Montant et disponibilité budgétaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="montant">Montant à engager *</Label>
              <div className="relative mt-1.5">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="montant"
                  type="number"
                  value={formData.montant || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, montant: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleCalculateAvailability}
                disabled={isCalculating || !formData.montant}
              >
                {isCalculating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="mr-2 h-4 w-4" />
                )}
                Calculer disponible
              </Button>
            </div>
          </div>

          {/* Tableau de disponibilité amélioré */}
          {availability && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-6 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">(A) Dotation actuelle</p>
                  <p className="font-bold text-lg">{formatMontant(availability.dotation_actuelle)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">(B) Eng. validés</p>
                  <p className="font-bold text-lg text-orange-600">{formatMontant(availability.engagements_anterieurs)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">(C) Réservé</p>
                  <p className="font-bold text-lg text-amber-600">{formatMontant(availability.montant_reserve)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">(D) Eng. actuel</p>
                  <p className="font-bold text-lg text-blue-600">{formatMontant(availability.engagement_actuel)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">(E) Disponible (A-B)</p>
                  <p className={`font-bold text-lg ${availability.disponible >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatMontant(availability.disponible)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">(F) Dispo. net (E-C-D)</p>
                  <p className={`font-bold text-lg ${availability.is_sufficient ? "text-green-600" : "text-red-600"}`}>
                    {formatMontant(availability.disponible_net)}
                  </p>
                </div>
              </div>
              {availability.budget_line_code && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Ligne budgétaire: <span className="font-mono">{availability.budget_line_code}</span>
                </p>
              )}
            </div>
          )}

          {/* Alerte si dépassement */}
          {availability && !availability.is_sufficient && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Disponible net insuffisant</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>
                  Le montant demandé dépasse le disponible net de{" "}
                  <strong>{formatMontant(Math.abs(availability.disponible_net))}</strong>.
                </p>
                <div>
                  <Label htmlFor="justification">Justification obligatoire *</Label>
                  <Textarea
                    id="justification"
                    value={formData.justification_depassement}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      justification_depassement: e.target.value,
                      forcer_imputation: !!e.target.value.trim()
                    }))}
                    placeholder="Expliquez pourquoi vous souhaitez forcer cette imputation..."
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {availability?.is_sufficient && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Disponible suffisant</AlertTitle>
              <AlertDescription className="text-green-600">
                L'imputation peut être effectuée. Après validation, vous pourrez passer le marché.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Alerte exercice clos */}
      {isReadOnly && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Exercice clôturé</AlertTitle>
          <AlertDescription>
            {getDisabledMessage()} - Aucune imputation n'est possible sur cet exercice.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            isImputing ||
            isReadOnly ||
            !formData.montant ||
            (availability && !availability.is_sufficient && !formData.forcer_imputation)
          }
          title={isReadOnly ? getDisabledMessage() : undefined}
        >
          {isImputing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-4 w-4" />
          )}
          Imputer et créer le dossier
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
