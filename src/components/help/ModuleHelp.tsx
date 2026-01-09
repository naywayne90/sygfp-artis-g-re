import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HelpCircle,
  ChevronDown,
  BookOpen,
  MessageCircleQuestion,
  Workflow,
  CheckCircle,
} from "lucide-react";

interface StepInfo {
  numero: number;
  titre: string;
  description: string;
  acteur?: string;
}

interface FAQItem {
  question: string;
  reponse: string;
}

interface ModuleHelpProps {
  module: string;
  titre: string;
  description: string;
  etapes?: StepInfo[];
  faq?: FAQItem[];
  validateurs?: { role: string; action: string }[];
  className?: string;
  defaultOpen?: boolean;
}

export function ModuleHelp({
  module,
  titre,
  description,
  etapes = [],
  faq = [],
  validateurs = [],
  className,
  defaultOpen = false,
}: ModuleHelpProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <Card className="border-dashed">
        <CardHeader className="py-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">Aide : {titre}</span>
                <Badge variant="outline" className="text-xs">
                  {module}
                </Badge>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">{description}</p>

            <Tabs defaultValue="procedure" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="procedure" className="text-xs">
                  <Workflow className="h-3 w-3 mr-1" />
                  Procédure
                </TabsTrigger>
                <TabsTrigger value="faq" className="text-xs">
                  <MessageCircleQuestion className="h-3 w-3 mr-1" />
                  FAQ
                </TabsTrigger>
                <TabsTrigger value="validateurs" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Qui valide ?
                </TabsTrigger>
              </TabsList>

              <TabsContent value="procedure" className="mt-4">
                {etapes.length > 0 ? (
                  <div className="space-y-3">
                    {etapes.map((etape, index) => (
                      <div
                        key={index}
                        className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {etape.numero}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{etape.titre}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {etape.description}
                          </p>
                          {etape.acteur && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              Acteur : {etape.acteur}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Procédure non documentée pour ce module
                  </p>
                )}
              </TabsContent>

              <TabsContent value="faq" className="mt-4">
                {faq.length > 0 ? (
                  <div className="space-y-3">
                    {faq.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <h4 className="font-medium text-sm flex items-start gap-2">
                          <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          {item.question}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-2 ml-6">
                          {item.reponse}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune FAQ disponible
                  </p>
                )}
              </TabsContent>

              <TabsContent value="validateurs" className="mt-4">
                {validateurs.length > 0 ? (
                  <div className="grid gap-2">
                    {validateurs.map((v, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <Badge variant="outline">{v.role}</Badge>
                        <span className="text-sm">{v.action}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun validateur défini
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Configurations prédéfinies pour chaque module
export const MODULE_HELP_CONFIG: Record<
  string,
  Omit<ModuleHelpProps, "className" | "defaultOpen">
> = {
  notes_sef: {
    module: "NOTES SEF",
    titre: "Notes Sans Effet Financier",
    description:
      "Les Notes SEF sont le point d'entrée de la chaîne de dépense. Elles permettent d'exprimer un besoin qui n'a pas encore d'impact budgétaire direct.",
    etapes: [
      { numero: 1, titre: "Création de la note", description: "Saisir l'objet, la direction demandeuse et les informations du bénéficiaire", acteur: "Agent" },
      { numero: 2, titre: "Soumission", description: "Soumettre la note pour validation hiérarchique", acteur: "Agent" },
      { numero: 3, titre: "Validation DG", description: "Le DG valide ou rejette la note", acteur: "DG" },
      { numero: 4, titre: "Passage en Note AEF", description: "Une fois validée, la note peut donner lieu à une Note AEF", acteur: "Service financier" },
    ],
    faq: [
      { question: "Quelle est la différence entre Note SEF et Note AEF ?", reponse: "La Note SEF exprime un besoin sans impact financier immédiat, tandis que la Note AEF inclut une estimation financière et nécessite une imputation budgétaire." },
      { question: "Puis-je modifier une note soumise ?", reponse: "Non, une fois soumise, la note ne peut plus être modifiée. Elle peut être rejetée pour correction." },
    ],
    validateurs: [
      { role: "DG", action: "Validation finale de la Note SEF" },
    ],
  },
  notes_aef: {
    module: "NOTES AEF",
    titre: "Notes Avec Effet Financier",
    description:
      "Les Notes AEF sont des demandes de dépense avec estimation financière. Elles nécessitent une imputation sur une ligne budgétaire avant de pouvoir progresser dans la chaîne.",
    etapes: [
      { numero: 1, titre: "Création de la note", description: "Saisir l'objet, le montant estimé, la direction et la justification", acteur: "Agent" },
      { numero: 2, titre: "Soumission", description: "Soumettre la note pour validation", acteur: "Agent" },
      { numero: 3, titre: "Validation", description: "Le responsable valide la note", acteur: "Directeur / DG" },
      { numero: 4, titre: "Imputation budgétaire", description: "Le CB impute la note sur une ligne budgétaire", acteur: "CB (Contrôleur Budgétaire)" },
    ],
    faq: [
      { question: "Que se passe-t-il si le budget est insuffisant ?", reponse: "L'imputation sera bloquée si le disponible est inférieur au montant demandé. Un virement de crédits peut être nécessaire." },
      { question: "Puis-je imputer sur plusieurs lignes ?", reponse: "Non, une note AEF est imputée sur une seule ligne budgétaire. Créez plusieurs notes si nécessaire." },
    ],
    validateurs: [
      { role: "Directeur", action: "Validation hiérarchique" },
      { role: "DG", action: "Validation finale" },
      { role: "CB", action: "Imputation budgétaire" },
    ],
  },
  imputation: {
    module: "IMPUTATION",
    titre: "Imputation Budgétaire",
    description:
      "L'imputation budgétaire consiste à rattacher une dépense autorisée à une ligne budgétaire spécifique, réservant ainsi les crédits nécessaires.",
    etapes: [
      { numero: 1, titre: "Sélection de la note", description: "Choisir une note AEF validée à imputer", acteur: "CB" },
      { numero: 2, titre: "Choix du rattachement", description: "Sélectionner OS, Mission, Action, Activité, NBE, SYSCO", acteur: "CB" },
      { numero: 3, titre: "Vérification du disponible", description: "Le système vérifie la disponibilité budgétaire", acteur: "Système" },
      { numero: 4, titre: "Création du dossier", description: "Un dossier est créé automatiquement avec un code unique", acteur: "Système" },
    ],
    faq: [
      { question: "Comment forcer une imputation avec dépassement ?", reponse: "Il faut fournir une justification de dépassement et cocher l'option 'Forcer l'imputation'. Cela sera tracé dans l'historique." },
    ],
    validateurs: [
      { role: "CB", action: "Réalise l'imputation" },
    ],
  },
  engagements: {
    module: "ENGAGEMENTS",
    titre: "Engagements Budgétaires",
    description:
      "L'engagement est l'acte par lequel l'ordonnateur crée ou constate une obligation qui entraînera une charge. C'est la première étape de consommation effective des crédits.",
    etapes: [
      { numero: 1, titre: "Création de l'engagement", description: "À partir d'une imputation ou d'un marché validé", acteur: "DAAF" },
      { numero: 2, titre: "Saisie des informations", description: "Montant définitif, fournisseur, pièces justificatives", acteur: "DAAF" },
      { numero: 3, titre: "Soumission", description: "Soumettre pour validation CB", acteur: "DAAF" },
      { numero: 4, titre: "Validation CB", description: "Le CB valide et réserve les crédits", acteur: "CB" },
    ],
    faq: [
      { question: "Le montant de l'engagement peut-il différer de l'estimation ?", reponse: "Oui, le montant définitif après marché peut différer. Le système vérifie toujours le disponible." },
    ],
    validateurs: [
      { role: "CB", action: "Validation de l'engagement et réservation des crédits" },
    ],
  },
  liquidations: {
    module: "LIQUIDATIONS",
    titre: "Liquidations",
    description:
      "La liquidation consiste à vérifier la réalité de la dette et à arrêter le montant exact de la dépense. Elle intervient après constatation du service fait.",
    etapes: [
      { numero: 1, titre: "Constat du service fait", description: "Vérifier et certifier que la prestation a été réalisée", acteur: "Service demandeur" },
      { numero: 2, titre: "Réception de la facture", description: "Enregistrer la facture définitive", acteur: "DAAF" },
      { numero: 3, titre: "Calcul des retenues", description: "Appliquer les retenues fiscales (TVA, AIRSI, etc.)", acteur: "DAAF" },
      { numero: 4, titre: "Validation", description: "Valider la liquidation", acteur: "DAAF" },
    ],
    faq: [
      { question: "Quelles retenues s'appliquent ?", reponse: "TVA (18%), AIRSI (5%), Retenue à la source selon le régime fiscal du fournisseur." },
    ],
    validateurs: [
      { role: "DAAF", action: "Validation de la liquidation" },
    ],
  },
  ordonnancements: {
    module: "ORDONNANCEMENTS",
    titre: "Ordonnancements",
    description:
      "L'ordonnancement est l'ordre donné par l'ordonnateur au comptable de payer une dépense. C'est l'étape qui précède le règlement effectif.",
    etapes: [
      { numero: 1, titre: "Génération de l'ordre de payer", description: "À partir d'une liquidation validée", acteur: "DAAF" },
      { numero: 2, titre: "Vérification des pièces", description: "S'assurer que toutes les pièces sont jointes", acteur: "DAAF" },
      { numero: 3, titre: "Signature DG", description: "Le DG signe l'ordre de payer", acteur: "DG" },
      { numero: 4, titre: "Transmission au comptable", description: "L'ordre signé est transmis pour paiement", acteur: "DAAF" },
    ],
    faq: [
      { question: "L'ordonnancement peut-il être refusé par le comptable ?", reponse: "Oui, en cas de non-conformité des pièces ou d'insuffisance de trésorerie." },
    ],
    validateurs: [
      { role: "DG", action: "Signature de l'ordre de payer" },
    ],
  },
  reglements: {
    module: "RÈGLEMENTS",
    titre: "Règlements",
    description:
      "Le règlement est l'exécution effective du paiement par le comptable. C'est l'étape finale de la chaîne de dépense.",
    etapes: [
      { numero: 1, titre: "Réception de l'ordonnancement", description: "Vérifier l'ordre de payer signé", acteur: "Trésorerie" },
      { numero: 2, titre: "Préparation du paiement", description: "Choisir le mode de règlement (virement, chèque)", acteur: "Trésorerie" },
      { numero: 3, titre: "Exécution du paiement", description: "Effectuer le virement ou émettre le chèque", acteur: "Trésorerie" },
      { numero: 4, titre: "Enregistrement", description: "Enregistrer le paiement et clôturer le dossier", acteur: "Trésorerie" },
    ],
    faq: [
      { question: "Quels modes de paiement sont disponibles ?", reponse: "Virement bancaire (recommandé), chèque, ou paiement en espèces pour les petits montants." },
    ],
    validateurs: [
      { role: "Agent Comptable", action: "Exécution du paiement" },
    ],
  },
  virements: {
    module: "VIREMENTS",
    titre: "Virements de Crédits",
    description:
      "Les virements permettent de transférer des crédits d'une ligne budgétaire à une autre pour répondre aux besoins d'exécution.",
    etapes: [
      { numero: 1, titre: "Demande de virement", description: "Sélectionner ligne source, destination et montant", acteur: "DAAF" },
      { numero: 2, titre: "Justification", description: "Fournir le motif du virement", acteur: "DAAF" },
      { numero: 3, titre: "Validation", description: "Le CB valide le virement", acteur: "CB" },
      { numero: 4, titre: "Exécution", description: "Le virement est exécuté et les dotations mises à jour", acteur: "CB" },
    ],
    faq: [
      { question: "Y a-t-il des restrictions sur les virements ?", reponse: "Oui, le disponible de la ligne source doit être suffisant. Certains virements peuvent nécessiter une justification renforcée." },
    ],
    validateurs: [
      { role: "CB", action: "Validation et exécution du virement" },
    ],
  },
  marches: {
    module: "MARCHÉS",
    titre: "Passation de Marchés",
    description:
      "Le module Marchés gère le processus de passation des marchés publics, depuis la consultation jusqu'à l'attribution au prestataire retenu.",
    etapes: [
      { numero: 1, titre: "Création du marché", description: "Définir l'objet, le type et le montant estimé", acteur: "DAAF" },
      { numero: 2, titre: "Consultation", description: "Lancer la demande de cotations auprès des fournisseurs", acteur: "DAAF" },
      { numero: 3, titre: "Réception des offres", description: "Enregistrer et analyser les offres reçues", acteur: "Commission" },
      { numero: 4, titre: "Attribution", description: "Sélectionner le prestataire et valider l'attribution", acteur: "Commission / DG" },
    ],
    faq: [
      { question: "Combien d'offres minimum faut-il ?", reponse: "Généralement 3 offres minimum pour assurer la concurrence, sauf cas de gré à gré justifié." },
    ],
    validateurs: [
      { role: "Commission des marchés", action: "Analyse et attribution" },
      { role: "DG", action: "Approbation finale" },
    ],
  },
};
