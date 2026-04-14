/**
 * Composant de pagination partagé pour SEF/AEF
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface NotesPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function NotesPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100],
}: NotesPaginationProps) {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  const hasMultiplePages = totalPages > 1;

  return (
    <Card className="mt-4">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Info et taille de page */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium">
              {startItem}-{endItem} sur {total}
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Afficher</span>
              <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="hidden sm:inline">par page</span>
            </div>
          </div>

          {/* Navigation — toujours affichée si plusieurs pages */}
          {hasMultiplePages && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </span>
              <div className="flex gap-1">
                {/* Première page */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => onPageChange(1)}
                  title="Première page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Page précédente */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  title="Page précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Pages numérotées */}
                <div className="hidden sm:flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                {/* Page suivante */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                  title="Page suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Dernière page */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(totalPages)}
                  title="Dernière page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
