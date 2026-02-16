import { useState, useEffect, useRef } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useExpressionsBesoin,
  URGENCE_OPTIONS,
  ExpressionBesoinLigne,
} from '@/hooks/useExpressionsBesoin';
import { useExercice } from '@/contexts/ExerciceContext';
import { AttachmentService } from '@/services/attachmentService';
import {
  CreditCard,
  Calendar,
  Loader2,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  Paperclip,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ImputationValidee {
  id: string;
  reference: string | null;
  objet: string;
  montant: number | null;
  code_imputation: string | null;
  direction_id: string | null;
  dossier_id: string | null;
  direction?: { id: string; label: string; sigle: string | null } | null;
  budget_line?: { id: string; code: string; label: string } | null;
}

interface ArticleLigne {
  id: string;
  designation: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  prix_total: number;
}

interface SelectedFile {
  file: File;
  typePiece: string;
}

interface ExpressionBesoinFromImputationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceImputation?: ImputationValidee | null;
  imputationsValidees?: ImputationValidee[];
  onSuccess?: () => void;
}

const UNITES = [
  { value: 'piece', label: 'Pièce(s)' },
  { value: 'kg', label: 'Kilogramme(s)' },
  { value: 'm', label: 'Mètre(s)' },
  { value: 'm2', label: 'm²' },
  { value: 'm3', label: 'm³' },
  { value: 'litre', label: 'Litre(s)' },
  { value: 'lot', label: 'Lot(s)' },
  { value: 'forfait', label: 'Forfait' },
];

const TYPES_PIECES = [
  { value: 'tdr', label: 'Termes de référence (TDR)' },
  { value: 'devis', label: 'Devis' },
  { value: 'specifications', label: 'Spécifications techniques' },
];

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

