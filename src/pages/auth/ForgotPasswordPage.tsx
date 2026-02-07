import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import logoArti from '@/assets/logo-arti.jpg';
import { supabase } from '@/integrations/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        if (resetError.message.includes('Too many requests')) {
          setError('Trop de tentatives. Veuillez réessayer dans quelques minutes.');
        } else {
          setError(resetError.message);
        }
        return;
      }

      setIsEmailSent(true);
    } catch {
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logoArti} alt="ARTI" className="h-16 w-auto object-contain" />
        </div>

        <Card className="shadow-xl border-slate-200/50">
          <CardHeader className="bg-primary text-center rounded-t-lg">
            <CardTitle className="text-lg font-bold text-white tracking-wide">SYGFP</CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-[0.15em] text-white/70">
              Système de Gestion Financière Publique
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {isEmailSent ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <h2 className="text-center text-sm font-medium text-slate-600">Email envoyé</h2>
                <p className="text-center text-sm text-muted-foreground">
                  Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un lien
                  de réinitialisation dans quelques instants.
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  Vérifiez également votre dossier spam.
                </p>
                <Link to="/auth" className="block">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-center text-sm font-medium text-slate-600">
                  Mot de passe oublié
                </h2>
                <p className="text-center text-xs text-muted-foreground">
                  Entrez votre adresse email pour recevoir un lien de réinitialisation.
                </p>

                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Adresse email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre.email@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        autoComplete="email"
                        autoFocus
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !email}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      'Envoyer le lien de réinitialisation'
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <Link
                    to="/auth"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Retour à la connexion
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-5">
          © 2025 ARTI - Tous droits réservés
        </p>
      </div>
    </div>
  );
}
