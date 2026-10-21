/**
 * @license Apache-2.0
 * Avenora — mobile activity hub (transactions + insights)
 */

import React, { useState } from 'react';
import { TransactionsView } from '../../TransactionsView.tsx';
import { MobileTransactionAnalytics } from './MobileTransactionAnalytics.tsx';
import type { PortalTransactionSummary } from '../../../hooks/usePortalDashboardData.ts';

interface MobileActivityScreenProps {
  transactions: PortalTransactionSummary[];
  transactionsLoading: boolean;
  initialSearchQuery?: string | null;
  onInitialSearchConsumed?: () => void;
}

export const MobileActivityScreen: React.FC<MobileActivityScreenProps> = ({
  transactions,
  transactionsLoading,
  initialSearchQuery,
  onInitialSearchConsumed,
}) => {
  const [segment, setSegment] = useState<'list' | 'insights'>('list');

  return (
    <div className="max-w-lg mx-auto w-full space-y-4">
      <div
        className="flex rounded-2xl bg-white border border-[#E2E8E4] p-1"
        role="tablist"
        aria-label="Activity views"
      >
        <button
          type="button"
          role="tab"
          aria-selected={segment === 'list'}
          onClick={() => setSegment('list')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
            segment === 'list' ? 'bg-[#075B46] text-white' : 'text-[#68746E]'
          }`}
        >
          Transactions
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={segment === 'insights'}
          onClick={() => setSegment('insights')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
            segment === 'insights' ? 'bg-[#075B46] text-white' : 'text-[#68746E]'
          }`}
        >
          Insights
        </button>
      </div>

      {segment === 'list' ? (
        <div className="portal-mobile-narrow">
          <TransactionsView
            initialSearchQuery={initialSearchQuery}
            onInitialSearchConsumed={onInitialSearchConsumed}
          />
        </div>
      ) : (
        <MobileTransactionAnalytics transactions={transactions} loading={transactionsLoading} />
      )}
    </div>
  );
};
