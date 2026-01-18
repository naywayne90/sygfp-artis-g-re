/**
 * Page affichée quand aucun exercice budgétaire n'est ouvert
 * Invite l'utilisateur à contacter l'administrateur
 * Les admins peuvent créer un nouvel exercice depuis cette page
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Loader2,
  Plus,
  AlertTriangle,
  Mail,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import logoArti from "@/assets/logo-arti.jpg";
import { toast } from "sonner";

export default function NoOpenExercise() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setExercice, refreshExercice } = useExercice();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  // Vérifier si l'utilisateur est admin
  const { data: isAdmin, isLoading: isLoadingAdmin } = useQuery({
    queryKey: ["is-admin-no-exercice"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Vérifier dans user_roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (roles?.some(r => r.role === "ADMIN" || r.role === "admin")) {
        return true;
      }

      // Vérifier dans profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("profil_fonctionnel")
        .eq("id", user.id)
        .single();

      return profile?.profil_fonctionnel === "Admin";
    },
  });

  // Vérifier s'il y a des exercices clôturés (pour les afficher en lecture seule)
  const { data: closedExercices, isLoading: isLoadingExercices, refetch } = useQuery({
    queryKey: ["closed-exercices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercices_budgetaires")
        .select("*")
        .in("statut", ["cloture", "archive"])
        .order("annee", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  // Mutation pour créer un nouvel exercice
  const createMutation = useMutation({
    mutationFn: async (annee: number) => {
      const { data, error } = await supabase
        .from("exercices_budgetaires")
        .insert({
          annee,
          code_exercice: `EX${annee}`,
          libelle: `Exercice budgétaire ${annee}`,
          statut: "ouvert",
          est_actif: true,
          date_ouverture: `${annee}-01-01`,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["closed-exercices"] });
      setShowCreateDialog(false);
      toast.success(`Exercice ${data.annee} créé avec succès`);
      setExercice(data.annee, false);
      navigate("/");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleCreateExercice = () => {
    createMutation.mutate(newYear);
  };

  const handleSelectClosedExercice = (annee: number) => {
    setExercice(annee, true);
    navigate("/");
  };

  const handleRefresh = async () => {
    await refetch();
    await refreshExercice();
    toast.info("Vérification en cours...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo centré */}
        <div className="flex justify-center mb-6">
          <img
            src={logoArti}
            alt="ARTI"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Carte principale */}
        <Card className="shadow-xl border-slate-200/50">
          <CardHeader className="bg-warning/10 border-b border-warning/20 rounded-t-lg text-center">
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded-full bg-warning/20">
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </div>
            <CardTitle className="text-lg font-bold text-warning">
              Aucun exercice budgétaire ouvert
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Tous les exercices sont clôturés ou aucun exercice n'a été créé
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Message pour utilisateur standard */}
            {!isAdmin && !isLoadingAdmin && (
              <Alert className="border-primary/20 bg-primary/5">
                <Mail className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  Veuillez contacter votre administrateur pour qu'il ouvre un nouvel exercice budgétaire
                  ou réouvre un exercice existant.
                </AlertDescription>
              </Alert>
            )}

            {/* Options admin */}
            {isAdmin && (
              <div className="space-y-3">
                <Alert className="border-success/20 bg-success/5">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <AlertDescription className="text-sm">
                    En tant qu'administrateur, vous pouvez créer un nouvel exercice
                    ou accéder aux exercices clôturés en lecture seule.
                  </AlertDescription>
                </Alert>

                <Button
                  className="w-full"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un nouvel exercice
                </Button>
              </div>
            )}

            {/* Exercices clôturés disponibles */}
            {closedExercices && closedExercices.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Exercices clôturés (lecture seule) :
                </p>
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {closedExercices.map((ex) => (
                    <Button
                      key={ex.id}
                      variant="outline"
                      className="w-full justify-between text-sm"
                      onClick={() => handleSelectClosedExercice(ex.annee)}
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Exercice {ex.annee}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {ex.statut === "cloture" ? "Clôturé" : "Archivé"}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton rafraîchir */}
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleRefresh}
              disabled={isLoadingExercices}
            >
              {isLoadingExercices ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Vérifier à nouveau
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-5">
          © 2025 ARTI - Système de Gestion Financière Publique
        </p>
      </div>

      {/* Dialog création exercice (Admin) */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Créer un nouvel exercice
            </DialogTitle>
            <DialogDescription>
              Créez un exercice budgétaire pour permettre aux utilisateurs de travailler.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="annee">Année de l'exercice</Label>
              <Input
                id="annee"
                type="number"
                min={2020}
                max={2100}
                value={newYear}
                onChange={(e) => setNewYear(parseInt(e.target.value))}
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p>L'exercice sera créé avec les paramètres suivants :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                <li>Code : EX{newYear}</li>
                <li>Statut : Ouvert</li>
                <li>Date d'ouverture : 1er janvier {newYear}</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateExercice} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer l'exercice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
