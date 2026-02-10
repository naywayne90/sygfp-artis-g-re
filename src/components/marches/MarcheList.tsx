import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShoppingCart,
  AlertCircle
} from "lucide-react";
import { Marche, VALIDATION_STEPS } from "@/hooks/useMarches";

interface MarcheListProps {
  marches: Marche[];
  title: string;
  description?: string;
  isLoading?: boolean;
  showActions?: boolean;
  onView?: (marche: Marche) => void;
  onValidate?: (marche: Marche) => void;
  onReject?: (marche: Marche) => void;
  onDefer?: (marche: Marche) => void;
  onResume?: (marche: Marche) => void;
}

export function MarcheList({
  marches,
  title,
  description,
  isLoading,
  showActions = true,
  onView,
  onValidate,
  onReject,
  onDefer,
  onResume,
}: MarcheListProps) {
  const [search, setSearch] = useState("");

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  const filteredMarches = marches.filter(
    (m) =>
      m.objet.toLowerCase().includes(search.toLowerCase()) ||
      m.numero?.toLowerCase().includes(search.toLowerCase()) ||
      m.prestataire?.raison_sociale?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (marche: Marche) => {
    const status = marche.validation_status;
    switch (status) {
      case "valide":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Validé</Badge>;
      case "rejete":
        return <Badge variant="destructive">Rejeté</Badge>;
      case "differe":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Différé</Badge>;
      case "en_attente":
      default: {
        const step = VALIDATION_STEPS.find(s => s.order === marche.current_validation_step);
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Étape {marche.current_validation_step || 1}: {step?.label || "En attente"}
          </Badge>
        );
      }
    }
  };

  const getModePassation = (mode: string) => {
    const modes: Record<string, string> = {
      appel_offres_ouvert: "AO Ouvert",
      appel_offres_restreint: "AO Restreint",
      consultation: "Consultation",
      gre_a_gre: "Gré à gré",
      demande_cotation: "Demande cotation",
    };
    return modes[mode] || mode;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9"
            />
          </div>
          <Badge variant="outline" className="text-sm">
            {filteredMarches.length} marché{filteredMarches.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : filteredMarches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun marché</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Prestataire</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Statut</TableHead>
                  {showActions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMarches.map((marche) => (
                  <TableRow key={marche.id}>
                    <TableCell className="font-mono text-sm">
                      {marche.numero || "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {marche.objet}
                    </TableCell>
                    <TableCell>
                      {marche.prestataire?.raison_sociale || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMontant(marche.montant)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getModePassation(marche.mode_passation)}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(marche)}</TableCell>
                    {showActions && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView?.(marche)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            
                            {marche.validation_status === "en_attente" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onValidate?.(marche)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  Valider l'étape
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDefer?.(marche)}>
                                  <Clock className="mr-2 h-4 w-4 text-orange-600" />
                                  Différer
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onReject?.(marche)}
                                  className="text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Rejeter
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {marche.validation_status === "differe" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onResume?.(marche)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                                  Reprendre le traitement
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Afficher motifs pour rejetés/différés */}
        {marches.some(m => m.rejection_reason || m.differe_motif) && (
          <div className="mt-4 space-y-2">
            {filteredMarches.filter(m => m.rejection_reason || m.differe_motif).map(m => (
              <div key={m.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{m.numero}</span>
                  <Badge variant="outline" className="text-xs">
                    {m.rejection_reason ? "Motif rejet" : "Motif différé"}
                  </Badge>
                </div>
                <p className="text-muted-foreground ml-6">
                  {m.rejection_reason || m.differe_motif}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
