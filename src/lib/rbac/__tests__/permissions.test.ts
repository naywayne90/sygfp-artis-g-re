import { describe, it, expect } from 'vitest';
import {
  getVisibilityScope,
  canViewDossier,
  canValidateStep,
  canRejectStep,
  canDeferStep,
  canSubmitStep,
  canCreateStep,
  canEditDossier,
  canDeleteDossier,
  canUploadPiece,
  canValidateNoteSEF,
  canValidateNoteAEF,
  canImputeNoteAEF,
  canSignOrdonnancement,
  canExecuteReglement,
  getRequiredRoleForAction,
  getAccessDeniedMessage,
  type RoleCode,
  type UserContext,
  type EntityContext,
} from '../permissions';
import { ETAPES_CHAINE_DEPENSE } from '@/lib/config/sygfp-constants';

// ============================================
// Helpers
// ============================================

function makeUser(overrides: Partial<UserContext> = {}): UserContext {
  return {
    userId: 'user-1',
    roles: ['AGENT'],
    directionId: 'dir-1',
    serviceId: 'svc-1',
    isAdmin: false,
    ...overrides,
  };
}

function makeEntity(overrides: Partial<EntityContext> = {}): EntityContext {
  return {
    createdBy: 'user-1',
    directionId: 'dir-1',
    serviceId: 'svc-1',
    statut: 'brouillon',
    ...overrides,
  };
}

// ============================================
// getVisibilityScope
// ============================================

describe('getVisibilityScope', () => {
  it('should return "all" for ADMIN', () => {
    expect(getVisibilityScope(['ADMIN'])).toBe('all');
  });

  it('should return "all" for DG', () => {
    expect(getVisibilityScope(['DG'])).toBe('all');
  });

  it('should return "all" for AUDITEUR', () => {
    expect(getVisibilityScope(['AUDITEUR'])).toBe('all');
  });

  it('should return "direction" for DIRECTEUR', () => {
    expect(getVisibilityScope(['DIRECTEUR'])).toBe('direction');
  });

  it('should return "direction" for SOUS_DIRECTEUR', () => {
    expect(getVisibilityScope(['SOUS_DIRECTEUR'])).toBe('direction');
  });

  it('should return "direction" for DAAF', () => {
    expect(getVisibilityScope(['DAAF'])).toBe('direction');
  });

  it('should return "service" for CHEF_SERVICE', () => {
    expect(getVisibilityScope(['CHEF_SERVICE'])).toBe('service');
  });

  it('should return "own" for OPERATEUR', () => {
    expect(getVisibilityScope(['OPERATEUR'])).toBe('own');
  });

  it('should return "own" for AGENT', () => {
    expect(getVisibilityScope(['AGENT'])).toBe('own');
  });

  it('should return highest scope when user has multiple roles', () => {
    expect(getVisibilityScope(['AGENT', 'ADMIN'])).toBe('all');
  });

  it('should return "all" when DG is among roles', () => {
    expect(getVisibilityScope(['AGENT', 'DG'])).toBe('all');
  });
});

// ============================================
// canViewDossier
// ============================================

