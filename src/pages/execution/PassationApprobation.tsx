import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useExercice } from '@/contexts/ExerciceContext';
import { usePassationsMarche, PassationMarche, MODES_PASSATION } from '@/hooks/usePassationsMarche';
import { PassationDetails } from '@/components/passation-marche';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ShieldCheck,
  XCircle,
  Eye,
  Search,
  Loader2,
  ArrowLeft,
  Clock,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  History,
} from 'lucide-react';

export default function PassationApprobation() {
  const { exercice } = useExercice();
  const navigate = useNavigate();
  const { hasAnyRole, isAdmin } = usePermissions();
  const canAccess = isAdmin || hasAnyRole(['DG']);

  const { passations, isLoading, refetch, approvePassation, rejectAttributionPassation } =
    usePassationsMarche();

  const [activeTab, setActiveTab] = useState('en_attente');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPassation, setSelectedPassation] = useState<PassationMarche | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectMotif, setRejectMotif] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Approve dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);

  // Passations en attente d'approbation (statut = attribué)
  const enAttente = passations.filter((p) => p.statut === 'attribue');

  // Historique des décisions DG (approuvé, signé, ou renvoyé en évaluation avec motif_rejet_attribution)
  const historique = passations.filter(
    (p) =>
      p.statut === 'approuve' ||
      p.statut === 'signe' ||
      (p.statut === 'en_evaluation' && p.motif_rejet_attribution)
  );

  // Filtrage par recherche
  const filterBySearch = (list: PassationMarche[]) =>
    list.filter(
      (p) =>
        p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.expression_besoin?.objet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.expression_besoin?.numero?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filteredEnAttente = filterBySearch(enAttente);
  const filteredHistorique = filterBySearch(historique).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // KPIs
  const totalEnAttente = enAttente.length;
  const montantTotal = enAttente.reduce(
    (sum, p) => sum + (p.montant_retenu || p.expression_besoin?.montant_estime || 0),
    0
  );
  // "Urgents" = attribués depuis plus de 5 jours
  const urgents = enAttente.filter((p) => {
    if (!p.attribue_at) return false;
    const daysSince = (Date.now() - new Date(p.attribue_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 5;
  }).length;

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA' : '-';

  const getModeName = (value: string) =>
    MODES_PASSATION.find((m) => m.value === value)?.label || value;

  const getDecisionBadge = (pm: PassationMarche) => {
    if (pm.statut === 'approuve' || pm.statut === 'signe') {
      return <Badge className="bg-green-100 text-green-700">Approuvé</Badge>;
    }
    if (pm.motif_rejet_attribution) {
      return <Badge className="bg-red-100 text-red-700">Rejeté</Badge>;
    }
    return <Badge variant="outline">-</Badge>;
  };

  const handleApprove = async () => {
    if (!selectedPassation) return;
    setIsProcessing(true);
    try {
      await approvePassation(selectedPassation.id);
      setApproveDialogOpen(false);
      setSelectedPassation(null);
      refetch();
    } catch {
      // handled by mutation onError
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPassation || !rejectMotif.trim()) return;
    setIsProcessing(true);
    try {
      await rejectAttributionPassation({
        id: selectedPassation.id,
        motif: rejectMotif.trim(),
      });
      setRejectDialogOpen(false);
      setRejectMotif('');
      setSelectedPassation(null);
      refetch();
    } catch {
      // handled by mutation onError
    } finally {
      setIsProcessing(false);
    }
  };

  // Access denied
  if (!canAccess) {
    return (
      <div
        data-testid="approbation-access-denied"
        className="flex flex-col items-center justify-center h-64 gap-4"
      >
        <ShieldCheck className="h-16 w-16 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold text-muted-foreground">Accès restreint</h2>
        <p className="text-sm text-muted-foreground">Accès réservé au Directeur Général</p>
        <Button variant="outline" onClick={() => navigate('/execution/passation-marche')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux passations
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/execution/passation-marche')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 data-testid="approbation-title" className="text-2xl font-bold tracking-tight">
                Approbation des attributions
              </h1>
              <p className="text-muted-foreground">
                Marchés en attente de décision du DG - Exercice {exercice}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge data-testid="pending-count" variant="outline" className="text-sm px-3 py-1">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            {totalEnAttente} en attente
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Espace DG
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente d'approbation
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEnAttente}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalEnAttente === 0
                ? 'Aucun marché en attente'
                : `${totalEnAttente} marché${totalEnAttente > 1 ? 's' : ''} à traiter`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant total
            </CardTitle>
            <Banknote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatMontant(montantTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Valeur cumulée des marchés en attente
            </p>
          </CardContent>
        </Card>

        <Card className={urgents > 0 ? 'border-red-200 bg-red-50/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Urgents (&gt; 5 jours)
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${urgents > 0 ? 'text-red-500' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${urgents > 0 ? 'text-red-600' : ''}`}>
              {urgents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {urgents === 0 ? 'Aucun marché en retard' : 'Nécessitent une décision rapide'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par référence ou objet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="en_attente" className="gap-2">
                <Clock className="h-3.5 w-3.5" />
                En attente ({totalEnAttente})
              </TabsTrigger>
              <TabsTrigger value="historique" className="gap-2">
                <History className="h-3.5 w-3.5" />
                Historique ({filteredHistorique.length})
              </TabsTrigger>
            </TabsList>

            {/* En attente */}
            <TabsContent value="en_attente" className="mt-4">
              {filteredEnAttente.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Aucun marché en attente d'approbation</p>
                  <p className="text-sm mt-1">Tous les marchés attribués ont été traités.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Objet</TableHead>
                      <TableHead>Procédure</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Attribué depuis</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnAttente.map((pm) => {
                      const daysSince = pm.attribue_at
                        ? (Date.now() - new Date(pm.attribue_at).getTime()) / (1000 * 60 * 60 * 24)
                        : 0;
                      const isUrgent = daysSince > 5;
                      return (
                        <TableRow key={pm.id} className={isUrgent ? 'bg-red-50/50' : ''}>
                          <TableCell className="font-mono text-sm font-medium">
                            {pm.reference || '-'}
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate">
                            {pm.expression_besoin?.objet || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getModeName(pm.mode_passation)}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium font-mono">
                            {formatMontant(
                              pm.montant_retenu || pm.expression_besoin?.montant_estime || null
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {pm.attribue_at && (
                                <>
                                  <span className="text-sm">
                                    {formatDistanceToNow(new Date(pm.attribue_at), {
                                      addSuffix: true,
                                      locale: fr,
                                    })}
                                  </span>
                                  {isUrgent && (
                                    <Badge
                                      variant="destructive"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      Urgent
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPassation(pm);
                                  setDetailsOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedPassation(pm);
                                  setApproveDialogOpen(true);
                                }}
                              >
                                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                                Approuver
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedPassation(pm);
                                  setRejectDialogOpen(true);
                                }}
                              >
                                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                Rejeter
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Historique */}
            <TabsContent value="historique" className="mt-4">
              {filteredHistorique.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune décision enregistrée</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Objet</TableHead>
                      <TableHead>Procédure</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Décision</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Motif rejet</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistorique.map((pm) => (
                      <TableRow key={pm.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {pm.reference || '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {pm.expression_besoin?.objet || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getModeName(pm.mode_passation)}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium font-mono">
                          {formatMontant(
                            pm.montant_retenu || pm.expression_besoin?.montant_estime || null
                          )}
                        </TableCell>
                        <TableCell>{getDecisionBadge(pm)}</TableCell>
                        <TableCell className="text-sm">
                          {pm.approuve_at
                            ? format(new Date(pm.approuve_at), 'dd MMM yyyy', { locale: fr })
                            : pm.updated_at
                              ? format(new Date(pm.updated_at), 'dd MMM yyyy', { locale: fr })
                              : '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {pm.motif_rejet_attribution ? (
                            <span className="text-sm text-red-700 line-clamp-2">
                              {pm.motif_rejet_attribution}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPassation(pm);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Details dialog */}
      {selectedPassation && (
        <PassationDetails
          passation={selectedPassation}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}

      {/* Approve confirmation dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'approbation</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point d'approuver l'attribution du marché{' '}
              <strong>{selectedPassation?.reference}</strong>.
              {selectedPassation?.expression_besoin?.objet && (
                <span className="block mt-1 text-foreground">
                  {selectedPassation.expression_besoin.objet}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
            <ShieldCheck className="inline h-4 w-4 mr-1.5" />
            Cette action validera l'attribution et permettra la signature du contrat.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ShieldCheck className="mr-2 h-4 w-4" />
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) setRejectMotif('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l'attribution</DialogTitle>
            <DialogDescription>
              Marché <strong>{selectedPassation?.reference}</strong> — Le marché sera renvoyé en
              phase d'évaluation.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motif du rejet de l'attribution (obligatoire)..."
            value={rejectMotif}
            onChange={(e) => setRejectMotif(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectMotif.trim() || isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
