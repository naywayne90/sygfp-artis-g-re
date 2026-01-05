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
import { Plus, Search, Filter, MoreHorizontal, Eye, FileCheck, FileSignature } from "lucide-react";

const mockOrdonnancements = [
  {
    id: "1",
    numero: "ORD-2024-0098",
    numeroLiquidation: "LIQ-2024-0156",
    beneficiaire: "TECH SOLUTIONS SARL",
    objet: "Achat de serveurs informatiques",
    montant: 45000000,
    modePaiement: "virement",
    statut: "transmis",
    signeDAAF: true,
    signeDG: true,
    dateOrdonnancement: "2024-01-17",
  },
  {
    id: "2",
    numero: "ORD-2024-0097",
    numeroLiquidation: "LIQ-2024-0155",
    beneficiaire: "NETTOYAGE PRO",
    objet: "Entretien locaux",
    montant: 2800000,
    modePaiement: "virement",
    statut: "en_signature_dg",
    signeDAAF: true,
    signeDG: false,
    dateOrdonnancement: "2024-01-16",
  },
  {
    id: "3",
    numero: "ORD-2024-0096",
    numeroLiquidation: "LIQ-2024-0150",
    beneficiaire: "FOURNITURES BUREAU CI",
    objet: "Fournitures bureau",
    montant: 1500000,
    modePaiement: "cheque",
    statut: "en_attente",
    signeDAAF: false,
    signeDG: false,
    dateOrdonnancement: "2024-01-15",
  },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    en_attente: { label: "En attente", className: "bg-warning/10 text-warning border-warning/20" },
    en_signature_daaf: { label: "Signature DAAF", className: "bg-secondary/10 text-secondary border-secondary/20" },
    en_signature_dg: { label: "Signature DG", className: "bg-primary/10 text-primary border-primary/20" },
    transmis: { label: "Transmis", className: "bg-success/10 text-success border-success/20" },
  };
  const variant = variants[status] || variants.en_attente;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export default function Ordonnancements() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrdonnancements = mockOrdonnancements.filter(ord => 
    ord.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ord.beneficiaire.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Ordonnancements</h1>
          <p className="page-description">
            Ordres de paiement et mandats à transmettre au Trésor
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel ordonnancement
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par numéro ou bénéficiaire..." 
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
                <p className="text-sm text-muted-foreground">Total ordonnancements</p>
                <p className="text-2xl font-bold">{mockOrdonnancements.length}</p>
              </div>
              <FileCheck className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatMontant(mockOrdonnancements.reduce((acc, e) => acc + e.montant, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En signature</p>
                <p className="text-2xl font-bold text-warning">
                  {mockOrdonnancements.filter(o => o.statut.includes('signature')).length}
                </p>
              </div>
              <FileSignature className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transmis</p>
                <p className="text-2xl font-bold text-success">
                  {mockOrdonnancements.filter(o => o.statut === 'transmis').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ordonnancements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des ordonnancements</CardTitle>
          <CardDescription>
            {filteredOrdonnancements.length} ordonnancement(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead className="hidden md:table-cell">Objet</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrdonnancements.map((ordonnancement) => (
                <TableRow key={ordonnancement.id}>
                  <TableCell className="font-medium">{ordonnancement.numero}</TableCell>
                  <TableCell>{ordonnancement.beneficiaire}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                    {ordonnancement.objet}
                  </TableCell>
                  <TableCell className="text-right">{formatMontant(ordonnancement.montant)}</TableCell>
                  <TableCell className="capitalize">{ordonnancement.modePaiement}</TableCell>
                  <TableCell>{getStatusBadge(ordonnancement.statut)}</TableCell>
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
                          <FileSignature className="mr-2 h-4 w-4" />
                          Signer
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
