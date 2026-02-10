import { describe, it, expect } from 'vitest';
import {
  STATUTS,
  WORKFLOW_STEPS,
  getStepConfig,
  getStepByModule,
  canOwn,
  canValidate,
  checkPrerequisites,
  isValidatedStatus,
  isTerminalStatus,
  getAvailableTransitions,
  canTransition,
  getNextAction,
  getStatutUIConfig,
  getBlockingMessage,
  type WorkflowStep,
  type Statut,
} from '../workflowEngine';

// ============================================
// getStepConfig
// ============================================

describe('getStepConfig', () => {
  it('should return config for step 1 (Note SEF)', () => {
    const config = getStepConfig(1);
    expect(config.code).toBe('NOTE_SEF');
    expect(config.label).toContain('Sans Engagement Financier');
    expect(config.table).toBe('notes_sef');
    expect(config.prerequisSteps).toEqual([]);
  });

  it('should return config for step 9 (Reglement)', () => {
    const config = getStepConfig(9);
    expect(config.code).toBe('REGLEMENT');
    expect(config.table).toBe('reglements');
    expect(config.prerequisSteps).toEqual([8]);
    expect(config.nextStep).toBeUndefined();
  });

  it('should have correct chain linking for all 9 steps', () => {
    for (let i = 1; i <= 9; i++) {
      const config = getStepConfig(i as WorkflowStep);
      expect(config.id).toBe(i);
      if (i < 9) {
        expect(config.nextStep).toBe(i + 1);
      }
      if (i > 1) {
        expect(config.previousStep).toBe(i - 1);
      }
    }
  });
});

// ============================================
// getStepByModule
// ============================================

describe('getStepByModule', () => {
  it('should find step by table name', () => {
    const step = getStepByModule('notes_sef');
    expect(step).toBeDefined();
    expect(step?.id).toBe(1);
  });

  it('should find step by code', () => {
    const step = getStepByModule('ENGAGEMENT');
    expect(step).toBeDefined();
    expect(step?.id).toBe(6);
  });

  it('should return undefined for unknown module', () => {
    const step = getStepByModule('unknown_table');
    expect(step).toBeUndefined();
  });

  it('should find all 9 modules by table name', () => {
    const tables = [
      'notes_sef', 'notes_dg', 'imputations', 'expressions_besoin',
      'marches', 'budget_engagements', 'budget_liquidations',
      'ordonnancements', 'reglements',
    ];
    tables.forEach((table) => {
      expect(getStepByModule(table)).toBeDefined();
    });
  });
});

// ============================================
// canOwn
// ============================================

describe('canOwn', () => {
  it('should allow ADMIN on all steps', () => {
    for (let i = 1; i <= 9; i++) {
      expect(canOwn(i as WorkflowStep, ['ADMIN'])).toBe(true);
    }
  });

  it('should allow AGENT to own step 1 (Note SEF)', () => {
    expect(canOwn(1, ['AGENT'])).toBe(true);
  });

  it('should allow AGENT to own step 2 (Note AEF)', () => {
    expect(canOwn(2, ['AGENT'])).toBe(true);
  });

  it('should not allow AGENT to own step 3 (Imputation)', () => {
    expect(canOwn(3, ['AGENT'])).toBe(false);
  });

  it('should allow CB to own step 3 (Imputation)', () => {
    expect(canOwn(3, ['CB'])).toBe(true);
  });

  it('should allow DAAF to own step 6 (Engagement)', () => {
    expect(canOwn(6, ['DAAF'])).toBe(true);
  });

  it('should allow TRESORERIE to own step 9 (Reglement)', () => {
    expect(canOwn(9, ['TRESORERIE'])).toBe(true);
  });

  it('should not allow TRESORERIE to own step 1 (Note SEF)', () => {
    expect(canOwn(1, ['TRESORERIE'])).toBe(false);
  });

  it('should allow users with multiple roles if any matches', () => {
    expect(canOwn(3, ['AGENT', 'CB'])).toBe(true);
  });
});

// ============================================
// canValidate
// ============================================

