import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SecteurSelect } from "@/components/admin/programmatique/SecteurSelect";
import { usePrestaireRequests } from "@/hooks/usePrestataires";
import { Building2, CheckCircle, Send } from "lucide-react";
import { toast } from "sonner";

export default function DemandePrestataire() {
  const { createRequest } = usePrestaireRequests();
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    raison_sociale: "",
    email: "",
    telephone: "",
    adresse: "",
    ninea: "",
    rccm: "",
    cc: "",
    code_comptable: "",
    rib_banque: "",
    rib_numero: "",
    rib_cle: "",
    secteur_principal_id: null as string | null,
    secteur_secondaire_id: null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.raison_sociale.trim()) {
      toast.error("La raison sociale est obligatoire");
      return;
    }

    if (!formData.email && !formData.telephone) {
      toast.error("Au moins un contact (email ou téléphone) est obligatoire");
      return;
    }

    await createRequest.mutateAsync({
      raison_sociale: formData.raison_sociale,
      email: formData.email || null,
      telephone: formData.telephone || null,
      adresse: formData.adresse || null,
      ninea: formData.ninea || null,
      rccm: formData.rccm || null,
      cc: formData.cc || null,
      code_comptable: formData.code_comptable || null,
      rib_banque: formData.rib_banque || null,
      rib_numero: formData.rib_numero || null,
      rib_cle: formData.rib_cle || null,
      secteur_principal_id: formData.secteur_principal_id,
      secteur_secondaire_id: formData.secteur_secondaire_id,
      source: "INTERNE",
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Demande enregistrée !</h2>
            <p className="text-muted-foreground mb-4">
              Votre demande d'enregistrement a été soumise avec succès.
              Elle sera examinée par les Services Généraux.
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline">
              Nouvelle demande
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Demande d'enregistrement Prestataire</h1>
        <p className="page-description">
          Remplissez ce formulaire pour demander l'enregistrement d'un nouveau prestataire
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Informations du Prestataire</CardTitle>
              <CardDescription>
                Les champs marqués d'un * sont obligatoires
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Raison sociale */}
            <div className="space-y-2">
              <Label htmlFor="raison_sociale">
                Raison sociale <span className="text-destructive">*</span>
              </Label>
              <Input
                id="raison_sociale"
                value={formData.raison_sociale}
                onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                placeholder="Nom de l'entreprise"
                required
              />
            </div>

            {/* Secteurs */}
            <SecteurSelect
              secteurPrincipalId={formData.secteur_principal_id}
              secteurSecondaireId={formData.secteur_secondaire_id}
              onChangePrincipal={(id) => setFormData({ ...formData, secteur_principal_id: id })}
              onChangeSecondaire={(id) => setFormData({ ...formData, secteur_secondaire_id: id })}
            />

            {/* Contact */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <Badge variant="outline" className="ml-2 text-xs">Au moins 1 contact requis</Badge>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@entreprise.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+221 XX XXX XX XX"
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Textarea
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Adresse complète"
                rows={2}
              />
            </div>

            {/* Identifiants légaux */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ninea">NINEA</Label>
                <Input
                  id="ninea"
                  value={formData.ninea}
                  onChange={(e) => setFormData({ ...formData, ninea: e.target.value })}
                  placeholder="Numéro NINEA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rccm">RCCM</Label>
                <Input
                  id="rccm"
                  value={formData.rccm}
                  onChange={(e) => setFormData({ ...formData, rccm: e.target.value })}
                  placeholder="Registre du commerce"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc">Compte Contribuable</Label>
                <Input
                  id="cc"
                  value={formData.cc}
                  onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                  placeholder="CC"
                />
              </div>
            </div>

            {/* Code comptable */}
            <div className="space-y-2">
              <Label htmlFor="code_comptable">Code Comptable</Label>
              <Input
                id="code_comptable"
                value={formData.code_comptable}
                onChange={(e) => setFormData({ ...formData, code_comptable: e.target.value })}
                placeholder="Code comptable du prestataire"
              />
            </div>

            {/* Informations bancaires */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Informations Bancaires (optionnel)</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="rib_banque">Banque</Label>
                  <Input
                    id="rib_banque"
                    value={formData.rib_banque}
                    onChange={(e) => setFormData({ ...formData, rib_banque: e.target.value })}
                    placeholder="Nom de la banque"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rib_numero">N° Compte</Label>
                  <Input
                    id="rib_numero"
                    value={formData.rib_numero}
                    onChange={(e) => setFormData({ ...formData, rib_numero: e.target.value })}
                    placeholder="Numéro de compte"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rib_cle">Clé RIB</Label>
                  <Input
                    id="rib_cle"
                    value={formData.rib_cle}
                    onChange={(e) => setFormData({ ...formData, rib_cle: e.target.value })}
                    placeholder="Clé"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createRequest.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {createRequest.isPending ? "Envoi en cours..." : "Soumettre la demande"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
