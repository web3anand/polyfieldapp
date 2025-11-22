import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { memo, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Position {
  id: string;
  marketTitle: string;
  side: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  invested: number;
}

interface PositionCardProps {
  position: Position;
}

export const PositionCard = memo(function PositionCard({ position }: PositionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { currentValue, pnl, pnlPercentage, isProfit } = useMemo(() => {
    const currentValue = position.shares * (position.currentPrice / 100);
    const pnl = currentValue - position.invested;
    const pnlPercentage = ((pnl / position.invested) * 100).toFixed(2);
    const isProfit = pnl >= 0;
    return { currentValue, pnl, pnlPercentage, isProfit };
  }, [position.shares, position.currentPrice, position.invested]);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleSell = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`Sold ${position.shares} ${position.side.toUpperCase()} shares at market price!`);
    setIsExpanded(false);
  }, [position.shares, position.side]);

  return (
    <div>
      <div className="glass-card p-4 transition-all hover:shadow-lg cursor-pointer rounded-t-[16px] rounded-b-[0px]" onClick={handleToggle}>
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-[var(--text-primary)] mb-2 leading-snug text-sm">{position.marketTitle}</h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              position.side === 'yes' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-rose-500 text-white'
            }`}>
              {position.side.toUpperCase()}
            </span>
            <span className="text-xs text-[var(--text-muted)]">{position.shares} shares</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-3 pb-3 border-b border-[var(--border-color)]">
          <div>
            <div className="text-[10px] text-[var(--text-muted)] mb-0.5 uppercase tracking-wider">Avg</div>
            <div className="text-[var(--text-primary)] font-semibold text-sm">{position.avgPrice}¢</div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-muted)] mb-0.5 uppercase tracking-wider">Now</div>
            <div className="text-[var(--text-primary)] font-semibold text-sm">{position.currentPrice}¢</div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-muted)] mb-0.5 uppercase tracking-wider">Cost</div>
            <div className="text-[var(--text-primary)] font-semibold text-sm">${position.invested}</div>
          </div>
        </div>

        {/* PnL */}
        <div className={`flex items-center justify-between p-2.5 rounded-xl font-semibold ${
          isProfit 
            ? 'bg-emerald-500 text-white' 
            : 'bg-rose-500 text-white'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="text-xs">
              {isProfit ? '+' : ''}{pnlPercentage}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold">
              {isProfit ? '+' : ''}${pnl.toFixed(2)}
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Expandable Sell Section - Outside main card */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className={`rounded-b-2xl px-3 py-2 -mt-1 ${
              isProfit ? 'bg-emerald-500/20' : 'bg-rose-500/20'
            }`} style={{ 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <div
                onClick={handleSell}
                className="w-full py-2 text-rose-500 hover:text-rose-600 rounded-xl text-lg font-semibold transition-all active:scale-[0.98] cursor-pointer text-center"
                style={{ fontFamily: 'Days One, cursive' }}
              >
                Sell at Market Price
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});