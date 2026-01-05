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
import { Search, Filter, MoreHorizontal, Eye, Wallet, CheckCircle } from "lucide-react";

const mockReglements = [
  {
    id: "1",
    numeroOrdonnancement: "ORD-2024-0098",
    beneficiaire: "TECH SOLUTIONS SARL",
    montant: 45000000,
    modePaiement: "virement",
    referenceTresor: "VIR-2024-00456",
    banque: "SGBCI",
    statut: "paye",
    dateReglement: "2024-01-18",
  },
  {
    id: "2",
    numeroOrdonnancement: "ORD-2024-0095",
    beneficiaire: "IMPRIMERIE NATIONALE",
    montant: 3500000,
    modePaiement: "virement",
    referenceTresor: "VIR-2024-00455",
    banque: "BICICI",
    statut: "paye",
    dateReglement: "2024-01-17",
  },
  {
    id: "3",
    numeroOrdonnancement: "ORD-2024-0094",
    beneficiaire: "CARBURANT CI",
    montant: 8000000,
    modePaiement: "virement",
    referenceTresor: null,
    banque: "ECOBANK",
    statut: "en_attente",
    dateReglement: null,
  },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    en_attente: { label: "En attente", className: "bg-warning/10 text-warning border-warning/20" },
    paye: { label: "Payé", className: "bg-success/10 text-success border-success/20" },
  };
  const variant = variants[status] || variants.en_attente;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export default function Reglements() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReglements = mockReglements.filter(reg => 
    reg.numeroOrdonnancement.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.beneficiaire.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPaye = mockReglements
    .filter(r => r.statut === 'paye')
    .reduce((acc, r) => acc + r.montant, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Règlements</h1>
          <p className="page-description">
            Suivi des paiements effectués par le Trésor
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par ordonnancement ou bénéficiaire..." 
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
                <p className="text-sm text-muted-foreground">Total règlements</p>
                <p className="text-2xl font-bold">{mockReglements.length}</p>
              </div>
              <Wallet className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant payé</p>
                <p className="text-2xl font-bold text-success">{formatMontant(totalPaye)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente paiement</p>
                <p className="text-2xl font-bold text-warning">
                  {mockReglements.filter(r => r.statut === 'en_attente').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Règlements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des règlements</CardTitle>
          <CardDescription>
            {filteredReglements.length} règlement(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordonnancement</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Réf. Trésor</TableHead>
                <TableHead>Banque</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReglements.map((reglement) => (
                <TableRow key={reglement.id}>
                  <TableCell className="font-medium">{reglement.numeroOrdonnancement}</TableCell>
                  <TableCell>{reglement.beneficiaire}</TableCell>
                  <TableCell className="text-right">{formatMontant(reglement.montant)}</TableCell>
                  <TableCell>{reglement.referenceTresor || '-'}</TableCell>
                  <TableCell>{reglement.banque}</TableCell>
                  <TableCell>{getStatusBadge(reglement.statut)}</TableCell>
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
