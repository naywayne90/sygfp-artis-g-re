import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Code,
  ArrowRight,
  Table,
  Calculator,
  ShieldCheck,
  FileWarning,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const IMPUTATION_STRUCTURE = [
  { position: "1-2", length: 2, name: "OS", description: "Objectif Stratégique", example: "01" },
  { position: "3-4", length: 2, name: "Action", description: "Action (optionnel, souvent 00)", example: "00" },
  { position: "5-7", length: 3, name: "Activité", description: "Code activité", example: "112" },
  { position: "8-10", length: 3, name: "Sous-activité", description: "Code sous-activité", example: "001" },
  { position: "11-12", length: 2, name: "Direction", description: "Code direction", example: "01" },
  { position: "13", length: 1, name: "Nature", description: "Nature de dépense (6=fonct, 2=invest)", example: "6" },
  { position: "14-19", length: 6, name: "NBE", description: "Nomenclature Budgétaire de l'État", example: "671700" },
];

const COMMON_ERRORS = [
  {
    code: "IMPUTATION_INVALID_LENGTH",
    title: "Longueur imputation invalide",
    description: "L'imputation doit contenir exactement 17 ou 19 chiffres",
    solution: "Vérifiez que l'imputation est complète. Ajoutez les zéros manquants si nécessaire.",
  },
  {
    code: "NBE_NOT_FOUND",
    title: "Code NBE non trouvé",
    description: "Le code NBE extrait n'existe pas dans le référentiel",
    solution: "Vérifiez le code NBE dans l'onglet 'NBE' du fichier ou ajoutez-le au référentiel avant l'import.",
  },
  {
    code: "DIRECTION_NOT_FOUND",
    title: "Direction non trouvée",
    description: "Le code direction n'existe pas dans le référentiel",
    solution: "Utilisez l'option 'Synchroniser les référentiels' pour importer automatiquement les directions.",
  },
  {
    code: "MONTANT_INVALID",
    title: "Montant invalide",
    description: "Le montant n'est pas un nombre valide ou est négatif",
    solution: "Assurez-vous que la colonne montant contient uniquement des nombres positifs.",
  },
  {
    code: "DUPLICATE_IMPUTATION",
    title: "Doublon d'imputation",
    description: "La même imputation apparaît plusieurs fois dans le fichier",
    solution: "Supprimez ou fusionnez les lignes en doublon. Chaque imputation doit être unique.",
  },
  {
    code: "OS_NOT_FOUND",
    title: "Objectif Stratégique non trouvé",
    description: "Le code OS n'existe pas dans le référentiel",
    solution: "Activez 'Synchroniser les référentiels' ou ajoutez l'OS manuellement.",
  },
];

const WORKFLOW_STEPS = [
  { step: 1, title: "Préparer le fichier Excel", description: "Utilisez le template officiel avec la structure Feuil3/Table15" },
  { step: 2, title: "Vérifier les référentiels", description: "S'assurer que OS, Direction, NBE existent dans le système" },
  { step: 3, title: "Uploader le fichier", description: "Glisser-déposer ou sélectionner le fichier Excel" },
  { step: 4, title: "Sélectionner l'onglet", description: "Choisir 'Groupé (2)' ou l'onglet contenant les données" },
  { step: 5, title: "Mapper les colonnes", description: "Vérifier que les colonnes sont bien détectées" },
  { step: 6, title: "Valider les données", description: "Corriger les erreurs signalées avant import" },
  { step: 7, title: "Importer", description: "Lancer l'import final vers les tables métiers" },
];

