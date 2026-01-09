import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  UserCheck, 
  Shield, 
  FileText, 
  CreditCard, 
  Receipt, 
  FileCheck, 
  Wallet,
  ShoppingCart,
  CheckCircle,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Matrice de validation définissant "Qui valide quoi"
 * Basée sur le document de spécification SYGFP
 */

interface ValidationRule {
  etape: string;
  etapeCode: string;
  icon: React.ElementType;
  createur: string;
  validateurs: {
    role: string;
    type: "R" | "A" | "C" | "I"; // RACI
    description: string;
  }[];
  documents: string[];
  delaiMax?: string;
}

const VALIDATION_RULES: ValidationRule[] = [
  {
    etape: "Note SEF",
    etapeCode: "NOTE_SEF",
    icon: FileText,
    createur: "Agent / Chef de Service",
    validateurs: [
      { role: "Directeur", type: "R", description: "Valide la demande au niveau direction" },
      { role: "DG", type: "A", description: "Approuve définitivement la note" },
    ],
    documents: ["Note de service", "Justificatifs"],
    delaiMax: "5 jours ouvrés",
  },
  {
    etape: "Note AEF",
    etapeCode: "NOTE_AEF",
    icon: FileText,
    createur: "Sous-Directeur / Chef de Service",
    validateurs: [
      { role: "Directeur", type: "R", description: "Valide la demande au niveau direction" },
      { role: "DAF/SDCT", type: "C", description: "Vérifie la conformité budgétaire" },
      { role: "DG", type: "A", description: "Approuve l'autorisation d'engagement" },
    ],
    documents: ["Note AEF", "Estimation budgétaire", "Proformas"],
    delaiMax: "7 jours ouvrés",
  },
  {
    etape: "Imputation Budgétaire",
    etapeCode: "IMPUTATION",
    icon: CreditCard,
    createur: "SDCT / Agent comptable",
    validateurs: [
      { role: "CB", type: "A", description: "Valide l'imputation sur la ligne budgétaire" },
      { role: "DAF", type: "I", description: "Informé de l'imputation" },
    ],
    documents: ["Fiche d'imputation", "Disponible vérifié"],
  },
  {
    etape: "Passation de Marché",
    etapeCode: "MARCHE",
    icon: ShoppingCart,
    createur: "SDPM",
    validateurs: [
      { role: "Commission", type: "C", description: "Examine les offres" },
      { role: "DAF", type: "R", description: "Valide le choix du prestataire" },
      { role: "DG", type: "A", description: "Approuve l'attribution du marché" },
    ],
    documents: ["DAO/DC", "PV d'ouverture", "PV d'évaluation", "Rapport d'analyse"],
    delaiMax: "Variable selon procédure",
  },
  {
    etape: "Engagement",
    etapeCode: "ENGAGEMENT",
    icon: CreditCard,
    createur: "SDCT / Agent SDPM",
    validateurs: [
      { role: "CB", type: "A", description: "Valide l'engagement (visa budgétaire)" },
      { role: "DG", type: "I", description: "Informé de l'engagement" },
    ],
    documents: ["Fiche d'engagement", "Contrat/Bon de commande", "Note AEF validée"],
    delaiMax: "3 jours ouvrés",
  },
  {
    etape: "Liquidation",
    etapeCode: "LIQUIDATION",
    icon: Receipt,
    createur: "Agent SDCT",
    validateurs: [
      { role: "Chef Service", type: "R", description: "Certifie le service fait" },
      { role: "CB", type: "A", description: "Valide la liquidation" },
    ],
    documents: ["Facture", "PV de réception", "Attestation service fait"],
    delaiMax: "5 jours ouvrés après service fait",
  },
  {
    etape: "Ordonnancement",
    etapeCode: "ORDONNANCEMENT",
    icon: FileCheck,
    createur: "Agent SDCT",
    validateurs: [
      { role: "DAF", type: "R", description: "Prépare l'ordre de paiement" },
      { role: "DG", type: "A", description: "Signe l'ordre de paiement" },
    ],
    documents: ["Mandat de paiement", "Bordereau d'envoi"],
    delaiMax: "3 jours ouvrés",
  },
  {
    etape: "Règlement",
    etapeCode: "REGLEMENT",
    icon: Wallet,
    createur: "Agent Comptable / Trésorerie",
    validateurs: [
      { role: "Trésorier", type: "R", description: "Exécute le paiement" },
      { role: "Agent Comptable", type: "A", description: "Valide le règlement" },
    ],
    documents: ["Preuve de paiement", "Ordre de virement"],
    delaiMax: "Selon disponibilité trésorerie",
  },
];

const ROLE_BADGES = {
  R: { label: "Responsable", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  A: { label: "Approbateur", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  C: { label: "Consulté", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  I: { label: "Informé", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
};

export function ValidationMatrix() {
  return (
    <div className="space-y-6">
      {/* Légende */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <TooltipProvider>
              {Object.entries(ROLE_BADGES).map(([key, value]) => (
                <Tooltip key={key}>
                  <TooltipTrigger>
                    <div className="flex items-center gap-2">
                      <Badge className={value.className}>{key}</Badge>
                      <span className="text-sm">{value.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {key === "R" && "Celui qui exécute la tâche"}
                    {key === "A" && "Celui qui approuve et rend compte"}
                    {key === "C" && "Ceux qui sont consultés avant décision"}
                    {key === "I" && "Ceux qui sont informés après décision"}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Matrice détaillée */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Matrice de Validation
          </CardTitle>
          <CardDescription>
            Qui valide quoi à chaque étape de la chaîne de dépense
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Étape</TableHead>
                  <TableHead>Créateur</TableHead>
                  <TableHead>Validateurs</TableHead>
                  <TableHead>Documents requis</TableHead>
                  <TableHead className="text-right">Délai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {VALIDATION_RULES.map((rule) => (
                  <TableRow key={rule.etapeCode}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <rule.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{rule.etape}</p>
                          <p className="text-xs text-muted-foreground">{rule.etapeCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.createur}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rule.validateurs.map((v, i) => (
                          <TooltipProvider key={i}>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1">
                                  <Badge className={ROLE_BADGES[v.type].className}>
                                    {v.type}
                                  </Badge>
                                  <span className="text-sm">{v.role}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{v.description}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rule.documents.map((doc, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {rule.delaiMax || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Résumé par rôle */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              DG
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Approuve Notes SEF/AEF
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Signe Ordres de paiement
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Approuve Attribution marchés
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              CB (Contrôleur Budgétaire)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Valide Imputations
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Valide Engagements
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Valide Liquidations
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              DAF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Vérifie conformité budgétaire
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Valide choix prestataires
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Prépare ordres de paiement
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              Trésorerie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Exécute paiements
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Gère trésorerie
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Valide règlements
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
