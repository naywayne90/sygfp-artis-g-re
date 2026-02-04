/**
 * VerifyDocument - Page publique de vérification des documents
 * Route : /verify/:hash (accessible sans authentification)
 */

import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Hash,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useVerifyQRCode } from '@/hooks/useQRCode';
import {
  formatValidationDate,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from '@/lib/qrcode-utils';

export default function VerifyDocument() {
  const { hash } = useParams<{ hash: string }>();
  const { isVerifying, isValid, data, error, verify } = useVerifyQRCode();

  useEffect(() => {
    if (hash) {
      verify(hash);
    }
  }, [hash, verify]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/favicon.jpg"
                alt="ARTI"
                className="h-10 w-10 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="font-bold text-lg text-blue-900">ARTI</h1>
                <p className="text-xs text-gray-500">
                  Autorité de Régulation des Télécommunications
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              SYGFP - Vérification
            </Badge>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
              Vérification de document
            </CardTitle>
            <CardDescription>
              Résultat de la vérification d'authenticité
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* État de chargement */}
            {isVerifying && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                <p className="text-muted-foreground">Vérification en cours...</p>
              </div>
            )}

            {/* Document valide */}
            {!isVerifying && isValid && data && (
              <div className="space-y-6">
                {/* Badge de succès */}
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="rounded-full bg-green-100 p-4">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-green-700">
                    Document authentique
                  </h2>
                  <p className="text-sm text-muted-foreground text-center">
                    Ce document a été vérifié et correspond aux enregistrements du système SYGFP.
                  </p>
                </div>

                {/* Détails du document */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Informations du document
                  </h3>

                  <div className="grid gap-3">
                    <InfoRow
                      icon={<Hash className="h-4 w-4" />}
                      label="Référence"
                      value={
                        <Badge variant="outline" className="font-mono">
                          {data.reference}
                        </Badge>
                      }
                    />
                    <InfoRow
                      icon={<FileText className="h-4 w-4" />}
                      label="Type de document"
                      value={DOCUMENT_TYPE_LABELS[data.type as DocumentType] || data.type}
                    />
                    <InfoRow
                      icon={<Calendar className="h-4 w-4" />}
                      label="Date de validation"
                      value={formatValidationDate(data.dateValidation)}
                    />
                    <InfoRow
                      icon={<User className="h-4 w-4" />}
                      label="Validé par"
                      value={data.validateur}
                    />
                  </div>
                </div>

                {/* Checksum */}
                <div className="text-center text-xs text-muted-foreground">
                  <span className="font-mono">
                    Signature : {data.checksum.slice(0, 16)}...{data.checksum.slice(-8)}
                  </span>
                </div>
              </div>
            )}

            {/* Document invalide ou non trouvé */}
            {!isVerifying && !isValid && (
              <div className="space-y-6">
                {/* Badge d'erreur */}
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="rounded-full bg-red-100 p-4">
                    <XCircle className="h-12 w-12 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-red-700">
                    Document non trouvé
                  </h2>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    {error || 'Ce document ne peut pas être vérifié. Il peut s\'agir d\'un document invalide ou d\'un QR code altéré.'}
                  </p>
                </div>

                {/* Avertissement */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Attention</p>
                      <p className="mt-1">
                        Si vous pensez qu'il s'agit d'une erreur, veuillez contacter
                        l'émetteur du document ou le service informatique de l'ARTI.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pas de hash fourni */}
            {!isVerifying && !hash && (
              <div className="flex flex-col items-center gap-4 py-8">
                <AlertTriangle className="h-12 w-12 text-amber-500" />
                <p className="text-muted-foreground text-center">
                  Aucun code de vérification fourni.
                  <br />
                  Scannez un QR code pour vérifier un document.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lien retour */}
        <div className="mt-6 text-center">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-muted-foreground">
          <p>
            SYGFP - Système de Gestion des Finances Publiques
            <br />
            &copy; {new Date().getFullYear()} ARTI - Tous droits réservés
          </p>
        </footer>
      </main>
    </div>
  );
}

// Composant helper pour les lignes d'information
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-sm text-muted-foreground w-36">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
