import { useProductionChecklist } from "@/hooks/useProductionChecklist";
import { useExercice } from "@/contexts/ExerciceContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  ClipboardCheck, RefreshCw, PlayCircle, CheckCircle2, 
  Circle, AlertCircle, FileText
} from "lucide-react";
import { useState } from "react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Exercice": <PlayCircle className="h-4 w-4" />,
  "Référentiels": <FileText className="h-4 w-4" />,
  "Budget": <AlertCircle className="h-4 w-4" />,
  "Prestataires": <Circle className="h-4 w-4" />,
  "Droits": <Circle className="h-4 w-4" />,
  "Alertes": <AlertCircle className="h-4 w-4" />,
  "Tests": <CheckCircle2 className="h-4 w-4" />,
  "Sécurité": <Circle className="h-4 w-4" />,
};

export default function ChecklistProduction() {
  const { exercice } = useExercice();
  const { 
    checklistItems, 
    groupedItems, 
    stats, 
    isLoading, 
    initChecklist, 
    toggleCheck,
    updateNotes,
    isInitializing 
  } = useProductionChecklist();
  
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");

  const handleNoteSubmit = (id: string) => {
    updateNotes({ id, notes: noteValue });
    setEditingNote(null);
    setNoteValue("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isEmpty = !checklistItems || checklistItems.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" />
          Checklist de Mise en Production
        </h1>
        <p className="page-description">
          Vérification des prérequis avant mise en production - Exercice {exercice}
        </p>
      </div>

      {/* Statistiques */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.checked}</p>
                <p className="text-sm text-muted-foreground">Validés</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-muted-foreground">/</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-primary">{stats.percentage}%</p>
              <p className="text-sm text-muted-foreground">Complété</p>
            </div>
          </div>
          <Progress value={stats.percentage} className="h-3" />
          {stats.percentage === 100 && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Prêt pour la production !
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Tous les prérequis sont validés pour l'exercice {exercice}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune checklist pour cet exercice</h3>
            <p className="text-muted-foreground mb-4">
              Initialisez la checklist pour l'exercice {exercice}
            </p>
            <Button onClick={() => initChecklist()} disabled={isInitializing}>
              {isInitializing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Initialiser la checklist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {CATEGORY_ICONS[category] || <Circle className="h-4 w-4" />}
                  {category}
                </CardTitle>
                <CardDescription>
                  {items.filter(i => i.is_checked).length} / {items.length} validés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-start gap-4 p-3 rounded-lg border transition-colors ${
                        item.is_checked 
                          ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={item.is_checked}
                        onCheckedChange={(checked) => 
                          toggleCheck({ id: item.id, isChecked: !!checked })
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium ${item.is_checked ? "line-through text-muted-foreground" : ""}`}>
                            {item.check_label}
                          </p>
                          {item.is_checked && item.checked_at && (
                            <Badge variant="secondary" className="text-xs">
                              {new Date(item.checked_at).toLocaleDateString("fr-FR")}
                            </Badge>
                          )}
                        </div>
                        {editingNote === item.id ? (
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={noteValue}
                              onChange={(e) => setNoteValue(e.target.value)}
                              placeholder="Ajouter une note..."
                              className="flex-1"
                            />
                            <Button size="sm" onClick={() => handleNoteSubmit(item.id)}>
                              OK
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingNote(null)}
                            >
                              Annuler
                            </Button>
                          </div>
                        ) : item.notes ? (
                          <p 
                            className="text-sm text-muted-foreground mt-1 cursor-pointer hover:underline"
                            onClick={() => {
                              setEditingNote(item.id);
                              setNoteValue(item.notes || "");
                            }}
                          >
                            📝 {item.notes}
                          </p>
                        ) : (
                          <button
                            className="text-xs text-muted-foreground mt-1 hover:underline"
                            onClick={() => {
                              setEditingNote(item.id);
                              setNoteValue("");
                            }}
                          >
                            + Ajouter une note
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