describe('canViewDossier', () => {
  it('should allow admin to view any dossier', () => {
    const user = makeUser({ isAdmin: true });
    const entity = makeEntity({ createdBy: 'other-user', directionId: 'other-dir' });
    expect(canViewDossier(user, entity)).toBe(true);
  });

  it('should allow DG to view any dossier', () => {
    const user = makeUser({ roles: ['DG'] });
    const entity = makeEntity({ createdBy: 'other-user', directionId: 'other-dir' });
    expect(canViewDossier(user, entity)).toBe(true);
  });

  it('should allow DIRECTEUR to view dossier in same direction', () => {
    const user = makeUser({ roles: ['DIRECTEUR'], directionId: 'dir-1' });
    const entity = makeEntity({ directionId: 'dir-1', createdBy: 'other-user' });
    expect(canViewDossier(user, entity)).toBe(true);
  });

  it('should deny DIRECTEUR from viewing dossier in other direction', () => {
    const user = makeUser({ roles: ['DIRECTEUR'], directionId: 'dir-1' });
    const entity = makeEntity({ directionId: 'dir-2', createdBy: 'other-user' });
    expect(canViewDossier(user, entity)).toBe(false);
  });

  it('should allow DIRECTEUR to view own dossier even in other direction', () => {
    const user = makeUser({ userId: 'user-1', roles: ['DIRECTEUR'], directionId: 'dir-1' });
    const entity = makeEntity({ directionId: 'dir-2', createdBy: 'user-1' });
    expect(canViewDossier(user, entity)).toBe(true);
  });

  it('should allow CHEF_SERVICE to view dossier in same service', () => {
    const user = makeUser({ roles: ['CHEF_SERVICE'], serviceId: 'svc-1' });
    const entity = makeEntity({ serviceId: 'svc-1', createdBy: 'other-user' });
    expect(canViewDossier(user, entity)).toBe(true);
  });

  it('should deny CHEF_SERVICE from viewing dossier in other service', () => {
    const user = makeUser({ roles: ['CHEF_SERVICE'], serviceId: 'svc-1' });
    const entity = makeEntity({ serviceId: 'svc-2', createdBy: 'other-user' });
    expect(canViewDossier(user, entity)).toBe(false);
  });

  it('should allow AGENT to view own dossier', () => {
    const user = makeUser({ userId: 'user-1', roles: ['AGENT'] });
    const entity = makeEntity({ createdBy: 'user-1' });
    expect(canViewDossier(user, entity)).toBe(true);
  });

  it('should deny AGENT from viewing other user dossier', () => {
    const user = makeUser({ userId: 'user-1', roles: ['AGENT'] });
    const entity = makeEntity({ createdBy: 'other-user' });
    expect(canViewDossier(user, entity)).toBe(false);
  });

  it('should allow AUDITEUR to view any dossier', () => {
    const user = makeUser({ roles: ['AUDITEUR'] });
    const entity = makeEntity({ createdBy: 'other-user', directionId: 'other-dir' });
    expect(canViewDossier(user, entity)).toBe(true);
  });
});

// ============================================
// canValidateStep
// ============================================

describe('canValidateStep', () => {
  const { NOTE_SEF, NOTE_AEF, IMPUTATION, ENGAGEMENT, LIQUIDATION, ORDONNANCEMENT, REGLEMENT } = ETAPES_CHAINE_DEPENSE;

  it('should allow ADMIN to validate NOTE_SEF', () => {
    expect(canValidateStep(['ADMIN'], NOTE_SEF)).toBe(true);
  });

  it('should allow DG to validate NOTE_SEF', () => {
    expect(canValidateStep(['DG'], NOTE_SEF)).toBe(true);
  });

  it('should deny AGENT from validating NOTE_SEF', () => {
    expect(canValidateStep(['AGENT'], NOTE_SEF)).toBe(false);
  });

  it('should allow DIRECTEUR to validate NOTE_AEF', () => {
    expect(canValidateStep(['DIRECTEUR'], NOTE_AEF)).toBe(true);
  });

  it('should allow CB to validate IMPUTATION', () => {
    expect(canValidateStep(['CB'], IMPUTATION)).toBe(true);
  });

  it('should allow CB to validate ENGAGEMENT', () => {
    expect(canValidateStep(['CB'], ENGAGEMENT)).toBe(true);
  });

  it('should allow DAAF to validate LIQUIDATION', () => {
    expect(canValidateStep(['DAAF'], LIQUIDATION)).toBe(true);
  });

  it('should allow DG to validate ORDONNANCEMENT', () => {
    expect(canValidateStep(['DG'], ORDONNANCEMENT)).toBe(true);
  });

  it('should allow TRESORERIE to validate REGLEMENT', () => {
    expect(canValidateStep(['TRESORERIE'], REGLEMENT)).toBe(true);
  });

  it('should deny validation when statut is brouillon', () => {
    expect(canValidateStep(['DG'], NOTE_SEF, 'brouillon')).toBe(false);
  });

  it('should deny validation when statut is valide', () => {
    expect(canValidateStep(['DG'], NOTE_SEF, 'valide')).toBe(false);
  });

  it('should allow validation when statut is soumis', () => {
    expect(canValidateStep(['DG'], NOTE_SEF, 'soumis')).toBe(true);
  });

  it('should allow validation when statut is a_valider', () => {
    expect(canValidateStep(['DG'], NOTE_SEF, 'a_valider')).toBe(true);
  });
});

// ============================================
// canRejectStep
// ============================================

