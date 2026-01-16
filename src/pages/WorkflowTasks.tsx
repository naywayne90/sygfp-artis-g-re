import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkflowTaskCenter } from "@/components/workflow/WorkflowTaskCenter";
import { ExerciceSubtitle } from "@/components/exercice/ExerciceSubtitle";

export default function WorkflowTasks() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <PageHeader 
          title="Tâches à traiter" 
          description="Centre de travail des tâches en attente de votre action"
        />
        <ExerciceSubtitle title="" />
        <WorkflowTaskCenter />
      </div>
    </AppLayout>
  );
}
