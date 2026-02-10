/**
 * Page Approvisionnements Banque
 * Gestion des approvisionnements des comptes bancaires
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  FileSpreadsheet,
  Filter,
  Loader2,
  Building2,
  CalendarIcon,
  Banknote,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  useApprovisionnementsTresorerie,
  CreateApprovisionnementData,
} from '@/hooks/useApprovisionnementsTresorerie';
import { useCompteBancaires } from '@/hooks/useCompteBancaires';
import { useFundingSources } from '@/hooks/useFundingSources';
import { useExercice } from '@/contexts/ExerciceContext';

export default function ApprovisionnementsBanque() {
  const { selectedExercice: _selectedExercice, isReadOnly } = useExercice();
  const [search, setSearch] = useState('');
  const [compteFilter, setCompteFilter] = useState<string>('all');
  const [origineFilter, setOrigineFilter] = useState<string>('all');
  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<CreateApprovisionnementData>>({
    type: 'BANK',
    montant: 0,
    date_operation: new Date().toISOString().split('T')[0],
  });

  // Hooks
  const {
    approvisionnements,
    stats,
    isLoading,
    createApprovisionnement,
    isCreating,
    exportToExcel,
    formatMontant,
    refetch,
  } = useApprovisionnementsTresorerie({
    type: 'BANK',
    compte_bancaire_id: compteFilter !== 'all' ? compteFilter : undefined,
    origine_fonds_id: origineFilter !== 'all' ? origineFilter : undefined,
    date_debut: dateDebut?.toISOString().split('T')[0],
    date_fin: dateFin?.toISOString().split('T')[0],
    search,
  });

  const { comptesActifs } = useCompteBancaires();
  const { activeSources } = useFundingSources();

  // Handle form submit
  const handleSubmit = () => {
    if (!formData.compte_bancaire_id) {
      return;
    }
    if (!formData.montant || formData.montant <= 0) {
      return;
    }

    createApprovisionnement({
      type: 'BANK',
      compte_bancaire_id: formData.compte_bancaire_id,
      montant: formData.montant,
      date_operation: formData.date_operation || new Date().toISOString().split('T')[0],
      date_valeur: formData.date_valeur,
      origine_fonds_id: formData.origine_fonds_id,
      reference_piece: formData.reference_piece,
      description: formData.description,
      statut: 'valide',
    });

    setIsDialogOpen(false);
    setFormData({
      type: 'BANK',
      montant: 0,
      date_operation: new Date().toISOString().split('T')[0],
    });
  };

  // Statut badge
  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
      case 'brouillon':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'annule':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Approvisionnements Banque"
        description="Gestion des approvisionnements du compte bancaire"
        icon={Building2}
        backUrl="/tresorerie"
      >
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
        <Button variant="outline" onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
        {!isReadOnly && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel approvisionnement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouvel approvisionnement bancaire</DialogTitle>
                <DialogDescription>
                  Enregistrer une entrée de fonds sur un compte bancaire
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="compte">Compte bancaire *</Label>
                  <Select
                    value={formData.compte_bancaire_id || ''}
                    onValueChange={(v) => setFormData({ ...formData, compte_bancaire_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {comptesActifs?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code} - {c.libelle} ({c.banque})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="montant">Montant (FCFA) *</Label>
                  <Input
                    id="montant"
                    type="number"
                    min={0}
                    value={formData.montant || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Date opération *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'justify-start text-left font-normal',
                            !formData.date_operation && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date_operation
                            ? format(new Date(formData.date_operation), 'dd/MM/yyyy')
                            : 'Sélectionner'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            formData.date_operation ? new Date(formData.date_operation) : undefined
                          }
                          onSelect={(d) =>
                            setFormData({
                              ...formData,
                              date_operation: d?.toISOString().split('T')[0],
                            })
                          }
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label>Date valeur</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'justify-start text-left font-normal',
                            !formData.date_valeur && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date_valeur
                            ? format(new Date(formData.date_valeur), 'dd/MM/yyyy')
                            : 'Sélectionner'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            formData.date_valeur ? new Date(formData.date_valeur) : undefined
                          }
                          onSelect={(d) =>
                            setFormData({
                              ...formData,
                              date_valeur: d?.toISOString().split('T')[0],
                            })
                          }
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Origine des fonds</Label>
                  <Select
                    value={formData.origine_fonds_id || 'none'}
                    onValueChange={(v) =>
                      setFormData({ ...formData, origine_fonds_id: v === 'none' ? undefined : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une origine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Aucune --</SelectItem>
                      {activeSources?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code} - {s.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reference">Référence pièce</Label>
                  <Input
                    id="reference"
                    value={formData.reference_piece || ''}
                    onChange={(e) => setFormData({ ...formData, reference_piece: e.target.value })}
                    placeholder="Ex: Chèque n°123456"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Détails de l'approvisionnement..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isCreating || !formData.compte_bancaire_id || !formData.montant}
                >
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nombre d'approvisionnements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatMontant(stats.montantTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comptes approvisionnés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{comptesActifs?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={compteFilter} onValueChange={setCompteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Compte bancaire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les comptes</SelectItem>
                {comptesActifs?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.banque}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={origineFilter} onValueChange={setOrigineFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Origine fonds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes origines</SelectItem>
                {activeSources?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateDebut ? format(dateDebut, 'dd/MM/yyyy') : 'Date début'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateDebut} onSelect={setDateDebut} locale={fr} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFin ? format(dateFin, 'dd/MM/yyyy') : 'Date fin'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateFin} onSelect={setDateFin} locale={fr} />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des approvisionnements</CardTitle>
          <CardDescription>{approvisionnements?.length || 0} enregistrement(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvisionnements?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Banknote className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      Aucun approvisionnement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  approvisionnements?.map((appro) => (
                    <TableRow key={appro.id}>
                      <TableCell className="font-mono text-sm">{appro.numero}</TableCell>
                      <TableCell>
                        {format(new Date(appro.date_operation), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{appro.compte_bancaire?.code}</p>
                          <p className="text-xs text-muted-foreground">
                            {appro.compte_bancaire?.banque}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {appro.origine_fonds?.libelle || appro.origine_fonds_code || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        +{formatMontant(appro.montant)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {appro.reference_piece || '-'}
                      </TableCell>
                      <TableCell>{getStatutBadge(appro.statut)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
