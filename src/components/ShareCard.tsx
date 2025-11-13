import { TrendingUp, TrendingDown, Trophy, Target, Zap } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ShareCardProps {
  type: 'position' | 'portfolio';
  pnl: number;
  pnlPercentage: string;
  title?: string;
  side?: 'yes' | 'no';
  shares?: number;
  totalValue?: number;
  invested?: number;
  positionsCount?: number;
  character?: string;
  characterPosition?: 'left' | 'right' | 'bottom';
}

const characters = {
  'anime-girl-1': 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop',
  'anime-girl-2': 'https://images.unsplash.com/photo-1614259187500-ed88cbdfecb9?w=400&h=600&fit=crop',
  'gamer': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop',
  'champion': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=600&fit=crop',
  'cyber': 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400&h=600&fit=crop',
  'none': ''
};

export function ShareCard({
  type,
  pnl,
  pnlPercentage,
  title,
  side,
  shares,
  totalValue,
  invested,
  positionsCount,
  character = 'none',
  characterPosition = 'right'
}: ShareCardProps) {
  const isProfit = pnl >= 0;
  const showCharacter = character !== 'none';
  const characterUrl = characters[character as keyof typeof characters];

  return (
    <div 
      id="share-card"
      className="relative w-[600px] h-[800px] bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 overflow-hidden"
      style={{
        fontFamily: 'Orbitron, system-ui, sans-serif'
      }}
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* CRT Scanlines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px)',
          zIndex: 10
        }}
      />

      {/* Character Image */}
      {showCharacter && characterUrl && (
        <div 
          className={`absolute ${
            characterPosition === 'left' ? 'left-0 top-1/2 -translate-y-1/2' :
            characterPosition === 'right' ? 'right-0 top-1/2 -translate-y-1/2' :
            'bottom-0 left-1/2 -translate-x-1/2'
          } z-0 opacity-40`}
          style={{
            width: characterPosition === 'bottom' ? '100%' : '50%',
            height: characterPosition === 'bottom' ? '50%' : '100%',
            maskImage: characterPosition === 'bottom' 
              ? 'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))' 
              : characterPosition === 'left'
              ? 'linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0))'
              : 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))',
            WebkitMaskImage: characterPosition === 'bottom' 
              ? 'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))' 
              : characterPosition === 'left'
              ? 'linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0))'
              : 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))'
          }}
        >
          <ImageWithFallback 
            src={characterUrl}
            alt="Character"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col p-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold tracking-tight">
                Poly<span className="text-yellow-400">Field</span>
              </h1>
              <p className="text-indigo-300 text-sm">Trading Performance</p>
            </div>
          </div>
          
          {/* Decorative Line */}
          <div className="h-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full shadow-lg" />
        </div>

        {/* Main PnL Display */}
        <div className="flex-1 flex flex-col justify-center items-center mb-8">
          <div 
            className="relative p-8 rounded-3xl mb-6"
            style={{
              background: isProfit 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3))',
              border: isProfit 
                ? '3px solid rgb(16, 185, 129)'
                : '3px solid rgb(239, 68, 68)',
              boxShadow: isProfit
                ? '0 0 40px rgba(16, 185, 129, 0.5), inset 0 0 20px rgba(16, 185, 129, 0.2)'
                : '0 0 40px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.2)'
            }}
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                isProfit ? 'bg-emerald-500' : 'bg-rose-500'
              } shadow-2xl`}>
                {isProfit ? (
                  <TrendingUp className="w-12 h-12 text-white" />
                ) : (
                  <TrendingDown className="w-12 h-12 text-white" />
                )}
              </div>
            </div>

            {/* Percentage */}
            <div className="text-center mb-3">
              <div className={`text-7xl font-bold ${
                isProfit ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isProfit ? '+' : ''}{pnlPercentage}%
              </div>
              <div className="text-indigo-200 text-xl mt-2">Return</div>
            </div>

            {/* Dollar Amount */}
            <div className={`text-center text-5xl font-bold ${
              isProfit ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              {isProfit ? '+' : ''}${Math.abs(pnl).toFixed(2)}
            </div>
          </div>

          {/* Title for Position Type */}
          {type === 'position' && title && (
            <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-indigo-500 max-w-md">
              <div className="text-white text-center font-semibold text-lg mb-2">{title}</div>
              <div className="flex items-center justify-center gap-3">
                {side && (
                  <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                    side === 'yes' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {side.toUpperCase()}
                  </span>
                )}
                {shares && (
                  <span className="text-indigo-300 text-sm">{shares} shares</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-3 gap-4">
          {type === 'portfolio' && (
            <>
              <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl border-2 border-purple-500">
                <div className="text-purple-300 text-xs uppercase tracking-wider mb-1">Positions</div>
                <div className="text-white text-2xl font-bold">{positionsCount}</div>
              </div>
              <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl border-2 border-blue-500">
                <div className="text-blue-300 text-xs uppercase tracking-wider mb-1">Invested</div>
                <div className="text-white text-2xl font-bold">${invested?.toFixed(0)}</div>
              </div>
              <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl border-2 border-yellow-500">
                <div className="text-yellow-300 text-xs uppercase tracking-wider mb-1">Value</div>
                <div className="text-white text-2xl font-bold">${totalValue?.toFixed(0)}</div>
              </div>
            </>
          )}
          
          {type === 'position' && (
            <>
              <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl border-2 border-blue-500">
                <div className="text-blue-300 text-xs uppercase tracking-wider mb-1">Invested</div>
                <div className="text-white text-2xl font-bold">${invested?.toFixed(0)}</div>
              </div>
              <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl border-2 border-yellow-500">
                <div className="text-yellow-300 text-xs uppercase tracking-wider mb-1">Value</div>
                <div className="text-white text-2xl font-bold">${totalValue?.toFixed(0)}</div>
              </div>
              <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl border-2 border-emerald-500">
                <div className="text-emerald-300 text-xs uppercase tracking-wider mb-1">Shares</div>
                <div className="text-white text-2xl font-bold">{shares}</div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Badge */}
        <div className="mt-6 flex justify-center">
          <div className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 px-6 py-2 rounded-full">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">PREDICTION MASTER</span>
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-yellow-400 rounded-tl-2xl" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-pink-500 rounded-tr-2xl" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-purple-500 rounded-bl-2xl" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-blue-500 rounded-br-2xl" />
    </div>
  );
}