describe('canValidate', () => {
  it('should allow ADMIN to validate all steps', () => {
    for (let i = 1; i <= 9; i++) {
      expect(canValidate(i as WorkflowStep, ['ADMIN'])).toBe(true);
    }
  });

  it('should allow DG to validate step 1 (Note SEF)', () => {
    expect(canValidate(1, ['DG'])).toBe(true);
  });

  it('should not allow AGENT to validate step 1 (Note SEF)', () => {
    expect(canValidate(1, ['AGENT'])).toBe(false);
  });

  it('should allow DIRECTEUR to validate step 2 (Note AEF)', () => {
    expect(canValidate(2, ['DIRECTEUR'])).toBe(true);
  });

  it('should allow CB to validate step 3 (Imputation)', () => {
    expect(canValidate(3, ['CB'])).toBe(true);
  });

  it('should allow CB to validate step 6 (Engagement)', () => {
    expect(canValidate(6, ['CB'])).toBe(true);
  });

  it('should allow DG to validate step 7 (Liquidation)', () => {
    expect(canValidate(7, ['DG'])).toBe(true);
  });

  it('should allow DG to validate step 8 (Ordonnancement)', () => {
    expect(canValidate(8, ['DG'])).toBe(true);
  });

  it('should allow TRESORERIE to validate step 9 (Reglement)', () => {
    expect(canValidate(9, ['TRESORERIE'])).toBe(true);
  });

  it('should not allow OPERATEUR to validate any step', () => {
    for (let i = 1; i <= 9; i++) {
      expect(canValidate(i as WorkflowStep, ['OPERATEUR'])).toBe(false);
    }
  });
});

// ============================================
// checkPrerequisites
// ============================================

describe('checkPrerequisites', () => {
  const emptyState: Record<WorkflowStep, Statut | null> = {
    1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null,
  };

  it('should always pass for step 1 (no prerequisites)', () => {
    const result = checkPrerequisites(1, emptyState);
    expect(result.valid).toBe(true);
  });

  it('should allow step 2 (AEF) without validated SEF (optional prerequisite)', () => {
    const result = checkPrerequisites(2, emptyState);
    expect(result.valid).toBe(true);
  });

  it('should fail step 3 (Imputation) without validated AEF', () => {
    const result = checkPrerequisites(3, emptyState);
    expect(result.valid).toBe(false);
    expect(result.code).toBe('PREREQUIS_NON_VALIDE');
  });

  it('should pass step 3 when AEF is validated', () => {
    const state = { ...emptyState, 2: STATUTS.VALIDE as Statut };
    const result = checkPrerequisites(3, state);
    expect(result.valid).toBe(true);
  });

  it('should fail step 4 (Expression Besoin) without imputation', () => {
    const result = checkPrerequisites(4, emptyState);
    expect(result.valid).toBe(false);
  });

  it('should pass step 4 when imputation is done', () => {
    const state = { ...emptyState, 3: STATUTS.IMPUTE as Statut };
    const result = checkPrerequisites(4, state);
    expect(result.valid).toBe(true);
  });

  it('should skip step 5 (Marche) when amount < threshold', () => {
    const result = checkPrerequisites(5, emptyState, 1000000);
    expect(result.valid).toBe(true);
  });

  it('should fail step 5 when amount >= threshold and expression besoin not validated', () => {
    const result = checkPrerequisites(5, emptyState, 10000000);
    expect(result.valid).toBe(false);
  });

  it('should pass step 6 (Engagement) when expression besoin is validated', () => {
    const state = { ...emptyState, 4: STATUTS.VALIDE as Statut };
    const result = checkPrerequisites(6, state);
    expect(result.valid).toBe(true);
  });

  it('should fail step 7 (Liquidation) without validated engagement', () => {
    const result = checkPrerequisites(7, emptyState);
    expect(result.valid).toBe(false);
  });

  it('should pass step 7 when engagement is validated', () => {
    const state = { ...emptyState, 6: STATUTS.VALIDE as Statut };
    const result = checkPrerequisites(7, state);
    expect(result.valid).toBe(true);
  });

  it('should pass prerequisite check when status is IMPUTE', () => {
    const state = { ...emptyState, 2: STATUTS.IMPUTE as Statut };
    const result = checkPrerequisites(3, state);
    expect(result.valid).toBe(true);
  });

  it('should pass prerequisite check when status is SIGNE', () => {
    const state = { ...emptyState, 8: STATUTS.SIGNE as Statut };
    const result = checkPrerequisites(9, state);
    expect(result.valid).toBe(true);
  });

  it('should fail prerequisite check when status is BROUILLON', () => {
    const state = { ...emptyState, 2: STATUTS.BROUILLON as Statut };
    const result = checkPrerequisites(3, state);
    expect(result.valid).toBe(false);
  });

  it('should fail prerequisite check when status is REJETE', () => {
    const state = { ...emptyState, 2: STATUTS.REJETE as Statut };
    const result = checkPrerequisites(3, state);
    expect(result.valid).toBe(false);
  });
});

