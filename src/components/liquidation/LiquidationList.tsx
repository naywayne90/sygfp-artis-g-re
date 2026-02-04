import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Liquidation, VALIDATION_STEPS } from "@/hooks/useLiquidations";
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Play,
  FileText,
  Flame
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { UrgentLiquidationToggle } from "@/components/liquidations/UrgentLiquidationToggle";
import { UrgentLiquidationBadge } from "@/components/liquidations/UrgentLiquidationBadge";

// Type étendu pour inclure les champs urgence (non encore dans les types générés)
interface LiquidationWithUrgent extends Liquidation {
  reglement_urgent?: boolean;
  urgence_motif?: string | null;
  urgence_date?: string | null;
  urgence_user?: { id: string; full_name: string | null } | null;
}

interface LiquidationListProps {
  liquidations: Liquidation[];
  onView: (liquidation: Liquidation) => void;
  onSubmit?: (id: string) => void;
  onValidate?: (id: string) => void;
  onReject?: (id: string) => void;
  onDefer?: (id: string) => void;
  onResume?: (id: string) => void;
  /** Afficher la colonne urgence */
  showUrgentColumn?: boolean;
  /** Callback quand le statut urgent change */
  onUrgentToggle?: (id: string, isUrgent: boolean) => void;
}

const getStatusBadge = (statut: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground border-muted" },
    soumis: { label: "Soumis", className: "bg-secondary/10 text-secondary border-secondary/20" },
    valide: { label: "Validé", className: "bg-success/10 text-success border-success/20" },
    rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive border-destructive/20" },
    differe: { label: "Différé", className: "bg-warning/10 text-warning border-warning/20" },
  };
  const variant = variants[statut || "brouillon"] || variants.brouillon;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export function LiquidationList({
  liquidations,
  onView,
  onSubmit,
  onValidate,
  onReject,
  onDefer,
  onResume,
  showUrgentColumn = true,
  onUrgentToggle,
}: LiquidationListProps) {
  const getCurrentStepLabel = (currentStep: number | null) => {
    const step = VALIDATION_STEPS.find(s => s.order === currentStep);
    return step?.label || "En attente";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showUrgentColumn && (
            <TableHead className="w-[60px]">
              <Flame className="h-4 w-4 text-muted-foreground" />
            </TableHead>
          )}
          <TableHead>Numéro</TableHead>
          <TableHead>Engagement</TableHead>
          <TableHead className="hidden md:table-cell">Fournisseur</TableHead>
          <TableHead className="text-right">Montant</TableHead>
          <TableHead className="hidden lg:table-cell">Date service fait</TableHead>
          <TableHead>Étape</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {liquidations.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showUrgentColumn ? 9 : 8} className="text-center py-8 text-muted-foreground">
              Aucune liquidation trouvée
            </TableCell>
          </TableRow>
        ) : (
          liquidations.map((liquidation) => {
            // Cast to extended type for urgent fields
            const liq = liquidation as LiquidationWithUrgent;
            return (
            <TableRow key={liquidation.id}>
              {showUrgentColumn && (
                <TableCell>
                  {liq.reglement_urgent ? (
                    <UrgentLiquidationBadge
                      variant="icon"
                      motif={liq.urgence_motif}
                      date={liq.urgence_date}
                      marqueParNom={liq.urgence_user?.full_name}
                    />
                  ) : (
                    <UrgentLiquidationToggle
                      liquidationId={liquidation.id}
                      liquidationNumero={liquidation.numero}
                      isUrgent={false}
                      variant="icon"
                      size="sm"
                      onToggle={(isUrgent) => onUrgentToggle?.(liquidation.id, isUrgent)}
                    />
                  )}
                </TableCell>
              )}
              <TableCell className="font-medium">{liquidation.numero}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{liquidation.engagement?.numero || "N/A"}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {liquidation.engagement?.objet}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {liquidation.engagement?.marche?.prestataire?.raison_sociale || 
                 liquidation.engagement?.fournisseur || "N/A"}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatMontant(liquidation.montant)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {liquidation.service_fait_date
                  ? format(new Date(liquidation.service_fait_date), "dd MMM yyyy", { locale: fr })
                  : "N/A"}
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {liquidation.statut === "valide" 
                    ? "Terminé"
                    : getCurrentStepLabel(liquidation.current_step)}
                </span>
              </TableCell>
              <TableCell>{getStatusBadge(liquidation.statut)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(liquidation)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir détails
                    </DropdownMenuItem>

                    {liquidation.attachments && liquidation.attachments.length > 0 && (
                      <DropdownMenuItem onClick={() => onView(liquidation)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Voir pièces ({liquidation.attachments.length})
                      </DropdownMenuItem>
                    )}

                    {liquidation.statut === "brouillon" && onSubmit && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onSubmit(liquidation.id)}>
                          <Send className="mr-2 h-4 w-4" />
                          Soumettre
                        </DropdownMenuItem>
                      </>
                    )}

                    {liquidation.statut === "soumis" && (
                      <>
                        <DropdownMenuSeparator />
                        {onValidate && (
                          <DropdownMenuItem onClick={() => onValidate(liquidation.id)}>
                            <CheckCircle className="mr-2 h-4 w-4 text-success" />
                            Valider
                          </DropdownMenuItem>
                        )}
                        {onDefer && (
                          <DropdownMenuItem onClick={() => onDefer(liquidation.id)}>
                            <Clock className="mr-2 h-4 w-4 text-warning" />
                            Différer
                          </DropdownMenuItem>
                        )}
                        {onReject && (
                          <DropdownMenuItem onClick={() => onReject(liquidation.id)}>
                            <XCircle className="mr-2 h-4 w-4 text-destructive" />
                            Rejeter
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {liquidation.statut === "differe" && onResume && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onResume(liquidation.id)}>
                          <Play className="mr-2 h-4 w-4 text-success" />
                          Reprendre
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
          })
        )}
      </TableBody>
    </Table>
  );
}
