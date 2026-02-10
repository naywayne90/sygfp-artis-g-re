/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Search,
  Edit,
  UserCheck,
  UserX,
  Filter,
  HelpCircle,
  Users,
  Shield,
  Building2,
  Briefcase,
  CheckCircle2,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  Calendar,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PageHeader } from '@/components/shared/PageHeader';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  matricule: string | null;
  telephone: string | null;
  direction_id: string | null;
  is_active: boolean | null;
  role_hierarchique: string | null;
  profil_fonctionnel: string | null;
  exercises_allowed: number[] | null;
  direction?: { label: string } | null;
};

type Direction = {
  id: string;
  label: string;
  code: string;
};

type Exercice = {
  id: string;
  annee: number;
  statut: string;
  est_actif: boolean;
};

const ROLES_HIERARCHIQUES = ['Agent', 'Chef de Service', 'Sous-Directeur', 'Directeur', 'DG'];
const PROFILS_FONCTIONNELS = ['Admin', 'Validateur', 'Operationnel', 'Controleur', 'Auditeur'];

export default function GestionUtilisateurs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<Partial<Profile>>({});

  // État pour la création d'utilisateur
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    matricule: '',
    telephone: '',
    direction_id: '',
    role_hierarchique: 'Agent',
    profil_fonctionnel: 'Operationnel',
  });

  const {
    data: users,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['users-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`*, direction:directions!profiles_direction_id_fkey(label)`)
        .order('full_name');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: directions } = useQuery({
    queryKey: ['directions-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('directions')
        .select('id, label, code')
        .order('label');
      if (error) throw error;
      return data as Direction[];
    },
  });

  const { data: exercices } = useQuery({
    queryKey: ['exercices-for-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercices_budgetaires')
        .select('id, annee, statut, est_actif')
        .order('annee', { ascending: false });
      if (error) throw error;
      return data as Exercice[];
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.matricule?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDirection = filterDirection === 'all' || user.direction_id === filterDirection;
    const matchesRole = filterRole === 'all' || user.role_hierarchique === filterRole;

    return matchesSearch && matchesDirection && matchesRole;
  });

  const handleEdit = (user: Profile) => {
    setEditingUser(user);
    setFormData({
      matricule: user.matricule,
      telephone: user.telephone,
      direction_id: user.direction_id,
      role_hierarchique: user.role_hierarchique,
      profil_fonctionnel: user.profil_fonctionnel,
      is_active: user.is_active,
      exercises_allowed: user.exercises_allowed,
    });
  };

  const toggleExercise = (annee: number) => {
    const current = formData.exercises_allowed || [];
    if (current.includes(annee)) {
      setFormData({ ...formData, exercises_allowed: current.filter((a) => a !== annee) });
    } else {
      setFormData({ ...formData, exercises_allowed: [...current, annee] });
    }
  };

  const selectAllExercises = () => {
    setFormData({ ...formData, exercises_allowed: null }); // null = tous
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          matricule: formData.matricule,
          telephone: formData.telephone,
          direction_id: formData.direction_id,
          role_hierarchique: formData.role_hierarchique as any,
          profil_fonctionnel: formData.profil_fonctionnel as any,
          is_active: formData.is_active,
          exercises_allowed: formData.exercises_allowed,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success('Utilisateur mis à jour avec succès');
      setEditingUser(null);
      refetch();
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    }
  };

  const toggleUserStatus = async (user: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(`Utilisateur ${user.is_active ? 'désactivé' : 'activé'} avec succès`);
      refetch();
    } catch (error: any) {
      toast.error('Erreur: ' + error.message);
    }
  };

  // Créer un nouvel utilisateur via edge function
  const handleCreateUser = async () => {
    if (
      !createFormData.email ||
      !createFormData.password ||
      !createFormData.first_name ||
      !createFormData.last_name
    ) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (createFormData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: createFormData,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(
        `Utilisateur ${createFormData.first_name} ${createFormData.last_name} créé avec succès`
      );
      setIsCreateDialogOpen(false);
      setCreateFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        matricule: '',
        telephone: '',
        direction_id: '',
        role_hierarchique: 'Agent',
        profil_fonctionnel: 'Operationnel',
      });
      refetch();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || "Erreur lors de la création de l'utilisateur");
    } finally {
      setIsCreating(false);
    }
  };

  const [helpOpen, setHelpOpen] = useState(true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Utilisateurs"
        description="Administration des comptes utilisateurs"
        icon={Users}
        backUrl="/"
      />

      {/* Section d'aide explicative */}
      <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
        <Alert className="border-primary/30 bg-primary/5">
          <HelpCircle className="h-5 w-5 text-primary" />
          <AlertTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold">Aide – Module Gestion des Utilisateurs</span>
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
                  Ce module permet de <strong>gérer les comptes utilisateurs</strong> de SYGFP. Vous
                  pouvez modifier les informations des utilisateurs, leur attribuer des rôles
                  hiérarchiques et fonctionnels, les rattacher à une direction, et
                  activer/désactiver leurs accès. La gestion centralisée des utilisateurs assure la
                  traçabilité et la sécurité du système.
                </p>
              </div>

              {/* Concepts clés */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-background rounded-lg border space-y-2">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Users className="h-4 w-4" />
                    <span>Rôle Hiérarchique</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Définit la position dans l'organigramme : <strong>Agent</strong>,{' '}
                    <strong>Chef de Service</strong>,<strong> Sous-Directeur</strong>,{' '}
                    <strong>Directeur</strong>, ou <strong>DG</strong>. Ce rôle détermine les droits
                    de validation et la visibilité des données.
                  </p>
                </div>

                <div className="p-4 bg-background rounded-lg border space-y-2">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Shield className="h-4 w-4" />
                    <span>Profil Fonctionnel</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Définit les permissions système : <strong>Admin</strong> (accès total),
                    <strong> Validateur</strong> (validation des workflows),{' '}
                    <strong>Opérationnel</strong> (saisie),
                    <strong> Contrôleur</strong> (contrôle), <strong>Auditeur</strong> (lecture
                    seule).
                  </p>
                </div>

                <div className="p-4 bg-background rounded-lg border space-y-2">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Building2 className="h-4 w-4" />
                    <span>Direction</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Rattache l'utilisateur à une direction métier. Cela limite la visibilité aux
                    données de sa direction (sauf pour les profils Admin/Auditeur qui ont une vue
                    transversale).
                  </p>
                </div>

                <div className="p-4 bg-background rounded-lg border space-y-2">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Briefcase className="h-4 w-4" />
                    <span>Matricule</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Identifiant unique de l'agent dans l'organisation (ex: MAT-001). Utilisé pour la
                    traçabilité dans le journal d'audit et les rapports.
                  </p>
                </div>
              </div>

              {/* Actions disponibles */}
              <div className="p-4 bg-background rounded-lg border space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Actions disponibles
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>
                    <strong>Modifier</strong> (icône crayon) : Éditer le matricule, téléphone,
                    direction, rôle hiérarchique et profil fonctionnel d'un utilisateur.
                  </li>
                  <li>
                    <strong>Activer/Désactiver</strong> (icône utilisateur) : Un utilisateur
                    désactivé ne peut plus se connecter au système. Ses données restent conservées.
                  </li>
                  <li>
                    <strong>Filtrer</strong> : Utilisez la barre de recherche et les filtres par
                    direction et rôle pour trouver rapidement un utilisateur.
                  </li>
                </ul>
              </div>

              {/* Bonnes pratiques */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  💡 Bonnes pratiques
                </h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 ml-4 list-disc">
                  <li>Attribuez le profil "Admin" uniquement aux administrateurs système.</li>
                  <li>Vérifiez que chaque utilisateur est bien rattaché à sa direction.</li>
                  <li>Désactivez les comptes des agents ayant quitté l'organisation.</li>
                  <li>Les modifications sont tracées dans le Journal d'Audit.</li>
                </ul>
              </div>
            </AlertDescription>
          </CollapsibleContent>
        </Alert>
      </Collapsible>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Liste des Utilisateurs</CardTitle>
            <CardDescription>{filteredUsers?.length || 0} utilisateur(s) trouvé(s)</CardDescription>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterDirection} onValueChange={setFilterDirection}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les directions</SelectItem>
                {directions?.map((dir) => (
                  <SelectItem key={dir.id} value={dir.id}>
                    {dir.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {ROLES_HIERARCHIQUES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tableau */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Rôle Hiérarchique</TableHead>
                  <TableHead>Profil</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name || 'Sans nom'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{user.matricule || '-'}</TableCell>
                      <TableCell>{user.direction?.label || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role_hierarchique || 'Agent'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {user.profil_fonctionnel || 'Operationnel'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleUserStatus(user)}
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
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

      {/* Modal d'édition */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              {editingUser?.full_name} ({editingUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matricule</Label>
                <Input
                  value={formData.matricule || ''}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  placeholder="MAT-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={formData.telephone || ''}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+221 77 000 00 00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select
                value={formData.direction_id || ''}
                onValueChange={(value) => setFormData({ ...formData, direction_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une direction" />
                </SelectTrigger>
                <SelectContent>
                  {directions?.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rôle Hiérarchique</Label>
                <Select
                  value={formData.role_hierarchique || 'Agent'}
                  onValueChange={(value) => setFormData({ ...formData, role_hierarchique: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES_HIERARCHIQUES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profil Fonctionnel</Label>
                <Select
                  value={formData.profil_fonctionnel || 'Operationnel'}
                  onValueChange={(value) => setFormData({ ...formData, profil_fonctionnel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFILS_FONCTIONNELS.map((profil) => (
                      <SelectItem key={profil} value={profil}>
                        {profil}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exercices autorisés */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Exercices autorisés
                </Label>
                <Button type="button" variant="ghost" size="sm" onClick={selectAllExercises}>
                  Tous
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {formData.exercises_allowed === null
                  ? 'Accès à tous les exercices'
                  : formData.exercises_allowed?.length
                    ? `${formData.exercises_allowed.length} exercice(s) sélectionné(s)`
                    : 'Aucun exercice sélectionné (accès limité)'}
              </p>
              <div className="grid grid-cols-4 gap-2 max-h-32 overflow-auto p-2 border rounded-md">
                {exercices?.map((ex) => (
                  <div key={ex.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ex-${ex.annee}`}
                      checked={
                        formData.exercises_allowed === null ||
                        (formData.exercises_allowed?.includes(ex.annee) ?? false)
                      }
                      onCheckedChange={() => {
                        if (formData.exercises_allowed === null) {
                          // Si "tous", on passe à une sélection spécifique
                          setFormData({ ...formData, exercises_allowed: [ex.annee] });
                        } else {
                          toggleExercise(ex.annee);
                        }
                      }}
                    />
                    <label
                      htmlFor={`ex-${ex.annee}`}
                      className={`text-sm ${ex.est_actif ? 'font-medium' : 'text-muted-foreground'}`}
                    >
                      {ex.annee}
                      {ex.statut === 'en_cours' && (
                        <span className="text-xs text-green-600 ml-1">(actif)</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de création */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Renseignez les informations du nouvel utilisateur. Un compte sera créé
              automatiquement.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Email et mot de passe */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  placeholder="utilisateur@arti.ci"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="create-password"
                    type={showPassword ? 'text' : 'password'}
                    value={createFormData.password}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, password: e.target.value })
                    }
                    placeholder="Min. 6 caractères"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Prénom et nom */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-firstname">Prénom *</Label>
                <Input
                  id="create-firstname"
                  value={createFormData.first_name}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, first_name: e.target.value })
                  }
                  placeholder="Prénom"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-lastname">Nom *</Label>
                <Input
                  id="create-lastname"
                  value={createFormData.last_name}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, last_name: e.target.value })
                  }
                  placeholder="Nom"
                  required
                />
              </div>
            </div>

            {/* Matricule et téléphone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-matricule">Matricule</Label>
                <Input
                  id="create-matricule"
                  value={createFormData.matricule}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, matricule: e.target.value })
                  }
                  placeholder="MAT-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-telephone">Téléphone</Label>
                <Input
                  id="create-telephone"
                  value={createFormData.telephone}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, telephone: e.target.value })
                  }
                  placeholder="+225 07 00 00 00 00"
                />
              </div>
            </div>

            {/* Direction */}
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select
                value={createFormData.direction_id}
                onValueChange={(value) =>
                  setCreateFormData({ ...createFormData, direction_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une direction" />
                </SelectTrigger>
                <SelectContent>
                  {directions?.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rôles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rôle Hiérarchique</Label>
                <Select
                  value={createFormData.role_hierarchique}
                  onValueChange={(value) =>
                    setCreateFormData({ ...createFormData, role_hierarchique: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES_HIERARCHIQUES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profil Fonctionnel</Label>
                <Select
                  value={createFormData.profil_fonctionnel}
                  onValueChange={(value) =>
                    setCreateFormData({ ...createFormData, profil_fonctionnel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFILS_FONCTIONNELS.map((profil) => (
                      <SelectItem key={profil} value={profil}>
                        {profil}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l'utilisateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
