import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { History, Search, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useHistoriqueLibelles } from '@/hooks/useHistoriqueLibelles';

export default function HistoriqueLibelles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: historique, isLoading } = useHistoriqueLibelles({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const filteredData = historique?.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.budget_line?.label?.toLowerCase().includes(search) ||
      item.budget_line?.code?.toLowerCase().includes(search) ||
      item.ancienne_valeur?.toLowerCase().includes(search) ||
      item.nouvelle_valeur?.toLowerCase().includes(search) ||
      item.modifie_par?.toLowerCase().includes(search) ||
      item.motif?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <History className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Historique des Modifications de Libelles
          </h1>
          <p className="text-muted-foreground">
            Tracabilite de toutes les modifications de libelles budgetaires
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par libelle, code, auteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[160px]"
                placeholder="Du"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[160px]"
                placeholder="Au"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Modifications</CardTitle>
          <CardDescription>{filteredData?.length ?? 0} modification(s) trouvee(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !filteredData || filteredData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Aucune modification trouvee</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Date</TableHead>
                    <TableHead className="min-w-[180px]">Ligne Budgetaire</TableHead>
                    <TableHead className="min-w-[100px]">Champ</TableHead>
                    <TableHead className="min-w-[200px]">Ancienne Valeur</TableHead>
                    <TableHead className="min-w-[200px]">Nouvelle Valeur</TableHead>
                    <TableHead className="min-w-[140px]">Modifie par</TableHead>
                    <TableHead className="min-w-[180px]">Motif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        {item.created_at
                          ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          {item.budget_line?.code && (
                            <Badge variant="outline" className="text-xs mb-1">
                              {item.budget_line.code}
                            </Badge>
                          )}
                          <p className="text-sm truncate max-w-[200px]">
                            {item.budget_line?.label ?? '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.champ_modifie ?? '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-red-600 line-through truncate max-w-[200px]">
                          {item.ancienne_valeur ?? '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ArrowRight className="h-3 w-3 text-green-600 shrink-0" />
                          <p className="text-sm text-green-700 truncate max-w-[200px]">
                            {item.nouvelle_valeur ?? '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.modifie_par?.slice(0, 8) ?? 'Inconnu'}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {item.motif ?? '-'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
