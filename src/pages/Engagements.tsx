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
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, CreditCard } from "lucide-react";

const mockEngagements = [
  {
    id: "1",
    numero: "ENG-2024-0234",
    objet: "Achat de serveurs informatiques",
    fournisseur: "TECH SOLUTIONS SARL",
    montant: 45000000,
    ligneBudgetaire: "2.3.4",
    statut: "valide",
    dateEngagement: "2024-01-15",
  },
  {
    id: "2",
    numero: "ENG-2024-0233",
    objet: "Fournitures de bureau - Q1",
    fournisseur: "PAPETERIE PLUS",
    montant: 3500000,
    ligneBudgetaire: "6.1.2",
    statut: "en_attente",
    dateEngagement: "2024-01-14",
  },
  {
    id: "3",
    numero: "ENG-2024-0232",
    objet: "Maintenance ascenseurs",
    fournisseur: "OTIS CI",
    montant: 12000000,
    ligneBudgetaire: "6.2.1",
    statut: "en_cours",
    dateEngagement: "2024-01-13",
  },
  {
    id: "4",
    numero: "ENG-2024-0231",
    objet: "Location véhicules",
    fournisseur: "AUTO RENT",
    montant: 8500000,
    ligneBudgetaire: "6.3.1",
    statut: "rejete",
    dateEngagement: "2024-01-12",
  },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    en_attente: { label: "En attente", className: "bg-warning/10 text-warning border-warning/20" },
    en_cours: { label: "En cours", className: "bg-secondary/10 text-secondary border-secondary/20" },
    valide: { label: "Validé", className: "bg-success/10 text-success border-success/20" },
    rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  const variant = variants[status] || variants.en_attente;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export default function Engagements() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEngagements = mockEngagements.filter(eng => 
    eng.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eng.objet.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eng.fournisseur.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Engagements</h1>
          <p className="page-description">
            Gestion des engagements budgétaires
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel engagement
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par numéro, objet ou fournisseur..." 
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
                <p className="text-sm text-muted-foreground">Total engagements</p>
                <p className="text-2xl font-bold">{mockEngagements.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatMontant(mockEngagements.reduce((acc, e) => acc + e.montant, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-warning">
                  {mockEngagements.filter(n => n.statut === 'en_attente').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validés</p>
                <p className="text-2xl font-bold text-success">
                  {mockEngagements.filter(n => n.statut === 'valide').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des engagements</CardTitle>
          <CardDescription>
            {filteredEngagements.length} engagement(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead className="hidden md:table-cell">Objet</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Ligne budg.</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEngagements.map((engagement) => (
                <TableRow key={engagement.id}>
                  <TableCell className="font-medium">{engagement.numero}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                    {engagement.objet}
                  </TableCell>
                  <TableCell>{engagement.fournisseur}</TableCell>
                  <TableCell className="text-right">{formatMontant(engagement.montant)}</TableCell>
                  <TableCell>{engagement.ligneBudgetaire}</TableCell>
                  <TableCell>{getStatusBadge(engagement.statut)}</TableCell>
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
