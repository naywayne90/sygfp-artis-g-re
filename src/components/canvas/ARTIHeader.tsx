/**
 * ARTIHeader - En-tete officiel ARTI non-editable
 * Reproduit fidelement les documents Word officiels ARTI
 * Layout: Logo ARTI | Centre ARTI | Devise Republique CI
 */

interface ARTIHeaderProps {
  reference?: string;
  dateNote?: string;
  expediteur?: string;
  destinataire?: string;
  objet?: string;
  directionLabel?: string;
}

export function ARTIHeader({
  reference,
  dateNote,
  expediteur,
  destinataire,
  objet,
  directionLabel,
}: ARTIHeaderProps) {
  return (
    <div className="select-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* En-tete 3 colonnes */}
      <div className="grid grid-cols-3 items-center gap-4 px-4 py-3">
        {/* Gauche: Logo ARTI */}
        <div className="flex items-center justify-start">
          <img
            src="/logo-arti.jpg"
            alt="Logo ARTI"
            className="h-14 w-auto object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('span');
                fallback.className = 'text-xl font-bold text-[#1F4E79]';
                fallback.textContent = 'ARTI';
                parent.appendChild(fallback);
              }
            }}
          />
        </div>

        {/* Centre: Nom officiel ARTI */}
        <div className="text-center">
          <p className="text-sm font-bold leading-tight" style={{ color: '#1F4E79' }}>
            AUTORITE DE REGULATION
          </p>
          <p className="text-sm font-bold leading-tight" style={{ color: '#1F4E79' }}>
            DU TRANSPORT INTERIEUR
          </p>
        </div>

        {/* Droite: Republique CI + Devise */}
        <div className="text-right">
          <p className="text-sm font-bold leading-tight">REPUBLIQUE DE COTE D'IVOIRE</p>
          <p className="text-xs italic text-gray-600 leading-tight mt-0.5">
            Union - Discipline - Travail
          </p>
          <p className="text-xs text-gray-400 leading-tight">---------</p>
        </div>
      </div>

      {/* Ligne separatrice bleue */}
      <div className="h-[3px]" style={{ backgroundColor: '#1F4E79' }} />

      {/* Bandeau direction */}
      {directionLabel && (
        <div
          className="py-2 px-4 text-center text-sm font-bold text-white"
          style={{ backgroundColor: '#1F4E79' }}
        >
          {directionLabel.toUpperCase()}
        </div>
      )}

      {/* Champs de la note */}
      <div className="mt-2">
        <table className="w-full text-sm border-collapse">
          <tbody>
            {reference !== undefined && (
              <tr>
                <td
                  className="font-bold px-3 py-1.5 border w-[160px]"
                  style={{ backgroundColor: '#D6E3F0' }}
                >
                  Reference
                </td>
                <td className="px-3 py-1.5 border">{reference || '-'}</td>
              </tr>
            )}
            {dateNote !== undefined && (
              <tr>
                <td className="font-bold px-3 py-1.5 border" style={{ backgroundColor: '#D6E3F0' }}>
                  Date
                </td>
                <td className="px-3 py-1.5 border">{dateNote || '-'}</td>
              </tr>
            )}
            {expediteur !== undefined && (
              <tr>
                <td className="font-bold px-3 py-1.5 border" style={{ backgroundColor: '#D6E3F0' }}>
                  De
                </td>
                <td className="px-3 py-1.5 border">{expediteur || '-'}</td>
              </tr>
            )}
            {destinataire !== undefined && (
              <tr>
                <td className="font-bold px-3 py-1.5 border" style={{ backgroundColor: '#D6E3F0' }}>
                  A
                </td>
                <td className="px-3 py-1.5 border">{destinataire || '-'}</td>
              </tr>
            )}
            {objet !== undefined && (
              <tr>
                <td className="font-bold px-3 py-1.5 border" style={{ backgroundColor: '#D6E3F0' }}>
                  Objet
                </td>
                <td className="px-3 py-1.5 border font-medium">{objet || '-'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
