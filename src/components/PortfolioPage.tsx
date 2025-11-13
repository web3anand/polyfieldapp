import { TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpRight, ArrowDownRight, Target, Plus, Minus, ShoppingCart, Share2, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { PositionCard } from './PositionCard';
import { PnLGraph } from './PnLGraph';
import { FloatingStats } from './FloatingStats';
import { FlexModal } from './FlexModal';
import { usePositions } from '../hooks/usePositions';
import { useTransactions, useTrades, useClosedPositions } from '../hooks/useHistory';
import { ClosedPosition } from '../types';

export function PortfolioPage() {
  const [activeView, setActiveView] = useState<'positions' | 'history'>('positions');
  const [historyTab, setHistoryTab] = useState<'closed' | 'deposits' | 'trades'>('closed');
  const [flexModalOpen, setFlexModalOpen] = useState(false);
  const [flexData, setFlexData] = useState<any>(null);

  // Fetch data from API
  const { positions, loading: positionsLoading, error: positionsError } = usePositions();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { trades, loading: tradesLoading } = useTrades();
  const { closedPositions, loading: closedPositionsLoading } = useClosedPositions();

  const loading = positionsLoading || transactionsLoading || tradesLoading || closedPositionsLoading;

  // Calculate totals
  const { totalInvested, totalValue, totalPnL, pnlPercentage } = useMemo(() => {
    const invested = positions.reduce((sum, pos) => sum + pos.invested, 0);
    const value = positions.reduce((sum, pos) => sum + (pos.shares * (pos.currentPrice / 100)), 0);
    const pnl = value - invested;
    const pnlPct = invested > 0 ? ((pnl / invested) * 100).toFixed(2) : '0.00';
    return { totalInvested: invested, totalValue: value, totalPnL: pnl, pnlPercentage: pnlPct };
  }, [positions]);

  const handleShareClosedPosition = (position: ClosedPosition) => {
    setFlexData({
      type: 'position',
      data: {
        pnl: position.pnl,
        pnlPercentage: position.pnlPercentage.toFixed(2),
        title: position.marketTitle,
        side: position.side,
        shares: position.shares,
        totalValue: position.closedValue,
        invested: position.invested,
      }
    });
    setFlexModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <FloatingStats />
      
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-[var(--bg-primary)] border-b border-[var(--border-color)] px-4 pt-4 pb-3 relative z-10">
        <h1 className="text-[var(--text-primary)] mb-0.5">Portfolio</h1>
        <p className="text-[var(--text-secondary)] text-sm">Track your positions and performance</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 relative z-10">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}

        {/* Error State */}
        {positionsError && !loading && (
          <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-4 mb-4">
            <p className="text-rose-600 text-sm">{positionsError}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !positionsError && (
          <>
        {/* Compact Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 bg-yellow-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Value</span>
            </div>
            <div className="text-lg font-bold text-[var(--text-primary)]">${totalValue.toFixed(0)}</div>
            <div className={`text-[10px] font-semibold mt-0.5 ${totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Invested</span>
            </div>
            <div className="text-lg font-bold text-[var(--text-primary)]">${totalInvested.toFixed(0)}</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{positions.length} positions</div>
          </div>
          
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                totalPnL >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
              }`}>
                {totalPnL >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Return</span>
            </div>
            <div className={`text-lg font-bold ${totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalPnL >= 0 ? '+' : ''}{pnlPercentage}%
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">All time</div>
          </div>
        </div>

        {/* P&L Graph */}
        <PnLGraph />

        {/* Toggle Button */}
        <div className="flex gap-2 mb-4 rounded-t-[0px] rounded-b-[16px]">
          <button
            onClick={() => setActiveView('positions')}
            className={`flex-1 px-3 py-2 rounded-t-[0px] rounded-b-xl font-semibold text-sm transition-all ${
              activeView === 'positions'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'glass-card text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              <span>Positions ({positions.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`flex-1 px-3 py-2 rounded-t-[0px] rounded-b-xl font-semibold text-sm transition-all ${
              activeView === 'history'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'glass-card text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>History</span>
            </div>
          </button>
        </div>

        {/* Positions View */}
        {activeView === 'positions' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[var(--text-primary)] text-lg">Active Positions</h2>
              {positions.length > 0 && (
                <button 
                  onClick={() => {
                    if (window.confirm(`Close all ${positions.length} positions?`)) {
                      console.log('Closing all positions');
                    }
                  }}
                  className="pixel-button bg-[rgb(213,248,38)] hover:bg-red-700 text-[rgb(42,23,23)] px-3 py-1.5 text-xs font-bold transition-all font-[Days_One] rounded-[14px]"
                >
                  CLOSE ALL
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {positions.map((position) => (
                <div key={position.id}>
                  <PositionCard position={position} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History View */}
        {activeView === 'history' && (
          <div>
            <h2 className="text-[var(--text-primary)] text-lg mb-3">Transaction History</h2>
            
            {/* History Tabs */}
            <div className="relative flex gap-1 mb-3 p-1 bg-[rgb(4,4,4)] rounded-2xl border border-[var(--border-color)]">
              {/* Sliding indicator */}
              <div 
                className="absolute top-1 bottom-1 transition-all duration-300 ease-out rounded-xl"
                style={{
                  left: historyTab === 'closed' ? '4px' : historyTab === 'deposits' ? 'calc(33.333% + 2px)' : 'calc(66.666%)',
                  width: 'calc(33.333% - 4px)',
                  background: '#10b981',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                }}
              />
              
              <button
                onClick={() => setHistoryTab('closed')}
                className={`relative z-10 flex-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                  historyTab === 'closed'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                style={{ fontFamily: 'Days One, sans-serif', fontSize: '13px', letterSpacing: '0.5px' }}
              >
                Closed
              </button>
              <button
                onClick={() => setHistoryTab('deposits')}
                className={`relative z-10 flex-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                  historyTab === 'deposits'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                style={{ fontFamily: 'Days One, sans-serif', fontSize: '13px', letterSpacing: '0.5px' }}
              >
                Deposits
              </button>
              <button
                onClick={() => setHistoryTab('trades')}
                className={`relative z-10 flex-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                  historyTab === 'trades'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                style={{ fontFamily: 'Days One, sans-serif', fontSize: '13px', letterSpacing: '0.5px' }}
              >
                Trades
              </button>
            </div>

            {/* Closed Positions */}
            {historyTab === 'closed' && (
              <div className="space-y-3">
                {closedPositions.map((position) => (
                  <div key={position.id} className="glass-card rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-full overflow-hidden border border-[var(--border-color)] flex-shrink-0 ${
                        position.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}>
                        <img 
                          src={position.marketImage || `https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=100&h=100&fit=crop`}
                          alt={position.marketTitle}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-[var(--text-primary)] font-medium text-sm mb-2 leading-snug">
                          {position.marketTitle}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            position.side === 'yes' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                          }`}>
                            {position.side.toUpperCase()}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">{position.shares} shares</span>
                          <span className="text-xs text-[var(--text-muted)]">•</span>
                          <span className="text-xs text-[var(--text-muted)]">{position.closedDate}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Invested</div>
                              <div className="text-[var(--text-primary)] font-semibold text-sm">${position.invested}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Closed</div>
                              <div className="text-[var(--text-primary)] font-semibold text-sm">${position.closedValue}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className={`font-bold text-sm ${
                                position.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                              </div>
                              <div className={`text-xs font-semibold ${
                                position.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {position.pnl >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleShareClosedPosition(position)}
                              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                              title="Share position"
                            >
                              <Share2 className="w-4 h-4 text-[var(--text-muted)]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Deposits & Withdrawals */}
            {historyTab === 'deposits' && (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'deposit' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}>
                      {transaction.type === 'deposit' ? (
                        <Plus className="w-5 h-5 text-white" />
                      ) : (
                        <Minus className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[var(--text-primary)] font-semibold text-sm capitalize">
                          {transaction.type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          transaction.status === 'completed' 
                            ? 'bg-emerald-500/20 text-emerald-600' 
                            : 'bg-yellow-500/20 text-yellow-600'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span>{transaction.method}</span>
                        <span>•</span>
                        <span>{transaction.date}</span>
                      </div>
                    </div>
                    <div className={`font-bold ${
                      transaction.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Trade History */}
            {historyTab === 'trades' && (
              <div className="space-y-2">
                {trades.map((trade) => (
                  <div key={trade.id} className="glass-card rounded-xl p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--hover-bg)]`}>
                        <img 
                          src={trade.marketImage || `https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=100&h=100&fit=crop`}
                          alt={trade.market}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[var(--text-primary)] text-sm font-medium mb-1 line-clamp-2">
                          {trade.marketTitle}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            trade.action === 'buy' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-purple-500 text-white'
                          }`}>
                            {trade.action.toUpperCase()}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            trade.side === 'yes' 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-rose-500 text-white'
                          }`}>
                            {trade.side.toUpperCase()}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {trade.shares} shares @ ${trade.price}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[var(--text-primary)] font-bold text-sm">
                          ${trade.total}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {trade.date}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
      {flexModalOpen && flexData && (
        <FlexModal
          isOpen={flexModalOpen}
          onClose={() => setFlexModalOpen(false)}
          type={flexData.type}
          data={flexData.data}
        />
      )}
    </div>
  );
}