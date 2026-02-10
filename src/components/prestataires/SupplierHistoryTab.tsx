import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileSignature, 
  CreditCard, 
  FileCheck, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SupplierHistoryTabProps {
  supplierId: string;
  supplierName: string;
}

interface Contrat {
  id: string;
  numero: string;
  objet: string;
  montant_initial: number;
  montant_actuel: number | null;
  statut: string | null;
  date_signature: string | null;
  created_at: string;
}

interface Engagement {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  statut: string | null;
  date_engagement: string;
}

interface Marche {
  id: string;
  numero: string;
  objet: string;
  montant: number | null;
  statut: string | null;
  date_lancement: string | null;
}

export function SupplierHistoryTab({ supplierId, supplierName }: SupplierHistoryTabProps) {
  // Fetch contrats
  const { data: contrats, isLoading: loadingContrats } = useQuery({
    queryKey: ["supplier-contrats", supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contrats")
        .select("id, numero, objet, montant_initial, montant_actuel, statut, date_signature, created_at")
        .eq("prestataire_id", supplierId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Contrat[];
    },
  });

  // Fetch engagements by fournisseur name
  const { data: engagements, isLoading: loadingEngagements } = useQuery({
    queryKey: ["supplier-engagements", supplierName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_engagements")
        .select("id, numero, objet, montant, statut, date_engagement")
        .ilike("fournisseur", `%${supplierName}%`)
        .order("date_engagement", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Engagement[];
    },
    enabled: !!supplierName,
  });

  // Fetch marchés directly assigned to this supplier
  const { data: marches, isLoading: loadingMarches } = useQuery<Marche[]>({
    queryKey: ["supplier-marches", supplierId],
    queryFn: async () => {
      // Marchés directly assigned to this supplier
      const { data, error } = await supabase
        .from("marches")
        .select("id, numero, objet, montant, statut, date_lancement")
        .eq("prestataire_id", supplierId)
        .order("date_lancement", { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Marche[];
    },
  });

  const isLoading = loadingContrats || loadingEngagements || loadingMarches;

  const getStatusBadge = (statut: string | null) => {
    switch (statut?.toLowerCase()) {
      case "valide":
      case "validé":
      case "en_cours":
      case "actif":
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Actif</Badge>;
      case "termine":
      case "terminé":
      case "solde":
        return <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" />Terminé</Badge>;
      case "rejete":
      case "annule":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Annulé</Badge>;
      case "brouillon":
      case "soumis":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      default:
        return <Badge variant="outline">{statut || "N/A"}</Badge>;
    }
  };

  const formatMontant = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy", { locale: fr });
  };

  // Calculate totals
  const totalContrats = contrats?.reduce((sum, c) => sum + (c.montant_actuel || c.montant_initial || 0), 0) || 0;
  const totalEngagements = engagements?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
        Chargement de l'historique...
      </div>
    );
  }

  const hasData = (contrats?.length || 0) + (engagements?.length || 0) + (marches?.length || 0) > 0;

  if (!hasData) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">Aucun historique</p>
        <p className="text-sm">Ce prestataire n'a pas encore de marchés, contrats ou engagements enregistrés.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <FileSignature className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{contrats?.length || 0}</p>
          <p className="text-sm text-muted-foreground">Contrats</p>
          <p className="text-xs text-primary font-medium mt-1">{formatMontant(totalContrats)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <CreditCard className="h-6 w-6 mx-auto mb-2 text-blue-600" />
          <p className="text-2xl font-bold">{engagements?.length || 0}</p>
          <p className="text-sm text-muted-foreground">Engagements</p>
          <p className="text-xs text-blue-600 font-medium mt-1">{formatMontant(totalEngagements)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <FileCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
          <p className="text-2xl font-bold">{marches?.length || 0}</p>
          <p className="text-sm text-muted-foreground">Marchés remportés</p>
        </div>
      </div>

      {/* Contrats */}
      {contrats && contrats.length > 0 && (
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <FileSignature className="h-4 w-4" />
            Contrats ({contrats.length})
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date signature</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contrats.map((contrat) => (
                <TableRow key={contrat.id}>
                  <TableCell className="font-mono text-sm">{contrat.numero}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{contrat.objet}</TableCell>
                  <TableCell>{formatMontant(contrat.montant_actuel || contrat.montant_initial)}</TableCell>
                  <TableCell>{formatDate(contrat.date_signature)}</TableCell>
                  <TableCell>{getStatusBadge(contrat.statut)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Engagements */}
      {engagements && engagements.length > 0 && (
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4" />
            Engagements ({engagements.length})
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {engagements.map((eng) => (
                <TableRow key={eng.id}>
                  <TableCell className="font-mono text-sm">{eng.numero}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{eng.objet}</TableCell>
                  <TableCell>{formatMontant(eng.montant)}</TableCell>
                  <TableCell>{formatDate(eng.date_engagement)}</TableCell>
                  <TableCell>{getStatusBadge(eng.statut)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Marchés */}
      {marches && marches.length > 0 && (
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <FileCheck className="h-4 w-4" />
            Marchés remportés ({marches.length})
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Montant estimatif</TableHead>
                <TableHead>Date lancement</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marches.map((marche) => (
                <TableRow key={marche.id}>
                  <TableCell className="font-mono text-sm">{marche.numero}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{marche.objet}</TableCell>
                  <TableCell>{formatMontant(marche.montant)}</TableCell>
                  <TableCell>{formatDate(marche.date_lancement)}</TableCell>
                  <TableCell>{getStatusBadge(marche.statut)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
