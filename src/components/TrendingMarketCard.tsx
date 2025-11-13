import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Market } from '../types';
import { memo } from 'react';

interface TrendingMarketCardProps {
  market: Market;
  onBet: (market: Market) => void;
}

export const TrendingMarketCard = memo(function TrendingMarketCard({ market, onBet }: TrendingMarketCardProps) {
  // Simulate price change percentage
  const priceChange = market.trending === 'up' ? '+12%' : '-8%';
  const changeColor = market.trending === 'up' ? 'text-emerald-500' : 'text-rose-500';
  
  return (
    <div 
      onClick={() => onBet(market)}
      className="flex-shrink-0 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] rounded-xl p-3 transition-all cursor-pointer border border-[var(--border-color)] min-w-0"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Title and Category */}
        <div className="flex-1 min-w-0">
          <h4 className="text-[var(--text-primary)] text-xs font-semibold truncate mb-0.5">
            {market.title}
          </h4>
          <span className="text-[10px] text-[var(--text-muted)]">{market.category}</span>
        </div>

        {/* Prices */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-center">
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">YES</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{market.yesPrice}¢</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mb-0.5">NO</div>
            <div className="text-sm font-bold text-rose-600 dark:text-rose-400">{market.noPrice}¢</div>
          </div>
        </div>

        {/* Change */}
        <div className={`flex items-center gap-1 flex-shrink-0 ${changeColor}`}>
          {market.trending === 'up' ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span className="text-xs font-semibold">{priceChange}</span>
        </div>
      </div>
    </div>
  );
});