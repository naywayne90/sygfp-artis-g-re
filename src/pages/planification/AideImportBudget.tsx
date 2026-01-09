import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  HelpCircle, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown,
  Calculator,
  FileWarning,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Code,
  FileText,
  Shield,
  ClipboardCheck
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AideImportBudget() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sheets: true,
    imputation: true,
    formula: true,
    errors: true,
    workflow: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Aide – Import Budget</h1>
            <p className="page-description">
              Guide complet pour importer correctement les lignes budgétaires dans SYGFP
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Link to="/planification/import-export">
            <Button variant="default" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Accéder à l'import
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Lightbulb className="h-5 w-5" />
            En résumé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <span>L'onglet <strong>"Groupé (2)"</strong> est prioritaire, sinon <strong>"Feuil3"</strong> est utilisé</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <span>L'imputation doit être au format <strong>TEXTE</strong> (pas nombre) pour éviter le bug E+17</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <span>L'imputation est calculée automatiquement à partir des composants si fournis</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <span>Le mode <strong>SAFE</strong> (par défaut) n'écrase jamais les lignes existantes</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 1: Feuilles utilisées */}
      <Collapsible open={openSections.sheets} onOpenChange={() => toggleSection("sheets")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                  1. Quelles feuilles Excel sont utilisées ?
                </CardTitle>
                <ChevronDown className={`h-5 w-5 transition-transform ${openSections.sheets ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Le système analyse automatiquement votre fichier Excel et sélectionne l'onglet le plus approprié.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-700 dark:text-green-300">
                      ✅ Onglets prioritaires (dans l'ordre)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside text-sm space-y-1">
                      <li><strong>"Groupé (2)"</strong> ou "Groupe (2)"</li>
                      <li><strong>"Feuil3"</strong> ou "Sheet3"</li>
                      <li><strong>"Données"</strong></li>
                      <li>Premier onglet valide disponible</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-700 dark:text-red-300">
                      ❌ Onglets ignorés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li><strong>"Groupé"</strong> (sans le "(2)")</li>
                      <li><strong>"Groupe"</strong> (sans le "(2)")</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Ces onglets contiennent souvent des erreurs #REF! ou des données non consolidées.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <BookOpen className="h-4 w-4" />
                <AlertTitle>Astuce</AlertTitle>
                <AlertDescription>
                  Lors de l'import, le système vous indique quel onglet a été sélectionné et pourquoi. 
                  Vous pouvez vérifier cette information dans l'étape "Prévisualisation".
                </AlertDescription>
              </Alert>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 2: Pourquoi format TEXTE */}
      <Collapsible open={openSections.imputation} onOpenChange={() => toggleSection("imputation")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  2. Pourquoi l'imputation doit être en TEXTE ?
                </CardTitle>
                <ChevronDown className={`h-5 w-5 transition-transform ${openSections.imputation ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-red-200">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>Le problème Excel E+17</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    Excel convertit automatiquement les grands nombres (comme <code>012345678901234567</code>) 
                    en notation scientifique : <code>1.23456789012346E+17</code>.
                  </p>
                  <p>
                    Cette conversion <strong>perd les derniers chiffres</strong> et rend l'imputation invalide !
                  </p>
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600 flex items-center gap-2">
                    ❌ Mauvais exemple (format Nombre)
                  </h4>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                    <div>Valeur saisie: 012034030101671700</div>
                    <div className="text-red-600">Excel affiche: 1.20340301E+17</div>
                    <div className="text-red-600">Valeur lue: 120340301016717<span className="bg-red-200">00</span></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-green-600 flex items-center gap-2">
                    ✅ Bon exemple (format Texte)
                  </h4>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                    <div>Valeur saisie: '012034030101671700</div>
                    <div className="text-green-600">Excel affiche: 012034030101671700</div>
                    <div className="text-green-600">Valeur lue: 012034030101671700 ✓</div>
                  </div>
                </div>
              </div>

              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-700 dark:text-blue-300">
                    💡 Comment éviter ce problème ?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Option 1:</strong> Formater la colonne Imputation en "Texte" AVANT de saisir les données</p>
                  <p><strong>Option 2:</strong> Préfixer chaque valeur avec une apostrophe: <code>'012034030101671700</code></p>
                  <p><strong>Option 3:</strong> Laisser la colonne Imputation vide et renseigner les composants (OS, Action, etc.) 
                     - le système recalculera automatiquement l'imputation</p>
                </CardContent>
              </Card>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 3: Formule de construction */}
      <Collapsible open={openSections.formula} onOpenChange={() => toggleSection("formula")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-purple-600" />
                  3. Construction de l'imputation (18 chiffres)
                </CardTitle>
                <ChevronDown className={`h-5 w-5 transition-transform ${openSections.formula ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                L'imputation budgétaire est un code unique de <strong>18 chiffres</strong> construit 
                par concaténation des codes des composants programmatiques.
              </p>

              <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-mono text-purple-800 dark:text-purple-300">
                    Formule de l'imputation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-lg flex flex-wrap items-center gap-1 text-center justify-center">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 font-mono">OS (2)</Badge>
                    <span>+</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800 font-mono">Action (2)</Badge>
                    <span>+</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 font-mono">Activité (3)</Badge>
                    <span>+</span>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 font-mono">S/Activité (2)</Badge>
                    <span>+</span>
                    <Badge variant="outline" className="bg-red-100 text-red-800 font-mono">Direction (2)</Badge>
                    <span>+</span>
                    <Badge variant="outline" className="bg-pink-100 text-pink-800 font-mono">Nat.Dép (1)</Badge>
                    <span>+</span>
                    <Badge variant="outline" className="bg-indigo-100 text-indigo-800 font-mono">NBE (6)</Badge>
                  </div>
                  <div className="text-center mt-3 font-mono text-muted-foreground">
                    = 2 + 2 + 3 + 2 + 2 + 1 + 6 = <strong>18 chiffres</strong>
                  </div>
                </CardContent>
              </Card>

              <h4 className="font-medium mt-4">Exemple concret</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Composant</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Code formaté</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Objectif Stratégique (OS)</TableCell>
                    <TableCell>2 chiffres</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell className="font-mono">01</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>2 chiffres</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell className="font-mono">02</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Activité</TableCell>
                    <TableCell>3 chiffres</TableCell>
                    <TableCell>34</TableCell>
                    <TableCell className="font-mono">034</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Sous-Activité</TableCell>
                    <TableCell>2 chiffres</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell className="font-mono">03</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Direction</TableCell>
                    <TableCell>2 chiffres</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell className="font-mono">01</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Nature de Dépense</TableCell>
                    <TableCell>1 chiffre</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell className="font-mono">0</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>NBE (Nature Budgétaire)</TableCell>
                    <TableCell>6 chiffres</TableCell>
                    <TableCell>671700</TableCell>
                    <TableCell className="font-mono">671700</TableCell>
                  </TableRow>
                  <TableRow className="bg-purple-50 dark:bg-purple-950/30 font-medium">
                    <TableCell colSpan={2}>Imputation résultante</TableCell>
                    <TableCell colSpan={2} className="font-mono text-lg">
                      <span className="text-blue-600">01</span>
                      <span className="text-green-600">02</span>
                      <span className="text-yellow-600">034</span>
                      <span className="text-orange-600">03</span>
                      <span className="text-red-600">01</span>
                      <span className="text-pink-600">0</span>
                      <span className="text-indigo-600">671700</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 4: Erreurs courantes */}
      <Collapsible open={openSections.errors} onOpenChange={() => toggleSection("errors")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileWarning className="h-5 w-5 text-red-600" />
                  4. Comment corriger une ligne rejetée ?
                </CardTitle>
                <ChevronDown className={`h-5 w-5 transition-transform ${openSections.errors ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Voici les erreurs les plus fréquentes et comment les corriger :
              </p>

              <div className="space-y-3">
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="destructive">Erreur</Badge>
                      <div className="flex-1">
                        <h4 className="font-medium">NBE absent ou invalide</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Le code NBE (Nature Budgétaire et Économique) doit être exactement 6 chiffres.
                        </p>
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <strong>Solution:</strong> Vérifiez que la colonne "NBE" ou "NATURE ECO" contient 
                          un code à 6 chiffres (ex: 671700). Si c'est "67170", ajoutez le 0 final: "671700".
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="destructive">Erreur</Badge>
                      <div className="flex-1">
                        <h4 className="font-medium">Direction vide ou non trouvée</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Le code Direction est obligatoire pour calculer l'imputation.
                        </p>
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <strong>Solution:</strong> Renseignez la colonne "Direction" avec le code de la direction 
                          (2 chiffres). Si la direction n'existe pas, elle sera créée automatiquement si 
                          l'option de synchronisation des référentiels est activée.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="destructive">Erreur</Badge>
                      <div className="flex-1">
                        <h4 className="font-medium">Montant invalide ou négatif</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Le montant (dotation initiale) doit être un nombre ≥ 0.
                        </p>
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <strong>Solution:</strong> Vérifiez que la colonne "Montant" ou "Budget initial" 
                          contient un nombre valide. Supprimez les espaces, les symboles monétaires 
                          et les séparateurs de milliers incorrects.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="destructive">Erreur</Badge>
                      <div className="flex-1">
                        <h4 className="font-medium">Imputation invalide (pas 18 chiffres)</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          L'imputation recalculée ne fait pas exactement 18 chiffres.
                        </p>
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <strong>Solution:</strong> Vérifiez que tous les composants sont renseignés avec 
                          le bon nombre de chiffres. Si l'OS est "1", écrivez "01". Si l'activité est "34", 
                          écrivez "034".
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Badge className="bg-amber-500">Warning</Badge>
                      <div className="flex-1">
                        <h4 className="font-medium">Imputation recalculée différente du fichier</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          C'est un avertissement, pas une erreur bloquante.
                        </p>
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <strong>Explication:</strong> Le système recalcule l'imputation à partir des 
                          composants pour garantir sa cohérence. Si elle diffère de celle du fichier, 
                          c'est souvent dû au bug E+17 d'Excel. La valeur recalculée sera utilisée.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200">
                <ClipboardCheck className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-700">Rapport d'erreurs</AlertTitle>
                <AlertDescription className="text-green-600">
                  Après l'analyse, vous pouvez télécharger un <strong>rapport d'erreurs Excel</strong> 
                  qui liste toutes les lignes rejetées avec les raisons. Corrigez le fichier source 
                  et réimportez-le.
                </AlertDescription>
              </Alert>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 5: Workflow et garde-fous */}
      <Collapsible open={openSections.workflow} onOpenChange={() => toggleSection("workflow")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  5. Sécurité et traçabilité de l'import
                </CardTitle>
                <ChevronDown className={`h-5 w-5 transition-transform ${openSections.workflow ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                SYGFP applique plusieurs garde-fous pour garantir la sécurité de vos données :
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Mode SAFE (par défaut)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Les lignes existantes ne sont <strong>jamais écrasées</strong>. 
                    Seules les nouvelles lignes sont créées. Les doublons sont ignorés.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-green-600" />
                      Confirmation obligatoire
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Vous devez confirmer l'import après avoir vérifié le résumé. 
                    Aucune donnée n'est modifiée avant cette confirmation.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Journal d'audit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Chaque import est journalisé avec : qui, quand, quel fichier, 
                    combien de lignes créées/mises à jour/ignorées.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-4 w-4 text-orange-600" />
                      Exercice obligatoire
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Un exercice budgétaire doit être sélectionné avant tout import. 
                    Cela évite les erreurs d'affectation.
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Consultez le journal d'audit pour voir l'historique des imports
                </span>
                <Link to="/admin/journal-audit">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Journal d'audit
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">Prêt à importer ?</h3>
              <p className="text-sm text-muted-foreground">
                Accédez à l'assistant d'import pour charger votre fichier Excel
              </p>
            </div>
            <Link to="/planification/import-export">
              <Button size="lg" className="gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Lancer l'import
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