// ============================================
// isValidatedStatus
// ============================================

describe('isValidatedStatus', () => {
  it('should return true for VALIDE', () => {
    expect(isValidatedStatus(STATUTS.VALIDE)).toBe(true);
  });

  it('should return true for IMPUTE', () => {
    expect(isValidatedStatus(STATUTS.IMPUTE)).toBe(true);
  });

  it('should return true for SIGNE', () => {
    expect(isValidatedStatus(STATUTS.SIGNE)).toBe(true);
  });

  it('should return true for PAYE', () => {
    expect(isValidatedStatus(STATUTS.PAYE)).toBe(true);
  });

  it('should return true for CLOTURE', () => {
    expect(isValidatedStatus(STATUTS.CLOTURE)).toBe(true);
  });

  it('should return false for BROUILLON', () => {
    expect(isValidatedStatus(STATUTS.BROUILLON)).toBe(false);
  });

  it('should return false for SOUMIS', () => {
    expect(isValidatedStatus(STATUTS.SOUMIS)).toBe(false);
  });

  it('should return false for REJETE', () => {
    expect(isValidatedStatus(STATUTS.REJETE)).toBe(false);
  });

  it('should return false for DIFFERE', () => {
    expect(isValidatedStatus(STATUTS.DIFFERE)).toBe(false);
  });

  it('should return false for ANNULE', () => {
    expect(isValidatedStatus(STATUTS.ANNULE)).toBe(false);
  });
});

// ============================================
// isTerminalStatus
// ============================================

describe('isTerminalStatus', () => {
  it('should return true for CLOTURE', () => {
    expect(isTerminalStatus(STATUTS.CLOTURE)).toBe(true);
  });

  it('should return true for ANNULE', () => {
    expect(isTerminalStatus(STATUTS.ANNULE)).toBe(true);
  });

  it('should return false for VALIDE', () => {
    expect(isTerminalStatus(STATUTS.VALIDE)).toBe(false);
  });

  it('should return false for PAYE', () => {
    expect(isTerminalStatus(STATUTS.PAYE)).toBe(false);
  });

  it('should return false for BROUILLON', () => {
    expect(isTerminalStatus(STATUTS.BROUILLON)).toBe(false);
  });
});

// ============================================
// getAvailableTransitions
// ============================================

