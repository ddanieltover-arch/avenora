/**
 * @license Apache-2.0
 * Avenora — sync React tree with browser URL slugs
 */

import { useCallback, useEffect, useState } from 'react';
import {
  AppRoute,
  PublicViewId,
  PortalTabId,
  AdminTabId,
  buildAdminPath,
  buildPortalPath,
  buildPublicPath,
  isPublicViewId,
  isPortalTabId,
  isAdminTabId,
  navigateToPath,
  parseAppPath,
  pathForRoute,
} from './appRoutes.ts';

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(() => parseAppPath(window.location.pathname));

  const syncFromLocation = useCallback(() => {
    setRoute(parseAppPath(window.location.pathname));
  }, []);

  useEffect(() => {
    const canonical = pathForRoute(route);
    if (window.location.pathname !== canonical) {
      navigateToPath(canonical, { replace: true });
    }
  }, [route]);

  useEffect(() => {
    const onPopState = () => syncFromLocation();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [syncFromLocation]);

  const goToPath = useCallback((path: string, options?: { replace?: boolean; scroll?: boolean }) => {
    navigateToPath(path, { replace: options?.replace });
    setRoute(parseAppPath(path));
    if (options?.scroll !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const navigatePublic = useCallback(
    (view: PublicViewId) => {
      goToPath(buildPublicPath(view));
    },
    [goToPath],
  );

  const navigatePortal = useCallback(
    (tab: PortalTabId = 'overview') => {
      goToPath(buildPortalPath(tab));
    },
    [goToPath],
  );

  const navigateAdmin = useCallback(
    (tab: AdminTabId = 'overview') => {
      goToPath(buildAdminPath(tab));
    },
    [goToPath],
  );

  const navigatePublicById = useCallback(
    (viewId: string) => {
      navigatePublic(isPublicViewId(viewId) ? viewId : 'home');
    },
    [navigatePublic],
  );

  const navigatePortalById = useCallback(
    (tabId: string) => {
      navigatePortal(isPortalTabId(tabId) ? tabId : 'overview');
    },
    [navigatePortal],
  );

  const navigateAdminById = useCallback(
    (tabId: string) => {
      navigateAdmin(isAdminTabId(tabId) ? tabId : 'overview');
    },
    [navigateAdmin],
  );

  return {
    route,
    navigatePublic,
    navigatePublicById,
    navigatePortal,
    navigatePortalById,
    navigateAdmin,
    navigateAdminById,
    goToPath,
  };
}