describe('canRejectStep', () => {
  it('should allow DG to reject NOTE_SEF', () => {
    expect(canRejectStep(['DG'], ETAPES_CHAINE_DEPENSE.NOTE_SEF)).toBe(true);
  });

  it('should deny AGENT from rejecting NOTE_SEF', () => {
    expect(canRejectStep(['AGENT'], ETAPES_CHAINE_DEPENSE.NOTE_SEF)).toBe(false);
  });

  it('should deny rejection when statut is brouillon', () => {
    expect(canRejectStep(['DG'], ETAPES_CHAINE_DEPENSE.NOTE_SEF, 'brouillon')).toBe(false);
  });

  it('should allow rejection when statut is soumis', () => {
    expect(canRejectStep(['DG'], ETAPES_CHAINE_DEPENSE.NOTE_SEF, 'soumis')).toBe(true);
  });
});

// ============================================
// canDeferStep
// ============================================

describe('canDeferStep', () => {
  it('should allow DG to defer NOTE_SEF', () => {
    expect(canDeferStep(['DG'], ETAPES_CHAINE_DEPENSE.NOTE_SEF)).toBe(true);
  });

  it('should deny AGENT from deferring NOTE_SEF', () => {
    expect(canDeferStep(['AGENT'], ETAPES_CHAINE_DEPENSE.NOTE_SEF)).toBe(false);
  });

  it('should deny deferral when statut is valide', () => {
    expect(canDeferStep(['DG'], ETAPES_CHAINE_DEPENSE.NOTE_SEF, 'valide')).toBe(false);
  });
});

// ============================================
// canSubmitStep
// ============================================

describe('canSubmitStep', () => {
  it('should allow owner AGENT to submit NOTE_SEF in brouillon', () => {
    expect(canSubmitStep(['AGENT'], ETAPES_CHAINE_DEPENSE.NOTE_SEF, true, 'brouillon')).toBe(true);
  });

  it('should deny non-owner from submitting', () => {
    expect(canSubmitStep(['AGENT'], ETAPES_CHAINE_DEPENSE.NOTE_SEF, false, 'brouillon')).toBe(false);
  });

  it('should allow ADMIN to submit even if not owner', () => {
    expect(canSubmitStep(['ADMIN'], ETAPES_CHAINE_DEPENSE.NOTE_SEF, false, 'brouillon')).toBe(true);
  });

  it('should deny submission when statut is soumis', () => {
    expect(canSubmitStep(['AGENT'], ETAPES_CHAINE_DEPENSE.NOTE_SEF, true, 'soumis')).toBe(false);
  });

  it('should deny submission when statut is valide', () => {
    expect(canSubmitStep(['AGENT'], ETAPES_CHAINE_DEPENSE.NOTE_SEF, true, 'valide')).toBe(false);
  });

  it('should allow OPERATEUR to submit NOTE_SEF', () => {
    expect(canSubmitStep(['OPERATEUR'], ETAPES_CHAINE_DEPENSE.NOTE_SEF, true, 'brouillon')).toBe(true);
  });

  it('should deny TRESORERIE from submitting NOTE_SEF', () => {
    expect(canSubmitStep(['TRESORERIE'], ETAPES_CHAINE_DEPENSE.NOTE_SEF, true, 'brouillon')).toBe(false);
  });
});

// ============================================
// canCreateStep
// ============================================

describe('canCreateStep', () => {
  it('should allow ADMIN to create at any step', () => {
    const steps = Object.values(ETAPES_CHAINE_DEPENSE);
    steps.forEach((step) => {
      expect(canCreateStep(['ADMIN'], step)).toBe(true);
    });
  });

  it('should allow AGENT to create NOTE_SEF', () => {
    expect(canCreateStep(['AGENT'], ETAPES_CHAINE_DEPENSE.NOTE_SEF)).toBe(true);
  });

  it('should deny AGENT from creating IMPUTATION', () => {
    expect(canCreateStep(['AGENT'], ETAPES_CHAINE_DEPENSE.IMPUTATION)).toBe(false);
  });

  it('should allow CB to create IMPUTATION', () => {
    expect(canCreateStep(['CB'], ETAPES_CHAINE_DEPENSE.IMPUTATION)).toBe(true);
  });

  it('should allow DAAF to create ENGAGEMENT', () => {
    expect(canCreateStep(['DAAF'], ETAPES_CHAINE_DEPENSE.ENGAGEMENT)).toBe(true);
  });

  it('should allow TRESORERIE to create REGLEMENT', () => {
    expect(canCreateStep(['TRESORERIE'], ETAPES_CHAINE_DEPENSE.REGLEMENT)).toBe(true);
  });

  it('should deny AGENT from creating REGLEMENT', () => {
    expect(canCreateStep(['AGENT'], ETAPES_CHAINE_DEPENSE.REGLEMENT)).toBe(false);
  });
});

