import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReferentiels } from "@/hooks/useReferentiels";
import { CheckCircle2, XCircle, Database, ArrowRight, Layers } from "lucide-react";

export default function ArchitectureSYGFP() {
  const { modules, loadingModules, socleStatus } = useReferentiels();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Architecture SYGFP</h1>
          <p className="text-muted-foreground">Vue d'ensemble des modules, tables et flux de données</p>
        </div>
      </div>

      {/* Statut du socle */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Statut du Socle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <StatusItem label="Dictionnaire des variables" ok={socleStatus.dictionnaireOK} />
            <StatusItem label="Règles de codification" ok={socleStatus.codificationOK} />
            <StatusItem label="Variables de connexion" ok={socleStatus.variablesConnexionOK} />
          </div>
        </CardContent>
      </Card>

      {/* Modules et tables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Registre des Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingModules ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Module</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tables concernées</TableHead>
                  <TableHead>Variables entrée</TableHead>
                  <TableHead>Variables sortie</TableHead>
                  <TableHead className="w-[100px]">Propriétaire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((mod) => (
                  <TableRow key={mod.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={mod.actif ? "default" : "secondary"}>{mod.module_key}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{mod.module_name}</span>
                    </TableCell>
                    <TableCell className="text-sm">{mod.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(mod.tables_concernees as string[]).map((t: string) => (
                          <Badge key={t} variant="outline" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(mod.variables_entree as string[]).map((v: string) => (
                          <Badge key={v} variant="secondary" className="text-xs">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(mod.variables_sortie as string[]).map((v: string) => (
                          <Badge key={v} className="text-xs bg-green-100 text-green-800">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{mod.owner_role}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Flux de données */}
      <Card>
        <CardHeader>
          <CardTitle>Flux de la Chaîne de Dépense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 flex-wrap py-4">
            {["Note DG", "Expression Besoin", "Marché", "Engagement", "Liquidation", "Ordonnancement", "Règlement"].map(
              (step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <Badge className="px-3 py-2">{step}</Badge>
                  {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive" />
      )}
      <span className={ok ? "text-green-700" : "text-destructive"}>{label}</span>
    </div>
  );
}
