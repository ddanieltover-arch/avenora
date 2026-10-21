/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Main Application Entry Point (Phase 04)
 */

import React from 'react';
import { LocalizationProvider } from './components/LocalizationContext.tsx';
import { AuthProvider } from './components/AuthContext.tsx';
import { PublicWebsite } from './components/public/PublicWebsite.tsx';
import { CustomerPortal } from './components/CustomerPortal.tsx';
import { AdminControlCenter } from './components/admin/AdminControlCenter.tsx';
import { useAppRoute } from './routing/useAppRoute.ts';

function MainApp() {
  const {
    route,
    navigatePublicById,
    navigatePortalById,
    navigatePortal,
    navigateAdmin,
    goToPath,
  } = useAppRoute();

  const handleBackToPublic = () => {
    goToPath('/');
  };

  if (route.area === 'admin') {
    return (
      <AdminControlCenter
        activeTab={route.tab}
        onTabChange={navigateAdmin}
        onBackToPortal={() => navigatePortal('overview')}
        onBackToPublic={handleBackToPublic}
      />
    );
  }

  if (route.area === 'portal') {
    return (
      <CustomerPortal
        activeTab={route.tab}
        onTabChange={navigatePortal}
        onOpenAdmin={() => navigateAdmin('overview')}
      />
    );
  }

  return (
    <PublicWebsite
      currentView={route.view}
      onNavigate={navigatePublicById}
      onOpenPortal={(tab) => navigatePortalById(tab ?? 'overview')}
      onOpenAdmin={() => navigateAdmin('overview')}
    />
  );
}

export default function App() {
  return (
    <LocalizationProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LocalizationProvider>
  );
}