// ============================================
// canEditDossier
// ============================================

describe('canEditDossier', () => {
  it('should allow admin to edit any dossier', () => {
    const user = makeUser({ isAdmin: true });
    const entity = makeEntity({ statut: 'soumis', createdBy: 'other' });
    expect(canEditDossier(user, entity)).toBe(true);
  });

  it('should allow creator to edit brouillon', () => {
    const user = makeUser({ userId: 'user-1' });
    const entity = makeEntity({ statut: 'brouillon', createdBy: 'user-1' });
    expect(canEditDossier(user, entity)).toBe(true);
  });

  it('should deny non-creator from editing brouillon', () => {
    const user = makeUser({ userId: 'user-1' });
    const entity = makeEntity({ statut: 'brouillon', createdBy: 'other-user' });
    expect(canEditDossier(user, entity)).toBe(false);
  });

  it('should allow creator to edit differe status', () => {
    const user = makeUser({ userId: 'user-1' });
    const entity = makeEntity({ statut: 'differe', createdBy: 'user-1' });
    expect(canEditDossier(user, entity)).toBe(true);
  });

  it('should deny editing soumis dossier (non-admin)', () => {
    const user = makeUser({ userId: 'user-1' });
    const entity = makeEntity({ statut: 'soumis', createdBy: 'user-1' });
    expect(canEditDossier(user, entity)).toBe(false);
  });

  it('should deny editing valide dossier (non-admin)', () => {
    const user = makeUser({ userId: 'user-1' });
    const entity = makeEntity({ statut: 'valide', createdBy: 'user-1' });
    expect(canEditDossier(user, entity)).toBe(false);
  });
});

// ============================================
// canDeleteDossier
// ============================================

describe('canDeleteDossier', () => {
  it('should allow admin to delete any dossier', () => {
    const user = makeUser({ isAdmin: true });
    const entity = makeEntity({ statut: 'soumis' });
    expect(canDeleteDossier(user, entity)).toBe(true);
  });

  it('should allow creator to delete brouillon', () => {
    const user = makeUser({ userId: 'user-1' });
    const entity = makeEntity({ statut: 'brouillon', createdBy: 'user-1' });
    expect(canDeleteDossier(user, entity)).toBe(true);
  });

  it('should deny non-creator from deleting brouillon', () => {
    const user = makeUser({ userId: 'user-1' });
    const entity = makeEntity({ statut: 'brouillon', createdBy: 'other-user' });
    expect(canDeleteDossier(user, entity)).toBe(false);
  });

  it('should deny deleting soumis dossier (non-admin)', () => {
    const user = makeUser({ userId: 'user-1' });
    const entity = makeEntity({ statut: 'soumis', createdBy: 'user-1' });
    expect(canDeleteDossier(user, entity)).toBe(false);
  });

  it('should deny deleting valide dossier (non-admin)', () => {
    const user = makeUser({ userId: 'user-1' });
    const entity = makeEntity({ statut: 'valide', createdBy: 'user-1' });
    expect(canDeleteDossier(user, entity)).toBe(false);
  });
});

// ============================================
// canUploadPiece
// ============================================

describe('canUploadPiece', () => {
  it('should allow admin to upload on any entity', () => {
    const user = makeUser({ isAdmin: true });
    const entity = makeEntity({ statut: 'valide', createdBy: 'other' });
    expect(canUploadPiece(user, entity)).toBe(true);
  });

  it('should allow creator to upload on brouillon', () => {
    const user = makeUser({ userId: 'user-1' });
    const entity = makeEntity({ statut: 'brouillon', createdBy: 'user-1' });
    expect(canUploadPiece(user, entity)).toBe(true);
  });

  it('should allow CB to upload after submission when they can view the entity', () => {
    // CB has 'own' visibility scope, so they need to be the creator OR have DAAF/DG role
    // To test canAddAfterSubmit, use a DAAF who has 'direction' scope
    const user = makeUser({ userId: 'user-2', roles: ['DAAF'], directionId: 'dir-1' });
    const entity = makeEntity({ statut: 'soumis', createdBy: 'user-1', directionId: 'dir-1' });
    expect(canUploadPiece(user, entity)).toBe(true);
  });

  it('should deny CB from uploading on entity they cannot view', () => {
    // CB has 'own' visibility scope, so cannot view entity by another user
    const user = makeUser({ userId: 'user-2', roles: ['CB'] });
    const entity = makeEntity({ statut: 'soumis', createdBy: 'user-1', directionId: 'dir-1' });
    expect(canUploadPiece(user, entity)).toBe(false);
  });

  it('should deny AGENT from uploading on soumis entity (not their own)', () => {
    const user = makeUser({ userId: 'user-2', roles: ['AGENT'] });
    const entity = makeEntity({ statut: 'soumis', createdBy: 'user-1' });
    expect(canUploadPiece(user, entity)).toBe(false);
  });
});

