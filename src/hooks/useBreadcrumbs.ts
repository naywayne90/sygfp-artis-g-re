/**
 * useBreadcrumbs - Auto-generation de breadcrumbs depuis modules.registry
 *
 * Parcourt la hiérarchie parent du module courant pour construire
 * le fil d'Ariane automatiquement.
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MODULES_REGISTRY, type ModuleConfig } from '@/config/modules.registry';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Trouve le module correspondant à la route courante.
 * Gère les routes paramétrées (ex: /notes-sef/:id -> /notes-sef/xxx)
 */
function findModuleByPath(pathname: string): ModuleConfig | undefined {
  // 1. Correspondance exacte
  const exact = MODULES_REGISTRY.find((m) => m.route !== null && m.route === pathname);
  if (exact) return exact;

  // 2. Correspondance sans query params (ex: /admin/utilisateurs?status=actif)
  const withoutQuery = MODULES_REGISTRY.find(
    (m) => m.route !== null && m.route.split('?')[0] === pathname
  );
  if (withoutQuery) return withoutQuery;

  // 3. Correspondance paramétrique (ex: /notes-sef/:id)
  for (const mod of MODULES_REGISTRY) {
    if (!mod.route || !mod.route.includes(':')) continue;
    const pattern = mod.route.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(pathname)) return mod;
  }

  // 4. Correspondance par préfixe (ex: /tresorerie/mouvements/banque pour /tresorerie)
  const segments = pathname.split('/').filter(Boolean);
  for (let i = segments.length; i > 0; i--) {
    const partial = '/' + segments.slice(0, i).join('/');
    const match = MODULES_REGISTRY.find(
      (m) => m.route !== null && m.route.split('?')[0] === partial
    );
    if (match) return match;
  }

  return undefined;
}

/**
 * Construit la chaîne de breadcrumbs en remontant la hiérarchie parent
 */
function buildBreadcrumbChain(module: ModuleConfig): BreadcrumbItem[] {
  const chain: BreadcrumbItem[] = [];
  const visited = new Set<string>();

  // Remonter la hiérarchie parent
  let current: ModuleConfig | undefined = module;
  while (current) {
    if (visited.has(current.id)) break;
    visited.add(current.id);

    chain.unshift({
      label: current.name,
      href: current.route?.split('?')[0] || undefined,
    });

    if (current.parent) {
      current = MODULES_REGISTRY.find((m) => m.id === current?.parent);
    } else {
      break;
    }
  }

  // Toujours commencer par "Accueil"
  if (chain.length === 0 || chain[0].label !== 'Tableau de bord') {
    chain.unshift({ label: 'Accueil', href: '/' });
  } else {
    chain[0] = { label: 'Accueil', href: '/' };
  }

  // Le dernier élément n'a pas de href (page courante)
  if (chain.length > 0) {
    delete chain[chain.length - 1].href;
  }

  return chain;
}

/**
 * Hook principal - génère les breadcrumbs pour la route courante
 */
export function useBreadcrumbs(overrides?: BreadcrumbItem[]): BreadcrumbItem[] {
  const location = useLocation();

  return useMemo(() => {
    // Si des overrides sont fournis, les utiliser
    if (overrides && overrides.length > 0) {
      return [{ label: 'Accueil', href: '/' }, ...overrides];
    }

    // Page d'accueil
    if (location.pathname === '/') {
      return [{ label: 'Accueil' }];
    }

    const module = findModuleByPath(location.pathname);
    if (!module) {
      // Fallback: générer depuis le path
      const segments = location.pathname.split('/').filter(Boolean);
      const items: BreadcrumbItem[] = [{ label: 'Accueil', href: '/' }];
      segments.forEach((seg, i) => {
        const isLast = i === segments.length - 1;
        items.push({
          label: seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          href: isLast ? undefined : '/' + segments.slice(0, i + 1).join('/'),
        });
      });
      return items;
    }

    return buildBreadcrumbChain(module);
  }, [location.pathname, overrides]);
}

/**
 * Retourne la route parente pour le bouton retour
 */
export function useParentRoute(): string {
  const location = useLocation();

  return useMemo(() => {
    const module = findModuleByPath(location.pathname);

    if (module?.parent) {
      const parent = MODULES_REGISTRY.find((m) => m.id === module.parent);
      if (parent?.route) return parent.route.split('?')[0];
    }

    // Fallback: remonter d'un segment
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length > 1) {
      return '/' + segments.slice(0, -1).join('/');
    }

    return '/';
  }, [location.pathname]);
}
