import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSecteursActivite } from "@/hooks/useSecteursActivite";

interface SecteurSelectProps {
  secteurPrincipalId: string | null;
  secteurSecondaireId: string | null;
  onChangePrincipal: (id: string | null) => void;
  onChangeSecondaire: (id: string | null) => void;
  principalRequired?: boolean;
  secondaireRequired?: boolean;
  disabled?: boolean;
  showInactifBadge?: boolean; // Pour afficher badge inactif sur les valeurs historiques
}

export function SecteurSelect({
  secteurPrincipalId,
  secteurSecondaireId,
  onChangePrincipal,
  onChangeSecondaire,
  principalRequired = false,
  secondaireRequired = false,
  disabled = false,
  showInactifBadge = true,
}: SecteurSelectProps) {
  const {
    secteurs,
    secteursPrincipauxActifs,
    getSecondairesByPrincipal,
  } = useSecteursActivite();

  // Quand le principal change, reset le secondaire si invalide
  useEffect(() => {
    if (secteurSecondaireId && secteurPrincipalId) {
      const validSecondaires = getSecondairesByPrincipal(secteurPrincipalId, false);
      const isValid = validSecondaires.some(s => s.id === secteurSecondaireId);
      if (!isValid) {
        onChangeSecondaire(null);
      }
    }
  }, [secteurPrincipalId]);

  // Trouver le secteur actuel (même inactif) pour l'affichage
  const currentPrincipal = secteurs.find(s => s.id === secteurPrincipalId);
  const currentSecondaire = secteurs.find(s => s.id === secteurSecondaireId);

  // Secondaires filtrés par principal
  const availableSecondaires = secteurPrincipalId
    ? getSecondairesByPrincipal(secteurPrincipalId, false)
    : [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Secteur Principal */}
      <div className="space-y-2">
        <Label>
          Secteur Principal
          {principalRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select
          value={secteurPrincipalId || ""}
          onValueChange={(v) => onChangePrincipal(v || null)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un secteur...">
              {currentPrincipal && (
                <span className="flex items-center gap-2">
                  {currentPrincipal.code} - {currentPrincipal.libelle}
                  {showInactifBadge && !currentPrincipal.actif && (
                    <Badge variant="secondary" className="text-xs">Inactif</Badge>
                  )}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {secteursPrincipauxActifs.map((secteur) => (
              <SelectItem key={secteur.id} value={secteur.id}>
                {secteur.code} - {secteur.libelle}
              </SelectItem>
            ))}
            {/* Afficher le secteur actuel s'il est inactif */}
            {currentPrincipal && !currentPrincipal.actif && (
              <SelectItem value={currentPrincipal.id} disabled>
                {currentPrincipal.code} - {currentPrincipal.libelle} (Inactif)
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Secteur Secondaire */}
      <div className="space-y-2">
        <Label>
          Secteur Secondaire
          {secondaireRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select
          value={secteurSecondaireId || ""}
          onValueChange={(v) => onChangeSecondaire(v || null)}
          disabled={disabled || !secteurPrincipalId}
        >
          <SelectTrigger>
            <SelectValue placeholder={secteurPrincipalId ? "Sélectionner..." : "Choisir d'abord un principal"}>
              {currentSecondaire && (
                <span className="flex items-center gap-2">
                  {currentSecondaire.code} - {currentSecondaire.libelle}
                  {showInactifBadge && !currentSecondaire.actif && (
                    <Badge variant="secondary" className="text-xs">Inactif</Badge>
                  )}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableSecondaires.map((secteur) => (
              <SelectItem key={secteur.id} value={secteur.id}>
                {secteur.code} - {secteur.libelle}
              </SelectItem>
            ))}
            {availableSecondaires.length === 0 && secteurPrincipalId && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                Aucun sous-secteur disponible
              </div>
            )}
            {/* Afficher le secteur actuel s'il est inactif */}
            {currentSecondaire && !currentSecondaire.actif && (
              <SelectItem value={currentSecondaire.id} disabled>
                {currentSecondaire.code} - {currentSecondaire.libelle} (Inactif)
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
