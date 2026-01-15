import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, Circle, ChevronDown, ClipboardList, AlertTriangle, Info } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  category: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Création
  { id: "create_1", category: "Création", label: "Ouvrir le modal 'Nouvelle Note SEF'", description: "Bouton visible et actif (exercice en cours)" },
  { id: "create_2", category: "Création", label: "Vérifier pré-remplissage exercice + utilisateur", description: "Exercice courant affiché automatiquement" },
  { id: "create_3", category: "Création", label: "Liste directions alimentée", description: "Toutes les directions actives affichées" },
  { id: "create_4", category: "Création", label: "Liste demandeurs alimentée", description: "Utilisateurs disponibles" },
  { id: "create_5", category: "Création", label: "Champs obligatoires validés", description: "Objet, Direction, Demandeur, Urgence, Justification, Date souhaitée" },
  { id: "create_6", category: "Création", label: "Message d'erreur si champs manquants", description: "Erreurs affichées en rouge sous les champs" },
  { id: "create_7", category: "Création", label: "Création réussie → Toast + liste rafraîchie", description: "Message 'Note ARTI... créée'" },
  { id: "create_8", category: "Création", label: "Numéro/Référence pivot générés automatiquement", description: "Format ARTI/YYYY/DIR/NNNN" },
  
  // Upload pièces
  { id: "upload_1", category: "Pièces jointes", label: "Ajout de pièce depuis la fiche détail", description: "Bouton visible si Brouillon" },
  { id: "upload_2", category: "Pièces jointes", label: "Limite 10MB respectée", description: "Toast d'erreur si fichier trop volumineux" },
  { id: "upload_3", category: "Pièces jointes", label: "Téléchargement de pièce", description: "Télécharger un fichier uploadé" },
  { id: "upload_4", category: "Pièces jointes", label: "Suppression de pièce", description: "Confirmation + suppression effective" },
  
  // Recherche et filtres
  { id: "search_1", category: "Recherche/Filtres", label: "Recherche par référence pivot (ARTI...)", description: "Filtrage en temps réel" },
  { id: "search_2", category: "Recherche/Filtres", label: "Recherche par objet", description: "Texte partiel reconnu" },
  { id: "search_3", category: "Recherche/Filtres", label: "Recherche par direction", description: "Label ou sigle" },
  { id: "search_4", category: "Recherche/Filtres", label: "Onglets filtrent correctement", description: "Toutes, À valider, Validées, Différées, Rejetées" },
  { id: "search_5", category: "Recherche/Filtres", label: "Compteurs cohérents avec la liste", description: "KPIs = nombre de notes dans chaque catégorie" },
  
  // Transitions de statut
  { id: "status_1", category: "Transitions statut", label: "Brouillon → Soumis (bouton Soumettre)", description: "Bouton visible pour le créateur" },
  { id: "status_2", category: "Transitions statut", label: "Soumis → À valider automatique", description: "Compteur 'À valider' mis à jour" },
  { id: "status_3", category: "Transitions statut", label: "À valider → Validé (DG clique Valider)", description: "Note passe en 'Validé' + Dossier créé" },
  { id: "status_4", category: "Transitions statut", label: "À valider → Rejeté (DG clique Rejeter)", description: "Modal motif obligatoire + confirmation" },
  { id: "status_5", category: "Transitions statut", label: "À valider → Différé (DG clique Différer)", description: "Modal motif + date reprise optionnelle" },
  { id: "status_6", category: "Transitions statut", label: "Différé → Validé (DG peut valider)", description: "Bouton Valider visible sur notes différées" },
  
  // Droits par rôle
  { id: "role_1", category: "Droits/Rôles", label: "Agent voit ses propres notes", description: "Peut créer, modifier si brouillon, soumettre" },
  { id: "role_2", category: "Droits/Rôles", label: "Agent ne peut pas valider/rejeter", description: "Boutons masqués si non-validateur" },
  { id: "role_3", category: "Droits/Rôles", label: "DG/DAAF/ADMIN peuvent valider", description: "Boutons visibles pour ces rôles" },
  { id: "role_4", category: "Droits/Rôles", label: "Exercice clos bloque la création", description: "Bouton 'Nouvelle note' désactivé" },
  
  // Multi-exercice
  { id: "exercice_1", category: "Multi-exercice", label: "Changement d'exercice filtre les notes", description: "Seules les notes de l'exercice sélectionné" },
  { id: "exercice_2", category: "Multi-exercice", label: "Compteurs recalculés par exercice", description: "KPIs changent avec l'exercice" },
  
  // Audit
  { id: "audit_1", category: "Audit/Traçabilité", label: "Historique visible dans la fiche détail", description: "Timeline des événements" },
  { id: "audit_2", category: "Audit/Traçabilité", label: "Création loguée dans notes_sef_history", description: "Vérifier en base" },
  { id: "audit_3", category: "Audit/Traçabilité", label: "Soumission → notification aux validateurs", description: "Badge cloche mis à jour" },
  { id: "audit_4", category: "Audit/Traçabilité", label: "Validation → notification au créateur", description: "Notification reçue" },
  { id: "audit_5", category: "Audit/Traçabilité", label: "Rejet → notification urgente au créateur", description: "Notification avec motif" },
  { id: "audit_6", category: "Audit/Traçabilité", label: "Activités récentes (dashboard)", description: "Événements SEF visibles" },
  
  // UX
  { id: "ux_1", category: "UX", label: "Loader pendant chargement", description: "Spinner affiché" },
  { id: "ux_2", category: "UX", label: "Empty state si aucune note", description: "Message clair 'Aucune note...'" },
  { id: "ux_3", category: "UX", label: "Toast de confirmation/erreur", description: "Messages utilisateur clairs" },
  { id: "ux_4", category: "UX", label: "Modal confirmation avant rejet", description: "Motif obligatoire" },
  { id: "ux_5", category: "UX", label: "Motif affiché dans fiche si rejeté/différé", description: "Bloc coloré avec détails" },
];

