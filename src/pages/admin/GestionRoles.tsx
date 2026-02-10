import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  HelpCircle,
  Lock,
  Palette,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PageHeader } from '@/components/shared/PageHeader';

type CustomRole = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  color: string | null;
  is_active: boolean | null;
  is_system: boolean | null;
  created_at: string;
};

export default function GestionRoles() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    description: '',
    color: '#3b82f6',
    is_active: true,
  });

  const { data: roles, isLoading } = useQuery({
    queryKey: ['custom-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_roles').select('*').order('label');
      if (error) throw error;
      return data as CustomRole[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('custom_roles')
          .update({
            code: data.code.toUpperCase(),
            label: data.label,
            description: data.description || null,
            color: data.color,
            is_active: data.is_active,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('custom_roles').insert({
          code: data.code.toUpperCase(),
          label: data.label,
          description: data.description || null,
          color: data.color,
          is_active: data.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingRole ? 'Rôle mis à jour' : 'Rôle créé');
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_roles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Rôle supprimé');
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData({ code: '', label: '', description: '', color: '#3b82f6', is_active: true });
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: CustomRole) => {
    setEditingRole(role);
    setFormData({
      code: role.code,
      label: role.label,
      description: role.description || '',
      color: role.color || '#3b82f6',
      is_active: role.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
  };

  const handleSave = () => {
    if (!formData.code || !formData.label) {
      toast.error('Code et libellé requis');
      return;
    }
    saveMutation.mutate({ ...formData, id: editingRole?.id });
  };

  const handleDelete = (role: CustomRole) => {
    if (role.is_system) {
      toast.error('Les rôles système ne peuvent pas être supprimés');
      return;
    }
    if (confirm(`Supprimer le rôle "${role.label}" ?`)) {
      deleteMutation.mutate(role.id);
    }
  };

  const [helpOpen, setHelpOpen] = useState(true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profils & Rôles"
        description="Configuration des profils et rôles utilisateurs"
        icon={Shield}
        backUrl="/"
      >
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Rôle
        </Button>
      </PageHeader>

      {/* Section d'aide explicative */}
      <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
        <Alert className="border-primary/30 bg-primary/5">
          <HelpCircle className="h-5 w-5 text-primary" />
          <AlertTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold">Aide – Module Profils & Rôles</span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {helpOpen ? 'Réduire' : 'Afficher'}
              </Button>
            </CollapsibleTrigger>
          </AlertTitle>
          <CollapsibleContent>
            <AlertDescription className="mt-4 space-y-4">
              {/* Introduction */}
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm leading-relaxed">
                  Ce module permet de <strong>configurer les rôles</strong> qui définissent les
                  permissions des utilisateurs dans SYGFP. Chaque rôle représente un profil métier
                  avec des droits d'accès spécifiques aux différents modules. Les rôles sont ensuite
                  attribués aux utilisateurs dans le module "Gestion des Autorisations".
                </p>
              </div>

              {/* Types de rôles */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-background rounded-lg border space-y-2">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Lock className="h-4 w-4" />
                    <span>Rôles Système</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Rôles prédéfinis et protégés (ADMIN, CB, DAF, DG, etc.). Leur code ne peut pas
                    être modifié et ils ne peuvent pas être supprimés. Vous pouvez cependant
                    modifier leur libellé et description.
                  </p>
                </div>

                <div className="p-4 bg-background rounded-lg border space-y-2">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Shield className="h-4 w-4" />
                    <span>Rôles Personnalisés</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Rôles créés par l'administrateur pour répondre à des besoins spécifiques. Ils
                    peuvent être modifiés ou supprimés à tout moment. Exemple : "Responsable
                    Marchés", "Agent Comptable".
                  </p>
                </div>

                <div className="p-4 bg-background rounded-lg border space-y-2">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Palette className="h-4 w-4" />
                    <span>Code & Couleur</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Le <strong>code</strong> est un identifiant court (ex: ADMIN, CB) utilisé dans
                    les règles d'autorisation. La <strong>couleur</strong> permet de distinguer
                    visuellement les rôles dans l'interface.
                  </p>
                </div>

                <div className="p-4 bg-background rounded-lg border space-y-2">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Statut Actif/Inactif</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Un rôle désactivé n'est plus proposé lors de l'attribution des permissions. Les
                    utilisateurs ayant ce rôle conservent leurs droits jusqu'à modification.
                  </p>
                </div>
              </div>

              {/* Rôles système prédéfinis avec actions */}
              <div className="p-4 bg-background rounded-lg border space-y-3">
                <h4 className="font-medium">Rôles système et leurs responsabilités</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                    <Badge variant="outline" className="border-blue-500 text-blue-500 shrink-0">
                      ADMIN
                    </Badge>
                    <div>
                      <span className="font-medium">Administrateur</span>
                      <p className="text-xs text-muted-foreground">
                        Accès complet à tous les modules
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                    <Badge variant="outline" className="border-green-500 text-green-500 shrink-0">
                      CB
                    </Badge>
                    <div>
                      <span className="font-medium">Contrôleur Budgétaire</span>
                      <p className="text-xs text-muted-foreground">
                        Imputation, validation engagements, virements
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                    <Badge variant="outline" className="border-purple-500 text-purple-500 shrink-0">
                      DAAF
                    </Badge>
                    <div>
                      <span className="font-medium">Dir. Admin & Financier</span>
                      <p className="text-xs text-muted-foreground">
                        Création engagements, liquidations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                    <Badge variant="outline" className="border-orange-500 text-orange-500 shrink-0">
                      DG
                    </Badge>
                    <div>
                      <span className="font-medium">Directeur Général</span>
                      <p className="text-xs text-muted-foreground">
                        Validation Notes SEF, signature ordonnancements
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                    <Badge variant="outline" className="border-cyan-500 text-cyan-500 shrink-0">
                      TRESORERIE
                    </Badge>
                    <div>
                      <span className="font-medium">Trésorerie / Agent Comptable</span>
                      <p className="text-xs text-muted-foreground">Exécution des règlements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                    <Badge variant="outline" className="border-pink-500 text-pink-500 shrink-0">
                      DIRECTEUR
                    </Badge>
                    <div>
                      <span className="font-medium">Directeur de département</span>
                      <p className="text-xs text-muted-foreground">
                        Validation Notes AEF de sa direction
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tableau récapitulatif Qui valide quoi */}
              <div className="p-4 bg-background rounded-lg border space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Tableau "Qui valide quoi"
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Action</th>
                        <th className="text-left py-2 px-3">Rôle requis</th>
                        <th className="text-left py-2 px-3">Remarque</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr className="hover:bg-muted/50">
                        <td className="py-2 px-3">Valider Note SEF</td>
                        <td className="py-2 px-3">
                          <Badge>DG</Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          Crée automatiquement le dossier
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="py-2 px-3">Valider Note AEF</td>
                        <td className="py-2 px-3">
                          <Badge>Directeur</Badge> ou <Badge>DG</Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          Selon périmètre direction
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="py-2 px-3">Imputation budgétaire</td>
                        <td className="py-2 px-3">
                          <Badge>CB</Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">Vérifie le disponible</td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="py-2 px-3">Valider Marché</td>
                        <td className="py-2 px-3">
                          <Badge>DG</Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">Après avis commission</td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="py-2 px-3">Valider Engagement</td>
                        <td className="py-2 px-3">
                          <Badge>CB</Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">Réserve les crédits</td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="py-2 px-3">Valider Liquidation</td>
                        <td className="py-2 px-3">
                          <Badge>DAAF</Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">Après service fait</td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="py-2 px-3">Signer Ordonnancement</td>
                        <td className="py-2 px-3">
                          <Badge>DG</Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">Ordre de payer</td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="py-2 px-3">Exécuter Règlement</td>
                        <td className="py-2 px-3">
                          <Badge>TRESORERIE</Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">Paiement effectif</td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="py-2 px-3">Approuver Virement</td>
                        <td className="py-2 px-3">
                          <Badge>CB</Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">Modification budgétaire</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Avertissement */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Points d'attention
                </h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 ml-4 list-disc">
                  <li>Les codes de rôle doivent être uniques et en majuscules.</li>
                  <li>
                    La suppression d'un rôle retire les permissions associées aux utilisateurs.
                  </li>
                  <li>
                    Après création d'un rôle, configurez ses permissions dans "Autorisations".
                  </li>
                  <li>Les modifications sont tracées dans le Journal d'Audit.</li>
                </ul>
              </div>
            </AlertDescription>
          </CollapsibleContent>
        </Alert>
      </Collapsible>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Liste des Rôles
          </CardTitle>
          <CardDescription>{roles?.length || 0} rôle(s) configuré(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : roles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun rôle configuré
                    </TableCell>
                  </TableRow>
                ) : (
                  roles?.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: role.color || undefined,
                            color: role.color || undefined,
                          }}
                        >
                          {role.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{role.label}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {role.description || '-'}
                      </TableCell>
                      <TableCell>
                        {role.is_system ? (
                          <Badge variant="secondary">Système</Badge>
                        ) : (
                          <Badge variant="outline">Personnalisé</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.is_active ? 'default' : 'destructive'}>
                          {role.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(role)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!role.is_system && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(role)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog création/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}</DialogTitle>
            <DialogDescription>
              Les rôles définissent les permissions des utilisateurs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="ADMIN"
                  disabled={editingRole?.is_system}
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 p-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Libellé *</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Administrateur"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du rôle..."
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Actif</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
