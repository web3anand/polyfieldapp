import { X, Info, TrendingUp, ArrowUpDown, Plus, Minus } from 'lucide-react';
import { useState, memo } from 'react';
import type { Market } from '../types';
import { toast } from 'sonner';
import { PriceChart } from './PriceChart';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'framer-motion';
import { placeOrderViaProxy } from '../services/clobApi';
import { useOrderBook } from '../hooks/useOrderBook';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { useLiveScores } from '../hooks/useLiveScores';
import { useWallet } from '../hooks/useWallet';

interface BetSheetProps {
  market: Market;
  onClose: () => void;
}

export function BetSheet({ market, onClose }: BetSheetProps) {
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('1');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [shares, setShares] = useState('1');
  const [showExpiration, setShowExpiration] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Real-time price updates
  const { yesPrice, noPrice, isConnected: priceConnected } = useMarketPrices(market);
  
  // Live scores and percentages
  const { homeScore, awayScore, yesPercentage, noPercentage, period, isConnected: scoreConnected } = useLiveScores(market);
  
  // Order book data
  const { orderBook, loading: orderBookLoading } = useOrderBook(market);
  
  // Wallet connection
  const { address, isConnected: isWalletConnected } = useWallet();
  
  // Check if Privy is configured
  const isPrivyConfigured = import.meta.env.VITE_PRIVY_APP_ID && import.meta.env.VITE_PRIVY_APP_ID.length > 0;

  // Use real-time prices (from live scores hook for consistency)
  const price = betSide === 'yes' ? yesPercentage : noPercentage;
  const priceInDollars = price / 100;
  const isConnected = priceConnected || scoreConnected;
  
  // Use real order book or fallback to empty
  const mockOrderBook = orderBook || {
    yes: { bids: [], asks: [] },
    no: { bids: [], asks: [] },
  };
  
  // Calculate for market orders
  const totalCost = orderType === 'market' 
    ? amount ? (parseFloat(amount) * priceInDollars).toFixed(2) : '0.00'
    : limitPrice && shares ? (parseFloat(limitPrice) * parseFloat(shares)).toFixed(2) : '0.00';
  
  const potentialWin = orderType === 'market'
    ? amount ? (parseFloat(amount) * (1 - priceInDollars)).toFixed(2) : '0.00'
    : limitPrice && shares ? (parseFloat(shares) * (1 - parseFloat(limitPrice))).toFixed(2) : '0.00';

  const calculatedShares = orderType === 'market' && amount 
    ? Math.floor(parseFloat(amount) / priceInDollars) 
    : 0;

  // Mock matching shares for limit orders
  const matchingShares = orderType === 'limit' && limitPrice 
    ? Math.min(parseFloat(shares || '0'), 100)
    : 0;

  // Get order book for selected side (YES or NO)
  const selectedOrderBook = betSide === 'yes' ? mockOrderBook.yes : mockOrderBook.no;

  const handlePlaceBet = async () => {
    try {
      setIsPlacingOrder(true);
      
      const sharesCount = orderType === 'market' ? calculatedShares : parseFloat(shares);
      const orderPrice = orderType === 'market' ? priceInDollars : parseFloat(limitPrice);
      
      // Get user wallet address from Privy or use placeholder
      // If Privy is not configured, use a placeholder address
      const userAddress = address || '0x0000000000000000000000000000000000000000';
      
      if (!address && isPrivyConfigured) {
        toast.error('Please connect your wallet to place orders');
        return;
      }
      
      if (!isPrivyConfigured) {
        toast.info('Wallet connection required for trading. Set VITE_PRIVY_APP_ID to enable authentication.');
        return;
      }
      
      // Place order via backend proxy
      const result = await placeOrderViaProxy({
        tokenId: market.id, // This might need to be the actual token ID from Polymarket
        side: action === 'buy' ? 'BUY' : 'SELL',
        size: sharesCount.toString(),
        price: orderPrice,
        user: userAddress,
      });

      toast.success(`Order placed! ${action === 'buy' ? 'Buying' : 'Selling'} ${sharesCount} ${betSide.toUpperCase()} shares at ${(orderPrice * 100).toFixed(0)}¢`);
      onClose();
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order. Make sure your backend is running and wallet is connected.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const adjustAmount = (delta: number) => {
    const current = parseFloat(amount) || 0;
    const newAmount = Math.max(0, current + delta);
    setAmount(newAmount.toString());
  };

  const adjustShares = (delta: number) => {
    const current = parseFloat(shares) || 0;
    const newAmount = Math.max(0, current + delta);
    setShares(newAmount.toString());
  };

  const adjustLimitPrice = (delta: number) => {
    const current = parseFloat(limitPrice) || priceInDollars;
    const newPrice = Math.max(0.01, Math.min(1, current + delta));
    setLimitPrice(newPrice.toFixed(2));
  };

  const setMaxAmount = () => {
    setAmount('1000'); // Mock max balance
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up max-w-2xl mx-auto">
        <div className="bg-[var(--bg-card)] rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto border-t border-[var(--border-color)]">
          {/* Header */}
          <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between z-10 rounded-t-[16px] rounded-b-[0px] pt-[18px] pr-[24px] pb-[16px] pl-[24px] mt-[2px] mr-[0px] mb-[0px] ml-[0px]">
            <div className="flex gap-2 bg-[var(--hover-bg)] p-1 rounded-full relative">
              {action === 'buy' ? (
                <motion.div
                  layoutId="slider"
                  className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-emerald-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  style={{ willChange: 'transform' }}
                />
              ) : (
                <motion.div
                  layoutId="slider"
                  className="absolute top-1 bottom-1 right-1 w-[calc(50%-4px)] rounded-full bg-rose-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  style={{ willChange: 'transform' }}
                />
              )}
              <button
                onClick={() => setAction('buy')}
                className={`flex-1 px-4 py-2 rounded-full font-semibold text-sm transition-colors relative z-10 ${
                  action === 'buy'
                    ? 'text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                style={{ fontFamily: 'Days One, cursive' }}
              >
                Buy
              </button>
              <button
                onClick={() => setAction('sell')}
                className={`flex-1 px-4 py-2 rounded-full font-semibold text-sm transition-colors relative z-10 ${
                  action === 'sell'
                    ? 'text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                style={{ fontFamily: 'Days One, cursive' }}
              >
                Sell
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setOrderType(orderType === 'market' ? 'limit' : 'market')}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 font-[Days_One] text-[20px]"
              >
                {orderType === 'market' ? 'Market' : 'Limit'}
                <ArrowUpDown className="w-3 h-3" />
              </button>
              
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4 pb-24">
            {/* Market Info */}
            <div className="flex items-center gap-3">
              <ImageWithFallback
                src={market.imageUrl || `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop`}
                alt={market.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="text-[var(--text-primary)] font-medium text-sm">{market.title}</h3>
              </div>
            </div>

            {/* Live Score Section */}
            <div className="glass-card rounded-xl p-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30">
              <div className="text-center mb-2">
                <div className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-0.5 flex items-center justify-center gap-1">
                  Live Score
                  {scoreConnected && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">{market.category} • {market.endDate}</div>
              </div>
              
              <div className="flex items-center justify-between gap-3">
                {/* Team 1 */}
                <div className="flex-1 text-center">
                  <div className="w-9 h-9 mx-auto mb-1.5 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-base font-bold text-emerald-400">🏆</span>
                  </div>
                  <div className="font-semibold text-[var(--text-primary)] text-xs mb-0.5">Home</div>
                  <motion.div 
                    key={homeScore}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-xl font-bold text-emerald-400 font-[Orbitron]"
                  >
                    {homeScore}
                  </motion.div>
                  <div className="text-[9px] text-emerald-400 mt-0.5">YES {yesPercentage}%</div>
                </div>

                {/* VS Divider */}
                <div className="flex flex-col items-center">
                  <div className="text-[10px] text-[var(--text-muted)] font-semibold px-1.5 py-0.5 bg-[var(--hover-bg)] rounded-full">VS</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{period}</div>
                </div>

                {/* Team 2 */}
                <div className="flex-1 text-center">
                  <div className="w-9 h-9 mx-auto mb-1.5 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <span className="text-base font-bold text-rose-400">⚡</span>
                  </div>
                  <div className="font-semibold text-[var(--text-primary)] text-xs mb-0.5">Away</div>
                  <motion.div 
                    key={awayScore}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-xl font-bold text-rose-400 font-[Orbitron]"
                  >
                    {awayScore}
                  </motion.div>
                  <div className="text-[9px] text-rose-400 mt-0.5">NO {noPercentage}%</div>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <PriceChart market={market} betSide={betSide} />

            {/* Outcome Selection */}
            <div className="flex gap-2 bg-[var(--hover-bg)] p-1 rounded-lg border border-[var(--border-color)]">
              <button
                onClick={() => setBetSide('yes')}
                className={`flex-1 px-3 py-2 rounded-md transition-all text-sm font-semibold text-center ${
                  betSide === 'yes'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:bg-emerald-500/10'
                }`}
                style={{ fontFamily: 'Days One, cursive' }}
              >
                YES{' '}
                <motion.span 
                  key={yesPercentage}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {yesPercentage}¢
                </motion.span>
                {isConnected && <span className="text-[8px] text-emerald-200 animate-pulse">●</span>}
              </button>
              <button
                onClick={() => setBetSide('no')}
                className={`flex-1 px-3 py-2 rounded-md transition-all text-sm font-semibold text-center ${
                  betSide === 'no'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:bg-rose-500/10'
                }`}
                style={{ fontFamily: 'Days One, cursive' }}
              >
                NO{' '}
                <motion.span 
                  key={noPercentage}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {noPercentage}¢
                </motion.span>
                {isConnected && <span className="text-[8px] text-rose-200 animate-pulse">●</span>}
              </button>
            </div>

            {/* Market Order Interface */}
            {orderType === 'market' && (
              <>
                <div>
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <button
                      onClick={() => adjustAmount(-1)}
                      className="w-11 h-11 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] rounded-xl flex items-center justify-center transition-all border border-[var(--border-color)] flex-shrink-0"
                    >
                      <Minus className="w-5 h-5 text-[var(--text-primary)]" />
                    </button>
                    
                    <div className="flex items-center justify-center gap-1 flex-1">
                      <span className="text-5xl font-bold text-[var(--text-primary)] font-[Days_One]">
                        $
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-auto min-w-[60px] max-w-[180px] text-5xl font-bold text-[var(--text-primary)] font-[Days_One] leading-tight bg-transparent border-none outline-none text-left appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        style={{ 
                          fontFamily: 'Days One, cursive',
                          width: `${Math.max(60, (amount?.length || 1) * 42)}px`
                        }}
                      />
                    </div>
                    
                    <button
                      onClick={() => adjustAmount(1)}
                      className="w-11 h-11 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] rounded-xl flex items-center justify-center transition-all border border-[var(--border-color)] flex-shrink-0"
                    >
                      <Plus className="w-5 h-5 text-[var(--text-primary)]" />
                    </button>
                  </div>

                  {/* Win Amount & Avg Price */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--hover-bg)] rounded-xl border border-[var(--border-color)] mb-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-[var(--text-muted)] mb-1">Avg. Price</span>
                      <span className="font-bold text-[var(--text-primary)]">{price}¢</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-[var(--text-muted)] mb-1">To Win</span>
                      <span className={`font-bold ${action === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>💸 ${potentialWin}</span>
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="flex gap-2">
                    {[25, 50, 75].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setAmount((balance * pct / 100).toFixed(2))}
                        className="flex-1 px-2 py-2 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] text-[var(--text-primary)] rounded-xl text-sm font-semibold transition-all border border-[var(--border-color)] text-center"
                      >
                        {pct}%
                      </button>
                    ))}
                    <button
                      onClick={setMaxAmount}
                      className="flex-1 px-2 py-2 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] text-[var(--text-primary)] rounded-xl text-sm font-semibold transition-all border border-[var(--border-color)] text-center"
                    >
                      Max
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Limit Order Interface */}
            {orderType === 'limit' && (
              <>
                {/* Order Book Display - Prominent for Limit Orders */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    Order Book
                    {orderBookLoading && (
                      <span className="text-xs text-[var(--text-muted)]">(Loading...)</span>
                    )}
                  </h3>
                  {orderBookLoading ? (
                    <div className="text-center text-[var(--text-muted)] text-xs py-4">
                      Loading order book...
                    </div>
                  ) : selectedOrderBook && (selectedOrderBook.bids.length > 0 || selectedOrderBook.asks.length > 0) ? (
                    <div className="glass-card rounded-xl p-3 border border-[var(--border-color)]">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Bids (Buy Orders) */}
                        <div>
                          <p className="text-emerald-400 font-semibold text-xs mb-2 text-center">Bids (Buy)</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {selectedOrderBook.bids.slice(0, 5).map((entry, index) => (
                              <div 
                                key={index}
                                onClick={() => {
                                  if (action === 'buy') {
                                    setLimitPrice((entry.price / 100).toFixed(2));
                                  }
                                }}
                                className={`flex justify-between text-xs p-1.5 rounded cursor-pointer transition-all ${
                                  action === 'buy' && limitPrice === (entry.price / 100).toFixed(2)
                                    ? 'bg-emerald-500/20 border border-emerald-500/40'
                                    : 'hover:bg-emerald-500/10'
                                }`}
                              >
                                <span className="text-emerald-400 font-medium">{entry.price}¢</span>
                                <span className="text-[var(--text-secondary)]">{entry.shares.toFixed(0)}</span>
                              </div>
                            ))}
                            {selectedOrderBook.bids.length === 0 && (
                              <p className="text-[var(--text-muted)] text-xs text-center py-2">No bids</p>
                            )}
                          </div>
                        </div>
                        {/* Asks (Sell Orders) */}
                        <div>
                          <p className="text-rose-400 font-semibold text-xs mb-2 text-center">Asks (Sell)</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {selectedOrderBook.asks.slice(0, 5).map((entry, index) => (
                              <div 
                                key={index}
                                onClick={() => {
                                  if (action === 'sell') {
                                    setLimitPrice((entry.price / 100).toFixed(2));
                                  }
                                }}
                                className={`flex justify-between text-xs p-1.5 rounded cursor-pointer transition-all ${
                                  action === 'sell' && limitPrice === (entry.price / 100).toFixed(2)
                                    ? 'bg-rose-500/20 border border-rose-500/40'
                                    : 'hover:bg-rose-500/10'
                                }`}
                              >
                                <span className="text-rose-400 font-medium">{entry.price}¢</span>
                                <span className="text-[var(--text-secondary)]">{entry.shares.toFixed(0)}</span>
                              </div>
                            ))}
                            {selectedOrderBook.asks.length === 0 && (
                              <p className="text-[var(--text-muted)] text-xs text-center py-2">No asks</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-[9px] text-[var(--text-muted)] text-center mt-2">
                        Click a price to set limit
                      </p>
                    </div>
                  ) : (
                    <div className="glass-card rounded-xl p-4 border border-[var(--border-color)] text-center">
                      <p className="text-[var(--text-muted)] text-xs mb-1">Order book unavailable</p>
                      <p className="text-[9px] text-[var(--text-muted)]">
                        Backend proxy required for CLOB API
                      </p>
                    </div>
                  )}
                </div>

                {/* Limit Price */}
                <div>
                  <label className="text-sm font-semibold text-[var(--text-primary)] mb-3 block">
                    Limit Price
                  </label>
                  <div>
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder={(priceInDollars).toFixed(2)}
                      step="0.01"
                      className="w-full px-4 py-3 bg-[var(--hover-bg)] rounded-xl text-center text-xl font-bold text-[var(--text-primary)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Shares */}
                <div>
                  <label className="text-sm font-semibold text-[var(--text-primary)] mb-2 block">
                    Shares
                  </label>
                  <div className="mb-2">
                    <input
                      type="number"
                      value={shares}
                      onChange={(e) => setShares(e.target.value)}
                      placeholder="1"
                      className="w-full px-4 py-3 bg-[var(--hover-bg)] rounded-xl text-center text-xl font-bold text-[var(--text-primary)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  {/* Matching Indicator */}
                  {matchingShares > 0 && (
                    <div className={`mb-2 px-3 py-1.5 rounded-lg ${
                      action === 'buy' 
                        ? 'bg-emerald-500/20 border border-emerald-500/40' 
                        : 'bg-rose-500/20 border border-rose-500/40'
                    }`}>
                      <span className={`text-xs font-semibold ${action === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {matchingShares.toFixed(2)} matching
                      </span>
                    </div>
                  )}

                  {/* Quick Share Buttons */}
                  <div className="flex gap-2">
                    {[
                      { label: '25%', value: 250 },
                      { label: '50%', value: 500 },
                      { label: '75%', value: 750 },
                      { label: 'Max', value: 1000 }
                    ].map((option) => (
                      <button
                        key={option.label}
                        onClick={() => setShares(option.value.toString())}
                        className="flex-1 px-2 py-2 bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] text-[var(--text-primary)] rounded-xl text-sm font-semibold transition-all border border-[var(--border-color)] text-center"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total & To Win */}
                <div className="space-y-2 px-4 py-3 bg-[var(--hover-bg)] rounded-xl border border-[var(--border-color)] mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Total</span>
                    <span className="text-lg font-bold text-[var(--text-primary)]">${totalCost}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">To Win</span>
                    <span className={`text-lg font-bold ${action === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>💸 ${potentialWin}</span>
                  </div>
                </div>

                {/* Set Expiration */}
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--hover-bg)] rounded-xl border border-[var(--border-color)] mb-4">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Set expiration</span>
                  <button
                    onClick={() => setShowExpiration(!showExpiration)}
                    className={`relative w-12 h-6 rounded-full transition-all ${
                      showExpiration ? (action === 'buy' ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-[var(--border-color)]'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                      showExpiration ? 'left-6' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              </>
            )}

            {/* Action Button */}
            <button
              onClick={handlePlaceBet}
              disabled={isPlacingOrder || (orderType === 'market' ? (!amount || parseFloat(amount) <= 0) : (!shares || parseFloat(shares) <= 0 || !limitPrice))}
              className={`w-full py-3.5 rounded-xl font-semibold transition-all text-base text-center uppercase tracking-widest ${
                isPlacingOrder || (orderType === 'market' ? (!amount || parseFloat(amount) <= 0) : (!shares || parseFloat(shares) <= 0 || !limitPrice))
                  ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                  : action === 'buy'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-emerald-500/50'
                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg hover:shadow-rose-500/50'
              }`}
              style={{ fontFamily: 'Days One, cursive', letterSpacing: '3px' }}
            >
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </button>

            {/* Terms */}
            <p className="text-xs text-center text-[var(--text-muted)]">
              By trading, you agree to the <span className="underline">Terms of Use</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}