describe('getAvailableTransitions', () => {
  it('should return SUBMIT transition for brouillon notes_sef', () => {
    const transitions = getAvailableTransitions('notes_sef', STATUTS.BROUILLON, ['AGENT']);
    const actions = transitions.map((t) => t.action);
    expect(actions).toContain('SUBMIT');
  });

  it('should return VALIDATE for soumis notes_sef with DG role', () => {
    const transitions = getAvailableTransitions('notes_sef', STATUTS.SOUMIS, ['DG']);
    const actions = transitions.map((t) => t.action);
    expect(actions).toContain('VALIDATE');
  });

  it('should return REJECT and DEFER for soumis notes_sef with DG role', () => {
    const transitions = getAvailableTransitions('notes_sef', STATUTS.SOUMIS, ['DG']);
    const actions = transitions.map((t) => t.action);
    expect(actions).toContain('REJECT');
    expect(actions).toContain('DEFER');
  });

  it('should return RESUBMIT for differe status', () => {
    const transitions = getAvailableTransitions('notes_sef', STATUTS.DIFFERE, ['AGENT']);
    const actions = transitions.map((t) => t.action);
    expect(actions).toContain('RESUBMIT');
  });

  it('should return REVISE for rejete status', () => {
    const transitions = getAvailableTransitions('notes_sef', STATUTS.REJETE, ['AGENT']);
    const actions = transitions.map((t) => t.action);
    expect(actions).toContain('REVISE');
  });

  it('should return empty for unknown module', () => {
    const transitions = getAvailableTransitions('unknown', STATUTS.BROUILLON, ['ADMIN']);
    expect(transitions).toEqual([]);
  });

  it('should return IMPUTE transition for imputations module', () => {
    const transitions = getAvailableTransitions('imputations', STATUTS.BROUILLON, ['CB']);
    const actions = transitions.map((t) => t.action);
    expect(actions).toContain('IMPUTE');
  });

  it('should return module-specific transitions for notes_dg', () => {
    const transitions = getAvailableTransitions('notes_dg', STATUTS.SOUMIS, ['CHEF_SERVICE']);
    const actions = transitions.map((t) => t.action);
    expect(actions).toContain('FORWARD_DIR');
  });

  it('should return SIGN for ordonnancements en_signature with DG', () => {
    const transitions = getAvailableTransitions('ordonnancements', STATUTS.EN_SIGNATURE, ['DG']);
    const actions = transitions.map((t) => t.action);
    expect(actions).toContain('SIGN');
  });

  it('should return PAY for reglements soumis with TRESORERIE', () => {
    const transitions = getAvailableTransitions('reglements', STATUTS.SOUMIS, ['TRESORERIE']);
    const actions = transitions.map((t) => t.action);
    expect(actions).toContain('PAY');
  });

  it('should return CLOSE for reglements paye with TRESORERIE', () => {
    const transitions = getAvailableTransitions('reglements', STATUTS.PAYE, ['TRESORERIE']);
    const actions = transitions.map((t) => t.action);
    expect(actions).toContain('CLOSE');
  });

  it('should filter transitions by required roles', () => {
    const transitions = getAvailableTransitions('notes_dg', STATUTS.SOUMIS, ['AGENT']);
    const actions = transitions.map((t) => t.action);
    // AGENT should not see FORWARD_DIR (requires CHEF_SERVICE)
    expect(actions).not.toContain('FORWARD_DIR');
  });

  it('should allow ADMIN to bypass role restrictions', () => {
    const transitions = getAvailableTransitions('notes_dg', STATUTS.SOUMIS, ['ADMIN']);
    const actions = transitions.map((t) => t.action);
    expect(actions).toContain('FORWARD_DIR');
  });
});

// ============================================
// canTransition
// ============================================

describe('canTransition', () => {
  it('should allow brouillon -> soumis for notes_sef', () => {
    const result = canTransition('notes_sef', STATUTS.BROUILLON, STATUTS.SOUMIS, ['AGENT']);
    expect(result.valid).toBe(true);
  });

  it('should allow soumis -> valide for notes_sef with DG', () => {
    const result = canTransition('notes_sef', STATUTS.SOUMIS, STATUTS.VALIDE, ['DG']);
    expect(result.valid).toBe(true);
  });

  it('should deny brouillon -> valide (skipping soumis)', () => {
    const result = canTransition('notes_sef', STATUTS.BROUILLON, STATUTS.VALIDE, ['DG']);
    expect(result.valid).toBe(false);
    expect(result.code).toBe('TRANSITION_NON_AUTORISEE');
  });

  it('should allow soumis -> rejete', () => {
    const result = canTransition('notes_sef', STATUTS.SOUMIS, STATUTS.REJETE, ['DG']);
    expect(result.valid).toBe(true);
  });

  it('should allow soumis -> differe', () => {
    const result = canTransition('notes_sef', STATUTS.SOUMIS, STATUTS.DIFFERE, ['DG']);
    expect(result.valid).toBe(true);
  });

  it('should allow differe -> soumis (resubmit)', () => {
    const result = canTransition('notes_sef', STATUTS.DIFFERE, STATUTS.SOUMIS, ['AGENT']);
    expect(result.valid).toBe(true);
  });

  it('should allow rejete -> brouillon (revise)', () => {
    const result = canTransition('notes_sef', STATUTS.REJETE, STATUTS.BROUILLON, ['AGENT']);
    expect(result.valid).toBe(true);
  });

  it('should deny valide -> brouillon (no backward transition)', () => {
    const result = canTransition('notes_sef', STATUTS.VALIDE, STATUTS.BROUILLON, ['ADMIN']);
    expect(result.valid).toBe(false);
  });
});

// ============================================
// getNextAction
// ============================================

