import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Copy,
  Hash,
  FileText,
  DollarSign,
  Building2,
  Check,
  X,
  Search,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useDoublonsDetection, DoublonGroup } from "@/hooks/useDoublonsDetection";
import { useExercice } from "@/contexts/ExerciceContext";

import { cn } from "@/lib/utils";

const formatMontant = (value: number) => {
  return new Intl.NumberFormat("fr-FR").format(value);
};

const TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  reference: { label: "Références identiques", icon: Hash, color: "text-blue-500" },
  objet: { label: "Objets similaires", icon: FileText, color: "text-amber-500" },
  montant_date: { label: "Montant + Date", icon: DollarSign, color: "text-green-500" },
  prestataire: { label: "Prestataire + Montant", icon: Building2, color: "text-purple-500" },
};

interface DoublonGroupCardProps {
  group: DoublonGroup;
  onVerify: (groupId: string) => void;
  onIgnore: (groupId: string) => void;
}

function DoublonGroupCard({ group, onVerify, onIgnore }: DoublonGroupCardProps) {
  const config = TYPE_CONFIG[group.type];
  const Icon = config.icon;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-muted", config.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{config.label}</CardTitle>
              <CardDescription>
                {group.items.length} éléments • Score: {group.similarityScore}%
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={group.similarityScore === 100 ? "destructive" : "secondary"}
              className="text-xs"
            >
              {group.similarityScore === 100 ? "Identique" : "Similaire"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entité</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Objet</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Date</TableHead>
              {group.type === "prestataire" && <TableHead>Prestataire</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.items.map((item, idx) => (
              <TableRow key={item.id} className={idx === 0 ? "bg-muted/30" : ""}>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {item.entite}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{item.reference}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={item.objet}>
                  {item.objet}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatMontant(item.montant)} FCFA
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.date ? new Date(item.date).toLocaleDateString("fr-FR") : "-"}
                </TableCell>
                {group.type === "prestataire" && (
                  <TableCell>{item.prestataire || "-"}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <X className="h-4 w-4 mr-1" />
                Ignorer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ignorer ce groupe ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ce groupe de doublons potentiels sera marqué comme ignoré et n'apparaîtra plus dans la liste.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => onIgnore(group.groupId)}>
                  Confirmer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button size="sm" onClick={() => onVerify(group.groupId)}>
            <Check className="h-4 w-4 mr-1" />
            Marquer vérifié
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GestionDoublons() {
  const { exercice } = useExercice();
  const { doublons, isLoading, stats, markAsVerified, ignoreGroup } = useDoublonsDetection();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDoublons = doublons.filter(group => {
    if (activeTab !== "all" && group.type !== activeTab) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return group.items.some(
        item =>
          item.reference.toLowerCase().includes(search) ||
          item.objet.toLowerCase().includes(search) ||
          (item.prestataire && item.prestataire.toLowerCase().includes(search))
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Copy className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des Doublons</h1>
            <p className="text-sm text-muted-foreground">Exercice {exercice}</p>
          </div>
        </div>
        <p className="text-muted-foreground">
          Détection et gestion des doublons potentiels par référence, objet, montant ou prestataire
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total détecté</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Hash className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.byReference}</p>
                <p className="text-xs text-muted-foreground">Par référence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.byObjet}</p>
                <p className="text-xs text-muted-foreground">Par objet</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.byMontantDate}</p>
                <p className="text-xs text-muted-foreground">Montant + Date</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.byPrestataire}</p>
                <p className="text-xs text-muted-foreground">Par prestataire</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par référence, objet, prestataire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs and Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            Tous ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="reference">
            <Hash className="h-4 w-4 mr-1" />
            Référence ({stats.byReference})
          </TabsTrigger>
          <TabsTrigger value="objet">
            <FileText className="h-4 w-4 mr-1" />
            Objet ({stats.byObjet})
          </TabsTrigger>
          <TabsTrigger value="montant_date">
            <DollarSign className="h-4 w-4 mr-1" />
            Montant ({stats.byMontantDate})
          </TabsTrigger>
          <TabsTrigger value="prestataire">
            <Building2 className="h-4 w-4 mr-1" />
            Prestataire ({stats.byPrestataire})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredDoublons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ShieldCheck className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun doublon détecté</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {searchTerm 
                    ? "Aucun résultat ne correspond à votre recherche."
                    : "Félicitations ! Aucun doublon potentiel n'a été détecté dans vos données."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {filteredDoublons.map(group => (
                <DoublonGroupCard
                  key={group.groupId}
                  group={group}
                  onVerify={(id) => markAsVerified.mutate(id)}
                  onIgnore={(id) => ignoreGroup.mutate(id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
