/**
 * Page Espace Direction
 * Permet à chaque direction de gérer ses notes internes et ses feuilles de route
 */

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Building2,
  FileText,
  Route,
  Plus,
  Upload,
  Search,
  Archive,
  Eye,
  Edit,
  Download,
  FileSpreadsheet,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRBAC } from '@/contexts/RBACContext';
import { useExercice } from '@/contexts/ExerciceContext';
import {
  useNotesDirection,
  useCreateNote,
  useUpdateNote,
  useArchiveNote,
  useImportWordNote,
  useNotesDirectionStats,
  type NoteDirection,
  type TypeNote,
  type StatutNote,
  type PrioriteNote,
  type CreateNoteInput,
} from '@/hooks/useNotesDirection';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// CONSTANTES
// ============================================

const TYPE_NOTE_LABELS: Record<TypeNote, string> = {
  interne: 'Note interne',
  compte_rendu: 'Compte rendu',
  rapport: 'Rapport',
  memo: 'Mémo',
  autre: 'Autre',
};

const TYPE_NOTE_COLORS: Record<TypeNote, string> = {
  interne: 'bg-blue-100 text-blue-800',
  compte_rendu: 'bg-green-100 text-green-800',
  rapport: 'bg-purple-100 text-purple-800',
  memo: 'bg-orange-100 text-orange-800',
  autre: 'bg-gray-100 text-gray-800',
};

const STATUT_LABELS: Record<StatutNote, string> = {
  brouillon: 'Brouillon',
  publie: 'Publié',
  archive: 'Archivé',
};

