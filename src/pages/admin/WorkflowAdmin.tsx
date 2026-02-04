import { useState } from 'react';
import { useWorkflowAdmin, WfDefinition, WfStep, WfRole, WfService, WfAction } from '@/hooks/useWorkflowAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertCircle, CheckCircle, Clock, Edit, GripVertical, Plus, Settings, Trash2, Users, Workflow } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Composant pour éditer un workflow
function WorkflowEditor({ workflow, roles, services, onSave, onCancel }: {
  workflow?: WfDefinition;
  roles: WfRole[];
  services: WfService[];
  onSave: (data: Partial<WfDefinition>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    entity_type: workflow?.entity_type || '',
    nom: workflow?.nom || '',
    description: workflow?.description || '',
    est_actif: workflow?.est_actif ?? true,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entity_type">Type d'entité (code)</Label>
          <Input
            id="entity_type"
            value={formData.entity_type}
            onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
            placeholder="notes_sef, engagements..."
            disabled={!!workflow}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nom">Nom du workflow</Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            placeholder="Validation Note SEF"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description du circuit de validation..."
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="est_actif"
          checked={formData.est_actif}
          onCheckedChange={(checked) => setFormData({ ...formData, est_actif: checked })}
        />
        <Label htmlFor="est_actif">Workflow actif</Label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={() => onSave({ id: workflow?.id, ...formData })}>Enregistrer</Button>
      </div>
    </div>
  );
}

// Composant pour éditer une étape
function StepEditor({ step, workflowId, roles, services, stepOrder, onSave, onCancel }: {
  step?: WfStep;
  workflowId: string;
  roles: WfRole[];
  services: WfService[];
  stepOrder: number;
  onSave: (data: Parameters<ReturnType<typeof useWorkflowAdmin>['upsertStep']['mutate']>[0]) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    label: step?.label || '',
    description: step?.description || '',
    role_required: step?.role_required || '',
    role_alternatif: step?.role_alternatif || '',
    direction_required: step?.direction_required || '',
    est_optionnel: step?.est_optionnel ?? false,
    delai_max_heures: step?.delai_max_heures ?? 48,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Libellé de l'étape</Label>
          <Input
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="Validation Directeur"
          />
        </div>
        <div className="space-y-2">
          <Label>Délai max (heures)</Label>
          <Input
            type="number"
            value={formData.delai_max_heures}
            onChange={(e) => setFormData({ ...formData, delai_max_heures: parseInt(e.target.value) || 48 })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Rôle requis</Label>
          <Select value={formData.role_required} onValueChange={(v) => setFormData({ ...formData, role_required: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>
              {roles.filter(r => r.est_actif).map(role => (
                <SelectItem key={role.code} value={role.code}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Rôle alternatif</Label>
          <Select value={formData.role_alternatif || '__none__'} onValueChange={(v) => setFormData({ ...formData, role_alternatif: v === '__none__' ? null : v })}>
            <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Aucun</SelectItem>
              {roles.filter(r => r.est_actif && r.code).map(role => (
                <SelectItem key={role.code} value={role.code}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Service/Direction</Label>
          <Select value={formData.direction_required || '__all__'} onValueChange={(v) => setFormData({ ...formData, direction_required: v === '__all__' ? null : v })}>
            <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous les services</SelectItem>
              {services.filter(s => s.est_actif && s.code).map(service => (
                <SelectItem key={service.code} value={service.code}>{service.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.est_optionnel}
          onCheckedChange={(checked) => setFormData({ ...formData, est_optionnel: checked })}
        />
        <Label>Étape optionnelle (peut être sautée)</Label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={() => onSave({
          id: step?.id,
          workflow_id: workflowId,
          step_order: step?.step_order || stepOrder,
          ...formData,
          role_alternatif: formData.role_alternatif || null,
          direction_required: formData.direction_required || null,
        })}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

// Composant pour la liste des étapes d'un workflow
function WorkflowStepsList({ workflow, roles, services, onAddStep, onEditStep, onDeleteStep }: {
  workflow: WfDefinition;
  roles: WfRole[];
  services: WfService[];
  onAddStep: () => void;
  onEditStep: (step: WfStep) => void;
  onDeleteStep: (stepId: string) => void;
}) {
  const getRoleLabel = (code: string) => roles.find(r => r.code === code)?.label || code;
  const getServiceLabel = (code: string | null) => code ? services.find(s => s.code === code)?.label || code : null;

  return (
    <div className="space-y-2">
      {workflow.steps.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">Aucune étape configurée</p>
      ) : (
        <div className="space-y-2">
          {workflow.steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <Badge variant="outline" className="w-8 justify-center">{step.step_order}</Badge>
              <div className="flex-1">
                <div className="font-medium">{step.label}</div>
                <div className="text-sm text-muted-foreground">
                  {getRoleLabel(step.role_required)}
                  {step.role_alternatif && ` ou ${getRoleLabel(step.role_alternatif)}`}
                  {step.direction_required && ` (${getServiceLabel(step.direction_required)})`}
                </div>
              </div>
              <Badge variant={step.est_optionnel ? 'secondary' : 'default'}>
                {step.est_optionnel ? 'Optionnel' : 'Requis'}
              </Badge>
              <Badge variant="outline">{step.delai_max_heures}h</Badge>
              <Button variant="ghost" size="icon" onClick={() => onEditStep(step)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDeleteStep(step.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" className="w-full" onClick={onAddStep}>
        <Plus className="h-4 w-4 mr-2" /> Ajouter une étape
      </Button>
    </div>
  );
}

// Page principale
export default function WorkflowAdminPage() {
  const {
    config,
    isLoading,
    error,
    upsertWorkflow,
    upsertStep,
    deleteStep,
    upsertRole,
    upsertService,
    upsertAction,
  } = useWorkflowAdmin();

  const [editingWorkflow, setEditingWorkflow] = useState<WfDefinition | null>(null);
  const [editingStep, setEditingStep] = useState<{ workflowId: string; step?: WfStep; stepOrder: number } | null>(null);
  const [editingRole, setEditingRole] = useState<WfRole | null>(null);
  const [editingService, setEditingService] = useState<WfService | null>(null);
  const [editingAction, setEditingAction] = useState<WfAction | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Impossible de charger la configuration des workflows.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { workflows = [], roles = [], services = [], actions = [] } = config || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" /> Administration des Workflows
          </h1>
          <p className="text-muted-foreground">
            Configurez les circuits de validation, rôles, services et actions
          </p>
        </div>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" /> Workflows ({workflows.length})
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Rôles ({roles.length})
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Services ({services.length})
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Actions ({actions.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Workflows */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddingNew && !editingWorkflow} onOpenChange={(open) => !open && setIsAddingNew(false)}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsAddingNew(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Nouveau workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nouveau workflow</DialogTitle>
                  <DialogDescription>Créez un nouveau circuit de validation</DialogDescription>
                </DialogHeader>
                <WorkflowEditor
                  roles={roles}
                  services={services}
                  onSave={(data) => {
                    upsertWorkflow.mutate(data);
                    setIsAddingNew(false);
                  }}
                  onCancel={() => setIsAddingNew(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {workflows.map((workflow) => (
              <AccordionItem key={workflow.id} value={workflow.id} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-4 flex-1">
                    <Badge variant={workflow.est_actif ? 'default' : 'secondary'}>
                      {workflow.est_actif ? 'Actif' : 'Inactif'}
                    </Badge>
                    <div className="text-left">
                      <div className="font-semibold">{workflow.nom}</div>
                      <div className="text-sm text-muted-foreground">{workflow.entity_type} - {workflow.steps.length} étape(s)</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">{workflow.description}</p>
                    <Button variant="outline" size="sm" onClick={() => setEditingWorkflow(workflow)}>
                      <Edit className="h-4 w-4 mr-2" /> Modifier
                    </Button>
                  </div>
                  <WorkflowStepsList
                    workflow={workflow}
                    roles={roles}
                    services={services}
                    onAddStep={() => setEditingStep({ workflowId: workflow.id, stepOrder: workflow.steps.length + 1 })}
                    onEditStep={(step) => setEditingStep({ workflowId: workflow.id, step, stepOrder: step.step_order })}
                    onDeleteStep={(stepId) => {
                      if (confirm('Supprimer cette étape ?')) {
                        deleteStep.mutate(stepId);
                      }
                    }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Dialog édition workflow */}
          <Dialog open={!!editingWorkflow} onOpenChange={(open) => !open && setEditingWorkflow(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Modifier le workflow</DialogTitle>
              </DialogHeader>
              {editingWorkflow && (
                <WorkflowEditor
                  workflow={editingWorkflow}
                  roles={roles}
                  services={services}
                  onSave={(data) => {
                    upsertWorkflow.mutate(data);
                    setEditingWorkflow(null);
                  }}
                  onCancel={() => setEditingWorkflow(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog édition étape */}
          <Dialog open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingStep?.step ? 'Modifier l\'étape' : 'Nouvelle étape'}</DialogTitle>
              </DialogHeader>
              {editingStep && (
                <StepEditor
                  step={editingStep.step}
                  workflowId={editingStep.workflowId}
                  roles={roles}
                  services={services}
                  stepOrder={editingStep.stepOrder}
                  onSave={(data) => {
                    upsertStep.mutate(data);
                    setEditingStep(null);
                  }}
                  onCancel={() => setEditingStep(null)}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Onglet Rôles */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Rôles du système</CardTitle>
                <CardDescription>Gérez les rôles utilisables dans les workflows</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" /> Nouveau rôle</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouveau rôle</DialogTitle>
                  </DialogHeader>
                  <RoleEditor
                    onSave={(data) => upsertRole.mutate(data)}
                    onCancel={() => {}}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-mono">{role.code}</TableCell>
                      <TableCell>{role.label}</TableCell>
                      <TableCell>{role.niveau_hierarchique}</TableCell>
                      <TableCell>
                        <Badge variant={role.est_actif ? 'default' : 'secondary'}>
                          {role.est_actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setEditingRole(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier le rôle</DialogTitle>
              </DialogHeader>
              {editingRole && (
                <RoleEditor
                  role={editingRole}
                  onSave={(data) => {
                    upsertRole.mutate(data);
                    setEditingRole(null);
                  }}
                  onCancel={() => setEditingRole(null)}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Onglet Services */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Services et Directions</CardTitle>
                <CardDescription>Gérez les services utilisables dans les workflows</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" /> Nouveau service</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouveau service</DialogTitle>
                  </DialogHeader>
                  <ServiceEditor
                    roles={roles}
                    services={services}
                    onSave={(data) => upsertService.mutate(data)}
                    onCancel={() => {}}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-mono">{service.code}</TableCell>
                      <TableCell>{service.label}</TableCell>
                      <TableCell>{roles.find(r => r.code === service.responsable_role_code)?.label || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={service.est_actif ? 'default' : 'secondary'}>
                          {service.est_actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setEditingService(service)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier le service</DialogTitle>
              </DialogHeader>
              {editingService && (
                <ServiceEditor
                  service={editingService}
                  roles={roles}
                  services={services}
                  onSave={(data) => {
                    upsertService.mutate(data);
                    setEditingService(null);
                  }}
                  onCancel={() => setEditingService(null)}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Onglet Actions */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Actions disponibles</CardTitle>
                <CardDescription>Gérez les actions possibles dans les workflows (valider, rejeter, etc.)</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" /> Nouvelle action</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvelle action</DialogTitle>
                  </DialogHeader>
                  <ActionEditor
                    onSave={(data) => upsertAction.mutate(data)}
                    onCancel={() => {}}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Couleur</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell className="font-mono">{action.code}</TableCell>
                      <TableCell>{action.label}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: getColorValue(action.color) }}>{action.color}</Badge>
                      </TableCell>
                      <TableCell className="space-x-1">
                        {action.require_motif && <Badge variant="outline">Motif</Badge>}
                        {action.is_terminal && <Badge variant="destructive">Terminal</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={action.est_actif ? 'default' : 'secondary'}>
                          {action.est_actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setEditingAction(action)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={!!editingAction} onOpenChange={(open) => !open && setEditingAction(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier l'action</DialogTitle>
              </DialogHeader>
              {editingAction && (
                <ActionEditor
                  action={editingAction}
                  onSave={(data) => {
                    upsertAction.mutate(data);
                    setEditingAction(null);
                  }}
                  onCancel={() => setEditingAction(null)}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Éditeurs simples
function RoleEditor({ role, onSave, onCancel }: { role?: WfRole; onSave: (data: Partial<WfRole>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    code: role?.code || '',
    label: role?.label || '',
    description: role?.description || '',
    niveau_hierarchique: role?.niveau_hierarchique ?? 50,
    est_actif: role?.est_actif ?? true,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Code</Label>
          <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} disabled={!!role} />
        </div>
        <div className="space-y-2">
          <Label>Libellé</Label>
          <Input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Niveau hiérarchique (0-100)</Label>
          <Input type="number" min={0} max={100} value={formData.niveau_hierarchique} onChange={(e) => setFormData({ ...formData, niveau_hierarchique: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={formData.est_actif} onCheckedChange={(checked) => setFormData({ ...formData, est_actif: checked })} />
          <Label>Actif</Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={() => onSave({ id: role?.id, ...formData })}>Enregistrer</Button>
      </DialogFooter>
    </div>
  );
}

function ServiceEditor({ service, roles, services, onSave, onCancel }: { service?: WfService; roles: WfRole[]; services: WfService[]; onSave: (data: Partial<WfService>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    code: service?.code || '',
    label: service?.label || '',
    description: service?.description || '',
    parent_id: service?.parent_id || '',
    responsable_role_code: service?.responsable_role_code || '',
    est_actif: service?.est_actif ?? true,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Code</Label>
          <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} disabled={!!service} />
        </div>
        <div className="space-y-2">
          <Label>Libellé</Label>
          <Input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Rôle responsable</Label>
          <Select value={formData.responsable_role_code} onValueChange={(v) => setFormData({ ...formData, responsable_role_code: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>
              {roles.filter(r => r.est_actif).map(role => (
                <SelectItem key={role.code} value={role.code}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={formData.est_actif} onCheckedChange={(checked) => setFormData({ ...formData, est_actif: checked })} />
          <Label>Actif</Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={() => onSave({ id: service?.id, ...formData, parent_id: formData.parent_id || null, responsable_role_code: formData.responsable_role_code || null })}>Enregistrer</Button>
      </DialogFooter>
    </div>
  );
}

function ActionEditor({ action, onSave, onCancel }: { action?: WfAction; onSave: (data: Partial<WfAction>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    code: action?.code || '',
    label: action?.label || '',
    description: action?.description || '',
    icon: action?.icon || '',
    color: action?.color || 'gray',
    require_motif: action?.require_motif ?? false,
    require_date_reprise: action?.require_date_reprise ?? false,
    is_terminal: action?.is_terminal ?? false,
    est_actif: action?.est_actif ?? true,
  });

  const colors = ['gray', 'green', 'red', 'orange', 'blue', 'purple', 'yellow'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Code</Label>
          <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })} disabled={!!action} />
        </div>
        <div className="space-y-2">
          <Label>Libellé</Label>
          <Input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Icône (Lucide)</Label>
          <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="CheckCircle, XCircle..." />
        </div>
        <div className="space-y-2">
          <Label>Couleur</Label>
          <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {colors.map(c => (
                <SelectItem key={c} value={c}>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getColorValue(c) }} />
                    {c}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Switch checked={formData.require_motif} onCheckedChange={(checked) => setFormData({ ...formData, require_motif: checked })} />
          <Label>Requiert un motif</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch checked={formData.require_date_reprise} onCheckedChange={(checked) => setFormData({ ...formData, require_date_reprise: checked })} />
          <Label>Requiert une date de reprise</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch checked={formData.is_terminal} onCheckedChange={(checked) => setFormData({ ...formData, is_terminal: checked })} />
          <Label>Action terminale (clôt le workflow)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch checked={formData.est_actif} onCheckedChange={(checked) => setFormData({ ...formData, est_actif: checked })} />
          <Label>Actif</Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={() => onSave({ id: action?.id, ...formData })}>Enregistrer</Button>
      </DialogFooter>
    </div>
  );
}

function getColorValue(color: string): string {
  const colors: Record<string, string> = {
    gray: '#6b7280',
    green: '#22c55e',
    red: '#ef4444',
    orange: '#f97316',
    blue: '#3b82f6',
    purple: '#a855f7',
    yellow: '#eab308',
  };
  return colors[color] || colors.gray;
}
