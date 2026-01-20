/**
 * Page de validation DG via QR code (PROMPT 29)
 *
 * Accessible via /dg/valider/:token
 * Requiert une authentification DG pour valider.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useValidationDGByToken,
  useValidateDG,
  VALIDATION_STATUS_LABELS,
  VALIDATION_STATUS_COLORS,
  ValidationDGStatus,
} from "@/hooks/useValidationDG";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  FileText,
  Building2,
  User,
  CreditCard,
  Loader2,
  ShieldAlert,
  LogIn,
  ArrowLeft,
  CheckCheck,
  Ban,
  Pause,
  FileEdit,
  ThumbsUp,
  Lightbulb,
} from "lucide-react";

export default function ValiderNoteDG() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { hasAnyRole } = usePermissions();

  const { data: validation, isLoading, error } = useValidationDGByToken(token);
  const validateMutation = useValidateDG();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: ValidationDGStatus | null;
    title: string;
    description: string;
  }>({
    open: false,
    action: null,
    title: "",
    description: "",
  });

  // Vérifier l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Vérifier si l'utilisateur est DG ou Admin
  const isDGOrAdmin = hasAnyRole(["DG", "ADMIN", "Admin"]);

  // Ouvrir le dialog de confirmation
  const openConfirmDialog = (action: ValidationDGStatus) => {
    const configs: Record<ValidationDGStatus, { title: string; description: string }> = {
      APPROVED: {
        title: "Confirmer la validation",
        description: "Voulez-vous valider cette note ? Cette action est irréversible.",
      },
      REJECTED: {
        title: "Confirmer le rejet",
        description: "Voulez-vous rejeter cette note ? Un motif est obligatoire.",
      },
      DEFERRED: {
        title: "Confirmer le report",
        description: "Voulez-vous différer cette note ? Un motif est obligatoire.",
      },
      PENDING: {
        title: "",
        description: "",
      },
    };

    setConfirmDialog({
      open: true,
      action,
      ...configs[action],
    });
  };

  // Exécuter la validation
  const handleConfirm = async () => {
    if (!token || !confirmDialog.action) return;

    // Vérifier que le commentaire est fourni pour rejet/report
    if ((confirmDialog.action === "REJECTED" || confirmDialog.action === "DEFERRED") && !commentaire.trim()) {
      return;
    }

    await validateMutation.mutateAsync({
      token,
      status: confirmDialog.action,
      commentaire: commentaire.trim() || undefined,
    });

    setConfirmDialog({ open: false, action: null, title: "", description: "" });
  };

  // État de chargement de l'authentification
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Vérification de l'authentification...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Non authentifié
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <ShieldAlert className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle>Authentification requise</CardTitle>
            <CardDescription>
              Vous devez vous connecter en tant que Directeur Général pour valider cette note.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate(`/auth?redirect=/dg/valider/${token}`)}>
              <LogIn className="h-4 w-4 mr-2" />
              Se connecter
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Authentifié mais pas DG
  if (!isDGOrAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Ban className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-destructive">Accès non autorisé</CardTitle>
            <CardDescription>
              Seul le Directeur Général ou un administrateur peut valider les notes via ce lien.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Chargement des données
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erreur ou token invalide
  if (error || !validation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-destructive">Lien invalide</CardTitle>
            <CardDescription>
              Ce lien de validation est invalide ou a expiré. Veuillez demander un nouveau QR code.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const note = validation.note_sef;
  const isAlreadyProcessed = validation.status !== "PENDING";

  // Icône selon le statut
  const StatusIcon = {
    PENDING: Clock,
    APPROVED: CheckCircle2,
    REJECTED: XCircle,
    DEFERRED: AlertTriangle,
  }[validation.status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Observations du Directeur Général
          </h1>
          <p className="text-muted-foreground">
            Validation de note SEF via QR code
          </p>
        </div>

        {/* Statut actuel */}
        <Card className={isAlreadyProcessed ? "border-2" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <StatusIcon className="h-5 w-5" />
                Statut de validation
              </CardTitle>
              <Badge className={VALIDATION_STATUS_COLORS[validation.status]}>
                {VALIDATION_STATUS_LABELS[validation.status]}
              </Badge>
            </div>
          </CardHeader>
          {isAlreadyProcessed && (
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                {validation.validated_at && (
                  <p className="text-sm">
                    <span className="font-medium">Date :</span>{" "}
                    {format(new Date(validation.validated_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                  </p>
                )}
                {validation.validated_by && (
                  <p className="text-sm">
                    <span className="font-medium">Par :</span>{" "}
                    {validation.validated_by.full_name ||
                      `${validation.validated_by.first_name || ""} ${validation.validated_by.last_name || ""}`.trim()}
                  </p>
                )}
                {validation.commentaire && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm font-medium mb-1">Observations :</p>
                    <p className="text-sm whitespace-pre-wrap">{validation.commentaire}</p>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Résumé de la note */}
        {note && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Résumé de la note
              </CardTitle>
              <CardDescription>
                {note.reference || "Sans référence"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Direction</p>
                    <p className="font-medium">
                      {note.direction?.sigle || note.direction?.label || "Non spécifiée"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Demandeur</p>
                    <p className="font-medium">{note.demandeur_display || "Non spécifié"}</p>
                  </div>
                </div>
                {note.montant && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Montant</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat("fr-FR").format(note.montant)} FCFA
                      </p>
                    </div>
                  </div>
                )}
                {note.urgence && (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Urgent
                    </Badge>
                  </div>
                )}
              </div>

              <Separator />

              {/* Objet */}
              <div>
                <p className="text-sm font-medium mb-1">Objet</p>
                <p className="text-sm">{note.objet}</p>
              </div>

              {/* Description */}
              {note.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground">{note.description}</p>
                </div>
              )}

              {/* Exposé */}
              {note.expose && (
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <FileEdit className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-800">Exposé</p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.expose}</p>
                </div>
              )}

              {/* Avis */}
              {note.avis && (
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800">Avis</p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.avis}</p>
                </div>
              )}

              {/* Recommandations */}
              {note.recommandations && (
                <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">Recommandations</p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.recommandations}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions de validation (si en attente) */}
        {!isAlreadyProcessed && (
          <Card>
            <CardHeader>
              <CardTitle>Décision</CardTitle>
              <CardDescription>
                Veuillez prendre une décision concernant cette note.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Observations du DG */}
              <div className="space-y-2">
                <Label htmlFor="commentaire">
                  Observations du Directeur Général (optionnel pour validation, obligatoire pour rejet/report)
                </Label>
                <Textarea
                  id="commentaire"
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Saisissez vos observations..."
                  rows={4}
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => openConfirmDialog("APPROVED")}
                  disabled={validateMutation.isPending}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Valider
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => openConfirmDialog("REJECTED")}
                  disabled={validateMutation.isPending || !commentaire.trim()}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => openConfirmDialog("DEFERRED")}
                  disabled={validateMutation.isPending || !commentaire.trim()}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Différer
                </Button>
              </div>

              {(!commentaire.trim()) && (
                <p className="text-xs text-muted-foreground text-center">
                  Un commentaire est obligatoire pour rejeter ou différer la note.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bouton retour */}
        <div className="flex justify-center pt-4">
          <Button variant="ghost" onClick={() => navigate("/notes-sef")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux notes SEF
          </Button>
        </div>
      </div>

      {/* Dialog de confirmation */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ ...confirmDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={validateMutation.isPending}
              className={
                confirmDialog.action === "APPROVED"
                  ? "bg-green-600 hover:bg-green-700"
                  : confirmDialog.action === "REJECTED"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              {validateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
