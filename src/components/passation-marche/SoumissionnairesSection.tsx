import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Soumissionnaire,
  StatutSoumissionnaire,
  STATUTS_SOUMISSIONNAIRE,
  MIN_SOUMISSIONNAIRES,
} from '@/hooks/usePassationsMarche';
import { usePrestataires, Prestataire } from '@/hooks/usePrestataires';
import {
  Plus,
  Search,
  Trash2,
  MoreHorizontal,
  ArrowRight,
  Building2,
  Users,
  FileText,
  AlertTriangle,
  Loader2,
  Phone,
  Mail,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SoumissionnairesSectionProps {
  passationId: string;
  lotId?: string | null;
  modePassation: string;
  soumissionnaires: Soumissionnaire[];
  readOnly?: boolean;
  onAdd: (data: {
    passation_marche_id: string;
    lot_marche_id?: string | null;
    prestataire_id?: string | null;
    is_manual_entry?: boolean;
    raison_sociale: string;
    contact_nom?: string | null;
    email?: string | null;
    telephone?: string | null;
    rccm?: string | null;
    offre_financiere?: number | null;
    date_depot?: string | null;
  }) => Promise<unknown>;
  onUpdate: (data: {
    id: string;
    statut?: StatutSoumissionnaire;
    offre_financiere?: number | null;
    note_technique?: number | null;
    note_financiere?: number | null;
    motif_elimination?: string | null;
  }) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function SoumissionnairesSection({
  passationId,
  lotId,
  modePassation,
  soumissionnaires,
  readOnly = false,
  onAdd,
  onUpdate,
  onDelete,
}: SoumissionnairesSectionProps) {
  const { prestataires } = usePrestataires();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [searchPrestataire, setSearchPrestataire] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newSoum, setNewSoum] = useState({
    prestataire_id: '' as string,
    raison_sociale: '',
    contact_nom: '',
    email: '',
    telephone: '',
    rccm: '',
    offre_financiere: '' as string,
    date_depot: '',
  });

  const minRequired = MIN_SOUMISSIONNAIRES[modePassation] || 1;
  const count = soumissionnaires.length;
  const isUnderMin = count < minRequired;

  const filteredPrestataires = prestataires.filter(
    (p) =>
      !soumissionnaires.some((s) => s.prestataire_id === p.id) &&
      (p.raison_sociale?.toLowerCase().includes(searchPrestataire.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchPrestataire.toLowerCase()))
  );

  const formatMontant = (montant: number | null) => (montant ? formatCurrency(montant) : '-');

  const handleSelectPrestataire = (p: Prestataire) => {
    setNewSoum((prev) => ({
      ...prev,
      prestataire_id: p.id,
      raison_sociale: p.raison_sociale,
      contact_nom: p.contact_nom || '',
      email: p.email || p.contact_email || '',
      telephone: p.telephone || p.contact_telephone || '',
      rccm: p.rccm || '',
    }));
    setSearchPrestataire('');
  };

  const handleAdd = async () => {
    if (!newSoum.raison_sociale.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdd({
        passation_marche_id: passationId,
        lot_marche_id: lotId || null,
        prestataire_id: isManualEntry ? null : newSoum.prestataire_id || null,
        is_manual_entry: isManualEntry,
        raison_sociale: newSoum.raison_sociale,
        contact_nom: newSoum.contact_nom || null,
        email: newSoum.email || null,
        telephone: newSoum.telephone || null,
        rccm: newSoum.rccm || null,
        offre_financiere: newSoum.offre_financiere ? parseFloat(newSoum.offre_financiere) : null,
        date_depot: newSoum.date_depot || null,
      });
      resetForm();
      setShowAddDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatut = async (soumId: string, newStatut: StatutSoumissionnaire) => {
    await onUpdate({ id: soumId, statut: newStatut });
  };

  const handleDeleteSoum = async (soumId: string) => {
    await onDelete(soumId);
  };

  const resetForm = () => {
    setNewSoum({
      prestataire_id: '',
      raison_sociale: '',
      contact_nom: '',
      email: '',
      telephone: '',
      rccm: '',
      offre_financiere: '',
      date_depot: '',
    });
    setIsManualEntry(false);
    setSearchPrestataire('');
  };

  return (
    <div className="space-y-4">
      {/* Header avec compteur */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {count} soumissionnaire{count !== 1 ? 's' : ''}
          </span>
          {isUnderMin && (
            <Badge
              variant="outline"
              className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs"
            >
              Min. {minRequired} requis
            </Badge>
          )}
          {!isUnderMin && (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-300 text-xs"
            >
              OK
            </Badge>
          )}
        </div>
        {!readOnly && (
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
            <Plus className="h-4 w-4" />
            Ajouter un soumissionnaire
          </Button>
        )}
      </div>

      {/* Warning minimum */}
      {isUnderMin && count > 0 && (
        <Alert className="bg-yellow-50 border-yellow-300">
          <AlertTriangle className="h-4 w-4 text-yellow-700" />
          <AlertDescription className="text-yellow-800">
            Pour une procedure « {modePassation.replace(/_/g, ' ')} », il faut au minimum{' '}
            {minRequired} soumissionnaire{minRequired > 1 ? 's' : ''}. Actuellement : {count}.
          </AlertDescription>
        </Alert>
      )}

      {/* Table des soumissionnaires */}
      {soumissionnaires.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun soumissionnaire</p>
          {!readOnly && (
            <p className="text-xs mt-1">Cliquez sur "Ajouter un soumissionnaire" pour commencer</p>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entreprise</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Offre technique</TableHead>
              <TableHead className="text-right">Offre financiere (FCFA)</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              {!readOnly && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {soumissionnaires.map((s) => {
              const statutConfig = STATUTS_SOUMISSIONNAIRE[s.statut];
              const nextStatuts = statutConfig.next || [];

              return (
                <TableRow
                  key={s.id}
                  className={
                    s.statut === 'retenu'
                      ? 'bg-green-50'
                      : s.statut === 'elimine'
                        ? 'bg-red-50/30'
                        : ''
                  }
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{s.raison_sociale}</p>
                        {s.rccm && <p className="text-xs text-muted-foreground">RCCM: {s.rccm}</p>}
                        {s.is_manual_entry && (
                          <Badge variant="outline" className="text-xs mt-0.5">
                            Saisie manuelle
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-0.5">
                      {s.contact_nom && <p>{s.contact_nom}</p>}
                      {s.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {s.email}
                        </p>
                      )}
                      {s.telephone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {s.telephone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.offre_technique_url ? (
                      <a
                        href={s.offre_technique_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Document
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Non fournie</span>
                    )}
                    {s.note_technique !== null && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Note: {s.note_technique}/100
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMontant(s.offre_financiere)}
                    {s.note_financiere !== null && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Note: {s.note_financiere}/100
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={statutConfig.color}>{statutConfig.label}</Badge>
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {nextStatuts.map((ns) => {
                            const nextConfig = STATUTS_SOUMISSIONNAIRE[ns];
                            return (
                              <DropdownMenuItem
                                key={ns}
                                onClick={() => handleChangeStatut(s.id, ns)}
                                className="gap-2"
                              >
                                <ArrowRight className="h-3 w-3" />
                                Passer en « {nextConfig.label} »
                              </DropdownMenuItem>
                            );
                          })}
                          <DropdownMenuItem
                            onClick={() => handleDeleteSoum(s.id)}
                            className="text-destructive gap-2"
                          >
                            <Trash2 className="h-3 w-3" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Dialog Ajout soumissionnaire */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Ajouter un soumissionnaire
            </DialogTitle>
            <DialogDescription>
              Selectionnez un prestataire existant ou saisissez les informations manuellement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Toggle saisie manuelle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-sm font-medium">Saisie manuelle</Label>
                <p className="text-xs text-muted-foreground">
                  {isManualEntry
                    ? 'Saisissez les informations du soumissionnaire'
                    : 'Selectionnez un prestataire du referentiel'}
                </p>
              </div>
              <Switch
                checked={isManualEntry}
                onCheckedChange={(checked) => {
                  setIsManualEntry(checked);
                  setNewSoum((prev) => ({
                    ...prev,
                    prestataire_id: '',
                    raison_sociale: '',
                    contact_nom: '',
                    email: '',
                    telephone: '',
                    rccm: '',
                  }));
                }}
              />
            </div>

            {/* Selection prestataire existant */}
            {!isManualEntry && (
              <div className="space-y-2">
                <Label>Prestataire *</Label>
                {newSoum.raison_sociale ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{newSoum.raison_sociale}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setNewSoum((prev) => ({
                          ...prev,
                          prestataire_id: '',
                          raison_sociale: '',
                          contact_nom: '',
                          email: '',
                          telephone: '',
                          rccm: '',
                        }))
                      }
                    >
                      Changer
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un prestataire..."
                        value={searchPrestataire}
                        onChange={(e) => setSearchPrestataire(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {searchPrestataire && filteredPrestataires.length > 0 && (
                      <div className="max-h-40 overflow-y-auto border rounded-md">
                        {filteredPrestataires.slice(0, 5).map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectPrestataire(p)}
                            className="p-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                          >
                            <p className="font-medium text-sm">{p.raison_sociale}</p>
                            <p className="text-xs text-muted-foreground">{p.code}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchPrestataire && filteredPrestataires.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Aucun prestataire trouve. Essayez la saisie manuelle.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Champs manuels */}
            {isManualEntry && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="raison_sociale">Nom / Raison sociale *</Label>
                  <Input
                    id="raison_sociale"
                    value={newSoum.raison_sociale}
                    onChange={(e) =>
                      setNewSoum((prev) => ({ ...prev, raison_sociale: e.target.value }))
                    }
                    placeholder="Nom de l'entreprise"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="rccm">RCCM</Label>
                    <Input
                      id="rccm"
                      value={newSoum.rccm}
                      onChange={(e) => setNewSoum((prev) => ({ ...prev, rccm: e.target.value }))}
                      placeholder="CI-ABJ-..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_nom">Contact</Label>
                    <Input
                      id="contact_nom"
                      value={newSoum.contact_nom}
                      onChange={(e) =>
                        setNewSoum((prev) => ({ ...prev, contact_nom: e.target.value }))
                      }
                      placeholder="Nom du contact"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newSoum.email}
                      onChange={(e) => setNewSoum((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="email@entreprise.ci"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telephone">Telephone</Label>
                    <Input
                      id="telephone"
                      value={newSoum.telephone}
                      onChange={(e) =>
                        setNewSoum((prev) => ({ ...prev, telephone: e.target.value }))
                      }
                      placeholder="+225..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Offre financiere + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="offre_financiere">Offre financiere (FCFA)</Label>
                <Input
                  id="offre_financiere"
                  type="number"
                  value={newSoum.offre_financiere}
                  onChange={(e) =>
                    setNewSoum((prev) => ({ ...prev, offre_financiere: e.target.value }))
                  }
                  placeholder="Montant"
                />
              </div>
              <div>
                <Label htmlFor="date_depot">Date de depot</Label>
                <Input
                  id="date_depot"
                  type="date"
                  value={newSoum.date_depot}
                  onChange={(e) => setNewSoum((prev) => ({ ...prev, date_depot: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={!newSoum.raison_sociale.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
