import { useSupplierExpiredDocuments } from "@/hooks/useSupplierDocuments";
import { Badge } from "@/components/ui/badge";

export function PrestatairesAlertBadge() {
  const { stats, isLoading } = useSupplierExpiredDocuments();

  if (isLoading || (stats.expired === 0 && stats.toRenew === 0)) {
    return null;
  }

  const total = stats.expired + stats.toRenew;

  return (
    <Badge 
      variant="destructive" 
      className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold"
    >
      {total > 99 ? "99+" : total}
    </Badge>
  );
}
