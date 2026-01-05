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
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, ShoppingCart } from "lucide-react";

const mockMarches = [
  {
    id: "1",
    numero: "MKT-2024-0045",
    objet: "Acquisition de matériel roulant",
    prestataire: "AUTO IMPORT SARL",
    montant: 180000000,
    modePassation: "appel_offres",
    statut: "execute",
    dateAttribution: "2024-01-10",
  },
  {
    id: "2",
    numero: "MKT-2024-0044",
    objet: "Travaux de rénovation siège",
    prestataire: "BTP EXCELLENCE",
    montant: 95000000,
    modePassation: "appel_offres",
    statut: "en_cours",
    dateAttribution: "2024-01-05",
  },
  {
    id: "3",
    numero: "MKT-2024-0043",
    objet: "Fourniture logiciels",
    prestataire: "SOFT SOLUTIONS",
    montant: 25000000,
    modePassation: "gre_a_gre",
    statut: "attribue",
    dateAttribution: "2024-01-03",
  },
  {
    id: "4",
    numero: "MKT-2024-0042",
    objet: "Equipements de sécurité",
    prestataire: null,
    montant: 45000000,
    modePassation: "appel_offres",
    statut: "en_preparation",
    dateAttribution: null,
  },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    en_preparation: { label: "En préparation", className: "bg-muted text-muted-foreground" },
    publie: { label: "Publié", className: "bg-secondary/10 text-secondary border-secondary/20" },
    attribue: { label: "Attribué", className: "bg-primary/10 text-primary border-primary/20" },
    en_cours: { label: "En cours", className: "bg-warning/10 text-warning border-warning/20" },
    execute: { label: "Exécuté", className: "bg-success/10 text-success border-success/20" },
  };
  const variant = variants[status] || variants.en_preparation;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const getModePassation = (mode: string) => {
  const modes: Record<string, string> = {
    appel_offres: "Appel d'offres",
    gre_a_gre: "Gré à gré",
    consultation: "Consultation",
  };
  return modes[mode] || mode;
};

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export default function Marches() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMarches = mockMarches.filter(marche => 
    marche.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
    marche.objet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Passation de Marchés</h1>
          <p className="page-description">
            Gestion des marchés publics et contrats
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau marché
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
                <p className="text-sm text-muted-foreground">Total marchés</p>
                <p className="text-2xl font-bold">{mockMarches.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatMontant(mockMarches.reduce((acc, e) => acc + e.montant, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold text-warning">
                  {mockMarches.filter(m => m.statut === 'en_cours').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exécutés</p>
                <p className="text-2xl font-bold text-success">
                  {mockMarches.filter(m => m.statut === 'execute').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marchés Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des marchés</CardTitle>
          <CardDescription>
            {filteredMarches.length} marché(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead className="hidden md:table-cell">Objet</TableHead>
                <TableHead>Prestataire</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMarches.map((marche) => (
                <TableRow key={marche.id}>
                  <TableCell className="font-medium">{marche.numero}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                    {marche.objet}
                  </TableCell>
                  <TableCell>{marche.prestataire || '-'}</TableCell>
                  <TableCell className="text-right">{formatMontant(marche.montant)}</TableCell>
                  <TableCell>{getModePassation(marche.modePassation)}</TableCell>
                  <TableCell>{getStatusBadge(marche.statut)}</TableCell>
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
