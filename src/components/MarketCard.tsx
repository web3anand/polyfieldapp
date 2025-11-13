import { Users, Clock, TrendingUp as TrendingUpIcon, TrendingDown, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';
import type { Market } from '../types';
import { memo } from 'react';
import { useMarketPrices } from '../hooks/useMarketPrices';

interface MarketCardProps {
  market: Market;
  onBet: (market: Market) => void;
}

export const MarketCard = memo(function MarketCard({ market, onBet }: MarketCardProps) {
  // Real-time price updates via WebSocket
  const { yesPrice, noPrice, isConnected } = useMarketPrices(market);
  
  // Use real-time prices if available, fallback to market prices
  const displayYesPrice = yesPrice || market.yesPrice;
  const displayNoPrice = noPrice || market.noPrice;
  return (
    <motion.div 
      className="glass-card rounded-2xl p-3 transition-all cursor-pointer group hover:shadow-lg bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] relative overflow-hidden will-change-transform"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full pointer-events-none"
        transition={{ duration: 0.6, ease: "linear" }}
      />
      
      {/* Title with Image */}
      <div className="flex gap-2 mb-3 relative z-10">
        <motion.div
          transition={{ duration: 0.5 }}
        >
          <ImageWithFallback
            src={market.imageUrl || `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop`}
            alt={market.category}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        </motion.div>
        <h3 className="text-[var(--text-primary)] text-sm font-normal leading-snug flex-1 line-clamp-3">{market.title}</h3>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mb-2 pb-2 relative z-10">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{(market.participants / 1000).toFixed(1)}k</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{market.endDate}</span>
        </div>
        <div className="ml-auto font-medium text-[var(--text-secondary)]">
          {market.volume}
        </div>
      </div>

      {/* Betting Options */}
      <div className="grid grid-cols-2 gap-2 relative z-10">
        <motion.button
          onClick={() => onBet(market)}
          className="btn-retro btn-retro-yes rounded-none p-2 transition-all font-semibold relative overflow-hidden"
          style={{
            boxShadow: '0 4px 0 0 rgba(16, 185, 129, 0.6)',
            imageRendering: 'pixelated'
          }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex flex-col items-center font-[Days_One] text-[20px]">
            <span className="text-[10px] mb-0.5">YES</span>
            <motion.span 
              key={displayYesPrice}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
              className="text-sm"
            >
              {displayYesPrice}¢
            </motion.span>
            {isConnected && (
              <span className="text-[8px] text-emerald-400 opacity-75 animate-pulse">●</span>
            )}
          </div>
        </motion.button>

        <motion.button
          onClick={() => onBet(market)}
          className="btn-retro btn-retro-no rounded-none p-2 transition-all font-semibold relative overflow-hidden"
          style={{
            boxShadow: '0 4px 0 0 rgba(244, 63, 94, 0.6)',
            imageRendering: 'pixelated'
          }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex flex-col items-center font-[Days_One] text-[16px]">
            <span className="text-[10px] mb-0.5">NO</span>
            <motion.span 
              key={displayNoPrice}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
              className="text-sm"
            >
              {displayNoPrice}¢
            </motion.span>
            {isConnected && (
              <span className="text-[8px] text-rose-400 opacity-75 animate-pulse">●</span>
            )}
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
});