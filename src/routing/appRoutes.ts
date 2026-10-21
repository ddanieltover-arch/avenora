/**
 * @license Apache-2.0
 * Avenora — client-side path routing (History API)
 */

export type PublicViewId =
  | 'home'
  | 'personal'
  | 'business'
  | 'cards'
  | 'loans'
  | 'grants'
  | 'about'
  | 'contact'
  | 'rates'
  | 'mobile'
  | 'security'
  | 'help'
  | 'privacy'
  | 'terms';

export const PUBLIC_VIEWS: PublicViewId[] = [
  'home',
  'personal',
  'business',
  'cards',
  'loans',
  'grants',
  'about',
  'contact',
  'rates',
  'mobile',
  'security',
  'help',
  'privacy',
  'terms',
];

/** URL segment under site root (empty string = home `/`). */
export const PUBLIC_VIEW_SLUG: Record<PublicViewId, string> = {
  home: '',
  personal: 'personal',
  business: 'business',
  cards: 'cards',
  loans: 'lending',
  grants: 'grants',
  about: 'about',
  contact: 'contact',
  rates: 'rates',
  mobile: 'mobile-banking',
  security: 'security',
  help: 'help',
  privacy: 'privacy',
  terms: 'terms',
};

export type PortalTabId =
  | 'overview'
  | 'wallets'
  | 'transfers'
  | 'transactions'
  | 'cards'
  | 'loans'
  | 'grants'
  | 'statements'
  | 'kyc'
  | 'profile'
  | 'ledger'
  | 'zerofloat'
  | 'webhooks'
  | 'health'
  | 'security'
  | 'support';

export const PORTAL_TABS: PortalTabId[] = [
  'overview',
  'wallets',
  'transfers',
  'transactions',
  'cards',
  'loans',
  'grants',
  'statements',
  'kyc',
  'profile',
  'ledger',
  'zerofloat',
  'webhooks',
  'health',
  'security',
  'support',
];

export const PORTAL_TAB_SLUG: Record<PortalTabId, string> = {
  overview: '',
  wallets: 'wallets',
  transfers: 'transfers',
  transactions: 'transactions',
  cards: 'cards',
  loans: 'loans',
  grants: 'grants',
  statements: 'statements',
  kyc: 'kyc',
  profile: 'profile',
  ledger: 'ledger',
  zerofloat: 'zero-float',
  webhooks: 'webhooks',
  health: 'health',
  security: 'security',
  support: 'support',
};

export type AdminTabId =
  | 'overview'
  | 'customers'
  | 'kyc'
  | 'transactions'
  | 'loans_grants'
  | 'cards'
  | 'webhooks'
  | 'audit'
  | 'readiness';

export const ADMIN_TABS: AdminTabId[] = [
  'overview',
  'customers',
  'kyc',
  'transactions',
  'loans_grants',
  'cards',
  'webhooks',
  'audit',
  'readiness',
];

export const ADMIN_TAB_SLUG: Record<AdminTabId, string> = {
  overview: '',
  customers: 'customers',
  kyc: 'kyc',
  transactions: 'transactions',
  loans_grants: 'loans-grants',
  cards: 'cards',
  webhooks: 'webhooks',
  audit: 'audit',
  readiness: 'readiness',
};

export type AppRoute =
  | { area: 'public'; view: PublicViewId }
  | { area: 'portal'; tab: PortalTabId }
  | { area: 'admin'; tab: AdminTabId };

const PUBLIC_SLUG_TO_VIEW = Object.fromEntries(
  Object.entries(PUBLIC_VIEW_SLUG).map(([view, slug]) => [slug || '__home__', view]),
) as Record<string, PublicViewId>;

/** Accept legacy `/loans` as alias for lending page. */
PUBLIC_SLUG_TO_VIEW.loans = 'loans';

const PORTAL_SLUG_TO_TAB = Object.fromEntries(
  Object.entries(PORTAL_TAB_SLUG).map(([tab, slug]) => [slug || '__overview__', tab]),
) as Record<string, PortalTabId>;

const ADMIN_SLUG_TO_TAB = Object.fromEntries(
  Object.entries(ADMIN_TAB_SLUG).map(([tab, slug]) => [slug || '__overview__', tab]),
) as Record<string, AdminTabId>;

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '') || '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function splitSegments(pathname: string): string[] {
  return normalizePathname(pathname)
    .split('/')
    .filter(Boolean);
}

export function buildPublicPath(view: PublicViewId): string {
  const slug = PUBLIC_VIEW_SLUG[view];
  return slug ? `/${slug}` : '/';
}

export function buildPortalPath(tab: PortalTabId): string {
  const slug = PORTAL_TAB_SLUG[tab];
  return slug ? `/portal/${slug}` : '/portal';
}

export function buildAdminPath(tab: AdminTabId): string {
  const slug = ADMIN_TAB_SLUG[tab];
  return slug ? `/admin/${slug}` : '/admin';
}

export function parseAppPath(pathname: string): AppRoute {
  const segments = splitSegments(pathname);

  if (segments.length === 0) {
    return { area: 'public', view: 'home' };
  }

  if (segments[0] === 'portal') {
    const slugKey = segments[1] ?? '__overview__';
    const tab = PORTAL_SLUG_TO_TAB[slugKey] ?? 'overview';
    return { area: 'portal', tab };
  }

  if (segments[0] === 'admin') {
    const slugKey = segments[1] ?? '__overview__';
    const tab = ADMIN_SLUG_TO_TAB[slugKey] ?? 'overview';
    return { area: 'admin', tab };
  }

  if (segments.length === 1) {
    const segment = segments[0];
    if (segment) {
      const view = PUBLIC_SLUG_TO_VIEW[segment];
      if (view) {
        return { area: 'public', view };
      }
    }
  }

  return { area: 'public', view: 'home' };
}

export function pathForRoute(route: AppRoute): string {
  switch (route.area) {
    case 'public':
      return buildPublicPath(route.view);
    case 'portal':
      return buildPortalPath(route.tab);
    case 'admin':
      return buildAdminPath(route.tab);
    default:
      return '/';
  }
}

export function navigateToPath(path: string, options?: { replace?: boolean }): void {
  const normalized = normalizePathname(path);
  if (window.location.pathname === normalized) {
    return;
  }
  if (options?.replace) {
    window.history.replaceState({}, '', normalized);
  } else {
    window.history.pushState({}, '', normalized);
  }
}

export function isPublicViewId(value: string): value is PublicViewId {
  return (PUBLIC_VIEWS as string[]).includes(value);
}

export function isPortalTabId(value: string): value is PortalTabId {
  return (PORTAL_TABS as string[]).includes(value);
}

export function isAdminTabId(value: string): value is AdminTabId {
  return (ADMIN_TABS as string[]).includes(value);
}
