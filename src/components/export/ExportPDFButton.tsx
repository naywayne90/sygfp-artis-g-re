/**
 * Bouton d'export PDF pour les documents SYGFP
 * Supporte les Notes SEF et autres types de documents
 */

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { downloadNotePDF, type GenerateNotePDFOptions } from '@/lib/pdf/generateNotePDF';
import type { NoteSEFEntity, NoteSEFHistoryEntry } from '@/lib/notes-sef/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ExportPDFButtonProps {
  /** La note SEF à exporter */
  note: NoteSEFEntity;
  /** Historique des validations (optionnel) */
  validations?: NoteSEFHistoryEntry[];
  /** Variante du bouton */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  /** Taille du bouton */
  size?: 'sm' | 'default' | 'lg' | 'icon';
  /** Désactiver le bouton */
  disabled?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
  /** Texte du bouton (défaut: "Exporter PDF") */
  label?: string;
  /** Afficher uniquement l'icône */
  iconOnly?: boolean;
  /** Callback après téléchargement réussi */
  onSuccess?: () => void;
  /** Callback en cas d'erreur */
  onError?: (error: Error) => void;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ExportPDFButton({
  note,
  validations = [],
  variant = 'outline',
  size = 'default',
  disabled = false,
  className = '',
  label = 'Exporter PDF',
  iconOnly = false,
  onSuccess,
  onError,
}: ExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleExport = async (includeQRCode: boolean = true) => {
    if (isGenerating || disabled) return;

    setIsGenerating(true);

    try {
      const options: GenerateNotePDFOptions = {
        note,
        validations,
        includeQRCode,
      };

      await downloadNotePDF(options);

      toast({
        title: 'PDF généré avec succès',
        description: `Le document a été téléchargé.`,
      });

      onSuccess?.();
    } catch (error) {
      console.error('[ExportPDFButton] Erreur de génération:', error);

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      toast({
        title: 'Erreur de génération',
        description: `Impossible de générer le PDF: ${errorMessage}`,
        variant: 'destructive',
      });

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsGenerating(false);
    }
  };

  // Version simple (bouton unique)
  if (iconOnly) {
    return (
      <Button
        variant={variant}
        size="icon"
        disabled={disabled || isGenerating}
        className={className}
        onClick={() => handleExport(true)}
        title={label}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
    );
  }

  // Version avec menu déroulant (options)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isGenerating}
          className={className}
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport(true)}>
          <FileText className="mr-2 h-4 w-4" />
          PDF avec QR Code
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(false)}>
          <FileText className="mr-2 h-4 w-4" />
          PDF sans QR Code
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// BOUTON SIMPLE (sans menu)
// ============================================================================

export interface SimpleExportPDFButtonProps extends Omit<ExportPDFButtonProps, 'iconOnly'> {
  /** Inclure le QR code (défaut: true) */
  includeQRCode?: boolean;
}

export function SimpleExportPDFButton({
  note,
  validations = [],
  variant = 'outline',
  size = 'default',
  disabled = false,
  className = '',
  label = 'Exporter PDF',
  includeQRCode = true,
  onSuccess,
  onError,
}: SimpleExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (isGenerating || disabled) return;

    setIsGenerating(true);

    try {
      await downloadNotePDF({
        note,
        validations,
        includeQRCode,
      });

      toast({
        title: 'PDF généré avec succès',
        description: 'Le document a été téléchargé.',
      });

      onSuccess?.();
    } catch (error) {
      console.error('[SimpleExportPDFButton] Erreur:', error);

      toast({
        title: 'Erreur de génération',
        description: 'Impossible de générer le PDF.',
        variant: 'destructive',
      });

      onError?.(error instanceof Error ? error : new Error('Erreur inconnue'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || isGenerating}
      className={className}
      onClick={handleExport}
    >
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}

// Export par défaut
export default ExportPDFButton;
