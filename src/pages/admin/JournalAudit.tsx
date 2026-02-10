import { useExercice } from '@/contexts/ExerciceContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogList } from '@/components/audit/AuditLogList';
import { AuditStats } from '@/components/audit/AuditStats';
import { History, BarChart3, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

export default function JournalAudit() {
  const { exercice } = useExercice();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Journal d'Audit"
        description={`Traçabilité des actions dans le système - Exercice ${exercice}`}
        icon={ClipboardList}
        backUrl="/"
      />

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <AuditLogList />
        </TabsContent>

        <TabsContent value="stats">
          <AuditStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
