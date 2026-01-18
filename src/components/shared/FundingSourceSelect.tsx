/**
 * FundingSourceSelect - Sélecteur de source de financement
 *
 * Utilise la table funding_sources pour afficher uniquement les sources actives.
 * Compatible avec les anciennes valeurs texte (legacy).
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useFundingSources, FundingSourceType } from "@/hooks/useFundingSources";
import { Loader2 } from "lucide-react";

// Mapping des anciennes valeurs vers les codes
const LEGACY_TO_CODE: Record<string, string> = {
  budget_etat: "ETAT",
  ressources_propres: "RP",
  partenaires: "PTF",
  emprunts: "EMPRUNT",
  dons: "DON",
};

// Mapping inverse pour la compatibilité
const CODE_TO_LEGACY: Record<string, string> = {
  ETAT: "budget_etat",
  RP: "ressources_propres",
  PTF: "partenaires",
  EMPRUNT: "emprunts",
  DON: "dons",
};

interface FundingSourceSelectProps {
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showBadge?: boolean;
  /** Si true, retourne le code legacy au lieu du code moderne */
  useLegacyValue?: boolean;
  className?: string;
}

export function FundingSourceSelect({
  value,
  onValueChange,
  placeholder = "Sélectionner une source...",
  disabled = false,
  showBadge = false,
  useLegacyValue = true,
  className,
}: FundingSourceSelectProps) {
  const { activeSources, isLoading, getTypeColor, getTypeLabel } = useFundingSources();

  // Normaliser la valeur reçue (legacy ou code) vers le code moderne
  const normalizedValue = value
    ? LEGACY_TO_CODE[value] || value.toUpperCase()
    : "";

  // Handler pour convertir le code sélectionné vers le format attendu
  const handleChange = (code: string) => {
    if (useLegacyValue && CODE_TO_LEGACY[code]) {
      onValueChange(CODE_TO_LEGACY[code]);
    } else {
      onValueChange(code);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  return (
    <Select
      value={normalizedValue}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {activeSources?.map((source) => (
          <SelectItem key={source.id} value={source.code}>
            <div className="flex items-center gap-2">
              <span>{source.libelle}</span>
              {showBadge && (
                <Badge
                  variant="outline"
                  className={`text-xs ${getTypeColor(source.type as FundingSourceType)}`}
                >
                  {getTypeLabel(source.type as FundingSourceType)}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Composant pour afficher le libellé d'une source de financement
 * Gère les anciennes valeurs texte avec fallback
 */
interface FundingSourceLabelProps {
  value: string | null | undefined;
  showBadge?: boolean;
}

export function FundingSourceLabel({ value, showBadge = false }: FundingSourceLabelProps) {
  const { getSourceLabel, activeSources, getTypeColor, getTypeLabel } = useFundingSources();

  if (!value) return <span className="text-muted-foreground">-</span>;

  const label = getSourceLabel(value);

  // Trouver la source pour afficher le badge si demandé
  const normalizedValue = LEGACY_TO_CODE[value] || value.toUpperCase();
  const source = activeSources?.find((s) => s.code === normalizedValue);

  if (showBadge && source) {
    return (
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <Badge
          variant="outline"
          className={`text-xs ${getTypeColor(source.type as FundingSourceType)}`}
        >
          {getTypeLabel(source.type as FundingSourceType)}
        </Badge>
      </div>
    );
  }

  return <span>{label}</span>;
}

export default FundingSourceSelect;
