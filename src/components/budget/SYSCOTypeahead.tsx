import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";

interface SYSCOTypeaheadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
}

export function SYSCOTypeahead({ value, onChange, label = "Plan Comptable SYSCO" }: SYSCOTypeaheadProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all SYSCO accounts
  const { data: allAccounts } = useQuery({
    queryKey: ["plan-comptable-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("plan_comptable_sysco")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      return data || [];
    },
  });

  // Get selected account details
  const selectedAccount = allAccounts?.find(a => a.id === value);

  // Filter accounts based on search
  const filteredAccounts = allAccounts?.filter(a => 
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    a.libelle.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20) || [];

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setSearch("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="space-y-2 relative">
      <Label>{label}</Label>
      
      {selectedAccount ? (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
          <Badge variant="secondary" className="font-mono">
            {selectedAccount.code}
          </Badge>
          <span className="text-sm truncate flex-1">{selectedAccount.libelle}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Tapez pour rechercher (ex: 611, Achats...)"
            className="pl-8"
          />
        </div>
      )}

      {isOpen && !selectedAccount && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <ScrollArea className="max-h-60">
            {filteredAccounts.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                {search ? "Aucun résultat" : "Commencez à taper pour rechercher"}
              </div>
            ) : (
              <div className="p-1">
                {filteredAccounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => handleSelect(account.id)}
                    className="w-full flex items-center gap-2 p-2 text-left hover:bg-accent rounded-sm"
                  >
                    <Badge variant="outline" className="font-mono text-xs">
                      {account.code}
                    </Badge>
                    <span className="text-sm truncate">{account.libelle}</span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
