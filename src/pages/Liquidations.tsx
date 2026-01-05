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
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Receipt } from "lucide-react";

const mockLiquidations = [
  {
    id: "1",
    numero: "LIQ-2024-0156",
    numeroEngagement: "ENG-2024-0234",
    objet: "Achat de serveurs informatiques",
    fournisseur: "TECH SOLUTIONS SARL",
    montant: 45000000,
    statut: "valide",
    serviceFait: true,
    dateLiquidation: "2024-01-16",
  },
  {
    id: "2",
    numero: "LIQ-2024-0155",
    numeroEngagement: "ENG-2024-0230",
    objet: "Entretien locaux",
    fournisseur: "NETTOYAGE PRO",
    montant: 2800000,
    statut: "en_attente",
    serviceFait: true,
    dateLiquidation: "2024-01-15",
  },
  {
    id: "3",
    numero: "LIQ-2024-0154",
    numeroEngagement: "ENG-2024-0228",
    objet: "Travaux de peinture",
    fournisseur: "BATIPRO SARL",
    montant: 6500000,
    statut: "en_cours",
    serviceFait: false,
    dateLiquidation: "2024-01-14",
  },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    en_attente: { label: "En attente", className: "bg-warning/10 text-warning border-warning/20" },
    en_cours: { label: "En cours", className: "bg-secondary/10 text-secondary border-secondary/20" },
    valide: { label: "Validé", className: "bg-success/10 text-success border-success/20" },
  };
  const variant = variants[status] || variants.en_attente;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export default function Liquidations() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLiquidations = mockLiquidations.filter(liq => 
    liq.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
    liq.objet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Liquidations</h1>
          <p className="page-description">
            Gestion des liquidations après constatation du service fait
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle liquidation
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total liquidations</p>
                <p className="text-2xl font-bold">{mockLiquidations.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatMontant(mockLiquidations.reduce((acc, e) => acc + e.montant, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Service fait certifié</p>
                <p className="text-2xl font-bold text-success">
                  {mockLiquidations.filter(l => l.serviceFait).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liquidations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des liquidations</CardTitle>
          <CardDescription>
            {filteredLiquidations.length} liquidation(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead className="hidden md:table-cell">Objet</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Service fait</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLiquidations.map((liquidation) => (
                <TableRow key={liquidation.id}>
                  <TableCell className="font-medium">{liquidation.numero}</TableCell>
                  <TableCell>{liquidation.numeroEngagement}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                    {liquidation.objet}
                  </TableCell>
                  <TableCell className="text-right">{formatMontant(liquidation.montant)}</TableCell>
                  <TableCell>
                    <Badge variant={liquidation.serviceFait ? "default" : "outline"} className={liquidation.serviceFait ? "bg-success" : ""}>
                      {liquidation.serviceFait ? "Oui" : "Non"}
                    </Badge>
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
