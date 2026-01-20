/**
 * Page de vérification d'une Note DG via QR Code
 *
 * Cette page est accessible publiquement (sans authentification)
 * Elle affiche les informations de vérification d'une note validée
 */

import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Building2,
  User,
  Shield,
} from "lucide-react";
import logoArti from "@/assets/logo-arti.jpg";

interface VerificationResult {
  reference: string | null;
  objet: string | null;
  date_note: string | null;
  statut: string | null;
  validated_at: string | null;
  validated_by_name: string | null;
  direction_name: string | null;
  is_valid: boolean;
}

export default function VerificationNoteDG() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["verify-note-dg", token],
    queryFn: async (): Promise<VerificationResult | null> => {
      if (!token) return null;

      const { data, error } = await supabase.rpc("verify_note_dg_by_token", {
        p_token: token,
      });

      if (error) {
        console.error("Verification error:", error);
        throw error;
      }

      // La fonction retourne un tableau, on prend le premier élément
      if (Array.isArray(data) && data.length > 0) {
        return data[0] as VerificationResult;
      }

      return null;
    },
    enabled: !!token,
    retry: false,
  });

  // États du résultat
  const isValid = data?.is_valid === true;
  const notFound = !isLoading && (!data || data.reference === null);
  const isAuthenticated = isValid && data?.validated_at;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        {/* En-tête avec logo */}
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img src={logoArti} alt="ARTI" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-xl text-primary">
            Vérification de Document
          </CardTitle>
          <CardDescription>
            Autorité de Régulation des Télécommunications de Côte d'Ivoire
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {/* État de chargement */}
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {/* Erreur */}
          {error && !isLoading && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-4">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-destructive">
                Erreur de vérification
              </h3>
              <p className="text-sm text-muted-foreground">
                Une erreur s'est produite lors de la vérification du document.
                <br />
                Veuillez réessayer ultérieurement.
              </p>
            </div>
          )}

          {/* Document non trouvé */}
          {notFound && !error && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-warning/10 p-4">
                  <XCircle className="h-12 w-12 text-warning" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-warning">
                Document non trouvé
              </h3>
              <p className="text-sm text-muted-foreground">
                Le QR Code scanné ne correspond à aucun document enregistré dans notre système.
                <br />
                <br />
                Cela peut signifier que:
              </p>
              <ul className="text-sm text-muted-foreground text-left list-disc list-inside space-y-1">
                <li>Le QR Code a été modifié ou falsifié</li>
                <li>Le document n'a pas encore été validé</li>
                <li>Le lien est incorrect ou incomplet</li>
              </ul>
            </div>
          )}

          {/* Document trouvé */}
          {data && !notFound && !isLoading && (
            <div className="space-y-6">
              {/* Badge de statut principal */}
              <div className="flex justify-center">
                {isAuthenticated ? (
                  <div className="rounded-full bg-success/10 p-4">
                    <CheckCircle2 className="h-12 w-12 text-success" />
                  </div>
                ) : (
                  <div className="rounded-full bg-warning/10 p-4">
                    <AlertTriangle className="h-12 w-12 text-warning" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <h3
                  className={`text-lg font-semibold ${
                    isAuthenticated ? "text-success" : "text-warning"
                  }`}
                >
                  {isAuthenticated ? "Document Authentifié" : "Document Non Validé"}
                </h3>
                <Badge
                  variant="outline"
                  className={
                    isAuthenticated
                      ? "bg-success/10 text-success mt-2"
                      : "bg-warning/10 text-warning mt-2"
                  }
                >
                  {data.statut === "dg_valide"
                    ? "Validé par le DG"
                    : data.statut === "diffusee"
                    ? "Diffusé"
                    : data.statut?.toUpperCase() || "INCONNU"}
                </Badge>
              </div>

              <Separator />

              {/* Détails du document */}
              <div className="space-y-4">
                {/* Référence */}
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Référence</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {data.reference || "-"}
                    </p>
                  </div>
                </div>

                {/* Objet */}
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Objet</p>
                    <p className="text-sm text-muted-foreground">{data.objet || "-"}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Date du document</p>
                    <p className="text-sm text-muted-foreground">
                      {data.date_note
                        ? format(new Date(data.date_note), "dd MMMM yyyy", { locale: fr })
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Direction */}
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Direction</p>
                    <p className="text-sm text-muted-foreground">
                      {data.direction_name || "Non spécifiée"}
                    </p>
                  </div>
                </div>

                {/* Validation */}
                {isAuthenticated && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-success mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-success">Validé par</p>
                        <p className="text-sm text-muted-foreground">
                          {data.validated_by_name || "Direction Générale"}
                        </p>
                        {data.validated_at && (
                          <p className="text-xs text-muted-foreground">
                            Le{" "}
                            {format(new Date(data.validated_at), "dd/MM/yyyy à HH:mm", {
                              locale: fr,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Note de sécurité */}
              <div className="mt-6 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-center text-muted-foreground">
                  {isAuthenticated ? (
                    <>
                      Ce document est authentifié électroniquement par l'ARTI.
                      <br />
                      Toute falsification est passible de poursuites judiciaires.
                    </>
                  ) : (
                    <>
                      Ce document n'a pas encore été validé par la Direction Générale.
                      <br />
                      Veuillez contacter l'émetteur pour confirmation.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        {/* Pied de page */}
        <Separator />
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            ARTI - SYGFP • Système de Gestion des Finances Publiques
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            © {new Date().getFullYear()} - Tous droits réservés
          </p>
        </div>
      </Card>
    </div>
  );
}
