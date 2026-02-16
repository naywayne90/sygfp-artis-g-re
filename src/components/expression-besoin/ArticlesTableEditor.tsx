import React, { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CATEGORIES_ARTICLES, UNITES } from '@/hooks/useExpressionsBesoin';
import { Plus, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ArticleLigne {
  id: string;
  designation: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  prix_total: number;
  categorie: string;
  ordre: number;
}

interface ArticlesTableEditorProps {
  articles: ArticleLigne[];
  onChange: (articles: ArticleLigne[]) => void;
  readOnly?: boolean;
  montantImpute?: number;
  showBudgetComparison?: boolean;
}

const getCategorieLabel = (value: string) =>
  CATEGORIES_ARTICLES.find((c) => c.value === value)?.label || value;

const getUniteLabel = (value: string) => UNITES.find((u) => u.value === value)?.label || value;

const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

// ============================
// Sortable row (edit mode)
// ============================
interface SortableArticleRowProps {
  article: ArticleLigne;
  index: number;
  onChange: (id: string, field: keyof ArticleLigne, value: string | number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function SortableArticleRow({
  article,
  index,
  onChange,
  onRemove,
  canRemove,
}: SortableArticleRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: article.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-8 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </TableCell>
      <TableCell className="text-center font-mono text-muted-foreground w-10">
        {index + 1}
      </TableCell>
      <TableCell>
        <Input
          value={article.designation}
          onChange={(e) => onChange(article.id, 'designation', e.target.value)}
          placeholder="Nom de l'article..."
          className="h-8"
        />
      </TableCell>
      <TableCell className="w-[120px]">
        <Select
          value={article.categorie}
          onValueChange={(v) => onChange(article.id, 'categorie', v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES_ARTICLES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="w-[80px]">
        <Input
          type="number"
          min="1"
          value={article.quantite}
          onChange={(e) => onChange(article.id, 'quantite', parseInt(e.target.value) || 1)}
          className="h-8"
        />
      </TableCell>
      <TableCell className="w-[100px]">
        <Select value={article.unite} onValueChange={(v) => onChange(article.id, 'unite', v)}>
          <SelectTrigger className="h-8 text-xs">
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
      <TableCell className="w-[110px]">
        <Input
          type="number"
          min="0"
          value={article.prix_unitaire || ''}
          onChange={(e) => onChange(article.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="h-8"
        />
      </TableCell>
      <TableCell className="w-[110px] text-right font-medium font-mono">
        {formatNumber(article.prix_total)}
      </TableCell>
      <TableCell className="w-10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onRemove(article.id)}
          disabled={!canRemove}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ============================
// Main component
// ============================
export function ArticlesTableEditor({
  articles,
  onChange,
  readOnly = false,
  montantImpute = 0,
  showBudgetComparison = false,
}: ArticlesTableEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Group articles by categorie
  const groupedArticles = useMemo(() => {
    const groups = new Map<string, ArticleLigne[]>();
    for (const art of articles) {
      const cat = art.categorie || 'autre';
      const existing = groups.get(cat);
      if (existing) {
        existing.push(art);
      } else {
        groups.set(cat, [art]);
      }
    }
    return groups;
  }, [articles]);

  const totalGeneral = articles.reduce((sum, a) => sum + a.prix_total, 0);
  const budgetDepasse = montantImpute > 0 && totalGeneral > montantImpute;
  const budgetRatio = montantImpute > 0 ? Math.min((totalGeneral / montantImpute) * 100, 100) : 0;

  // Handlers
  const handleArticleChange = (id: string, field: keyof ArticleLigne, value: string | number) => {
    const updated = articles.map((a) => {
      if (a.id !== id) return a;
      const upd = { ...a, [field]: value };
      if (field === 'quantite' || field === 'prix_unitaire') {
        upd.prix_total = upd.quantite * upd.prix_unitaire;
      }
      return upd;
    });
    onChange(updated);
  };

  const handleAddArticle = () => {
    const newArticle: ArticleLigne = {
      id: crypto.randomUUID(),
      designation: '',
      quantite: 1,
      unite: 'piece',
      prix_unitaire: 0,
      prix_total: 0,
      categorie: 'autre',
      ordre: articles.length,
    };
    onChange([...articles, newArticle]);
  };

  const handleRemoveArticle = (id: string) => {
    if (articles.length <= 1) return;
    const updated = articles.filter((a) => a.id !== id).map((a, i) => ({ ...a, ordre: i }));
    onChange(updated);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = articles.findIndex((a) => a.id === active.id);
    const newIndex = articles.findIndex((a) => a.id === over.id);
    const reordered = arrayMove(articles, oldIndex, newIndex).map((a, i) => ({ ...a, ordre: i }));
    onChange(reordered);
  };

  // ============================
  // READ-ONLY RENDER
  // ============================
  if (readOnly) {
    return (
      <div className="space-y-4">
        {articles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucun article renseigné</p>
        ) : (
          <>
            {Array.from(groupedArticles.entries()).map(([cat, items]) => {
              const subtotal = items.reduce((s, a) => s + a.prix_total, 0);
              return (
                <div key={cat}>
                  {groupedArticles.size > 1 && (
                    <div className="flex items-center justify-between py-1 px-2 bg-muted/50 rounded-t text-sm font-medium">
                      <span>{getCategorieLabel(cat)}</span>
                      <span className="font-mono">{formatNumber(subtotal)} FCFA</span>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[5%]">N°</TableHead>
                        <TableHead className="w-[30%]">Désignation</TableHead>
                        {groupedArticles.size <= 1 && (
                          <TableHead className="w-[14%]">Catégorie</TableHead>
                        )}
                        <TableHead className="w-[10%] text-right">Qté</TableHead>
                        <TableHead className="w-[10%]">Unité</TableHead>
                        <TableHead className="w-[15%] text-right">PU (FCFA)</TableHead>
                        <TableHead className="w-[16%] text-right">Total (FCFA)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={item.id || idx}>
                          <TableCell className="text-center font-mono text-muted-foreground">
                            {(item.ordre ?? idx) + 1}
                          </TableCell>
                          <TableCell className="font-medium">{item.designation || '-'}</TableCell>
                          {groupedArticles.size <= 1 && (
                            <TableCell className="text-xs text-muted-foreground">
                              {getCategorieLabel(item.categorie || 'autre')}
                            </TableCell>
                          )}
                          <TableCell className="text-right">{item.quantite}</TableCell>
                          <TableCell className="text-xs">{getUniteLabel(item.unite)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {item.prix_unitaire > 0 ? formatNumber(item.prix_unitaire) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {item.prix_total > 0 ? formatNumber(item.prix_total) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}

            {/* Récap financier */}
            <div className="space-y-1 bg-muted/30 rounded p-3">
              <div className="flex justify-end items-center gap-4 font-bold">
                <span>Total HT</span>
                <span className="font-mono text-base w-40 text-right">
                  {formatNumber(totalGeneral)} FCFA
                </span>
              </div>
              <div className="flex justify-end items-center gap-4 text-sm text-muted-foreground">
                <span>TVA 18% (indicatif)</span>
                <span className="font-mono w-40 text-right">
                  {formatNumber(Math.round(totalGeneral * 0.18))} FCFA
                </span>
              </div>
              <div className="flex justify-end items-center gap-4 font-bold border-t pt-1">
                <span>Total TTC (indicatif)</span>
                <span className="font-mono text-base w-40 text-right">
                  {formatNumber(totalGeneral + Math.round(totalGeneral * 0.18))} FCFA
                </span>
              </div>
            </div>
          </>
        )}

        {/* Budget comparison */}
        {showBudgetComparison && montantImpute > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Total articles : <strong>{formatNumber(totalGeneral)} FCFA</strong>
              </span>
              <span>
                Montant imputé : <strong>{formatNumber(montantImpute)} FCFA</strong>
              </span>
            </div>
            <Progress
              value={budgetRatio}
              className={cn('h-3', budgetDepasse ? '[&>div]:bg-destructive' : '[&>div]:bg-success')}
            />
            <p
              className={cn(
                'text-xs text-right font-medium',
                budgetDepasse ? 'text-destructive' : 'text-success'
              )}
            >
              {budgetDepasse
                ? `Dépassement de ${formatNumber(totalGeneral - montantImpute)} FCFA`
                : `Reste disponible : ${formatNumber(montantImpute - totalGeneral)} FCFA`}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ============================
  // EDIT RENDER
  // ============================
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          {articles.length} article{articles.length > 1 ? 's' : ''}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={handleAddArticle}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={articles.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead className="w-10">N°</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead className="w-[120px]">Catégorie</TableHead>
                <TableHead className="w-[80px]">Qté</TableHead>
                <TableHead className="w-[100px]">Unité</TableHead>
                <TableHead className="w-[110px]">Prix unit.</TableHead>
                <TableHead className="w-[110px] text-right">Total</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article, index) => (
                <SortableArticleRow
                  key={article.id}
                  article={article}
                  index={index}
                  onChange={handleArticleChange}
                  onRemove={handleRemoveArticle}
                  canRemove={articles.length > 1}
                />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} className="text-right font-bold">
                  Total HT
                </TableCell>
                <TableCell className="text-right font-bold text-base font-mono">
                  {formatNumber(totalGeneral)} FCFA
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell colSpan={7} className="text-right text-sm text-muted-foreground">
                  TVA 18% (indicatif)
                </TableCell>
                <TableCell className="text-right text-sm font-mono text-muted-foreground">
                  {formatNumber(Math.round(totalGeneral * 0.18))} FCFA
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell colSpan={7} className="text-right font-bold">
                  Total TTC (indicatif)
                </TableCell>
                <TableCell className="text-right font-bold text-base font-mono">
                  {formatNumber(totalGeneral + Math.round(totalGeneral * 0.18))} FCFA
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </SortableContext>
      </DndContext>

      {/* Budget alert */}
      {budgetDepasse && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Le total des articles ({formatNumber(totalGeneral)} FCFA) dépasse le montant imputé (
            {formatNumber(montantImpute)} FCFA)
          </AlertDescription>
        </Alert>
      )}

      {/* Budget comparison bar */}
      {showBudgetComparison && montantImpute > 0 && !budgetDepasse && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Consommation budget</span>
            <span>{budgetRatio.toFixed(1)}%</span>
          </div>
          <Progress value={budgetRatio} className="h-2 [&>div]:bg-success" />
        </div>
      )}
    </div>
  );
}
