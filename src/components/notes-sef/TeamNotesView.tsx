/**
 * TeamNotesView - Vue hiérarchique des notes de l'équipe
 * Permet au supérieur hiérarchique de consulter les notes de ses collaborateurs (N-1)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Eye, FileText, Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency, cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Collaborator {
  id: string;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  direction_id: string | null;
}

interface TeamNote {
  id: string;
  numero: string | null;
  reference_pivot: string | null;
  objet: string;
  statut: string | null;
  urgence: string | null;
  montant_estime: number | null;
  created_at: string;
  created_by: string | null;
  creator?: {
    last_name: string | null;
    first_name: string | null;
    email: string | null;
  } | null;
}

export interface TeamNotesViewProps {
  /** Classe CSS additionnelle */
  className?: string;
  /** Profondeur de la hiérarchie (1 = N-1 uniquement, 2 = N-1 et N-2, etc.) */
  depth?: number;
  /** Nombre maximum de notes à afficher */
  limit?: number;
}

// ============================================================================
// CONFIGURATION DES STATUTS
// ============================================================================

const STATUS_CONFIG: Record<
  string,
  { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }
> = {
  brouillon: { variant: 'outline', label: 'Brouillon' },
  soumis: { variant: 'secondary', label: 'Soumis' },
  a_valider: { variant: 'default', label: 'À valider' },
  valide: { variant: 'default', label: 'Validé' },
  validé: { variant: 'default', label: 'Validé' },
  differe: { variant: 'outline', label: 'Différé' },
  différé: { variant: 'outline', label: 'Différé' },
  rejete: { variant: 'destructive', label: 'Rejeté' },
  rejeté: { variant: 'destructive', label: 'Rejeté' },
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function TeamNotesView({
  className,
  depth = 1,
  limit = 50,
}: TeamNotesViewProps) {
  const navigate = useNavigate();
  const { userId } = usePermissions();
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>('all');

  // Récupérer les collaborateurs directs (N-1)
  const {
    data: collaborators,
    isLoading: isLoadingCollaborators,
    error: collaboratorsError,
    refetch: refetchCollaborators,
  } = useQuery({
    queryKey: ['team-members', userId, depth],
    queryFn: async (): Promise<Collaborator[]> => {
      // Essayer d'utiliser la fonction RPC si disponible
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_team_members',
        { p_supervisor_id: userId, p_depth: depth }
      );

      if (!rpcError && rpcData) {
        return rpcData as Collaborator[];
      }

      // Fallback: requête directe si la fonction n'existe pas
      type ProfileRow = { id: string; last_name: string | null; first_name: string | null; email: string | null; direction_id: string | null };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = supabase.from('profiles').select('id, last_name, first_name, email, direction_id') as any;
      const { data, error: queryError } = await query.eq('supervisor_id', userId);

      if (queryError) {
        // Si la colonne n'existe pas, retourner un tableau vide
        if (queryError.message?.includes('supervisor_id')) {
          console.warn('[TeamNotesView] Colonne supervisor_id non trouvée');
          return [];
        }
        throw queryError;
      }

      return ((data || []) as ProfileRow[]).map((p) => ({
        id: p.id,
        nom: p.last_name,
        prenom: p.first_name,
        email: p.email,
        direction_id: p.direction_id,
      }));
    },
    enabled: !!userId,
  });

  // Récupérer les notes de l'équipe
  const {
    data: teamNotes,
    isLoading: isLoadingNotes,
    error: notesError,
    refetch: refetchNotes,
  } = useQuery({
    queryKey: ['team-notes', userId, selectedCollaborator, depth, limit],
    queryFn: async (): Promise<TeamNote[]> => {
      const collaboratorIds = collaborators?.map((c) => c.id) || [];
      if (collaboratorIds.length === 0) return [];

      // Filtrer par collaborateur si sélectionné
      const idsToQuery =
        selectedCollaborator === 'all'
          ? collaboratorIds
          : [selectedCollaborator];

      const { data, error } = await supabase
        .from('notes_sef')
        .select(
          `
          id,
          numero,
          reference_pivot,
          objet,
          statut,
          urgence,
          montant_estime,
          created_at,
          created_by,
          creator:profiles!notes_sef_created_by_fkey(last_name, first_name, email)
        `
        )
        .in('created_by', idsToQuery)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as unknown as TeamNote[];
    },
    enabled: !!userId && !!collaborators && collaborators.length > 0,
  });

  // Obtenir le badge de statut
  const getStatusBadge = (statut: string | null) => {
    const key = statut?.toLowerCase() || 'brouillon';
    const config = STATUS_CONFIG[key] || { variant: 'outline' as const, label: statut || '-' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Obtenir le nom complet du créateur
  const getCreatorName = (note: TeamNote): string => {
    if (!note.creator) return '-';
    const parts = [note.creator.first_name, note.creator.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : note.creator.email || '-';
  };

  // Obtenir la référence affichable
  const getReference = (note: TeamNote): string => {
    return note.numero || note.reference_pivot || 'Brouillon';
  };

  // État de chargement initial
  if (isLoadingCollaborators) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Erreur de chargement des collaborateurs
  if (collaboratorsError) {
    return (
      <Card className={cn('border-red-200', className)}>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-red-600 font-medium">Erreur de chargement</p>
          <p className="text-sm text-gray-500 mt-2">
            Impossible de récupérer la liste de vos collaborateurs.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => refetchCollaborators()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Pas de collaborateurs
  if (!collaborators || collaborators.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">
            Vous n'avez pas de collaborateurs directs.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Les notes de vos N-1 apparaîtront ici lorsque la hiérarchie sera
            configurée.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Compteurs
  const pendingCount =
    teamNotes?.filter((n) =>
      ['brouillon', 'soumis', 'a_valider'].includes(n.statut?.toLowerCase() || '')
    ).length || 0;

  const totalNotes = teamNotes?.length || 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Notes de mon équipe
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingCount} en attente
            </Badge>
          )}
        </CardTitle>

        <div className="flex items-center gap-2">
          <Select
            value={selectedCollaborator}
            onValueChange={setSelectedCollaborator}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par collaborateur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Tous ({collaborators.length} collaborateurs)
              </SelectItem>
              {collaborators.map((collab) => (
                <SelectItem key={collab.id} value={collab.id}>
                  {collab.prenom} {collab.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              refetchCollaborators();
              refetchNotes();
            }}
            title="Actualiser"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Statistiques rapides */}
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1 text-gray-500">
            <Users className="h-4 w-4" />
            {collaborators.length} collaborateur(s)
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <FileText className="h-4 w-4" />
            {totalNotes} note(s)
          </div>
        </div>

        {/* Chargement des notes */}
        {isLoadingNotes ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : notesError ? (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
            <p className="text-red-600">Erreur lors du chargement des notes</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => refetchNotes()}
            >
              Réessayer
            </Button>
          </div>
        ) : teamNotes?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Aucune note de vos collaborateurs</p>
            {selectedCollaborator !== 'all' && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setSelectedCollaborator('all')}
              >
                Voir toutes les notes
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {teamNotes?.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/notes-sef/${note.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm">
                      {getReference(note)}
                    </span>
                    {getStatusBadge(note.statut)}
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        note.montant_estime && note.montant_estime > 0
                          ? 'border-blue-300 text-blue-700'
                          : 'border-green-300 text-green-700'
                      )}
                    >
                      {note.montant_estime && note.montant_estime > 0 ? (
                        <Wallet className="h-3 w-3 mr-1" />
                      ) : (
                        <FileText className="h-3 w-3 mr-1" />
                      )}
                      {note.montant_estime && note.montant_estime > 0 ? 'NAEF' : 'NSEF'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{note.objet}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Par {getCreatorName(note)}
                    {' • '}
                    {formatDistanceToNow(new Date(note.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                  {note.montant_estime != null && note.montant_estime > 0 && (
                    <span className="font-semibold text-blue-600 whitespace-nowrap">
                      {formatCurrency(note.montant_estime)}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/notes-sef/${note.id}`);
                    }}
                    title="Voir le détail"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination ou "Voir plus" si nécessaire */}
        {teamNotes && teamNotes.length >= limit && (
          <div className="text-center mt-4">
            <Button variant="outline" size="sm">
              Voir plus de notes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TeamNotesView;
