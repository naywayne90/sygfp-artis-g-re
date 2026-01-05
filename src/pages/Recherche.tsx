import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, FileText, CreditCard, Receipt, FileCheck, ShoppingCart } from "lucide-react";

export default function Recherche() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Recherche de Dossiers</h1>
        <p className="page-description">
          Recherche globale dans tous les modules de la chaîne de la dépense
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher par numéro, objet, fournisseur..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Type de document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="marches">Marchés</SelectItem>
                  <SelectItem value="engagements">Engagements</SelectItem>
                  <SelectItem value="liquidations">Liquidations</SelectItem>
                  <SelectItem value="ordonnancements">Ordonnancements</SelectItem>
                </SelectContent>
              </Select>
              <Button className="gap-2">
                <Search className="h-4 w-4" />
                Rechercher
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="pt-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-secondary" />
            <p className="font-medium">Notes</p>
            <p className="text-2xl font-bold mt-1">156</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-secondary" />
            <p className="font-medium">Marchés</p>
            <p className="text-2xl font-bold mt-1">34</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="pt-6 text-center">
            <CreditCard className="h-8 w-8 mx-auto mb-2 text-secondary" />
            <p className="font-medium">Engagements</p>
            <p className="text-2xl font-bold mt-1">245</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="pt-6 text-center">
            <Receipt className="h-8 w-8 mx-auto mb-2 text-secondary" />
            <p className="font-medium">Liquidations</p>
            <p className="text-2xl font-bold mt-1">198</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="pt-6 text-center">
            <FileCheck className="h-8 w-8 mx-auto mb-2 text-secondary" />
            <p className="font-medium">Ordonnancements</p>
            <p className="text-2xl font-bold mt-1">175</p>
          </CardContent>
        </Card>
      </div>

      {/* Results Area */}
      <Card>
        <CardHeader>
          <CardTitle>Résultats de recherche</CardTitle>
          <CardDescription>
            Effectuez une recherche pour voir les résultats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Saisissez un terme de recherche pour trouver des dossiers</p>
            <p className="text-sm mt-2">
              Vous pouvez rechercher par numéro de dossier, objet, fournisseur ou montant
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