const PRIORITE_LABELS: Record<PrioriteNote, string> = {
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function EspaceDirection() {
  const { user, isAdmin, isLoading: rbacLoading } = useRBAC();
  const { exerciceId } = useExercice();

  // Direction: admin peut choisir, sinon c'est la direction de l'utilisateur
  const [selectedDirectionId, setSelectedDirectionId] = useState<string>('');
  const directionId = selectedDirectionId || user?.directionId || '';

  // Onglet actif
  const [activeTab, setActiveTab] = useState('notes');

  // Filtres notes
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TypeNote | 'all'>('all');
  const [filterStatut, setFilterStatut] = useState<StatutNote | 'all'>('all');

  // Dialog création/modification note
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteDirection | null>(null);
  const [viewingNote, setViewingNote] = useState<NoteDirection | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);

  // Form state
  const [formTitre, setFormTitre] = useState('');
  const [formContenu, setFormContenu] = useState('');
  const [formType, setFormType] = useState<TypeNote>('interne');
  const [formPriorite, setFormPriorite] = useState<PrioriteNote>('normale');
  const [formStatut, setFormStatut] = useState<StatutNote>('brouillon');

  // Données
  const { data: directions } = useQuery({
    queryKey: ['directions-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('directions')
        .select('id, code, label, sigle')
        .order('code');
      if (error) throw error;
      return data || [];
    },
  });

  const currentDirection = directions?.find((d) => d.id === directionId);

  const { data: notes, isLoading: notesLoading } = useNotesDirection({
    directionId,
    exerciceId: exerciceId || undefined,
    typeNote: filterType !== 'all' ? filterType : undefined,
    statut: filterStatut !== 'all' ? filterStatut : undefined,
    search: searchTerm || undefined,
  });

  const { data: stats } = useNotesDirectionStats(directionId);

  // Mutations
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const archiveNote = useArchiveNote();
  const importWord = useImportWordNote();

  // Plans de travail de la direction
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans-travail-direction', directionId],
    queryFn: async () => {
      const fromTable = supabase.from as (table: string) => ReturnType<typeof supabase.from>;
      const { data, error } = await fromTable('plans_travail')
        .select('*')
        .eq('direction_id', directionId)
        .eq('est_actif', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!directionId,
  });

  // Activités de la direction (via actions → objectifs_strategiques)
  const { data: activites } = useQuery({
    queryKey: ['activites-direction', directionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activites')
        .select('id, code, libelle, est_active, action_id')
        .eq('est_active', true)
        .order('code');
      if (error) throw error;
      return data || [];
    },
    enabled: !!directionId,
  });

  // ============================================
  // HANDLERS
  // ============================================

  const openCreateDialog = useCallback(() => {
    setEditingNote(null);
    setFormTitre('');
    setFormContenu('');
    setFormType('interne');
    setFormPriorite('normale');
    setFormStatut('brouillon');
    setNoteDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((note: NoteDirection) => {
    setEditingNote(note);
    setFormTitre(note.titre);
    setFormContenu(note.contenu || '');
    setFormType(note.type_note);
    setFormPriorite(note.priorite);
    setFormStatut(note.statut);
    setNoteDialogOpen(true);
  }, []);

  const handleSaveNote = useCallback(async () => {
    if (!formTitre.trim()) {
      toast.error('Le titre est obligatoire');
      return;
    }

    const plainText = formContenu
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (editingNote) {
      await updateNote.mutateAsync({
        id: editingNote.id,
        titre: formTitre,
        contenu: formContenu,
        contenu_brut: plainText.substring(0, 10000),
        type_note: formType,
        priorite: formPriorite,
        statut: formStatut,
      });
    } else {
      const input: CreateNoteInput = {
        direction_id: directionId,
        exercice_id: exerciceId || undefined,
        titre: formTitre,
        contenu: formContenu,
        contenu_brut: plainText.substring(0, 10000),
        type_note: formType,
        priorite: formPriorite,
        statut: formStatut,
      };
      await createNote.mutateAsync(input);
    }

    setNoteDialogOpen(false);
  }, [
    formTitre,
    formContenu,
    formType,
    formPriorite,
    formStatut,
    editingNote,
    directionId,
    exerciceId,
    createNote,
    updateNote,
  ]);

  const handleImportWord = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx,.doc';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!file.name.match(/\.docx?$/i)) {
        toast.error('Veuillez sélectionner un fichier Word (.docx)');
        return;
      }

      await importWord.mutateAsync({
        file,
        directionId,
        exerciceId: exerciceId || undefined,
      });
    };
    input.click();
  }, [directionId, exerciceId, importWord]);

  // ============================================
  // RENDER
  // ============================================

  if (rbacLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!directionId && !isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Vous n'êtes rattaché à aucune direction. Contactez l'administrateur.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Espace Direction</h1>
            <p className="text-muted-foreground">
              {currentDirection
                ? `${currentDirection.sigle} - ${currentDirection.label}`
                : 'Sélectionnez une direction'}
            </p>
          </div>
        </div>

        {/* Sélecteur de direction (admin uniquement) */}
        {isAdmin && (
          <Select value={directionId} onValueChange={setSelectedDirectionId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Choisir une direction" />
            </SelectTrigger>
            <SelectContent>
              {directions?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.sigle} - {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Notes</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Brouillons</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.brouillons}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Publiés</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.publies}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Activités</span>
              </div>
              <p className="text-2xl font-bold mt-1">{activites?.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="feuilles-route" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Feuilles de Route
          </TabsTrigger>
        </TabsList>

        {/* ==================== ONGLET NOTES ==================== */}
        <TabsContent value="notes" className="space-y-4">
          {/* Actions bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-1 gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filterType}
                onValueChange={(v) => setFilterType(v as TypeNote | 'all')}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  {Object.entries(TYPE_NOTE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterStatut}
                onValueChange={(v) => setFilterStatut(v as StatutNote | 'all')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  {Object.entries(STATUT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleImportWord} disabled={importWord.isPending}>
                <Upload className="h-4 w-4 mr-2" />
                {importWord.isPending ? 'Import...' : 'Importer Word'}
              </Button>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Note
              </Button>
            </div>
          </div>

          {/* Notes list */}
          <Card>
            <CardContent className="pt-6">
              {notesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !notes || notes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Aucune note trouvée</p>
                  <p className="text-sm mt-1">Créez une note ou importez un document Word</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Titre</TableHead>
                      <TableHead className="min-w-[120px]">Type</TableHead>
                      <TableHead className="min-w-[100px]">Statut</TableHead>
                      <TableHead className="min-w-[100px]">Priorité</TableHead>
                      <TableHead className="min-w-[140px]">Date</TableHead>
                      <TableHead className="min-w-[140px]">Auteur</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-[300px]">{note.titre}</p>
                            {note.fichier_original_nom && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Download className="h-3 w-3" />
                                {note.fichier_original_nom}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={TYPE_NOTE_COLORS[note.type_note]}>
                            {TYPE_NOTE_LABELS[note.type_note]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={note.statut === 'publie' ? 'default' : 'outline'}>
                            {STATUT_LABELS[note.statut]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              note.priorite === 'urgente'
                                ? 'text-red-600 font-medium'
                                : note.priorite === 'haute'
                                  ? 'text-orange-600'
                                  : 'text-muted-foreground'
                            }
                          >
                            {PRIORITE_LABELS[note.priorite]}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm', {
                            locale: fr,
                          })}
                        </TableCell>
                        <TableCell className="text-sm">{note.creator?.full_name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingNote(note)}
                              title="Voir"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(note)}
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setArchiveConfirmId(note.id)}
                              title="Archiver"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ONGLET FEUILLES DE ROUTE ==================== */}
        <TabsContent value="feuilles-route" className="space-y-4">
          {/* Plans de travail */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="h-5 w-5" />
                    Plans de Travail
                  </CardTitle>
                  <CardDescription>
                    {plans?.length ?? 0} plan(s) pour cette direction
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href="/planification/import-feuille-route">
                      <Upload className="h-4 w-4 mr-2" />
                      Importer Excel
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {plansLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : !plans || plans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Aucun plan de travail</p>
                  <p className="text-sm mt-1">Importez une feuille de route Excel pour commencer</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan: Record<string, unknown>) => (
                      <TableRow key={String(plan.id)}>
                        <TableCell>
                          <Badge variant="outline">{String(plan.code || '-')}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{String(plan.libelle || '-')}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              plan.statut === 'en_cours'
                                ? 'default'
                                : plan.statut === 'valide'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {String(plan.statut || '-')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {plan.date_debut
                            ? format(new Date(String(plan.date_debut)), 'dd/MM/yyyy')
                            : '-'}{' '}
                          →{' '}
                          {plan.date_fin
                            ? format(new Date(String(plan.date_fin)), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {plan.budget_alloue
                            ? Number(plan.budget_alloue).toLocaleString('fr-FR')
                            : '-'}{' '}
                          FCFA
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Activités */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Activités ({activites?.length ?? 0})
              </CardTitle>
              <CardDescription>Activités budgétaires rattachées à cette direction</CardDescription>
            </CardHeader>
            <CardContent>
              {!activites || activites.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">Aucune activité importée</p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activites.map((act) => (
                        <TableRow key={act.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {act.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{act.libelle}</TableCell>
                          <TableCell>
                            <Badge variant={act.est_active ? 'default' : 'secondary'}>
                              {act.est_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== DIALOG CRÉATION/MODIFICATION NOTE ==================== */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Modifier la note' : 'Nouvelle note'}</DialogTitle>
            <DialogDescription>
              {editingNote
                ? 'Modifiez les informations de la note'
                : 'Créez une nouvelle note pour votre direction'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Titre *</label>
              <Input
                value={formTitre}
                onChange={(e) => setFormTitre(e.target.value)}
                placeholder="Titre de la note"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={formType} onValueChange={(v) => setFormType(v as TypeNote)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_NOTE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Priorité</label>
                <Select
                  value={formPriorite}
                  onValueChange={(v) => setFormPriorite(v as PrioriteNote)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Statut</label>
                <Select value={formStatut} onValueChange={(v) => setFormStatut(v as StatutNote)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brouillon">Brouillon</SelectItem>
                    <SelectItem value="publie">Publié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Contenu</label>
              <Textarea
                value={formContenu}
                onChange={(e) => setFormContenu(e.target.value)}
                placeholder="Rédigez le contenu de votre note..."
                rows={12}
                className="mt-1 font-sans"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={createNote.isPending || updateNote.isPending}
            >
              {createNote.isPending || updateNote.isPending
                ? 'Enregistrement...'
                : editingNote
                  ? 'Mettre à jour'
                  : 'Créer la note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG VISUALISATION NOTE ==================== */}
      <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewingNote && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={TYPE_NOTE_COLORS[viewingNote.type_note]}>
                    {TYPE_NOTE_LABELS[viewingNote.type_note]}
                  </Badge>
                  <Badge variant="outline">{STATUT_LABELS[viewingNote.statut]}</Badge>
                  {viewingNote.priorite !== 'normale' && (
                    <Badge
                      variant="destructive"
                      className={
                        viewingNote.priorite === 'urgente' ? 'bg-red-500' : 'bg-orange-500'
                      }
                    >
                      {PRIORITE_LABELS[viewingNote.priorite]}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl">{viewingNote.titre}</DialogTitle>
                <DialogDescription>
                  Par {viewingNote.creator?.full_name || 'Inconnu'} le{' '}
                  {format(new Date(viewingNote.created_at), "dd MMMM yyyy 'à' HH:mm", {
                    locale: fr,
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                {viewingNote.contenu ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: viewingNote.contenu }}
                  />
                ) : (
                  <p className="text-muted-foreground italic">Aucun contenu</p>
                )}
              </div>

              {viewingNote.fichier_original_url && (
                <div className="border-t pt-4">
                  <a
                    href={viewingNote.fichier_original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger le fichier original: {viewingNote.fichier_original_nom}
                  </a>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG CONFIRMATION ARCHIVAGE ==================== */}
      <AlertDialog open={!!archiveConfirmId} onOpenChange={() => setArchiveConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver cette note ?</AlertDialogTitle>
            <AlertDialogDescription>
              La note sera déplacée dans les archives. Vous pourrez la retrouver en filtrant par
              statut "Archivé".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (archiveConfirmId) {
                  await archiveNote.mutateAsync(archiveConfirmId);
                  setArchiveConfirmId(null);
                }
              }}
            >
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