export function NoteSEFChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "Création": true,
    "Transitions statut": true,
  });

  const categories = [...new Set(CHECKLIST_ITEMS.map((item) => item.category))];
  
  const getItemsByCategory = (category: string) =>
    CHECKLIST_ITEMS.filter((item) => item.category === category);

  const getCategoryProgress = (category: string) => {
    const items = getItemsByCategory(category);
    const checked = items.filter((item) => checkedItems[item.id]).length;
    return { checked, total: items.length };
  };

  const totalChecked = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = CHECKLIST_ITEMS.length;
  const progressPercent = Math.round((totalChecked / totalItems) * 100);

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetChecklist = () => {
    setCheckedItems({});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Checklist de tests - Notes SEF
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant={progressPercent === 100 ? "default" : "secondary"}>
              {totalChecked}/{totalItems} ({progressPercent}%)
            </Badge>
            <Button variant="outline" size="sm" onClick={resetChecklist}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {categories.map((category) => {
              const { checked, total } = getCategoryProgress(category);
              const isComplete = checked === total;
              
              return (
                <Collapsible
                  key={category}
                  open={openCategories[category]}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        {isComplete ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="font-medium">{category}</span>
                        <Badge variant={isComplete ? "default" : "outline"} className="text-xs">
                          {checked}/{total}
                        </Badge>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${openCategories[category] ? "rotate-180" : ""}`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pl-4 pt-2 space-y-2">
                      {getItemsByCategory(category).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer"
                          onClick={() => toggleItem(item.id)}
                        >
                          <Checkbox
                            checked={!!checkedItems[item.id]}
                            onCheckedChange={() => toggleItem(item.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <p className={`text-sm ${checkedItems[item.id] ? "line-through text-muted-foreground" : ""}`}>
                              {item.label}
                            </p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        {/* Notes importantes */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-300">Scénario de démo (3 minutes)</p>
              <ol className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-decimal list-inside">
                <li><strong>Agent</strong> : Créer une Note SEF + ajouter pièce + Soumettre</li>
                <li><strong>DG</strong> : Ouvrir onglet "À valider" + Valider la note</li>
                <li><strong>Vérifier</strong> : Note "Validée", dossier créé, audit visible, recherche par référence</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Risques restants */}
        <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">Risques restants</p>
              <ul className="text-sm text-amber-700 dark:text-amber-400 mt-2 space-y-1 list-disc list-inside">
                <li>RLS : vérifier que seuls les utilisateurs autorisés accèdent aux données</li>
                <li>Emails : système prêt mais non activé (in-app uniquement)</li>
                <li>Performances : à tester avec volume réaliste (&gt;100 notes)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