export default function DocumentationImport() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Documentation Import Budget
        </h1>
        <p className="text-muted-foreground mt-1">
          Guide complet pour l'import de la structure budgétaire depuis Excel
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate("/planification/import-export")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Aller à l'Import/Export
        </Button>
      </div>

      <Tabs defaultValue="format" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="format">Format attendu</TabsTrigger>
          <TabsTrigger value="imputation">Règle imputation</TabsTrigger>
          <TabsTrigger value="steps">Étapes</TabsTrigger>
          <TabsTrigger value="errors">Erreurs fréquentes</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        {/* Format attendu */}
        <TabsContent value="format" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Structure du fichier Excel
              </CardTitle>
              <CardDescription>
                Le fichier doit respecter le format Feuil3/Table15 avec les colonnes suivantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-2 text-left">Colonne</th>
                      <th className="border p-2 text-left">Obligatoire</th>
                      <th className="border p-2 text-left">Description</th>
                      <th className="border p-2 text-left">Exemple</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 font-medium">Imputation</td>
                      <td className="border p-2"><Badge variant="destructive">Obligatoire*</Badge></td>
                      <td className="border p-2">Code complet 17-19 chiffres OU colonnes séparées</td>
                      <td className="border p-2 font-mono text-xs">01001120010016717000</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="border p-2">OS</td>
                      <td className="border p-2"><Badge variant="secondary">Optionnel</Badge></td>
                      <td className="border p-2">Objectif Stratégique (2 chiffres)</td>
                      <td className="border p-2 font-mono text-xs">01 ou "01 - Libellé"</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Action</td>
                      <td className="border p-2"><Badge variant="secondary">Optionnel</Badge></td>
                      <td className="border p-2">Action (2 chiffres, souvent 00)</td>
                      <td className="border p-2 font-mono text-xs">00</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="border p-2">Activité</td>
                      <td className="border p-2"><Badge variant="secondary">Optionnel</Badge></td>
                      <td className="border p-2">Code activité (3 chiffres)</td>
                      <td className="border p-2 font-mono text-xs">112</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Sous-activité</td>
                      <td className="border p-2"><Badge variant="secondary">Optionnel</Badge></td>
                      <td className="border p-2">Code sous-activité (3 chiffres)</td>
                      <td className="border p-2 font-mono text-xs">001</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="border p-2">Libellé projet</td>
                      <td className="border p-2"><Badge variant="secondary">Optionnel</Badge></td>
                      <td className="border p-2">Description de la ligne</td>
                      <td className="border p-2">Fournitures de bureau</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Direction</td>
                      <td className="border p-2"><Badge variant="secondary">Optionnel</Badge></td>
                      <td className="border p-2">Code direction (2 chiffres)</td>
                      <td className="border p-2 font-mono text-xs">01 ou "01 - DG"</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="border p-2">Nature dépense</td>
                      <td className="border p-2"><Badge variant="secondary">Optionnel</Badge></td>
                      <td className="border p-2">6=Fonctionnement, 2=Investissement</td>
                      <td className="border p-2 font-mono text-xs">6</td>
                    </tr>
                    <tr>
                      <td className="border p-2">NBE</td>
                      <td className="border p-2"><Badge variant="secondary">Optionnel</Badge></td>
                      <td className="border p-2">Nomenclature (6 chiffres)</td>
                      <td className="border p-2 font-mono text-xs">671700 ou "671700 : Libellé"</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="border p-2 font-medium">Budget initial</td>
                      <td className="border p-2"><Badge variant="destructive">Obligatoire</Badge></td>
                      <td className="border p-2">Montant de la dotation en FCFA</td>
                      <td className="border p-2 font-mono text-xs">15000000</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Direction charge exécution</td>
                      <td className="border p-2"><Badge variant="secondary">Optionnel</Badge></td>
                      <td className="border p-2">Direction responsable</td>
                      <td className="border p-2">Direction Générale</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Colonnes obligatoires</AlertTitle>
                <AlertDescription>
                  Seules <strong>Imputation</strong> (ou les colonnes composantes) et <strong>Budget initial</strong> sont obligatoires. 
                  Si l'imputation complète n'est pas fournie, le système la reconstruit à partir des colonnes OS, Action, Activité, etc.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Onglets de référentiels</CardTitle>
              <CardDescription>
                Le fichier peut contenir des onglets de référentiels qui seront synchronisés automatiquement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["OS", "Direction", "Activité_fonctionnement", "Activité_projet_PIP", "Sous activité", "Nature de dépense", "NBE"].map((sheet) => (
                  <div key={sheet} className="flex items-center gap-2 p-2 border rounded bg-muted/30">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{sheet}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Règle imputation */}
        <TabsContent value="imputation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Structure du code imputation
              </CardTitle>
              <CardDescription>
                L'imputation est un code de 17 à 19 chiffres composé de plusieurs segments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visual representation */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">Exemple: <span className="font-mono font-bold">01 00 112 001 01 6 671700</span></p>
                <div className="flex flex-wrap gap-1">
                  {IMPUTATION_STRUCTURE.map((seg, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className={`px-3 py-2 rounded font-mono text-sm font-bold ${
                        i % 2 === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}>
                        {seg.example}
                      </div>
                      <span className="text-xs mt-1 text-muted-foreground">{seg.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-2 text-left">Position</th>
                      <th className="border p-2 text-left">Longueur</th>
                      <th className="border p-2 text-left">Segment</th>
                      <th className="border p-2 text-left">Description</th>
                      <th className="border p-2 text-left">Exemple</th>
                    </tr>
                  </thead>
                  <tbody>
                    {IMPUTATION_STRUCTURE.map((seg, i) => (
                      <tr key={i} className={i % 2 === 0 ? "" : "bg-muted/30"}>
                        <td className="border p-2 font-mono">{seg.position}</td>
                        <td className="border p-2">{seg.length}</td>
                        <td className="border p-2 font-medium">{seg.name}</td>
                        <td className="border p-2">{seg.description}</td>
                        <td className="border p-2 font-mono">{seg.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Alert>
                <Code className="h-4 w-4" />
                <AlertTitle>Calcul automatique</AlertTitle>
                <AlertDescription>
                  Si la colonne Imputation n'est pas fournie, le système la calcule automatiquement :<br />
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    imputation = OS + Action + Activité + Sous-activité + Direction + Nature + NBE
                  </code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Étapes */}
        <TabsContent value="steps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow d'import</CardTitle>
              <CardDescription>
                Suivez ces étapes pour importer votre structure budgétaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {WORKFLOW_STEPS.map((step, i) => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-medium">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-muted-foreground mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Bonnes pratiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Utilisez toujours le template officiel téléchargeable depuis l'interface</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Activez "Synchroniser les référentiels" pour éviter les erreurs de codes manquants</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Vérifiez les erreurs dans l'aperçu avant de lancer l'import final</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Exportez le rapport d'erreurs si l'import échoue partiellement</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>L'import est idempotent : réimporter le même fichier met à jour les lignes existantes</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Erreurs fréquentes */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-destructive" />
                Erreurs fréquentes et solutions
              </CardTitle>
              <CardDescription>
                Consultez cette liste pour résoudre les erreurs d'import
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {COMMON_ERRORS.map((error) => (
                <div key={error.code} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{error.code}</Badge>
                    <span className="font-medium">{error.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{error.description}</p>
                  <div className="flex items-start gap-2 bg-green-50 dark:bg-green-950 p-2 rounded text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{error.solution}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Règles de sécurité
              </CardTitle>
              <CardDescription>
                L'import est soumis à des contrôles de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Budget validé</AlertTitle>
                <AlertDescription>
                  Lorsque le budget d'un exercice est validé, seuls les profils <strong>Admin</strong> et <strong>DG</strong> 
                  peuvent effectuer des imports. Une justification est requise et l'action est tracée dans le journal d'audit.
                </AlertDescription>
              </Alert>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Rôles autorisés à importer</h4>
                <div className="flex flex-wrap gap-2">
                  {["ADMIN", "DG", "DAF", "SDPM", "BUDGET", "CONTROLEUR"].map((role) => (
                    <Badge key={role} variant="outline">{role}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Rôles autorisés à exporter</h4>
                <div className="flex flex-wrap gap-2">
                  {["ADMIN", "DG", "DAF", "SDPM", "BUDGET", "CONTROLEUR", "TRESORERIE", "COMPTABLE"].map((role) => (
                    <Badge key={role} variant="secondary">{role}</Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Traçabilité</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Chaque import génère un événement <code className="bg-muted px-1 rounded">IMPORT_BUDGET</code> dans le journal d'audit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Les lignes budgétaires importées conservent un lien vers le fichier source (<code className="bg-muted px-1 rounded">import_run_id</code>)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Les imports sur budget validé sont marqués avec justification obligatoire</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interconnexion avec les modules aval</CardTitle>
              <CardDescription>
                Les lignes importées sont automatiquement disponibles dans tous les modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Après l'import, les modules suivants peuvent sélectionner les lignes budgétaires via 
                <code className="bg-muted px-1 mx-1 rounded">computed_imputation</code> + <code className="bg-muted px-1 rounded">exercice</code> :
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["Engagement", "Liquidation", "Ordonnancement", "Règlement"].map((module) => (
                  <div key={module} className="flex items-center gap-2 p-3 border rounded bg-muted/30">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="font-medium">{module}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
