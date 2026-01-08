import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { useExport, EntityType } from "@/hooks/useExport";

interface PrintButtonProps {
  entityType: EntityType;
  entityId: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function PrintButton({
  entityType,
  entityId,
  label = "Imprimer / PDF",
  variant = "outline",
  size = "default",
  className,
}: PrintButtonProps) {
  const { isExporting, printDocument } = useExport();

  const handlePrint = async () => {
    await printDocument(entityType, entityId);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Printer className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}

export default PrintButton;
