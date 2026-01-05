import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useExercice } from "@/contexts/ExerciceContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { exercice, clearExercice } = useExercice();
  const navigate = useNavigate();

  useEffect(() => {
    if (!exercice) {
      navigate("/select-exercice");
    }
  }, [exercice, navigate]);

  const handleChangeExercice = () => {
    clearExercice();
    navigate("/select-exercice");
  };

  if (!exercice) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            
            <div className="flex-1" />

            {/* Exercice Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Exercice {exercice}</span>
            </div>

            {/* Change Exercice Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleChangeExercice}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Changer d'exercice</span>
            </Button>
            
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    3
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-3 border-b">
                  <h4 className="font-semibold">Notifications</h4>
                </div>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <span className="font-medium text-sm">Nouvelle note soumise</span>
                  <span className="text-xs text-muted-foreground">Il y a 5 minutes</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <span className="font-medium text-sm">Engagement validé</span>
                  <span className="text-xs text-muted-foreground">Il y a 1 heure</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <span className="font-medium text-sm">Ordonnancement en attente</span>
                  <span className="text-xs text-muted-foreground">Il y a 2 heures</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Institution badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent">
              <span className="text-sm font-medium text-accent-foreground">ARTI</span>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
