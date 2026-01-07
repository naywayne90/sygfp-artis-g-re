import { Prestataire } from "@/hooks/usePrestataires";

interface SupplierIdentityTabProps {
  prestataire: Prestataire;
  getSecteurLibelle: (id: string | null) => string;
}

export function SupplierIdentityTab({ prestataire, getSecteurLibelle }: SupplierIdentityTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Informations générales</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <p className="text-sm text-muted-foreground">Raison sociale</p>
            <p className="font-medium text-lg">{prestataire.raison_sociale}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sigle</p>
            <p>{prestataire.sigle || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Type</p>
            <p>{prestataire.type_prestataire || "Non défini"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Secteur Principal</p>
            <p>{getSecteurLibelle(prestataire.secteur_principal_id)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Secteur Secondaire</p>
            <p>{getSecteurLibelle(prestataire.secteur_secondaire_id)}</p>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Identifiants fiscaux</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">NINEA</p>
            <p className="font-mono">{prestataire.ninea || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">NIF</p>
            <p className="font-mono">{prestataire.nif || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">IFU</p>
            <p className="font-mono">{prestataire.ifu || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">RCCM</p>
            <p className="font-mono">{prestataire.rccm || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Compte Contribuable</p>
            <p className="font-mono">{prestataire.cc || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Code Comptable</p>
            <p className="font-mono">{prestataire.code_comptable || "-"}</p>
          </div>
        </div>
      </div>

      {prestataire.statut_fiscal && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Situation fiscale</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Statut fiscal</p>
              <p>{prestataire.statut_fiscal}</p>
            </div>
            {prestataire.date_expiration_fiscale && (
              <div>
                <p className="text-sm text-muted-foreground">Expiration</p>
                <p>{new Date(prestataire.date_expiration_fiscale).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {prestataire.date_qualification && (
        <div className="border-t pt-4 text-sm text-muted-foreground">
          Qualifié le {new Date(prestataire.date_qualification).toLocaleDateString('fr-FR')}
        </div>
      )}
    </div>
  );
}
