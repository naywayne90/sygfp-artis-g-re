/**
 * TopBar V2 - Barre supérieure unifiée
 * Logo ARTI + Sélecteur exercice + Notifications + Menu utilisateur
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Lock, RefreshCw, Bell, User, Settings, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useExercice } from "@/contexts/ExerciceContext";
import { ExerciceChangeModal } from "@/components/exercice/ExerciceChangeModal";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoArti from "@/assets/logo-arti.jpg";

export function TopBar() {
  const { exercice, exerciceInfo, isReadOnly } = useExercice();
  const { data: badges } = useSidebarBadges();
  const navigate = useNavigate();
  const [showExerciceModal, setShowExerciceModal] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion");
    } else {
      toast.success("Déconnexion réussie");
      navigate("/");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-card px-3 lg:px-6 shadow-sm">
        {/* Trigger sidebar (mobile) */}
        <SidebarTrigger className="text-muted-foreground hover:text-foreground lg:hidden" />

        {/* Logo ARTI (visible sur desktop) */}
        <div className="hidden lg:flex items-center gap-3 mr-4">
          <div className="flex h-9 items-center justify-center rounded-lg bg-white px-2 shadow-sm border">
            <img 
              src={logoArti} 
              alt="ARTI" 
              className="h-6 w-auto object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm tracking-tight">SYGFP</span>
            <span className="text-[9px] text-primary font-medium uppercase tracking-wider">
              Gestion Financière
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Indicateur tâches à traiter */}
        {badges && badges.totalATraiter > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex items-center gap-2 text-warning hover:text-warning"
            onClick={() => navigate("/workflow-tasks")}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
            </span>
            <span className="text-xs font-medium">
              {badges.totalATraiter} à traiter
            </span>
          </Button>
        )}

        {/* Sélecteur d'exercice */}
        <button
          onClick={() => setShowExerciceModal(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            isReadOnly
              ? "bg-warning/10 border border-warning/30 hover:bg-warning/20"
              : "bg-primary/10 border border-primary/30 hover:bg-primary/20"
          }`}
        >
          {isReadOnly ? (
            <Lock className="h-4 w-4 text-warning" />
          ) : (
            <Calendar className="h-4 w-4 text-primary" />
          )}
          <span className={`text-sm font-semibold ${isReadOnly ? "text-warning" : "text-primary"}`}>
            {exercice}
          </span>
          {exerciceInfo?.statut && (
            <Badge
              variant="outline"
              className={`text-[9px] px-1.5 py-0 h-4 ${
                exerciceInfo.statut === "en_cours"
                  ? "border-success/40 text-success bg-success/10"
                  : exerciceInfo.statut === "ouvert"
                  ? "border-primary/40 text-primary bg-primary/10"
                  : exerciceInfo.statut === "cloture"
                  ? "border-warning/40 text-warning bg-warning/10"
                  : "border-muted text-muted-foreground"
              }`}
            >
              {exerciceInfo.statut === "en_cours"
                ? "En cours"
                : exerciceInfo.statut === "ouvert"
                ? "Ouvert"
                : exerciceInfo.statut === "cloture"
                ? "Clôturé"
                : exerciceInfo.statut === "archive"
                ? "Archivé"
                : exerciceInfo.statut}
            </Badge>
          )}
          <RefreshCw className="h-3 w-3 text-muted-foreground ml-1" />
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Menu utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  U
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">Utilisateur</p>
              <p className="text-xs text-muted-foreground">Invité</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/mon-profil")}>
              <User className="mr-2 h-4 w-4" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/parametres")}>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Modal changement d'exercice */}
      <ExerciceChangeModal
        open={showExerciceModal}
        onOpenChange={setShowExerciceModal}
      />
    </>
  );
}
