import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProfileOption {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
}

function getDisplayName(profile: ProfileOption): string {
  if (profile.full_name) return profile.full_name;
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '(sans nom)';
}

interface ProfileMultiSelectProps {
  profiles: ProfileOption[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export function ProfileMultiSelect({
  profiles,
  selectedIds,
  onSelectionChange,
  placeholder = 'Selectionner...',
  emptyMessage = 'Aucun profil trouve.',
}: ProfileMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedProfiles = profiles.filter((p) => selectedIds.includes(p.id));

  const toggleProfile = (profileId: string) => {
    if (selectedIds.includes(profileId)) {
      onSelectionChange(selectedIds.filter((id) => id !== profileId));
    } else {
      onSelectionChange([...selectedIds, profileId]);
    }
  };

  const removeProfile = (profileId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== profileId));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 font-normal"
        >
          {selectedProfiles.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedProfiles.map((profile) => (
                <Badge key={profile.id} variant="secondary" className="gap-1 text-xs">
                  {getDisplayName(profile)}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProfile(profile.id);
                    }}
                  />
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un profil..." />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {profiles.map((profile) => {
                const isSelected = selectedIds.includes(profile.id);
                return (
                  <CommandItem
                    key={profile.id}
                    value={getDisplayName(profile)}
                    onSelect={() => toggleProfile(profile.id)}
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')}
                    />
                    {getDisplayName(profile)}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
