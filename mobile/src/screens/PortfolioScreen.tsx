/**
 * Portfolio Screen - Now with Supabase integration
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ElegantArrow from '../components/ElegantArrow';
import { useTheme } from '@react-navigation/native';
import { useThemeContext } from '../theme/ThemeContext';
import { LineChart } from 'react-native-chart-kit';
import { usePositions } from '../hooks/usePositions';
import { useBets } from '../hooks/useBets';
import { useSupabase } from '../context/SupabaseContext';
import { usePrivy } from '@privy-io/expo';
import { useEmbeddedEthereumWallet } from '@privy-io/expo';
import { polymarketWS } from '../lib/polymarketWebSocket';
import { getUSDCBalance } from '../services/etherscan';

export default function PortfolioScreen() {
  const theme = useTheme();
  const { colors } = useThemeContext();
  const { userProfile } = useSupabase();
  const { user: privyUser } = usePrivy();
  const embeddedWallet = useEmbeddedEthereumWallet();
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');
  const [positionFilter, setPositionFilter] = useState<'open' | 'closed'>('open');
  const [timePeriod, setTimePeriod] = useState<'1D' | '1W' | '1M' | 'ALL'>('ALL');
  const [selectedDataPoint, setSelectedDataPoint] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsTestResults, setWsTestResults] = useState<{price?: string; orderBook?: string}>({});
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  // Fetch real data from Supabase
  const {
    openPositions: dbOpenPositions,
    closedPositions: dbClosedPositions,
    loading: positionsLoading,
    refresh: refreshPositions,
  } = usePositions(userProfile?.address || null);

  const {
    bets: dbBets,
    stats: betStats,
    loading: betsLoading,
    refresh: refreshBets,
  } = useBets(userProfile?.address || null);

  const themedStyles = styles(colors);

  // Get wallet address from Privy user object
  useEffect(() => {
    const getWalletAddress = async () => {
      try {
        if (!privyUser) return;
        
        console.log('👤 User linked accounts:', privyUser.linked_accounts?.map(a => ({ type: a.type, hasAddress: 'address' in a })));
        
        // Get wallet from linked accounts
        const walletAccount = privyUser.linked_accounts?.find(
          (account) => account.type === 'wallet' && 'address' in account && account.address
        );
        
        if (walletAccount && 'address' in walletAccount) {
          setWalletAddress(walletAccount.address as string);
          console.log('✅ Wallet found:', walletAccount.address);
          
          // Fetch USDC balance from Polygonscan
          try {
            console.log('🔍 Fetching USDC balance for:', walletAccount.address);
            const balanceData = await getUSDCBalance(walletAccount.address as string);
            console.log('📦 Balance data received:', balanceData);
            const balance = parseFloat(balanceData.formatted);
            setWalletBalance(balance);
            console.log('💰 USDC Balance set to:', balance);
          } catch (error) {
            console.error('❌ Failed to fetch balance:', error);
            setWalletBalance(0);
          }
        } else {
          // No wallet yet, try to create embedded wallet
          console.log('📱 No wallet found, creating embedded wallet...');
          try {
            await embeddedWallet.create();
            // Refresh user to get new wallet - wait a bit for creation to complete
            setTimeout(() => {
              const updatedWallet = privyUser.linked_accounts?.find(
                (account) => account.type === 'wallet' && 'address' in account && account.address
              );
              if (updatedWallet && 'address' in updatedWallet) {
                setWalletAddress(updatedWallet.address as string);
                console.log('✅ Embedded wallet created:', updatedWallet.address);
              }
            }, 1000);
          } catch (createError) {
            console.log('ℹ️ Wallet creation skipped or already exists');
          }
        }
      } catch (error) {
        console.error('❌ Error getting wallet address:', error);
      }
    };
    
    if (privyUser) {
      getWalletAddress();
    }
  }, [privyUser]);

  // Test WebSocket connection
  useEffect(() => {
    setWsConnected(polymarketWS.isConnected());
    
    // Test WebSocket by subscribing to a market
    const testMarketId = '21743';
    let priceUpdateCount = 0;
    let orderBookUpdateCount = 0;
    
    console.log('🧪 Testing WebSocket connection...');
    console.log('🔌 WS Connected:', polymarketWS.isConnected());
    
    // Test price updates
    const unsubPrice = polymarketWS.subscribe(testMarketId, (yesPrice, noPrice) => {
      priceUpdateCount++;
      const result = `✅ Price update #${priceUpdateCount}: YES=${yesPrice.toFixed(3)}, NO=${noPrice.toFixed(3)}`;
      console.log(result);
      setWsTestResults(prev => ({ ...prev, price: result }));
    }, false);
    
    // Test order book updates
    const unsubOrderBook = polymarketWS.subscribeOrderBook(testMarketId, (bids, asks) => {
      orderBookUpdateCount++;
      const result = `✅ Order book #${orderBookUpdateCount}: ${bids.length} bids, ${asks.length} asks`;
      console.log(result);
      setWsTestResults(prev => ({ ...prev, orderBook: result }));
    });
    
    // Check connection status after 3 seconds
    const statusCheck = setTimeout(() => {
      const connected = polymarketWS.isConnected();
      setWsConnected(connected);
      console.log(`🔍 WebSocket status check: ${connected ? 'Connected ✅' : 'Disconnected ❌'}`);
      if (!connected) {
        console.log('ℹ️ WebSocket may require authentication or is unavailable');
      }
    }, 3000);
    
    return () => {
      unsubPrice();
      unsubOrderBook();
      clearTimeout(statusCheck);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Refresh positions and bets
    await Promise.all([refreshPositions(), refreshBets()]);
    
    // Also refresh wallet balance
    if (walletAddress) {
      try {
        const balanceData = await getUSDCBalance(walletAddress);
        const balance = parseFloat(balanceData.formatted);
        setWalletBalance(balance);
        console.log('🔄 Balance refreshed:', balance);
      } catch (error) {
        console.error('❌ Failed to refresh balance:', error);
      }
    }
    
    setRefreshing(false);
  };

  const handleClosePosition = (positionId: string, marketTitle: string) => {
    Alert.alert(
      'Close Position',
      `Are you sure you want to close your position in "${marketTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Close', 
          style: 'destructive',
          onPress: () => Alert.alert('Success', 'Position closed successfully!')
        }
      ]
    );
  };

  const handleCloseAll = () => {
    Alert.alert(
      'Close All Positions',
      `Are you sure you want to close all ${dbOpenPositions.length} open positions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Close All', 
          style: 'destructive',
          onPress: () => Alert.alert('Success', `All positions closed successfully!`)
        }
      ]
    );
  };

  // Transform DB positions to match component format
  const transformedOpenPositions = dbOpenPositions.map(pos => ({
    id: pos.id,
    marketTitle: pos.market_id, // You'd fetch market title separately
    side: pos.side,
    shares: pos.shares,
    invested: pos.invested,
    currentValue: pos.current_value,
    currentPrice: pos.current_price,
    status: pos.status,
  }));

  const transformedClosedPositions = dbClosedPositions.map(pos => ({
    id: pos.id,
    marketTitle: pos.market_id,
    side: pos.side,
    shares: pos.shares,
    invested: pos.invested,
    currentValue: pos.current_value,
    currentPrice: pos.current_price,
    status: pos.status,
    closedDate: pos.closed_date,
  }));

  // Get current positions based on filter
  const currentPositions = positionFilter === 'open' 
    ? transformedOpenPositions
    : transformedClosedPositions;
  
  const allPositions = [...transformedOpenPositions, ...transformedClosedPositions];
  
  // Calculate totals from real data
  const totalInvested = allPositions.reduce((sum: number, pos: any) => sum + pos.invested, 0);
  const totalValue = allPositions.reduce((sum: number, pos: any) => sum + pos.currentValue, 0);
  const totalPnL = totalValue - totalInvested;
  const pnlPercentage = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : '0.00';
  
  // Generate PnL chart data from real positions (simplified - showing current value)
  const generatePnLData = (period: '1D' | '1W' | '1M' | 'ALL') => {
    // For now, show flat line at current total value
    // TODO: Implement time-series PnL tracking in database
    const currentDate = new Date();
    const dataPoints = period === '1D' ? 6 : period === '1W' ? 7 : period === '1M' ? 5 : 6;
    
    return Array.from({ length: dataPoints }, (_, i) => ({
      label: '',
      value: totalValue || 0,
      date: currentDate.toLocaleDateString(),
    }));
  };
  
  const currentPnLData = generatePnLData(timePeriod);
  const selectedIndex = selectedDataPoint !== null ? selectedDataPoint : currentPnLData.length - 1;
  const selectedPoint = currentPnLData[selectedIndex];

  const screenWidth = Dimensions.get('window').width;

  // Show loading state
  if (positionsLoading && !refreshing) {
    return (
      <View style={[themedStyles.container, themedStyles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[themedStyles.loadingText, { color: colors.text, marginTop: 16 }]}>
          Loading portfolio...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[themedStyles.container, { backgroundColor: theme.colors.background }]} 
      contentContainerStyle={themedStyles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Compact Header Stats */}
      <View style={themedStyles.headerCard}>
        <View style={themedStyles.headerTop}>
          <View>
            <Text style={themedStyles.headerLabel}>PORTFOLIO VALUE</Text>
            <Text style={themedStyles.headerValue}>${totalValue.toFixed(2)}</Text>
          </View>
          <View style={[themedStyles.pnlBadge, totalPnL >= 0 ? themedStyles.pnlBadgePositive : themedStyles.pnlBadgeNegative]}>
            <ElegantArrow
              direction={totalPnL >= 0 ? 'up-right' : 'down-right'}
              size={14}
              color={totalPnL >= 0 ? colors.success : colors.error}
            />
            <Text style={[themedStyles.pnlBadgeText, totalPnL >= 0 ? themedStyles.positive : themedStyles.negative]}>
              {totalPnL >= 0 ? '+' : ''}{pnlPercentage}%
            </Text>
          </View>
        </View>
        
        <View style={themedStyles.headerStats}>
          <View style={themedStyles.headerStat}>
            <Text style={themedStyles.headerStatLabel}>Balance</Text>
            <Text style={themedStyles.headerStatValue}>${walletBalance.toFixed(2)}</Text>
          </View>
          <View style={themedStyles.headerStatDivider} />
          <View style={themedStyles.headerStat}>
            <Text style={themedStyles.headerStatLabel}>Invested</Text>
            <Text style={themedStyles.headerStatValue}>${totalInvested.toFixed(2)}</Text>
          </View>
          <View style={themedStyles.headerStatDivider} />
          <View style={themedStyles.headerStat}>
            <Text style={themedStyles.headerStatLabel}>P&L</Text>
            <Text style={[themedStyles.headerStatValue, totalPnL >= 0 ? themedStyles.positive : themedStyles.negative]}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* PnL Chart */}
      <View style={themedStyles.chartCard}>
        <View style={themedStyles.chartHeader}>
          <View>
            <Text style={themedStyles.chartTitle}>Profit/Loss</Text>
            <Text style={[themedStyles.chartValue, totalPnL >= 0 ? themedStyles.positive : themedStyles.negative]}>
              ${totalPnL.toFixed(2)}
            </Text>
            <Text style={themedStyles.chartDate}>{selectedPoint.date}</Text>
          </View>
          <View style={themedStyles.chartPeriods}>
            <TouchableOpacity 
              style={[themedStyles.periodButton, timePeriod === '1D' && themedStyles.periodButtonActive]}
              onPress={() => { setTimePeriod('1D'); setSelectedDataPoint(null); }}
            >
              <Text style={[themedStyles.periodText, timePeriod === '1D' && themedStyles.periodTextActive]}>1D</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[themedStyles.periodButton, timePeriod === '1W' && themedStyles.periodButtonActive]}
              onPress={() => { setTimePeriod('1W'); setSelectedDataPoint(null); }}
            >
              <Text style={[themedStyles.periodText, timePeriod === '1W' && themedStyles.periodTextActive]}>1W</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[themedStyles.periodButton, timePeriod === '1M' && themedStyles.periodButtonActive]}
              onPress={() => { setTimePeriod('1M'); setSelectedDataPoint(null); }}
            >
              <Text style={[themedStyles.periodText, timePeriod === '1M' && themedStyles.periodTextActive]}>1M</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[themedStyles.periodButton, timePeriod === 'ALL' && themedStyles.periodButtonActive]}
              onPress={() => { setTimePeriod('ALL'); setSelectedDataPoint(null); }}
            >
              <Text style={[themedStyles.periodText, timePeriod === 'ALL' && themedStyles.periodTextActive]}>ALL</Text>
            </TouchableOpacity>
          </View>
        </View>
        <LineChart
          data={{
            labels: currentPnLData.map(() => ''),
            datasets: [{
              data: currentPnLData.map(d => d.value),
            }]
          }}
          onDataPointClick={(data: any) => {
            setSelectedDataPoint(data.index);
          }}
          width={screenWidth - 28}
          height={140}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => totalPnL >= 0 
              ? `rgba(59, 130, 246, ${opacity})`
              : `rgba(239, 68, 68, ${opacity})`,
            labelColor: () => 'transparent',
            style: {
              borderRadius: 0,
            },
            propsForDots: {
              r: '0',
            },
            propsForBackgroundLines: {
              strokeWidth: 0,
            },
            strokeWidth: 2,
          }}
          bezier
          style={themedStyles.chart}
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={false}
          withVerticalLabels={false}
          withHorizontalLabels={false}
          withDots={false}
          withShadow={false}
          decorator={() => {
            if (selectedDataPoint === null) return null;
            const x = (screenWidth - 28) * (selectedDataPoint / (currentPnLData.length - 1));
            return (
              <View>
                <View style={{
                  position: 'absolute',
                  left: x,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: colors.border,
                }} />
                <View style={{
                  position: 'absolute',
                  left: x - 4,
                  top: 60,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: totalPnL >= 0 ? colors.success : colors.error,
                  borderWidth: 2,
                  borderColor: colors.surface,
                }} />
              </View>
            );
          }}
        />

      </View>

      {/* Main Tab Buttons */}
      <View style={themedStyles.mainTabContainer}>
        <TouchableOpacity
          style={[themedStyles.mainTab, themedStyles.mainTabLeft, activeTab === 'positions' && themedStyles.mainTabActive]}
          onPress={() => setActiveTab('positions')}
        >
          <Ionicons 
            name="list" 
            size={18} 
            color={activeTab === 'positions' ? '#FFFFFF' : colors.textTertiary}
          />
          <Text style={[themedStyles.mainTabText, activeTab === 'positions' && themedStyles.mainTabTextActive]}>
            Positions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[themedStyles.mainTab, themedStyles.mainTabRight, activeTab === 'history' && themedStyles.mainTabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name="time-outline" 
            size={18} 
            color={activeTab === 'history' ? '#FFFFFF' : colors.textTertiary}
          />
          <Text style={[themedStyles.mainTabText, activeTab === 'history' && themedStyles.mainTabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub-tabs for Positions */}
      {activeTab === 'positions' && (
        <View style={themedStyles.subTabRow}>
          <View style={themedStyles.subTabContainer}>
            <TouchableOpacity
              style={[themedStyles.subTab, themedStyles.subTabLeft, positionFilter === 'open' && themedStyles.subTabActive]}
              onPress={() => setPositionFilter('open')}
            >
              <Text style={[themedStyles.subTabText, positionFilter === 'open' && themedStyles.subTabTextActive]}>
                Open
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[themedStyles.subTab, themedStyles.subTabRight, positionFilter === 'closed' && themedStyles.subTabActive]}
              onPress={() => setPositionFilter('closed')}
            >
              <Text style={[themedStyles.subTabText, positionFilter === 'closed' && themedStyles.subTabTextActive]}>
                Closed
              </Text>
            </TouchableOpacity>
          </View>
          {positionFilter === 'open' && transformedOpenPositions.length > 0 && (
            <TouchableOpacity
              style={themedStyles.closeAllButton}
              onPress={handleCloseAll}
            >
              <Ionicons name="close-circle" size={16} color="#FFFFFF" />
              <Text style={themedStyles.closeAllButtonText}>Close All</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Positions List */}
      {activeTab === 'positions' ? (
        currentPositions.length > 0 ? (
          <View style={themedStyles.positionsList}>
            {currentPositions.map((position: any) => {
              const pnl = position.currentValue - position.invested;
              const pnlPct = position.invested > 0 ? ((pnl / position.invested) * 100).toFixed(2) : '0.00';
              
              return (
                <View key={position.id} style={themedStyles.positionCard}>
                  <View style={themedStyles.positionHeader}>
                    <Text style={themedStyles.positionTitle} numberOfLines={2}>
                      {position.marketTitle}
                    </Text>
                    <View style={[
                      themedStyles.sideBadge,
                      position.side === 'yes' ? themedStyles.yesBadge : themedStyles.noBadge
                    ]}>
                      <Text style={themedStyles.sideText}>{position.side.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={themedStyles.positionDetails}>
                    <View style={themedStyles.detailRow}>
                      <Text style={themedStyles.detailLabel}>Shares</Text>
                      <Text style={themedStyles.detailValue}>{position.shares}</Text>
                    </View>
                    <View style={themedStyles.detailRow}>
                      <Text style={themedStyles.detailLabel}>Invested</Text>
                      <Text style={themedStyles.detailValue}>${position.invested.toFixed(2)}</Text>
                    </View>
                    <View style={themedStyles.detailRow}>
                      <Text style={themedStyles.detailLabel}>Value</Text>
                      <Text style={themedStyles.detailValue}>${position.currentValue.toFixed(2)}</Text>
                    </View>
                  </View>

                  <View style={themedStyles.pnlContainer}>
                    <View>
                      <Text style={[themedStyles.pnlValue, pnl >= 0 ? themedStyles.positive : themedStyles.negative]}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </Text>
                      <Text style={[themedStyles.pnlPercent, pnl >= 0 ? themedStyles.positive : themedStyles.negative]}>
                        {pnl >= 0 ? '+' : ''}{pnlPct}%
                      </Text>
                    </View>
                    {positionFilter === 'open' ? (
                      <TouchableOpacity 
                        style={themedStyles.closeButton}
                        onPress={() => handleClosePosition(position.id, position.marketTitle)}
                      >
                        <Text style={themedStyles.closeButtonText}>Close</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={themedStyles.closedBadge}>
                        <Text style={themedStyles.closedBadgeText}>Closed</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={themedStyles.emptyState}>
            <Ionicons 
              name={positionFilter === 'open' ? 'wallet-outline' : 'checkmark-circle-outline'} 
              size={64} 
              color={colors.textTertiary} 
            />
            <Text style={themedStyles.emptyTitle}>
              {positionFilter === 'open' ? 'No Open Positions' : 'No Closed Positions'}
            </Text>
            <Text style={themedStyles.emptyText}>
              {positionFilter === 'open' 
                ? 'Your active positions will appear here once you place a bet'
                : 'Your closed positions will appear here'}
            </Text>
          </View>
        )
      ) : (
        <View style={themedStyles.emptyState}>
          <Ionicons name="time-outline" size={64} color={colors.textTertiary} />
          <Text style={themedStyles.emptyTitle}>No Transaction History</Text>
          <Text style={themedStyles.emptyText}>Your transaction history will appear here</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 14,
    paddingBottom: 32,
  },
  // Compact Header with unique border radius
  headerCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  headerValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  pnlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 4,
  },
  pnlBadgePositive: {
    backgroundColor: `${colors.success}15`,
  },
  pnlBadgeNegative: {
    backgroundColor: `${colors.error}15`,
  },
  pnlBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  headerStat: {
    alignItems: 'center',
  },
  headerStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  headerStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  headerStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  // Chart Card with unique border radius
  chartCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 8,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  chartValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  chartDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  chartPeriods: {
    flexDirection: 'row',
    gap: 4,
  },
  periodButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  chart: {
    marginVertical: 0,
    marginHorizontal: 0,
    borderRadius: 0,
  },
  chartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 8,
  },
  chartFooterText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.error,
  },
  // Main tabs
  mainTabContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 0,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.surfaceSecondary,
  },
  mainTabLeft: {
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  mainTabRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  mainTabActive: {
    backgroundColor: colors.primary,
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  mainTabTextActive: {
    color: '#FFFFFF',
  },
  // Sub-tabs row
  subTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  subTabContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 0,
  },
  subTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  subTabLeft: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  subTabRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  subTabActive: {
    backgroundColor: colors.primary,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subTabTextActive: {
    color: '#FFFFFF',
  },
  closeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  closeAllButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Unbounded_700Bold',
  },
  positionsList: {
    gap: 12,
  },
  positionCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 16,
    padding: 12,
    borderWidth: 0,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  positionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
    lineHeight: 18,
  },
  sideBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 4,
  },
  yesBadge: {
    backgroundColor: colors.successBg,
  },
  noBadge: {
    backgroundColor: colors.errorBg,
  },
  sideText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'Unbounded_700Bold',
  },
  positionDetails: {
    gap: 6,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  pnlContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pnlValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  pnlPercent: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 4,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  closedBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 4,
  },
  closedBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warning + '20',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  demoNoticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning,
    fontWeight: '500',
  },
});