describe('getNextAction', () => {
  it('should recommend SUBMIT for brouillon', () => {
    const action = getNextAction('notes_sef', STATUTS.BROUILLON, ['AGENT']);
    expect(action).not.toBeNull();
    expect(action?.toStatus).toBe(STATUTS.SOUMIS);
  });

  it('should recommend VALIDATE for soumis with validator role', () => {
    const action = getNextAction('notes_sef', STATUTS.SOUMIS, ['DG']);
    expect(action).not.toBeNull();
    expect(action?.toStatus).toBe(STATUTS.VALIDE);
  });

  it('should return null when no transitions available', () => {
    const action = getNextAction('notes_sef', STATUTS.CLOTURE, ['ADMIN']);
    expect(action).toBeNull();
  });

  it('should have requiresMotif true for reject actions', () => {
    const transitions = getAvailableTransitions('notes_sef', STATUTS.SOUMIS, ['DG']);
    const rejectTransition = transitions.find((t) => t.action === 'REJECT');
    expect(rejectTransition?.requiresMotif).toBe(true);
  });

  it('should have requiresMotif true for defer actions', () => {
    const transitions = getAvailableTransitions('notes_sef', STATUTS.SOUMIS, ['DG']);
    const deferTransition = transitions.find((t) => t.action === 'DEFER');
    expect(deferTransition?.requiresMotif).toBe(true);
  });

  it('should have requiresMotif false for submit', () => {
    const transitions = getAvailableTransitions('notes_sef', STATUTS.BROUILLON, ['AGENT']);
    const submitTransition = transitions.find((t) => t.action === 'SUBMIT');
    expect(submitTransition?.requiresMotif).toBe(false);
  });
});

// ============================================
// getStatutUIConfig
// ============================================

describe('getStatutUIConfig', () => {
  it('should return config for known statut', () => {
    const config = getStatutUIConfig(STATUTS.VALIDE);
    expect(config.label).toBe('Valid\u00e9');
    expect(config.icon).toBe('CheckCircle');
  });

  it('should return config for brouillon', () => {
    const config = getStatutUIConfig(STATUTS.BROUILLON);
    expect(config.label).toBe('Brouillon');
  });

  it('should return fallback for unknown statut', () => {
    const config = getStatutUIConfig('unknown_statut');
    expect(config.label).toBe('unknown_statut');
    expect(config.icon).toBe('Circle');
  });
});

// ============================================
// getBlockingMessage
// ============================================

describe('getBlockingMessage', () => {
  it('should return a message for unknown module', () => {
    const msg = getBlockingMessage('unknown', STATUTS.BROUILLON, 'SUBMIT');
    expect(msg).toBe('Module inconnu');
  });

  it('should return a string for known module', () => {
    const msg = getBlockingMessage('notes_sef', STATUTS.BROUILLON, 'VALIDATE');
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});

// ============================================
// WORKFLOW_STEPS structure integrity
// ============================================

describe('WORKFLOW_STEPS structure', () => {
  it('should have exactly 9 steps', () => {
    expect(Object.keys(WORKFLOW_STEPS)).toHaveLength(9);
  });

  it('should have unique codes for each step', () => {
    const codes = Object.values(WORKFLOW_STEPS).map((s) => s.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(9);
  });

  it('should have unique tables for each step', () => {
    const tables = Object.values(WORKFLOW_STEPS).map((s) => s.table);
    const uniqueTables = new Set(tables);
    expect(uniqueTables.size).toBe(9);
  });

  it('should have owners defined for every step', () => {
    Object.values(WORKFLOW_STEPS).forEach((step) => {
      expect(step.owners.length).toBeGreaterThan(0);
    });
  });

  it('should have validators defined for every step', () => {
    Object.values(WORKFLOW_STEPS).forEach((step) => {
      expect(step.validators.length).toBeGreaterThan(0);
    });
  });

  it('should have validStatuts defined for every step', () => {
    Object.values(WORKFLOW_STEPS).forEach((step) => {
      expect(step.validStatuts.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// STATUTS constants
// ============================================

describe('STATUTS constants', () => {
  it('should have all expected statut values', () => {
    expect(STATUTS.BROUILLON).toBe('brouillon');
    expect(STATUTS.SOUMIS).toBe('soumis');
    expect(STATUTS.VALIDE).toBe('valide');
    expect(STATUTS.REJETE).toBe('rejete');
    expect(STATUTS.DIFFERE).toBe('differe');
    expect(STATUTS.IMPUTE).toBe('impute');
    expect(STATUTS.EN_SIGNATURE).toBe('en_signature');
    expect(STATUTS.SIGNE).toBe('signe');
    expect(STATUTS.PAYE).toBe('paye');
    expect(STATUTS.CLOTURE).toBe('cloture');
    expect(STATUTS.ANNULE).toBe('annule');
  });
});
