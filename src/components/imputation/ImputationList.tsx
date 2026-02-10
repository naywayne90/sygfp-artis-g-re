import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, CreditCard, Eye, FileText } from "lucide-react";
import { ImputationForm } from "./ImputationForm";
import { useNavigate } from "react-router-dom";

interface Note {
  id: string;
  numero: string | null;
  objet: string;
  montant_estime: number | null;
  priorite: string | null;
  validated_at: string | null;
  direction?: { id: string; label: string; sigle: string | null } | null;
  created_by_profile?: { id: string; first_name: string | null; last_name: string | null } | null;
}

interface ImputationListProps {
  notes: Note[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function ImputationList({ notes, isLoading, onRefresh }: ImputationListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat("fr-FR").format(montant) + " FCFA" : "-";

  const filteredNotes = notes.filter(
    (note) =>
      note.objet.toLowerCase().includes(search.toLowerCase()) ||
      note.numero?.toLowerCase().includes(search.toLowerCase()) ||
      note.direction?.label?.toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityBadge = (priorite: string | null) => {
    switch (priorite) {
      case "urgente":
        return <Badge variant="destructive">Urgente</Badge>;
      case "haute":
        return <Badge className="bg-orange-500 hover:bg-orange-600">Haute</Badge>;
      case "normale":
        return <Badge variant="secondary">Normale</Badge>;
      case "basse":
        return <Badge variant="outline">Basse</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Notes validées à imputer
          </CardTitle>
          <CardDescription>
            Sélectionnez une note pour renseigner les informations d'imputation budgétaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par objet, numéro, direction..."
                className="pl-9"
              />
            </div>
            <Badge variant="outline" className="text-sm">
              {filteredNotes.length} note{filteredNotes.length > 1 ? "s" : ""} en attente
            </Badge>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune note à imputer</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Demandeur</TableHead>
                    <TableHead className="text-right">Montant estimé</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Validée le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotes.map((note) => (
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
                      <TableCell>
                        {note.created_by_profile?.first_name} {note.created_by_profile?.last_name}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMontant(note.montant_estime)}
                      </TableCell>
                      <TableCell>{getPriorityBadge(note.priorite)}</TableCell>
                      <TableCell>
                        {note.validated_at
                          ? format(new Date(note.validated_at), "dd MMM yyyy", { locale: fr })
                          : "-"}
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
                            size="sm"
                            onClick={() => setSelectedNote(note)}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Imputer
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

      {/* Dialog d'imputation */}
      <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Imputer la note
            </DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <ImputationForm
              note={selectedNote}
              onSuccess={() => {
                setSelectedNote(null);
                onRefresh?.();
              }}
              onCancel={() => setSelectedNote(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
