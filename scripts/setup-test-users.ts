/**
 * Script de configuration des utilisateurs de test
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/setup-test-users.ts
 *
 * La clé service_role se trouve dans:
 *   Dashboard Supabase > Settings > API > service_role key
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY non définie');
  console.log('\nUsage:');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/setup-test-users.ts');
  console.log('\nTrouvez la clé dans: Dashboard Supabase > Settings > API > service_role key');
  process.exit(1);
}

// Client admin avec bypass RLS
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface TestUser {
  email: string;
  full_name: string;
  role_hierarchique: string;
  profil_fonctionnel: string;
  direction_id: string;
  direction_code: string;
  poste: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'dg@arti.ci',
    full_name: 'Directeur GENERAL',
    role_hierarchique: 'DG',
    profil_fonctionnel: 'Validateur',
    direction_id: '92f5f18f-dcaf-4f96-b50d-4a8e5ea9f8bf',
    direction_code: 'DG',
    poste: 'Directeur Général',
  },
  {
    email: 'daaf@arti.ci',
    full_name: 'Chef DAAF',
    role_hierarchique: 'Directeur',
    profil_fonctionnel: 'Validateur',
    direction_id: '4ad86b02-8fa8-4b6e-abff-d9350fbe7928',
    direction_code: 'DAAF',
    poste: 'Directeur Administratif et Financier',
  },
  {
    email: 'agent.dsi@arti.ci',
    full_name: 'Agent DSI',
    role_hierarchique: 'Agent',
    profil_fonctionnel: 'Operationnel',
    direction_id: '6ecac2e4-876d-4197-a27f-cfb03c1cd457',
    direction_code: 'DSI',
    poste: 'Agent Informatique',
  },
];

async function updateTestUsers() {
  console.log('🔧 Configuration des utilisateurs de test...\n');

  for (const user of TEST_USERS) {
    console.log(`📝 Mise à jour: ${user.email}`);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        role_hierarchique: user.role_hierarchique,
        profil_fonctionnel: user.profil_fonctionnel,
        direction_id: user.direction_id,
        direction_code: user.direction_code,
        poste: user.poste,
        updated_at: new Date().toISOString(),
      })
      .eq('email', user.email)
      .select();

    if (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`   ✅ ${user.full_name} - ${user.role_hierarchique} / ${user.profil_fonctionnel}`);
    } else {
      console.log(`   ⚠️ Profil non trouvé pour ${user.email}`);
    }
  }

  console.log('\n📊 Vérification finale...\n');

  const { data: profiles, error: verifyError } = await supabase
    .from('profiles')
    .select('email, full_name, role_hierarchique, profil_fonctionnel, direction_code')
    .in('email', TEST_USERS.map((u) => u.email));

  if (verifyError) {
    console.error('❌ Erreur de vérification:', verifyError.message);
  } else if (profiles) {
    console.log('┌──────────────────────┬─────────────────────┬────────────┬────────────────┬───────────┐');
    console.log('│ Email                │ Nom                 │ Rôle Hier. │ Profil Fonct.  │ Direction │');
    console.log('├──────────────────────┼─────────────────────┼────────────┼────────────────┼───────────┤');

    for (const p of profiles) {
      const email = (p.email || '').padEnd(20).substring(0, 20);
      const name = (p.full_name || '').padEnd(19).substring(0, 19);
      const role = (p.role_hierarchique || '').padEnd(10).substring(0, 10);
      const profil = (p.profil_fonctionnel || '').padEnd(14).substring(0, 14);
      const dir = (p.direction_code || '').padEnd(9).substring(0, 9);
      console.log(`│ ${email} │ ${name} │ ${role} │ ${profil} │ ${dir} │`);
    }

    console.log('└──────────────────────┴─────────────────────┴────────────┴────────────────┴───────────┘');
  }

  console.log('\n✅ Configuration terminée!');
  console.log('\nUtilisateurs de test disponibles:');
  console.log('  - dg@arti.ci       / Test2026!  → Validateur (DG)');
  console.log('  - daaf@arti.ci     / Test2026!  → Validateur (DAAF)');
  console.log('  - agent.dsi@arti.ci / Test2026! → Opérationnel (DSI)');
}

updateTestUsers().catch(console.error);
