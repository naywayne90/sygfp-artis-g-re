import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, FileText } from "lucide-react";

const mockNotes = [
  {
    id: "1",
    numero: "NOTE-2024-0089",
    objet: "Acquisition de matériel informatique",
    direction: "DSI",
    montant: 15000000,
    priorite: "haute",
    statut: "en_attente",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    numero: "NOTE-2024-0088",
    objet: "Fournitures de bureau",
    direction: "DAAF",
    montant: 2500000,
    priorite: "normale",
    statut: "valide",
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    numero: "NOTE-2024-0087",
    objet: "Formation du personnel",
    direction: "DRH",
    montant: 8000000,
    priorite: "normale",
    statut: "impute",
    createdAt: "2024-01-13",
  },
  {
    id: "4",
    numero: "NOTE-2024-0086",
    objet: "Maintenance véhicules",
    direction: "SDMG",
    montant: 5500000,
    priorite: "basse",
    statut: "differe",
    createdAt: "2024-01-12",
  },
  {
    id: "5",
    numero: "NOTE-2024-0085",
    objet: "Réparation climatisation",
    direction: "SDMG",
    montant: 3200000,
    priorite: "haute",
    statut: "brouillon",
    createdAt: "2024-01-11",
  },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
    en_attente: { label: "En attente", className: "bg-warning/10 text-warning border-warning/20" },
    valide: { label: "Validé", className: "bg-success/10 text-success border-success/20" },
    impute: { label: "Imputé", className: "bg-secondary/10 text-secondary border-secondary/20" },
    differe: { label: "Différé", className: "bg-destructive/10 text-destructive border-destructive/20" },
    rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  const variant = variants[status] || variants.brouillon;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const getPrioriteBadge = (priorite: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    haute: { label: "Haute", className: "bg-destructive text-destructive-foreground" },
    normale: { label: "Normale", className: "bg-secondary text-secondary-foreground" },
    basse: { label: "Basse", className: "bg-muted text-muted-foreground" },
  };
  const variant = variants[priorite] || variants.normale;
  return <Badge className={variant.className}>{variant.label}</Badge>;
};

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export default function Notes() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = mockNotes.filter(note => 
    note.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.objet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Gestion des Notes</h1>
          <p className="page-description">
            Notes d'Autorisation d'Engagement Financier (AEF) et de Suivi d'Exécution Financière (SEF)
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle note
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par numéro ou objet..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total notes</p>
                <p className="text-2xl font-bold">{mockNotes.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-warning">
                  {mockNotes.filter(n => n.statut === 'en_attente').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                <span className="text-warning">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold text-success">
                  {mockNotes.filter(n => n.statut === 'valide').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <span className="text-success">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Différées</p>
                <p className="text-2xl font-bold text-destructive">
                  {mockNotes.filter(n => n.statut === 'differe').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive">!</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des notes</CardTitle>
          <CardDescription>
            {filteredNotes.length} note(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead className="hidden md:table-cell">Objet</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="font-medium">{note.numero}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                    {note.objet}
                  </TableCell>
                  <TableCell>{note.direction}</TableCell>
                  <TableCell className="text-right">{formatMontant(note.montant)}</TableCell>
                  <TableCell>{getPrioriteBadge(note.priorite)}</TableCell>
                  <TableCell>{getStatusBadge(note.statut)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
