import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Market } from '../types';
import { useThemeContext } from '../theme/ThemeContext';
import { useToastContext } from '../context/ToastContext';
import { Easing, Animated } from 'react-native';
import PriceChart from '../components/PriceChart';
import { getOrderBook } from '../services/clobApi';
import { polymarketWS, OrderLevel } from '../lib/polymarketWebSocket';
import { usePrivy } from '@privy-io/expo';
import { useEmbeddedEthereumWallet } from '@privy-io/expo';
import { getUSDCBalance, hasEnoughUSDC } from '../services/etherscan';
import { placeOrderViaBackend, OrderParams } from '../services/polymarketTrading';
import { useSupabase } from '../context/SupabaseContext';
import { saveBet, updateBetStatus, savePosition, updatePosition, saveMarketToDB } from '../utils/supabase';

interface BetScreenProps {
  route: {
    params: {
      market: Market;
      selectedSide: 'yes' | 'no';
    };
  };
  navigation: any;
}

export default function BetScreen({ route, navigation }: BetScreenProps) {
  const { market: initialMarket, selectedSide: initialSelectedSide } = route.params;
  const { colors } = useThemeContext();
  const toast = useToastContext();
  const { user } = usePrivy();
  const embeddedWallet = useEmbeddedEthereumWallet();
  const { userProfile } = useSupabase();
  
  const [market, setMarket] = useState<Market>(initialMarket);
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no'>(initialSelectedSide);
  const [amount, setAmount] = useState('');
  const [shares, setShares] = useState('0');
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [activePercentage, setActivePercentage] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPriceCents, setLimitPriceCents] = useState<string>('');
  const [inputMode, setInputMode] = useState<'amount' | 'price'>('amount');
  const [bids, setBids] = useState<OrderLevel[]>([]);
  const [asks, setAsks] = useState<OrderLevel[]>([]);
  const [yesBids, setYesBids] = useState<OrderLevel[]>([]);
  const [yesAsks, setYesAsks] = useState<OrderLevel[]>([]);
  const [noBids, setNoBids] = useState<OrderLevel[]>([]);
  const [noAsks, setNoAsks] = useState<OrderLevel[]>([]);
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const obRaf = useRef<number | null>(null);
  const lastOrderBookUpdate = useRef<number>(0);
  const updateThrottle = 100; // Update order book max every 100ms (10 times per second)
  
  const themedStyles = styles(colors);

  // Subscribe to live price updates via WebSocket
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (market.yesTokenId) {
      console.log(`🔌 Subscribing to market ${market.id} for live updates`);
      unsubscribe = polymarketWS.subscribe(
        market.yesTokenId,
        (yesPrice: number, noPrice: number) => {
          console.log(`📈 Price update: YES ${(yesPrice * 100).toFixed(1)}% NO ${(noPrice * 100).toFixed(1)}%`);
          setMarket(prev => ({
            ...prev,
            yesPrice,
            noPrice,
          }));
        },
        true // isTokenId
      );
    } else if (market.conditionId) {
      unsubscribe = polymarketWS.subscribe(
        market.conditionId,
        (yesPrice: number, noPrice: number) => {
          console.log(`📈 Price update: YES ${(yesPrice * 100).toFixed(1)}% NO ${(noPrice * 100).toFixed(1)}%`);
          setMarket(prev => ({
            ...prev,
            yesPrice,
            noPrice,
          }));
        },
        false // isTokenId
      );
    }

    return () => {
      if (unsubscribe) {
        console.log(`🔌 Unsubscribing from market ${market.id}`);
        unsubscribe();
      }
    };
  }, [market.id, market.yesTokenId, market.conditionId]);

  // Normalize prices in case upstream provided 0-100 instead of 0-1
  const normYes = market.yesPrice > 1 ? market.yesPrice / 100 : market.yesPrice;
  const normNo = market.noPrice > 1 ? market.noPrice / 100 : market.noPrice;

  // Animated counters for price display (in cents)
  const yesAnim = useRef(new Animated.Value(Math.round((normYes || 0) * 100))).current;
  const noAnim = useRef(new Animated.Value(Math.round((normNo || 0) * 100))).current;
  const [yesCents, setYesCents] = useState(Math.round((normYes || 0) * 100));
  const [noCents, setNoCents] = useState(Math.round((normNo || 0) * 100));

  useEffect(() => {
    const yesSub = yesAnim.addListener((evt: { value: number }) => setYesCents(Math.max(0, Math.min(100, Math.round(evt.value)))));
    const noSub = noAnim.addListener((evt: { value: number }) => setNoCents(Math.max(0, Math.min(100, Math.round(evt.value)))));
    return () => {
      yesAnim.removeListener(yesSub);
      noAnim.removeListener(noSub);
    };
  }, [yesAnim, noAnim]);

  // When normalized prices change, animate to new display values
  useEffect(() => {
    Animated.timing(yesAnim, {
      toValue: Math.round((normYes || 0) * 100),
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    Animated.timing(noAnim, {
      toValue: Math.round((normNo || 0) * 100),
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [normYes, normNo]);

  // If user navigates to a different market on the same screen instance, sync state immediately
  useEffect(() => {
    const nextMarket = route.params?.market as Market;
    const nextSide = route.params?.selectedSide as 'yes' | 'no';
    if (!nextMarket) return;
    if (nextMarket.id !== market.id) {
      setMarket(nextMarket);
      setSelectedSide(nextSide || 'yes');
      // Prime animations to the new market's prices to avoid showing prior market for a frame
      const nextYes = (nextMarket.yesPrice > 1 ? nextMarket.yesPrice / 100 : nextMarket.yesPrice) || 0;
      const nextNo = (nextMarket.noPrice > 1 ? nextMarket.noPrice / 100 : nextMarket.noPrice) || 0;
      const y = Math.round(nextYes * 100);
      const n = Math.round(nextNo * 100);
      yesAnim.setValue(y);
      noAnim.setValue(n);
      setYesCents(y);
      setNoCents(n);
    }
  }, [route.params?.market?.id]);

  // Effective price: for limit orders, prefer manual price if entered
  const parsedLimitPrice = (() => {
    const v = parseFloat(limitPriceCents);
    if (isNaN(v)) return undefined;
    const clamped = Math.max(0, Math.min(100, v));
    return clamped / 100; // to 0-1
  })();
  const fallbackSidePrice = selectedSide === 'yes' ? normYes : normNo; // 0-1
  const effectivePrice = orderType === 'limit' && parsedLimitPrice !== undefined && parsedLimitPrice > 0
    ? parsedLimitPrice
    : fallbackSidePrice;
  const calculatedShares = amount && effectivePrice > 0 ? (parseFloat(amount) / effectivePrice).toFixed(2) : '0';
  // "To Win" typically means profit (excluding stake): shares * (1 - price)
  const potentialReturn = amount && effectivePrice > 0 ? (parseFloat(amount) * ((1 - effectivePrice) / effectivePrice)).toFixed(2) : '0';

  // Formatters
  const toCents = (p: number | undefined) => {
    if (p == null || isNaN(p)) return '–';
    const cents = Math.round(Math.max(0, Math.min(1, p)) * 100);
    return `${cents}¢`;
  };
  const formatMoneyShort = (v: number | undefined) => {
    if (v == null || isNaN(v)) return '$0';
    if (v >= 1000000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
    return `$${Math.round(v)}`;
  };

  // Initial snapshot + live orderbook
  // Subscribe to both YES and NO order books once
  useEffect(() => {
    const yesToken = market.yesTokenId;
    const noToken = market.noTokenId;
    if (!yesToken || !noToken) return;

    let mounted = true;
    let unsubYes: (() => void) | undefined;
    let unsubNo: (() => void) | undefined;

    const parseLevel = (p: any, s: any): OrderLevel | null => {
      const price = Number(p);
      const size = Number(s);
      if (isNaN(price) || isNaN(size)) return null;
      const pp = price > 1 ? price / 100 : price;
      return { price: pp, size };
    };

    // Fetch YES snapshot
    (async () => {
      try {
        const snap = await getOrderBook(yesToken);
        if (!mounted || !snap) return;
        const b = (snap.bids || [])
          .map((lvl: any) => parseLevel(lvl.price ?? lvl[0], lvl.size ?? lvl[1]))
          .filter(Boolean) as OrderLevel[];
        const a = (snap.asks || [])
          .map((lvl: any) => parseLevel(lvl.price ?? lvl[0], lvl.size ?? lvl[1]))
          .filter(Boolean) as OrderLevel[];
        setYesBids(b);
        setYesAsks(a);
      } catch {}
    })();

    // Fetch NO snapshot
    (async () => {
      try {
        const snap = await getOrderBook(noToken);
        if (!mounted || !snap) return;
        const b = (snap.bids || [])
          .map((lvl: any) => parseLevel(lvl.price ?? lvl[0], lvl.size ?? lvl[1]))
          .filter(Boolean) as OrderLevel[];
        const a = (snap.asks || [])
          .map((lvl: any) => parseLevel(lvl.price ?? lvl[0], lvl.size ?? lvl[1]))
          .filter(Boolean) as OrderLevel[];
        setNoBids(b);
        setNoAsks(a);
      } catch {}
    })();

    // Subscribe to YES live updates with throttling
    unsubYes = polymarketWS.subscribeOrderBook(yesToken, (b, a) => {
      if (!mounted) return;
      const now = Date.now();
      // Throttle updates to avoid excessive re-renders
      if (now - lastOrderBookUpdate.current < updateThrottle) {
        return;
      }
      lastOrderBookUpdate.current = now;
      
      // Immediate state update for instant UI refresh
      setYesBids([...b]);
      setYesAsks([...a]);
      console.log(`📊 YES order book updated: ${b.length} bids, ${a.length} asks`);
    });

    // Subscribe to NO live updates with throttling
    unsubNo = polymarketWS.subscribeOrderBook(noToken, (b, a) => {
      if (!mounted) return;
      const now = Date.now();
      // Throttle updates to avoid excessive re-renders
      if (now - lastOrderBookUpdate.current < updateThrottle) {
        return;
      }
      lastOrderBookUpdate.current = now;
      
      // Immediate state update for instant UI refresh
      setNoBids([...b]);
      setNoAsks([...a]);
      console.log(`📊 NO order book updated: ${b.length} bids, ${a.length} asks`);
    });

    return () => {
      mounted = false;
      if (unsubYes) unsubYes();
      if (unsubNo) unsubNo();
      if (unsubYes) unsubYes();
      if (unsubNo) unsubNo();
    };
  }, [market.yesTokenId, market.noTokenId]);

  // Fetch wallet balance on mount and when user changes
  useEffect(() => {
    const fetchBalance = async () => {
      const wallet = user?.linked_accounts?.find(
        (a) => a.type === 'wallet' && 'wallet_client_type' in a && a.wallet_client_type === 'privy'
      );
      
      if (!wallet || !('address' in wallet)) {
        setUsdcBalance('0.00');
        return;
      }

      setIsLoadingBalance(true);
      try {
        const balanceData = await getUSDCBalance(wallet.address);
        setUsdcBalance(balanceData.formatted);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setUsdcBalance('0.00');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [user]);

  // Update displayed bids/asks based on selected side with immediate effect
  useEffect(() => {
    // Immediate update without batching
    if (selectedSide === 'yes') {
      setBids(yesBids);
      setAsks(yesAsks);
    } else {
      setBids(noBids);
      setAsks(noAsks);
    }
  }, [selectedSide, yesBids, yesAsks, noBids, noAsks]);
  
  // Memoize displayed order book for performance
  const displayedBids = useMemo(() => bids.slice(0, 10), [bids]);
  const displayedAsks = useMemo(() => asks.slice(0, 10), [asks]);

  // Default the limit price when toggling to limit or changing side
  useEffect(() => {
    if (orderType !== 'limit') return;
    if (!limitPriceCents) {
      const cents = selectedSide === 'yes' ? yesCents : noCents;
      setLimitPriceCents(String(cents));
    }
  }, [orderType, selectedSide]);

  const handlePlaceBet = async () => {
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    // Get wallet
    const wallet = user?.linked_accounts?.find(
      (a) => a.type === 'wallet' && 'wallet_client_type' in a && a.wallet_client_type === 'privy'
    );
    
    if (!wallet || !('address' in wallet)) {
      toast.error('Wallet Required', 'Please connect your wallet to place orders');
      return;
    }

    // Check balance
    setIsPlacingOrder(true);
    try {
      const balanceCheck = await hasEnoughUSDC(wallet.address, parseFloat(amount));
      
      if (!balanceCheck.sufficient) {
        toast.error(
          'Insufficient Balance',
          `You have $${balanceCheck.balance} USDC but need $${balanceCheck.required}`
        );
        setIsPlacingOrder(false);
        return;
      }

      // Get token ID based on selected side
      const tokenId = selectedSide === 'yes' ? market.yesTokenId : market.noTokenId;
      
      if (!tokenId) {
        toast.error('Error', 'Market token ID not found');
        setIsPlacingOrder(false);
        return;
      }

      // Get embedded wallet for signing
      const walletProvider = embeddedWallet.wallets[0];
      if (!walletProvider) {
        toast.error('Error', 'Wallet provider not available');
        setIsPlacingOrder(false);
        return;
      }

      const provider = await walletProvider.getProvider();
      
      // Privy's signTypedData function for EIP-712 signatures
      if (!provider.request) {
        toast.error('Error', 'Wallet signing not available');
        setIsPlacingOrder(false);
        return;
      }

      // Create signTypedData function for Privy
      const signTypedData = async (typedData: any) => {
        try {
          const method = 'eth_signTypedData_v4';
          // EIP-712 requires specific format with domain, types, primaryType, message
          const typedDataString = JSON.stringify({
            domain: typedData.domain,
            types: {
              EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
              ],
              ...typedData.types,
            },
            primaryType: typedData.primaryType,
            message: typedData.value,
          });
          const params = [wallet.address, typedDataString];
          return await provider.request({ method, params }) as string;
        } catch (error) {
          console.error('Signing error:', error);
          throw error;
        }
      };
      
      toast.info('Placing Order...', 'Please sign the order');

      // Prepare order parameters
      const orderParams: OrderParams = {
        tokenId,
        side: activeTab === 'buy' ? 'BUY' : 'SELL',
        size: amount,
        price: effectivePrice,
        userAddress: wallet.address,
      };

      // Place order: client signs with Privy, backend adds Builder headers
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';
      const result = await placeOrderViaBackend(orderParams, signTypedData, API_BASE_URL);

      if (!result.success) {
        throw new Error(result.error || 'Failed to place order');
      }

      // Save trade to Supabase database immediately
      if (userProfile?.address) {
        try {
          const betData = {
            user_address: userProfile.address,
            market_id: market.id || market.conditionId,
            side: selectedSide,
            amount: parseFloat(amount),
            price: effectivePrice,
            shares: parseFloat(shares),
            status: 'pending' as const,
            transaction_hash: result.transactionHash || undefined,
          };
          
          const savedBet = await saveBet(betData);
          console.log('✅ Trade saved to database:', savedBet);
          
          // Update bet status when confirmed
          if (result.transactionHash && savedBet?.id) {
            setTimeout(async () => {
              try {
                await updateBetStatus(savedBet.id, 'filled');
                console.log('✅ Bet status updated to filled');
              } catch (err) {
                console.error('Error updating bet status:', err);
              }
            }, 5000); // Check after 5 seconds
          }

          // Cache market data to Supabase for offline access
          await saveMarketToDB({
            condition_id: market.conditionId,
            title: market.title,
            yes_price: market.yesPrice,
            no_price: market.noPrice,
            category: market.category,
            end_date: market.endDate,
            image_url: market.imageUrl || '',
            volume: market.volume?.toString() || '0',
            participants: market.participants || 0,
          });
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          // Don't fail the trade if database save fails
        }
      }

      // Success!
      toast.success(
        'Order Placed! 🎉',
        `${selectedSide.toUpperCase()} ${activeTab} order for $${amount} placed successfully`,
        4000
      );
      
      // Clear form
      setAmount('');
      setActivePercentage(null);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 500);

    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error('Order Failed', error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePercentage = (percentage: number) => {
    setActivePercentage(percentage);
    const balance = 100; // Mock balance
    if (percentage === 100) {
      setAmount(balance.toString());
    } else {
      const calculatedAmount = (balance * percentage) / 100;
      setAmount(calculatedAmount.toFixed(2));
    }
  };

  const quickAmounts = [10, 25, 50, 100];

  return (
    <SafeAreaView style={[themedStyles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={themedStyles.scrollView} contentContainerStyle={themedStyles.content}>
        {/* Header - Buy/Sell tabs on left, Market/Limit toggle on right */}
        <View style={themedStyles.header}>
          {/* Buy/Sell Tabs */}
          <View style={themedStyles.tabsContainer}>
            <TouchableOpacity 
              style={[themedStyles.tab, activeTab === 'buy' && themedStyles.activeTab]}
              onPress={() => setActiveTab('buy')}
            >
              <Text style={[themedStyles.tabText, activeTab === 'buy' && themedStyles.activeTabText]}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[themedStyles.tab, activeTab === 'sell' && themedStyles.activeTab]}
              onPress={() => setActiveTab('sell')}
            >
              <Text style={[themedStyles.tabText, activeTab === 'sell' && themedStyles.activeTabText]}>Sell</Text>
            </TouchableOpacity>
          </View>

          {/* Market/Limit Simple Toggle */}
          <TouchableOpacity 
            style={themedStyles.orderTypeToggle}
            onPress={() => setOrderType(orderType === 'market' ? 'limit' : 'market')}
          >
            <Text style={themedStyles.orderTypeText}>
              {orderType === 'market' ? 'Market' : 'Limit'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Market Info - Compact */}
        <View style={themedStyles.marketInfo}>
          {market.imageUrl ? (
            <Image 
              source={{ uri: market.imageUrl }} 
              style={themedStyles.marketImage}
            />
          ) : (
            <View style={themedStyles.marketIconContainer}>
              <Ionicons name="football" size={20} color={colors.text} />
            </View>
          )}
          <Text style={themedStyles.marketTitle} numberOfLines={2}>
            {market.title}
          </Text>
        </View>

        {/* Price History Chart */}
        <View style={themedStyles.chartContainer}>
          {market.yesTokenId ? (
            <PriceChart 
              tokenId={market.yesTokenId}
              noTokenId={market.noTokenId}
              color={colors.success}
              height={260}
              endDate={market.endDate}
            />
          ) : (
            <View style={themedStyles.chartPlaceholder}>
              <Text style={themedStyles.chartPlaceholderText}>Chart unavailable</Text>
            </View>
          )}
        </View>

        {/* Order Book - Side by side layout for selected token */}
        {orderType === 'limit' && (
          <View style={themedStyles.orderBookCard}>
            <View style={themedStyles.orderBookHeader}>
              <Text style={themedStyles.orderBookTitle}>
                {selectedSide.toUpperCase()} Order Book
              </Text>
              <Text style={themedStyles.spreadText}>
                Spread: {bids.length > 0 && asks.length > 0 
                  ? `${toCents(Math.abs(asks[0].price - bids[0].price))}`
                  : '—'}
              </Text>
            </View>

            {/* Column headers */}
            <View style={themedStyles.orderBookSplitRow}>
              <View style={themedStyles.orderColLeft}>
                <View style={themedStyles.orderBookTableHeader}>
                  <Text style={[themedStyles.orderBookHeaderText, { flex: 1, textAlign: 'center' }]}>PRICE</Text>
                  <Text style={[themedStyles.orderBookHeaderText, { flex: 1, textAlign: 'center' }]}>SIZE</Text>
                </View>
              </View>
              <View style={themedStyles.orderColRight}>
                <View style={themedStyles.orderBookTableHeader}>
                  <Text style={[themedStyles.orderBookHeaderText, { flex: 1, textAlign: 'center' }]}>PRICE</Text>
                  <Text style={[themedStyles.orderBookHeaderText, { flex: 1, textAlign: 'center' }]}>SIZE</Text>
                </View>
              </View>
            </View>

            {/* Side by side data rows */}
            <View style={themedStyles.orderBookSplitRow}>
              {/* Asks (Sellers) - Left Column */}
              <View style={themedStyles.orderColLeft}>
                {(asks
                  .slice()
                  .sort((l, r) => r.price - l.price)
                  .slice(0, 6)
                ).map((order, idx) => (
                  <TouchableOpacity
                    key={`ask-${idx}`}
                    style={themedStyles.orderBookRowCompact}
                    onPress={() => {
                      setOrderType('limit');
                      setLimitPriceCents(String(Math.round(order.price * 100)));
                    }}
                    activeOpacity={0.85}
                  >
                    <Text numberOfLines={1} style={[themedStyles.orderBookPriceCompact, { color: colors.error, flex: 1, textAlign: 'center' }]}>
                      {toCents(order.price)}
                    </Text>
                    <Text numberOfLines={1} style={[themedStyles.orderBookSizeCompact, { flex: 1, textAlign: 'center' }]}>
                      {formatMoneyShort(order.size)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bids (Buyers) - Right Column */}
              <View style={themedStyles.orderColRight}>
                {(bids
                  .slice()
                  .sort((l, r) => r.price - l.price)
                  .slice(0, 6)
                ).map((order, idx) => (
                  <TouchableOpacity
                    key={`bid-${idx}`}
                    style={themedStyles.orderBookRowCompact}
                    onPress={() => {
                      setOrderType('limit');
                      setLimitPriceCents(String(Math.round(order.price * 100)));
                    }}
                    activeOpacity={0.85}
                  >
                    <Text numberOfLines={1} style={[themedStyles.orderBookPriceCompact, { color: colors.success, flex: 1, textAlign: 'center' }]}>
                      {toCents(order.price)}
                    </Text>
                    <Text numberOfLines={1} style={[themedStyles.orderBookSizeCompact, { flex: 1, textAlign: 'center' }]}>
                      {formatMoneyShort(order.size)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Bet Buttons - Dynamic width based on percentage with min/max caps */}
        <View style={themedStyles.betButtons}>
          <TouchableOpacity
            style={[
              themedStyles.betButton, 
              themedStyles.yesBetButton,
              selectedSide === 'yes' && themedStyles.betButtonSelected,
              { flex: Math.max(0.3, Math.min(0.7, normYes)) }
            ]}
            onPress={() => setSelectedSide('yes')}
          >
            <Text style={[
              themedStyles.betButtonLabel,
              selectedSide === 'yes' && themedStyles.betButtonLabelSelected
            ]}>YES {yesCents}¢</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              themedStyles.betButton, 
              themedStyles.noBetButton,
              selectedSide === 'no' && themedStyles.betButtonSelected,
              { flex: Math.max(0.3, Math.min(0.7, normNo)) }
            ]}
            onPress={() => setSelectedSide('no')}
          >
            <Text style={[
              themedStyles.betButtonLabel,
              selectedSide === 'no' && themedStyles.betButtonLabelSelected
            ]}>NO {noCents}¢</Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input - Split for Amount/Price in Limit mode */}
        <View style={themedStyles.amountContainer}>
          {orderType === 'limit' ? (
            <View style={themedStyles.splitInputRow}>
              {/* Amount side */}
              <View style={themedStyles.splitInputHalf}>
                <Text style={themedStyles.splitLabel}>Amount</Text>
                <View style={themedStyles.splitInputWrapper}>
                  <Text style={themedStyles.splitPrefix}>$</Text>
                  <TextInput
                    style={themedStyles.splitInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
              {/* Price side */}
              <View style={themedStyles.splitInputHalf}>
                <Text style={themedStyles.splitLabel}>Price</Text>
                <View style={themedStyles.splitInputWrapper}>
                  <TextInput
                    style={themedStyles.splitInput}
                    value={limitPriceCents}
                    onChangeText={(t) => {
                      const cleaned = t.replace(/[^0-9]/g, '');
                      setLimitPriceCents(cleaned);
                    }}
                    keyboardType="numeric"
                    placeholder={String(selectedSide === 'yes' ? yesCents : noCents)}
                    placeholderTextColor={colors.textTertiary}
                  />
                  <Text style={themedStyles.splitSuffix}>¢</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={themedStyles.amountInputWrapper}>
              <Text style={themedStyles.dollarSign}>$</Text>
              <TextInput
                style={themedStyles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="1"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          )}
        </View>

        {/* Summary - Compact */}
        <View style={themedStyles.summaryContainer}>
          <View style={themedStyles.summaryRow}>
            <Text style={themedStyles.summaryLabel}>Avg. Price</Text>
            <Text style={themedStyles.summaryValue}>{Math.round(effectivePrice * 100)}¢</Text>
          </View>
          <View style={themedStyles.summaryRow}>
            <Text style={themedStyles.summaryLabel}>To Win</Text>
            <Text style={[themedStyles.summaryValue, themedStyles.winValue]}>
              ${potentialReturn}
            </Text>
          </View>
        </View>

        {/* Percentage Buttons - Compact */}
        <View style={themedStyles.percentageRow}>
          {[25, 50, 75].map((pct) => (
            <TouchableOpacity
              key={pct}
              style={[
                themedStyles.percentButton,
                activePercentage === pct && themedStyles.percentButtonActive
              ]}
              onPress={() => handlePercentage(pct)}
            >
              <Text style={[
                themedStyles.percentText,
                activePercentage === pct && themedStyles.percentTextActive
              ]}>
                {pct}%
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              themedStyles.percentButton,
              activePercentage === 100 && themedStyles.percentButtonActive
            ]}
            onPress={() => handlePercentage(100)}
          >
            <Text style={[
              themedStyles.percentText,
              activePercentage === 100 && themedStyles.percentTextActive
            ]}>
              Max
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Balance */}
        <View style={themedStyles.balanceContainer}>
          <Text style={themedStyles.balanceLabel}>Available Balance:</Text>
          {isLoadingBalance ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={themedStyles.balanceAmount}>${usdcBalance} USDC</Text>
          )}
        </View>

        {/* Place Order Button */}
        <TouchableOpacity
          style={[
            themedStyles.placeOrderButton,
            selectedSide === 'yes' ? themedStyles.placeOrderButtonYes : themedStyles.placeOrderButtonNo,
            (!amount || isPlacingOrder) && themedStyles.placeOrderButtonDisabled
          ]}
          onPress={handlePlaceBet}
          disabled={!amount || isPlacingOrder}
        >
          {isPlacingOrder ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={themedStyles.placeOrderButtonText}>Placing Order...</Text>
            </View>
          ) : (
            <Text style={themedStyles.placeOrderButtonText}>
              Place {selectedSide.toUpperCase()} Order
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  // Buy/Sell Tabs (moved to header left)
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.success,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  // Order Type Toggle (Market/Limit) - Simple clickable text
  orderTypeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  orderTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Unbounded_700Bold',
  },
  marketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  marketIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marketImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
  },
  marketTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  // Price Chart Card
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  priceHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  priceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  chartContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 0,
    marginBottom: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  chartPlaceholder: {
    height: 140,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  timePeriods: {
    flexDirection: 'row',
    gap: 6,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  // Bet Buttons
  betButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  betButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  betButtonSelected: {
    opacity: 1,
    transform: [{ scale: 1.02 }],
  },
  yesBetButton: {
    backgroundColor: colors.success,
  },
  noBetButton: {
    backgroundColor: colors.error,
  },
  betButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.85,
    fontFamily: 'Unbounded_700Bold',
  },
  betButtonLabelSelected: {
    opacity: 1,
    fontWeight: '800',
  },
  // Amount Input
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: '100%',
  },
  dollarSign: {
    fontSize: 36,
    fontWeight: '300',
    color: colors.textSecondary,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'left',
    flex: 1,
  },
  // Split input for limit orders
  splitInputRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  splitInputHalf: {
    flex: 1,
  },
  splitLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  splitInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  splitPrefix: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 4,
  },
  splitSuffix: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  splitInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  // Summary
  summaryContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  winValue: {
    color: colors.success,
  },
  // Percentage Buttons
  percentageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  percentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  percentButtonActive: {
    backgroundColor: colors.primary,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  percentTextActive: {
    color: '#FFFFFF',
  },
  // Order Book
  orderBookCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  orderBookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  orderBookTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  spreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  orderBookUnifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderBookHeaderCol: {
    flex: 1,
    alignItems: 'center',
  },
  orderBookHeaderColDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
  },
  orderBookSplitRow: {
    flexDirection: 'row',
  },
  orderColLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  orderColRight: {
    flex: 1,
    minWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: 6,
  },
  orderBookSectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  orderBookTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 3,
  },
  orderBookHeaderText: {
    flex: 1,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  orderBookRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 3,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    marginBottom: 2,
  },
  orderBookPriceCompact: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    minWidth: 0,
  },
  orderBookSizeCompact: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    minWidth: 0,
  },
  // Place Order Button
  placeOrderButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  placeOrderButtonYes: {
    backgroundColor: colors.success,
  },
  placeOrderButtonNo: {
    backgroundColor: colors.error,
  },
  placeOrderButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  placeOrderButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Unbounded_700Bold',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Unbounded_400Regular',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'Unbounded_700Bold',
  },
});
