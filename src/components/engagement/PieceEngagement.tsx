import { forwardRef } from "react";
import { Engagement } from "@/hooks/useEngagements";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PieceEngagementProps {
  engagement: Engagement;
}

export const PieceEngagement = forwardRef<HTMLDivElement, PieceEngagementProps>(
  ({ engagement }, ref) => {
    const formatMontant = (value: number) => {
      return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
    };

    const buildImputationCode = () => {
      const parts: string[] = [];
      if (engagement.budget_line?.objectif_strategique?.code) {
        parts.push(engagement.budget_line.objectif_strategique.code);
      }
      if (engagement.budget_line?.mission?.code) {
        parts.push(engagement.budget_line.mission.code);
      }
      if (engagement.budget_line?.nomenclature_nbe?.code) {
        parts.push(engagement.budget_line.nomenclature_nbe.code);
      }
      if (engagement.budget_line?.plan_comptable_sysco?.code) {
        parts.push(engagement.budget_line.plan_comptable_sysco.code);
      }
      return parts.join("-") || engagement.budget_line?.code || "N/A";
    };

    return (
      <div ref={ref} className="p-8 bg-white text-black print:p-4" style={{ fontFamily: "Times New Roman, serif" }}>
        {/* En-tête */}
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-xl font-bold uppercase">Pièce d'Engagement Budgétaire</h1>
          <p className="text-lg font-semibold mt-2">N° {engagement.numero}</p>
        </div>

        {/* Informations du document */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p><strong>Exercice budgétaire:</strong> {engagement.exercice}</p>
            <p><strong>Date d'engagement:</strong> {format(new Date(engagement.date_engagement), "dd MMMM yyyy", { locale: fr })}</p>
          </div>
          <div className="text-right">
            <p><strong>Statut:</strong> {engagement.statut === "valide" ? "VALIDÉ" : engagement.statut?.toUpperCase()}</p>
          </div>
        </div>

        {/* Objet */}
        <div className="mb-6 p-4 border border-black">
          <h2 className="font-bold text-sm uppercase mb-2">Objet de l'engagement</h2>
          <p>{engagement.objet}</p>
        </div>

        {/* Bénéficiaire/Fournisseur */}
        <div className="mb-6 p-4 border border-black">
          <h2 className="font-bold text-sm uppercase mb-2">Bénéficiaire / Fournisseur</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Raison sociale:</strong> {engagement.fournisseur}</p>
            </div>
            <div>
              {engagement.marche && (
                <p><strong>Réf. Marché:</strong> {engagement.marche.numero}</p>
              )}
              {engagement.expression_besoin && (
                <p><strong>Réf. Expression besoin:</strong> {engagement.expression_besoin.numero}</p>
              )}
            </div>
          </div>
        </div>

        {/* Imputation budgétaire */}
        <div className="mb-6 p-4 border border-black">
          <h2 className="font-bold text-sm uppercase mb-2">Imputation budgétaire</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Code d'imputation:</strong> {buildImputationCode()}</p>
              <p><strong>Ligne budgétaire:</strong> {engagement.budget_line?.code}</p>
              <p><strong>Libellé:</strong> {engagement.budget_line?.label}</p>
            </div>
            <div>
              {engagement.budget_line?.objectif_strategique && (
                <p><strong>OS:</strong> {engagement.budget_line.objectif_strategique.code} - {engagement.budget_line.objectif_strategique.libelle}</p>
              )}
              {engagement.budget_line?.mission && (
                <p><strong>Mission:</strong> {engagement.budget_line.mission.code} - {engagement.budget_line.mission.libelle}</p>
              )}
              {engagement.budget_line?.direction && (
                <p><strong>Direction:</strong> {engagement.budget_line.direction.sigle || engagement.budget_line.direction.label}</p>
              )}
            </div>
          </div>
        </div>

        {/* Montants */}
        <div className="mb-6 p-4 border-2 border-black">
          <h2 className="font-bold text-sm uppercase mb-4">Détail financier</h2>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-black">
                <td className="py-2">Montant Hors Taxes (HT)</td>
                <td className="py-2 text-right font-semibold">
                  {engagement.montant_ht ? formatMontant(engagement.montant_ht) : "N/A"}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-2">TVA ({engagement.tva || 0}%)</td>
                <td className="py-2 text-right font-semibold">
                  {engagement.montant_ht && engagement.tva
                    ? formatMontant(engagement.montant_ht * (engagement.tva / 100))
                    : "N/A"}
                </td>
              </tr>
              <tr className="bg-gray-100">
                <td className="py-3 font-bold text-lg">MONTANT TOTAL TTC</td>
                <td className="py-3 text-right font-bold text-lg">
                  {formatMontant(engagement.montant)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dotation et disponible */}
        <div className="mb-6 p-4 border border-black bg-gray-50">
          <h2 className="font-bold text-sm uppercase mb-2">Situation budgétaire</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Dotation initiale:</strong> {formatMontant(engagement.budget_line?.dotation_initiale || 0)}</p>
            </div>
            <div>
              <p><strong>Engagement actuel:</strong> {formatMontant(engagement.montant)}</p>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-black">
          <div className="text-center">
            <p className="font-bold mb-16">L'Ordonnateur</p>
            <p className="border-t border-black pt-2">Signature et cachet</p>
          </div>
          <div className="text-center">
            <p className="font-bold mb-16">Le Contrôleur Budgétaire</p>
            <p className="border-t border-black pt-2">Visa</p>
          </div>
          <div className="text-center">
            <p className="font-bold mb-16">Le Directeur Financier</p>
            <p className="border-t border-black pt-2">Signature et cachet</p>
          </div>
        </div>

        {/* Pied de page */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-center text-gray-500">
          <p>Document généré le {format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
          <p>Ce document fait foi de pièce comptable</p>
        </div>
      </div>
    );
  }
);

PieceEngagement.displayName = "PieceEngagement";
