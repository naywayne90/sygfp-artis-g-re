/**
 * Détermine si le rôle utilisateur correspond à l'étape de validation courante.
 * ADMIN peut agir sur toutes les étapes.
 */
export function isRoleForStep(statut: string | null, role: string | null): boolean {
  if (!role) return false;
  if (role === 'ADMIN') return true;
  switch (statut) {
    case 'soumis':
      return role === 'SAF' || role === 'OPERATEUR';
    case 'visa_saf':
      return role === 'CB';
    case 'visa_cb':
      return role === 'DAAF' || role === 'DAF';
    case 'visa_daaf':
      return role === 'DG';
    default:
      return false;
  }
}
