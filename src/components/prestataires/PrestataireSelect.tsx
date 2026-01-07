import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, AlertCircle, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { usePrestataires, Prestataire } from "@/hooks/usePrestataires";
import { useSupplierBankAccounts } from "@/hooks/useSupplierDocuments";

interface PrestataireSelectProps {
  value?: string;
  onChange: (prestataire: Prestataire | null, bankInfo?: { banque: string; compte: string; titulaire: string }) => void;
  placeholder?: string;
  disabled?: boolean;
  showOnlyQualified?: boolean;
}

export function PrestataireSelect({
  value,
  onChange,
  placeholder = "Sélectionner un prestataire",
  disabled = false,
  showOnlyQualified = true,
}: PrestataireSelectProps) {
  const [open, setOpen] = useState(false);
  const { prestataires, prestatairesActifs, isLoading } = usePrestataires();

  // Filter to show only qualified/active suppliers if required
  const availablePrestataires = useMemo(() => {
    if (showOnlyQualified) {
      return prestatairesActifs;
    }
    return prestataires;
  }, [prestataires, prestatairesActifs, showOnlyQualified]);

  const selectedPrestataire = prestataires.find((p) => p.id === value);

  // Get bank accounts for selected supplier to auto-fill
  const { primaryAccount } = useSupplierBankAccounts(value);

  const handleSelect = (prestataire: Prestataire) => {
    if (prestataire.statut !== "ACTIF" && showOnlyQualified) {
      return; // Don't allow selecting non-qualified suppliers
    }

    // Get the primary bank account info
    const bankInfo = primaryAccount
      ? {
          banque: primaryAccount.banque,
          compte: primaryAccount.numero_compte,
          titulaire: primaryAccount.titulaire || prestataire.raison_sociale,
        }
      : undefined;

    onChange(prestataire, bankInfo);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedPrestataire && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {selectedPrestataire ? (
            <div className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{selectedPrestataire.raison_sociale}</span>
              {selectedPrestataire.statut === "ACTIF" ? (
                <Badge className="bg-green-600 text-[10px] py-0">Qualifié</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] py-0">{selectedPrestataire.statut}</Badge>
              )}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un prestataire..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Chargement..." : "Aucun prestataire trouvé."}
            </CommandEmpty>
            <CommandGroup>
              {availablePrestataires.map((prestataire) => {
                const isDisabled = showOnlyQualified && prestataire.statut !== "ACTIF";
                return (
                  <CommandItem
                    key={prestataire.id}
                    value={`${prestataire.raison_sociale} ${prestataire.code} ${prestataire.ninea || ""}`}
                    onSelect={() => handleSelect(prestataire)}
                    disabled={isDisabled}
                    className={cn(isDisabled && "opacity-50 cursor-not-allowed")}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === prestataire.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{prestataire.raison_sociale}</span>
                        {prestataire.statut === "ACTIF" ? (
                          <Badge className="bg-green-600 text-[10px] py-0 shrink-0">Qualifié</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 shrink-0">{prestataire.statut}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-3">
                        <span className="font-mono">{prestataire.code}</span>
                        {prestataire.ninea && <span>NINEA: {prestataire.ninea}</span>}
                      </div>
                    </div>
                    {isDisabled && (
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {selectedPrestataire && (
          <div className="border-t p-2">
            <Button variant="ghost" size="sm" onClick={handleClear} className="w-full text-muted-foreground">
              Effacer la sélection
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
