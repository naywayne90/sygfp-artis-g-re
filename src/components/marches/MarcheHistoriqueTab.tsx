import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  FileCheck, 
  AlertTriangle,
  User
} from "lucide-react";
import { useMarcheDocuments } from "@/hooks/useMarcheDocuments";

interface MarcheHistoriqueTabProps {
  marcheId: string;
}

export function MarcheHistoriqueTab({ marcheId }: MarcheHistoriqueTabProps) {
  const { historique, loadingHistorique } = useMarcheDocuments(marcheId);

  const getActionIcon = (type: string) => {
    switch (type) {
      case "creation":
        return <Plus className="h-4 w-4 text-primary" />;
      case "validation":
      case "validation_complete":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "rejet":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "differe":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "attribution":
        return <FileCheck className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case "creation":
        return <Badge variant="outline">Création</Badge>;
      case "validation":
        return <Badge className="bg-green-100 text-green-700">Validation</Badge>;
      case "validation_complete":
        return <Badge className="bg-green-100 text-green-700">Validation complète</Badge>;
      case "rejet":
        return <Badge variant="destructive">Rejet</Badge>;
      case "differe":
        return <Badge className="bg-orange-100 text-orange-700">Différé</Badge>;
      case "attribution":
        return <Badge className="bg-blue-100 text-blue-700">Attribution</Badge>;
      default:
        return <Badge variant="secondary">Modification</Badge>;
    }
  };

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des décisions
        </CardTitle>
        <CardDescription>
          Traçabilité complète des actions et décisions sur ce marché
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingHistorique ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : historique.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun historique</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              
              <div className="space-y-6">
                {historique.map((entry, index) => (
                  <div key={entry.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                      {getActionIcon(entry.type_action)}
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getActionBadge(entry.type_action)}
                          {entry.ancien_statut && entry.nouveau_statut && (
                            <span className="text-xs text-muted-foreground">
                              {entry.ancien_statut} → {entry.nouveau_statut}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-2">{entry.description}</p>
                      
                      {entry.commentaire && (
                        <p className="text-sm text-muted-foreground italic mb-2">
                          "{entry.commentaire}"
                        </p>
                      )}
                      
                      {/* Metadata */}
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {entry.metadata.montant && (
                            <Badge variant="outline" className="text-xs">
                              {formatMontant(entry.metadata.montant)}
                            </Badge>
                          )}
                          {entry.metadata.objet && (
                            <Badge variant="outline" className="text-xs max-w-[200px] truncate">
                              {entry.metadata.objet}
                            </Badge>
                          )}
                          {entry.metadata.mode_passation && (
                            <Badge variant="outline" className="text-xs">
                              {entry.metadata.mode_passation}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* User */}
                      {entry.user && (
                        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>
                            {entry.user.full_name || `${entry.user.first_name || ""} ${entry.user.last_name || ""}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
