/**
 * ARTIFooter - Pied de page officiel ARTI
 * Zone signature avec Date, Decision, Signature
 * Reproduit le bloc Decision/Signature des documents Word ARTI
 */

interface ARTIFooterProps {
  signataire?: string;
  titre?: string;
  lieu?: string;
}

export function ARTIFooter({ signataire, titre, lieu = 'Abidjan' }: ARTIFooterProps) {
  const today = new Date();
  const dateStr = `${lieu}, le ${today.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })}`;

  return (
    <div className="select-none mt-8" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Observations DG */}
      <div className="mb-4">
        <div
          className="py-2 px-3 text-sm font-bold text-white"
          style={{ backgroundColor: '#1F4E79' }}
        >
          OBSERVATIONS DU DIRECTEUR GENERAL
        </div>
        <div className="border border-t-0 min-h-[80px] p-3" style={{ borderColor: '#ccc' }} />
      </div>

      {/* Decision / Signature */}
      <table className="w-full text-sm border-collapse border">
        <thead>
          <tr>
            <th
              className="border px-3 py-2 text-left font-bold w-1/3"
              style={{ backgroundColor: '#D6E3F0' }}
            >
              DATE
            </th>
            <th
              className="border px-3 py-2 text-left font-bold w-1/3"
              style={{ backgroundColor: '#D6E3F0' }}
            >
              DECISION
            </th>
            <th
              className="border px-3 py-2 text-left font-bold w-1/3"
              style={{ backgroundColor: '#D6E3F0' }}
            >
              SIGNATURE
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-3 py-4 text-sm align-top">{dateStr}</td>
            <td className="border px-3 py-4 text-sm align-top" />
            <td className="border px-3 py-4 text-sm align-top">
              {signataire && (
                <div className="mt-8 text-center">
                  <p className="font-bold">{signataire}</p>
                  {titre && <p className="text-xs text-gray-600 mt-0.5">{titre}</p>}
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
