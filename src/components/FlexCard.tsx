import { TrendingUp, TrendingDown } from 'lucide-react';

interface FlexCardProps {
  type: 'position' | 'portfolio';
  pnl: number;
  pnlPercentage: string;
  title?: string;
  side?: 'yes' | 'no';
  shares?: number;
  totalValue?: number;
  invested?: number;
  positionsCount?: number;
  character?: 'cloud' | 'money' | 'superman';
}

// Placeholder character images - replace with actual assets when available
const characters = {
  'cloud': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=800&fit=crop',
  'money': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=800&fit=crop',
  'superman': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=800&fit=crop',
};

export function FlexCard({
  type,
  pnl,
  pnlPercentage,
  title,
  side,
  shares,
  totalValue,
  invested,
  positionsCount,
  character = 'superman'
}: FlexCardProps) {
  const isProfit = pnl >= 0;
  const characterUrl = characters[character];

  return (
    <div 
      id="flex-card"
      className="relative w-[1080px] h-[1080px] overflow-hidden"
      style={{
        fontFamily: 'Orbitron, system-ui, sans-serif',
        background: '#0a0a0a'
      }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={characterUrl}
          alt="Background"
          className="w-full h-full object-cover opacity-30"
        />
        {/* Simple dark overlay */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-between p-16">
        {/* Header */}
        <div>
          <h1 className="text-white text-4xl font-bold tracking-tight">
            Poly<span className="text-[rgb(213,248,38)]">Field</span>
          </h1>
          <p className="text-white/50 text-lg mt-1">Prediction Markets</p>
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex items-center justify-center -mt-8">
          <div className="w-full max-w-4xl text-center">
            {/* Market Title */}
            {type === 'position' && title && (
              <div className="mb-12">
                <div className="text-white text-2xl font-semibold mb-4 leading-snug px-4">
                  {title}
                </div>
                <div className="flex items-center justify-center gap-3">
                  {side && (
                    <span className={`px-5 py-1.5 rounded-full font-bold text-base ${
                      side === 'yes' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {side.toUpperCase()}
                    </span>
                  )}
                  {shares && (
                    <span className="text-white/60 text-base">{shares} shares</span>
                  )}
                </div>
              </div>
            )}

            {/* PnL Display */}
            <div className="mb-12">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${
                  isProfit ? 'bg-emerald-500' : 'bg-rose-500'
                }`}>
                  {isProfit ? (
                    <TrendingUp className="w-14 h-14 text-white" />
                  ) : (
                    <TrendingDown className="w-14 h-14 text-white" />
                  )}
                </div>
              </div>

              {/* Percentage */}
              <div className={`font-bold mb-4 ${
                isProfit ? 'text-emerald-400' : 'text-rose-400'
              }`}
                style={{ fontSize: '120px', lineHeight: '1' }}
              >
                {isProfit ? '+' : ''}{pnlPercentage}%
              </div>

              {/* Dollar Amount */}
              <div className={`text-6xl font-bold ${
                isProfit ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {isProfit ? '+' : ''}${Math.abs(pnl).toFixed(2)}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-12">
              <div className="text-center">
                <div className="text-white/40 text-sm uppercase tracking-wide mb-2">Invested</div>
                <div className="text-white text-3xl font-bold">${invested?.toFixed(0)}</div>
              </div>
              <div className="w-px h-16 bg-white/20"></div>
              <div className="text-center">
                <div className="text-white/40 text-sm uppercase tracking-wide mb-2">Value</div>
                <div className="text-white text-3xl font-bold">${totalValue?.toFixed(0)}</div>
              </div>
              {type === 'portfolio' && positionsCount && (
                <>
                  <div className="w-px h-16 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-white/40 text-sm uppercase tracking-wide mb-2">Positions</div>
                    <div className="text-white text-3xl font-bold">{positionsCount}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="text-white/30 text-base">polyfield.app</div>
        </div>
      </div>
    </div>
  );
}
