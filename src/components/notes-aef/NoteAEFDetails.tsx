import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NoteAEF } from '@/hooks/useNotesAEF';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  User,
  FileText,
  CreditCard,
  AlertTriangle,
  Link2,
  Zap,
  History,
  ExternalLink,
  Package,
} from 'lucide-react';
import { LignesEstimativesReadonly } from './LignesEstimativesEditor';

interface NoteAEFHistoryEntry {
  id: string;
  action: string;
  old_statut: string | null;
  new_statut: string | null;
  performed_at: string;
  commentaire: string | null;
  performer: { id: string; first_name: string | null; last_name: string | null } | null;
}

interface NoteAEFDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteAEF | null;
}

const getStatusBadge = (status: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: 'Brouillon', className: 'bg-muted text-muted-foreground' },
    soumis: { label: 'Soumis', className: 'bg-blue-100 text-blue-700' },
    a_valider: { label: 'À valider', className: 'bg-warning/10 text-warning' },
    valide: { label: 'Validé', className: 'bg-success/10 text-success' },
    impute: { label: 'Imputé', className: 'bg-primary/10 text-primary' },
    rejete: { label: 'Rejeté', className: 'bg-destructive/10 text-destructive' },
    differe: { label: 'Différé', className: 'bg-orange-100 text-orange-700' },
  };
  const variant = variants[status || 'brouillon'] || variants.brouillon;
  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
};

const formatMontant = (montant: number | null) => {
  if (!montant) return 'Non spécifié';
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export function NoteAEFDetails({ open, onOpenChange, note }: NoteAEFDetailsProps) {
  // Récupérer l'historique de la note
  const { data: history = [] } = useQuery<NoteAEFHistoryEntry[]>({
    queryKey: ['note-aef-history', note?.id],
    queryFn: async () => {
      if (!note?.id) return [];
      const { data, error } = await supabase
        .from('notes_aef_history')
        .select(
          `
          *,
          performer:profiles!notes_aef_history_performed_by_fkey(id, first_name, last_name)
        `
        )
        .eq('note_id', note.id)
        .order('performed_at', { ascending: false });
      if (error) {
        console.error('Error fetching history:', error);
        return [];
      }
      return (data || []) as unknown as NoteAEFHistoryEntry[];
    },
    enabled: !!note?.id && open,
  });

  // Récupérer la Note SEF liée si existe
  const { data: linkedNoteSEF } = useQuery({
    queryKey: ['linked-note-sef', note?.note_sef_id],
    queryFn: async () => {
      if (!note?.note_sef_id) return null;
      const { data, error } = await supabase
        .from('notes_sef')
        .select('id, numero, objet, statut, created_at')
        .eq('id', note.note_sef_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!note?.note_sef_id && open,
  });

  if (!note) return null;

  const isDirectAEF = note.is_direct_aef === true;

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      status_change: 'Changement de statut',
      create: 'Création',
      update: 'Modification',
      submit: 'Soumission',
      validate: 'Validation',
      reject: 'Rejet',
      defer: 'Report',
      impute: 'Imputation',
    };
    return labels[action] || action;
  };

  const getStatusLabel = (status: string | null) => {
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      soumis: 'Soumis',
      a_valider: 'À valider',
      valide: 'Validé',
      impute: 'Imputé',
      rejete: 'Rejeté',
      differe: 'Différé',
    };
    return labels[status || ''] || status || '-';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Note AEF</span>
              <Badge variant="outline" className="font-mono ml-2">
                {note.reference_pivot || note.numero || note.id.substring(0, 8)}
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isDirectAEF && (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                  <Zap className="h-3 w-3 mr-1" />
                  AEF Directe
                </Badge>
              )}
              {getStatusBadge(note.statut)}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Note SEF liée */}
          {linkedNoteSEF && !isDirectAEF && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  Note SEF liée (source de la référence)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Référence commune :</span>
                      <Badge variant="secondary" className="font-mono font-bold text-primary">
                        {note.reference_pivot || linkedNoteSEF.numero || '—'}
                      </Badge>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">
                      N° SEF : {linkedNoteSEF.numero}
                    </p>
                    <p className="text-sm text-muted-foreground truncate max-w-[350px]">
                      {linkedNoteSEF.objet}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/notes-sef/${linkedNoteSEF.id}`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Voir SEF
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Justification AEF directe */}
          {isDirectAEF && note.justification && (
            <Card className="border-warning/20 bg-warning/5">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2 text-warning">
                  <Zap className="h-4 w-4" />
                  Justification AEF directe
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm">{note.justification}</p>
              </CardContent>
            </Card>
          )}

          {/* Informations principales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{note.objet}</h3>

            {note.contenu && (
              <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                {note.contenu}
              </div>
            )}
          </div>

          <Separator />

          {/* Détails */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Direction:</span>
              <span className="font-medium">
                {note.direction?.sigle || note.direction?.label || 'Non spécifiée'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Montant estimé:</span>
              <span className="font-medium">{formatMontant(note.montant_estime)}</span>
            </div>

            {note.type_depense && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{note.type_depense}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Créée le:</span>
              <span>{format(new Date(note.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
            </div>

            {note.created_by_profile && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Créée par:</span>
                <span>
                  {note.created_by_profile.first_name} {note.created_by_profile.last_name}
                </span>
              </div>
            )}
          </div>

          {/* Lignes estimatives */}
          <Separator />
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Détail des lignes estimatives
            </h4>
            <LignesEstimativesReadonly noteAefId={note.id} />
          </div>

          {/* Imputation */}
          {note.statut === 'impute' && note.budget_line && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Imputation budgétaire
                </h4>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="font-mono text-sm">{note.budget_line.code}</p>
                  <p className="text-sm">{note.budget_line.label}</p>
                  {note.imputed_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Imputé le{' '}
                      {format(new Date(note.imputed_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      {note.imputed_by_profile && (
                        <>
                          {' '}
                          par {note.imputed_by_profile.first_name}{' '}
                          {note.imputed_by_profile.last_name}
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Rejet */}
          {note.statut === 'rejete' && note.rejection_reason && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Motif de rejet
                </h4>
                <div className="bg-destructive/10 p-4 rounded-lg text-sm">
                  {note.rejection_reason}
                </div>
              </div>
            </>
          )}

          {/* Différé */}
          {note.statut === 'differe' && note.motif_differe && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  Report
                </h4>
                <div className="bg-orange-100 dark:bg-orange-900/20 p-4 rounded-lg text-sm">
                  <p>
                    <strong>Motif:</strong> {note.motif_differe}
                  </p>
                  {note.deadline_correction && (
                    <p className="mt-2">
                      <strong>Date de reprise:</strong>{' '}
                      {format(new Date(note.deadline_correction), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Validation */}
          {note.validated_at && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                <span className="text-success">✓</span> Validée le{' '}
                {format(new Date(note.validated_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </div>
            </>
          )}

          {/* Historique */}
          {history.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historique des actions
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 text-sm p-2 rounded-lg bg-muted/30"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{getActionLabel(entry.action)}</span>
                          {entry.old_statut && entry.new_statut && (
                            <span className="text-muted-foreground">
                              {getStatusLabel(entry.old_statut)} →{' '}
                              {getStatusLabel(entry.new_statut)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(entry.performed_at), 'dd/MM/yyyy à HH:mm', {
                            locale: fr,
                          })}
                          {entry.performer && (
                            <>
                              {' '}
                              • {entry.performer.first_name} {entry.performer.last_name}
                            </>
                          )}
                        </div>
                        {entry.commentaire && (
                          <p className="text-xs mt-1 text-muted-foreground italic">
                            {entry.commentaire}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
