import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Filter, TrendingUp, Globe, Zap, Trophy, Coins, Briefcase, TrendingDown, Flame, Award, Target, Circle, Disc, Loader2 } from 'lucide-react';
import { MarketCard } from './MarketCard';
import { BetSheet } from './BetSheet';
import type { Market } from '../types';
import { useMarkets } from '../hooks/useMarkets';

// Test function - available in dev mode (loads dynamically)
import('../utils/testMarketsFetch').then(({ runMarketsTest }) => {
  (window as any).testMarkets = runMarketsTest;
  if (process.env.NODE_ENV === 'development') {
    console.log('💡 Dev tip: Run testMarkets() in console to test markets fetching');
  }
}).catch(() => {
  // Ignore if test file doesn't exist
});

const categoryIcons = {
  All: Globe,
  Football: Trophy,
  Basketball: Circle,
  Baseball: Disc,
  Soccer: Target,
  Tennis: TrendingUp,
  Hockey: Zap,
  MMA: Flame,
  Boxing: Award,
  Cricket: Coins,
};

const categoryClasses = {
  All: 'category-all',
  Football: 'bg-orange-600',
  Basketball: 'bg-orange-500',
  Baseball: 'bg-blue-600',
  Soccer: 'bg-green-600',
  Tennis: 'bg-yellow-600',
  Hockey: 'bg-cyan-600',
  MMA: 'bg-red-600',
  Boxing: 'bg-purple-600',
  Cricket: 'bg-emerald-600',
};

const categories = ['All', 'Football', 'Basketball', 'Baseball', 'Soccer', 'Tennis', 'Hockey', 'MMA', 'Boxing', 'Cricket'] as const;

export function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  // Fetch markets from API
  const { markets: apiMarkets, loading: marketsLoading, error: marketsError } = useMarkets();

  const loading = marketsLoading;

  // Use API data if available, otherwise fallback to empty array (will show loading/empty state)
  const markets = apiMarkets.length > 0 ? apiMarkets : [];

  const filteredMarkets = useMemo(() => {
    const filtered = markets.filter(market => {
      const matchesCategory = selectedCategory === 'All' || market.category === selectedCategory;
      const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development' && selectedCategory !== 'All') {
      const categoryCounts = markets.reduce((acc, m) => {
        acc[m.category] = (acc[m.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`📊 Market categories:`, categoryCounts);
      console.log(`🔍 Filtering for "${selectedCategory}": ${filtered.length} markets found`);
    }
    
    return filtered;
  }, [markets, selectedCategory, searchQuery]);

  const handleBet = useCallback((market: Market) => {
    setSelectedMarket(market);
  }, []);

  // Debug logging
  useEffect(() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      console.log('[MarketsPage] loading:', loading, 'markets:', markets.length, 'error:', marketsError);
    }
  }, [loading, markets.length, marketsError]);

  return (
    <div className="flex flex-col h-screen">
      {/* Loading State - Full Screen Centered */}
      {loading ? (
        <div className="flex items-center justify-center flex-1 h-full w-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] text-sm">Loading markets...</p>
            {import.meta.env.DEV && (
              <p className="text-[var(--text-muted)] text-xs mt-2">Check console for details</p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Error State */}
          {marketsError && (
            <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-4 m-4">
              <p className="text-rose-600 text-sm font-semibold mb-1">Failed to load markets</p>
              <p className="text-rose-600/80 text-xs">{marketsError}</p>
              {import.meta.env.DEV && (
                <p className="text-rose-600/60 text-xs mt-2">Check console and network tab</p>
              )}
            </div>
          )}

          {/* Fixed Header Section */}
          <div className="flex-shrink-0 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        {/* App Name */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-[var(--text-primary)] text-2xl font-bold tracking-tight">
            Poly<span className="text-indigo-600">Field</span>
          </h1>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] w-4 h-4" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] rounded-xl focus:outline-none transition-all text-sm text-[rgb(255,255,255)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          <button className="bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] px-3 py-2 rounded-xl transition-all">
            <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 rounded-[3px]">
          {categories.map((category) => {
            const Icon = categoryIcons[category];
            const colorClass = categoryClasses[category];
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  selectedCategory === category
                    ? `${colorClass} text-white shadow-lg scale-105`
                    : 'bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:bg-[var(--active-bg)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {category}
              </button>
            );
          })}
        </div>

        {/* Section Header - Fixed */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[12px] mx-[2px] my-[3px] mt-[1px] mr-[2px] mb-[5px] ml-[5px] py-[4px] px-[12px] border border-slate-700/50 shadow-lg">
          <h2 className="text-slate-100 font-semibold text-sm flex items-center gap-2 font-[Inter] tracking-wide">
            {(() => {
              const Icon = categoryIcons[selectedCategory as keyof typeof categoryIcons];
              return <Icon className="w-4 h-4 text-amber-400" />;
            })()}
            {selectedCategory} Markets
          </h2>
        </div>
      </div>

          {/* Scrollable Markets Grid */}
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 bg-[var(--bg-primary)] mt-0 pt-6 rounded-t-[16px] rounded-b-[0px] border-t border-[#FFD700]">
            {filteredMarkets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center max-w-md">
              <Globe className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
              <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-2">
                {marketsError ? 'Failed to Load Markets' : 'No Markets Found'}
              </h3>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                {marketsError 
                  ? marketsError 
                  : searchQuery 
                    ? `No markets match "${searchQuery}"` 
                    : 'Markets will appear here once loaded'}
              </p>
              {marketsError && (
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-sm font-medium transition-all"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMarkets.map((market) => (
              <MarketCard 
                key={market.id} 
                market={market}
                onBet={handleBet}
              />
            ))}
          </div>
            )}
          </div>

          {/* Bet Sheet */}
          {selectedMarket && (
            <BetSheet
              market={selectedMarket}
              onClose={() => setSelectedMarket(null)}
            />
          )}
        </>
      )}
    </div>
  );
}