import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, FolderOpen } from "lucide-react";
import { Dossier } from "@/hooks/useDossiers";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DossierListProps {
  dossiers: Dossier[];
  loading: boolean;
  onView: (dossier: Dossier) => void;
  onEdit: (dossier: Dossier) => void;
}

const STATUT_COLORS: Record<string, string> = {
  en_cours: "bg-blue-100 text-blue-800",
  termine: "bg-green-100 text-green-800",
  annule: "bg-red-100 text-red-800",
  suspendu: "bg-yellow-100 text-yellow-800",
};

const ETAPE_LABELS: Record<string, string> = {
  note: "Note",
  expression_besoin: "Expression besoin",
  marche: "Marché",
  engagement: "Engagement",
  liquidation: "Liquidation",
  ordonnancement: "Ordonnancement",
  reglement: "Règlement",
};

export function DossierList({ dossiers, loading, onView, onEdit }: DossierListProps) {
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(montant);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (dossiers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun dossier trouvé</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numéro</TableHead>
            <TableHead>Objet</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Étape</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dossiers.map((dossier) => (
            <TableRow
              key={dossier.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(dossier)}
            >
              <TableCell className="font-mono font-medium text-primary">
                {dossier.numero}
              </TableCell>
              <TableCell className="max-w-[300px] truncate">
                {dossier.objet}
              </TableCell>
              <TableCell>
                {dossier.direction?.sigle || dossier.direction?.code || "-"}
              </TableCell>
              <TableCell className="font-medium">
                {formatMontant(dossier.montant_estime)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {ETAPE_LABELS[dossier.etape_courante] || dossier.etape_courante}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={STATUT_COLORS[dossier.statut_global] || ""}>
                  {dossier.statut_global === "en_cours" ? "En cours" :
                   dossier.statut_global === "termine" ? "Terminé" :
                   dossier.statut_global === "annule" ? "Annulé" : "Suspendu"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(dossier.created_at), "dd/MM/yyyy", { locale: fr })}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(dossier)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(dossier)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