export function ExpressionBesoinFromImputationForm({
  open,
  onOpenChange,
  sourceImputation,
  imputationsValidees = [],
  onSuccess,
}: ExpressionBesoinFromImputationFormProps) {
  const { exercice } = useExercice();
  const { createFromImputation, isCreating } = useExpressionsBesoin();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImputation, setSelectedImputation] = useState<ImputationValidee | null>(null);
  const [searchImputation, setSearchImputation] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    objet: '',
    description: '',
    justification: '',
    specifications: '',
    calendrier_debut: '',
    calendrier_fin: '',
    montant_estime: '',
    urgence: 'normale',
    lieu_livraison: '',
    delai_livraison: '',
    contact_livraison: '',
  });

  const [articles, setArticles] = useState<ArticleLigne[]>([
    {
      id: crypto.randomUUID(),
      designation: '',
      quantite: 1,
      unite: 'piece',
      prix_unitaire: 0,
      prix_total: 0,
    },
  ]);

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  // Auto-sélectionner l'imputation si elle est fournie
  useEffect(() => {
    if (sourceImputation) {
      setSelectedImputation(sourceImputation);
      setFormData((prev) => ({
        ...prev,
        objet: sourceImputation.objet || '',
        montant_estime: sourceImputation.montant?.toString() || '',
      }));
    }
  }, [sourceImputation]);

  const filteredImputations = imputationsValidees.filter(
    (imp) =>
      imp.reference?.toLowerCase().includes(searchImputation.toLowerCase()) ||
      imp.objet.toLowerCase().includes(searchImputation.toLowerCase()) ||
      imp.direction?.sigle?.toLowerCase().includes(searchImputation.toLowerCase())
  );

  const handleSelectImputation = (imputation: ImputationValidee) => {
    setSelectedImputation(imputation);
    setFormData((prev) => ({
      ...prev,
      objet: imputation.objet || '',
      montant_estime: imputation.montant?.toString() || '',
    }));
  };

  const handleAddArticle = () => {
    setArticles((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        designation: '',
        quantite: 1,
        unite: 'piece',
        prix_unitaire: 0,
        prix_total: 0,
      },
    ]);
  };

  const handleRemoveArticle = (id: string) => {
    if (articles.length > 1) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // Calcul du total des articles
  const totalArticles = articles.reduce((sum, a) => sum + a.prix_total, 0);
  const montantImpute = selectedImputation?.montant || 0;
  const hasValidArticles = articles.some((a) => a.designation.trim() !== '');
  const budgetDepasse = totalArticles > montantImpute && montantImpute > 0 && hasValidArticles;

  const handleArticleChange = (id: string, field: keyof ArticleLigne, value: string | number) => {
    setArticles((prev) => {
      const updated = prev.map((a) => {
        if (a.id !== id) return a;
        const upd = { ...a, [field]: value };
        if (field === 'quantite' || field === 'prix_unitaire') {
          upd.prix_total = upd.quantite * upd.prix_unitaire;
        }
        return upd;
      });
      // Auto-calcul du montant estimé
      const newTotal = updated.reduce((sum, a) => sum + a.prix_total, 0);
      if (newTotal > 0) {
        setFormData((f) => ({ ...f, montant_estime: newTotal.toString() }));
      }
      return updated;
    });
  };

  // Gestion des pièces jointes
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = MAX_FILES - selectedFiles.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_FILES} pièces jointes autorisées`);
      return;
    }

    const newFiles: SelectedFile[] = [];
    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} dépasse la taille maximale de 10 Mo`);
        continue;
      }
      const validation = AttachmentService.validateFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }
      newFiles.push({ file, typePiece: 'specifications' });
    }

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }

    // Reset input pour permettre la re-sélection du même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileTypeChange = (index: number, typePiece: string) => {
    setSelectedFiles((prev) => prev.map((f, i) => (i === index ? { ...f, typePiece } : f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImputation) return;

    // Validation: au moins un article avec désignation
    const listeArticles: ExpressionBesoinLigne[] = articles
      .filter((a) => a.designation.trim() !== '')
      .map(({ designation, quantite, unite, prix_unitaire, prix_total }) => ({
        designation,
        quantite,
        unite,
        prix_unitaire,
        prix_total,
      }));

    if (listeArticles.length === 0) {
      toast.error('Veuillez saisir au moins un article avec une désignation');
      return;
    }

    // Bloquer si dépassement budget
    if (budgetDepasse) {
      toast.error('Le total des articles dépasse le montant imputé');
      return;
    }

    try {
      const result = await createFromImputation({
        imputation_id: selectedImputation.id,
        dossier_id: selectedImputation.dossier_id || null,
        direction_id: selectedImputation.direction_id || null,
        objet: formData.objet,
        description: formData.description || null,
        justification: formData.justification || null,
        specifications: formData.specifications || null,
        calendrier_debut: formData.calendrier_debut || null,
        calendrier_fin: formData.calendrier_fin || null,
        montant_estime: formData.montant_estime ? parseFloat(formData.montant_estime) : null,
        urgence: formData.urgence,
        lieu_livraison: formData.lieu_livraison || null,
        delai_livraison: formData.delai_livraison || null,
        contact_livraison: formData.contact_livraison || null,
        liste_articles: listeArticles,
      });

      // Upload des PJ après création réussie
      if (selectedFiles.length > 0 && result?.id) {
        setIsUploading(true);
        const dossierRef = selectedImputation.reference || result.id;
        const filesToUpload = selectedFiles.map((sf) => sf.file);

        const uploadResult = await AttachmentService.uploadFiles({
          dossierRef,
          step: 'expression_besoin',
          files: filesToUpload,
          exercice: exercice || new Date().getFullYear(),
          entityId: result.id,
        });

        if (uploadResult.failedCount > 0) {
          toast.warning(
            `${uploadResult.successCount} fichier(s) uploadé(s), ${uploadResult.failedCount} en erreur`
          );
        }
        setIsUploading(false);
      }

      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch {
      // Error handled by hook's onError
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedImputation(null);
    setSearchImputation('');
    setFormData({
      objet: '',
      description: '',
      justification: '',
      specifications: '',
      calendrier_debut: '',
      calendrier_fin: '',
      montant_estime: '',
      urgence: 'normale',
      lieu_livraison: '',
      delai_livraison: '',
      contact_livraison: '',
    });
    setArticles([
      {
        id: crypto.randomUUID(),
        designation: '',
        quantite: 1,
        unite: 'piece',
        prix_unitaire: 0,
        prix_total: 0,
      },
    ]);
    setSelectedFiles([]);
  };

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA' : '-';

  const isBusy = isCreating || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une expression de besoin</DialogTitle>
          <DialogDescription>
            Créer une expression de besoin à partir d'une imputation validée - Exercice {exercice}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection de l'imputation */}
          {!selectedImputation ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Sélectionner une imputation validée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par référence, objet ou direction..."
                    value={searchImputation}
                    onChange={(e) => setSearchImputation(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredImputations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune imputation validée disponible
                    </p>
                  ) : (
                    filteredImputations.map((imputation) => (
                      <div
                        key={imputation.id}
                        onClick={() => handleSelectImputation(imputation)}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium font-mono text-sm">
                              {imputation.reference || 'Réf. en attente'}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {imputation.objet}
                            </p>
                            {imputation.direction && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {imputation.direction.sigle || imputation.direction.label}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">{formatMontant(imputation.montant)}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Informations de l'imputation sélectionnée — enrichies */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Imputation source
                    </CardTitle>
                    {!sourceImputation && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedImputation(null)}
                      >
                        Changer
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Référence:</span>{' '}
                      <span className="font-medium font-mono">
                        {selectedImputation.reference || 'En attente'}
                      </span>
                    </div>
                    {selectedImputation.direction && (
                      <div>
                        <span className="text-muted-foreground">Direction:</span>{' '}
                        <span className="font-medium">
                          {selectedImputation.direction.sigle || selectedImputation.direction.label}
                        </span>
                      </div>
                    )}
                    {selectedImputation.budget_line && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Ligne budgétaire:</span>{' '}
                        <span className="font-medium font-mono">
                          {selectedImputation.budget_line.code}
                        </span>{' '}
                        <span className="text-muted-foreground">
                          — {selectedImputation.budget_line.label}
                        </span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Budget imputé:</span>{' '}
                      <span className="font-bold text-primary text-base">
                        {formatMontant(selectedImputation.montant)}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Objet:</span>{' '}
                      <span className="font-medium">{selectedImputation.objet}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Détails du besoin */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="objet">Objet *</Label>
                  <Input
                    id="objet"
                    value={formData.objet}
                    onChange={(e) => setFormData((prev) => ({ ...prev, objet: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description détaillée du besoin</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    placeholder="Décrivez le besoin en détail..."
                  />
                </div>

                <div>
                  <Label htmlFor="justification">Justification</Label>
                  <Textarea
                    id="justification"
                    value={formData.justification}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, justification: e.target.value }))
                    }
                    rows={2}
                    placeholder="Pourquoi ce besoin est-il nécessaire ?"
                  />
                </div>

                {/* Liste des articles avec N° et Total */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Liste des articles *</CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddArticle}>
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[5%]">N°</TableHead>
                          <TableHead className="w-[28%]">Désignation</TableHead>
                          <TableHead className="w-[10%]">Quantité</TableHead>
                          <TableHead className="w-[15%]">Unité</TableHead>
                          <TableHead className="w-[15%]">Prix unit.</TableHead>
                          <TableHead className="w-[17%]">Prix total</TableHead>
                          <TableHead className="w-[5%]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {articles.map((article, index) => (
                          <TableRow key={article.id}>
                            <TableCell className="text-center font-mono text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={article.designation}
                                onChange={(e) =>
                                  handleArticleChange(article.id, 'designation', e.target.value)
                                }
                                placeholder="Nom de l'article..."
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={article.quantite}
                                onChange={(e) =>
                                  handleArticleChange(
                                    article.id,
                                    'quantite',
                                    parseInt(e.target.value) || 1
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={article.unite}
                                onValueChange={(value) =>
                                  handleArticleChange(article.id, 'unite', value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNITES.map((u) => (
                                    <SelectItem key={u.value} value={u.value}>
                                      {u.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={article.prix_unitaire || ''}
                                onChange={(e) =>
                                  handleArticleChange(
                                    article.id,
                                    'prix_unitaire',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">
                                {new Intl.NumberFormat('fr-FR').format(article.prix_total)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveArticle(article.id)}
                                disabled={articles.length === 1}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={5} className="text-right font-bold">
                            TOTAL GÉNÉRAL
                          </TableCell>
                          <TableCell className="font-bold text-base">
                            {new Intl.NumberFormat('fr-FR').format(totalArticles)} FCFA
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableFooter>
                    </Table>

                    {/* Alerte dépassement budget */}
                    {budgetDepasse && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Le total des articles (
                          {new Intl.NumberFormat('fr-FR').format(totalArticles)} FCFA) dépasse le
                          montant imputé ({new Intl.NumberFormat('fr-FR').format(montantImpute)}{' '}
                          FCFA)
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <div>
                  <Label htmlFor="specifications">Spécifications techniques</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, specifications: e.target.value }))
                    }
                    rows={3}
                    placeholder="Spécifications techniques, caractéristiques requises..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="montant_estime">Montant estimé (FCFA)</Label>
                    <Input
                      id="montant_estime"
                      type="number"
                      value={formData.montant_estime}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, montant_estime: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="urgence">Niveau d'urgence</Label>
                    <Select
                      value={formData.urgence}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, urgence: value }))
                      }
                    >
                      <SelectTrigger id="urgence">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {URGENCE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="calendrier_debut">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Date début souhaitée
                    </Label>
                    <Input
                      id="calendrier_debut"
                      type="date"
                      value={formData.calendrier_debut}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, calendrier_debut: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="calendrier_fin">Date fin souhaitée</Label>
                    <Input
                      id="calendrier_fin"
                      type="date"
                      value={formData.calendrier_fin}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, calendrier_fin: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Lieu et délai de livraison */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Lieu et délais de livraison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="lieu_livraison">Lieu de livraison</Label>
                      <Input
                        id="lieu_livraison"
                        value={formData.lieu_livraison}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, lieu_livraison: e.target.value }))
                        }
                        placeholder="Adresse ou site de livraison..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="delai_livraison">Délai de livraison souhaité</Label>
                        <Input
                          id="delai_livraison"
                          value={formData.delai_livraison}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, delai_livraison: e.target.value }))
                          }
                          placeholder="Ex: 15 jours, 1 mois..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_livraison">Contact sur site</Label>
                        <Input
                          id="contact_livraison"
                          value={formData.contact_livraison}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, contact_livraison: e.target.value }))
                          }
                          placeholder="Nom et téléphone..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pièces jointes */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Pièces jointes
                      <span className="text-xs text-muted-foreground font-normal">
                        (max {MAX_FILES} fichiers, 10 Mo chacun)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Liste des fichiers sélectionnés */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        {selectedFiles.map((sf, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 border rounded-md bg-background"
                          >
                            <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{sf.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {AttachmentService.formatFileSize(sf.file.size)}
                              </p>
                            </div>
                            <Select
                              value={sf.typePiece}
                              onValueChange={(value) => handleFileTypeChange(index, value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TYPES_PIECES.map((tp) => (
                                  <SelectItem key={tp.value} value={tp.value}>
                                    {tp.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bouton d'ajout */}
                    {selectedFiles.length < MAX_FILES && (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept={AttachmentService.getAcceptedExtensions()}
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter un fichier
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!selectedImputation || isBusy || budgetDepasse}>
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? 'Upload des fichiers...' : "Créer l'expression de besoin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