// ============================================
// Specialized helpers
// ============================================

describe('canValidateNoteSEF', () => {
  it('should allow DG', () => {
    expect(canValidateNoteSEF(['DG'])).toBe(true);
  });

  it('should allow ADMIN', () => {
    expect(canValidateNoteSEF(['ADMIN'])).toBe(true);
  });

  it('should deny AGENT', () => {
    expect(canValidateNoteSEF(['AGENT'])).toBe(false);
  });
});

describe('canValidateNoteAEF', () => {
  it('should allow DIRECTEUR', () => {
    expect(canValidateNoteAEF(['DIRECTEUR'])).toBe(true);
  });

  it('should allow DG', () => {
    expect(canValidateNoteAEF(['DG'])).toBe(true);
  });

  it('should deny AGENT', () => {
    expect(canValidateNoteAEF(['AGENT'])).toBe(false);
  });
});

describe('canImputeNoteAEF', () => {
  it('should allow CB', () => {
    expect(canImputeNoteAEF(['CB'])).toBe(true);
  });

  it('should allow ADMIN', () => {
    expect(canImputeNoteAEF(['ADMIN'])).toBe(true);
  });

  it('should deny AGENT', () => {
    expect(canImputeNoteAEF(['AGENT'])).toBe(false);
  });
});

describe('canSignOrdonnancement', () => {
  it('should allow DG', () => {
    expect(canSignOrdonnancement(['DG'])).toBe(true);
  });

  it('should allow ADMIN', () => {
    expect(canSignOrdonnancement(['ADMIN'])).toBe(true);
  });

  it('should deny CB', () => {
    expect(canSignOrdonnancement(['CB'])).toBe(false);
  });
});

describe('canExecuteReglement', () => {
  it('should allow TRESORERIE', () => {
    expect(canExecuteReglement(['TRESORERIE'])).toBe(true);
  });

  it('should allow AGENT_COMPTABLE', () => {
    expect(canExecuteReglement(['AGENT_COMPTABLE'])).toBe(true);
  });

  it('should deny DG', () => {
    expect(canExecuteReglement(['DG'])).toBe(false);
  });
});

// ============================================
// getRequiredRoleForAction
// ============================================

describe('getRequiredRoleForAction', () => {
  it('should return DG for NOTE_SEF validate', () => {
    const role = getRequiredRoleForAction(ETAPES_CHAINE_DEPENSE.NOTE_SEF, 'validate');
    expect(role).toBe('ADMIN');
  });

  it('should return a string for all action types', () => {
    const actions: Array<'validate' | 'reject' | 'defer' | 'submit' | 'create' | 'sign' | 'execute'> = [
      'validate', 'reject', 'defer', 'submit', 'create', 'sign', 'execute',
    ];
    actions.forEach((action) => {
      const role = getRequiredRoleForAction(ETAPES_CHAINE_DEPENSE.NOTE_SEF, action);
      expect(typeof role).toBe('string');
      expect(role.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// getAccessDeniedMessage
// ============================================

describe('getAccessDeniedMessage', () => {
  it('should return a French message for validate', () => {
    const msg = getAccessDeniedMessage(ETAPES_CHAINE_DEPENSE.NOTE_SEF, 'validate');
    expect(msg).toContain('requis');
    expect(msg).toContain('valider');
  });

  it('should return a message for sign', () => {
    const msg = getAccessDeniedMessage(ETAPES_CHAINE_DEPENSE.ORDONNANCEMENT, 'sign');
    expect(msg).toContain('signer');
  });

  it('should return a message for execute', () => {
    const msg = getAccessDeniedMessage(ETAPES_CHAINE_DEPENSE.REGLEMENT, 'execute');
    expect(msg).toContain('ex\u00e9cuter');
  });
});
