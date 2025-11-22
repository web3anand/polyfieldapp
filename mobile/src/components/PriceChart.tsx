/**
 * Live Price Chart Component
 * Displays real-time price history for a market using Polymarket CLOB API
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, PanResponder, Animated, Easing, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useThemeContext } from '../theme/ThemeContext';
import { polymarketWS } from '../lib/polymarketWebSocket';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface PricePoint {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  tokenId: string;
  noTokenId?: string;
  color?: string;
  height?: number;
  endDate?: string;
}

const MAX_LIVE_POINTS = 50; // Keep last 50 live updates

export default function PriceChart({ tokenId, noTokenId, color = '#10B981', height = 100, endDate }: PriceChartProps) {
  const { colors } = useThemeContext();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [noPriceHistory, setNoPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width - 40);
  const chartPadding = 16;
  const [yesCentsTarget, setYesCentsTarget] = useState<number>(0);
  const [noCentsTarget, setNoCentsTarget] = useState<number>(0);
  const animatedYes = useAnimatedNumber(yesCentsTarget, { duration: 300, fractionDigits: 1 });
  const animatedNo = useAnimatedNumber(noCentsTarget, { duration: 300, fractionDigits: 1 });
  const isTouchingRef = useRef(false);
  const liveYesRef = useRef(0);
  const liveNoRef = useRef(0);
  const [timeframe, setTimeframe] = useState<string>('max');
  const [touchX, setTouchX] = useState<number | null>(null);
  const [touchedIndex, setTouchedIndex] = useState<number | null>(null);
  
  // Touch handler ref - must be declared before any conditional returns
  const panResponderRef = useRef<any>(null);
  
  // Check if market is live (not ended)
  const isLive = endDate ? new Date(endDate) > new Date() : false;



  // Fetch historical price data
  useEffect(() => {
    fetchPriceHistory();
  }, [tokenId, timeframe]);

  // Subscribe to live WebSocket updates
  useEffect(() => {
    if (!tokenId) return;

    const unsubscribe = polymarketWS.subscribe(
      tokenId,
      (yesPrice: number, _noPrice: number) => {
        const newPoint: PricePoint = {
          timestamp: Date.now(),
          price: yesPrice,
        };

        // Merge with historical data - keep last 150 points
        setPriceHistory(prev => {
          const combined = [...prev, newPoint];
          return combined.slice(-150);
        });

        // Update prices
        const yesCents = yesPrice * 100;
        const noCents = (1 - yesPrice) * 100;
        liveYesRef.current = yesCents;
        liveNoRef.current = noCents;
        if (!isTouchingRef.current) {
          setYesCentsTarget(yesCents);
          setNoCentsTarget(noCents);
        }
      },
      true // isTokenId
    );

    return () => {
      unsubscribe();
    };
  }, [tokenId]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      // Fetch historical prices from Polymarket CLOB API
      const url = `https://clob.polymarket.com/prices-history?market=${tokenId}&interval=${timeframe}&fidelity=60`;
      console.log('📊 Fetching YES price history:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch price history: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the data into our format
      const points: PricePoint[] = [];
      if (data.history && Array.isArray(data.history)) {
        data.history.forEach((point: any) => {
          if (point.t && point.p !== undefined) {
            points.push({
              timestamp: point.t * 1000,
              price: parseFloat(point.p),
            });
          }
        });
      }

      // If we have data, use it; otherwise create a flat line at current price
      if (points.length > 0) {
        setPriceHistory(points);
        const last = points[points.length - 1].price;
        const yes = last * 100;
        const no = (1 - last) * 100;
        setYesCentsTarget(yes);
        setNoCentsTarget(no);
        liveYesRef.current = yes;
        liveNoRef.current = no;
      } else {
        const now = Date.now();
        const flat = [
          { timestamp: now - 86400000, price: 0.5 },
          { timestamp: now, price: 0.5 },
        ];
        setPriceHistory(flat);
        setYesCentsTarget(50);
        setNoCentsTarget(50);
        liveYesRef.current = 50;
        liveNoRef.current = 50;
      }

      // Fetch NO token price history if provided
      if (noTokenId) {
        const noUrl = `https://clob.polymarket.com/prices-history?market=${noTokenId}&interval=${timeframe}&fidelity=60`;
        console.log('📊 Fetching NO price history:', noUrl);
        
        const noResponse = await fetch(noUrl);
        if (noResponse.ok) {
          const noData = await noResponse.json();
          const noPoints: PricePoint[] = [];
          if (noData.history && Array.isArray(noData.history)) {
            noData.history.forEach((point: any) => {
              if (point.t && point.p !== undefined) {
                noPoints.push({
                  timestamp: point.t * 1000,
                  price: parseFloat(point.p),
                });
              }
            });
          }
          if (noPoints.length > 0) {
            setNoPriceHistory(noPoints);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
      const now = Date.now();
      const flat = [
        { timestamp: now - 86400000, price: 0.5 },
        { timestamp: now, price: 0.5 },
      ];
      setPriceHistory(flat);
      setYesCentsTarget(50);
      setNoCentsTarget(50);
    } finally {
      setLoading(false);
    }
  };

  // Memoize chart data to prevent unnecessary recalculations
  // MUST be before any early returns to avoid hooks error
  const chartMemo = useMemo(() => {
    const priceData = priceHistory.map((p) => p.price * 100);

    const labels: string[] = [];
    const totalPoints = priceHistory.length;
    for (let i = 0; i < totalPoints; i++) {
      if (i === 0 || i === Math.floor(totalPoints / 2) || i === totalPoints - 1) {
        const date = new Date(priceHistory[i].timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'pm' : 'am';
        const displayHours = hours % 12 || 12;
        labels.push(`${displayHours}:${minutes}${ampm}`);
      } else {
        labels.push('');
      }
    }

    const datasets: any[] = [
      { data: priceData, color: () => colors.success, strokeWidth: 2.5 }
    ];

    // Add NO token data if available
    if (noTokenId && noPriceHistory.length > 0) {
      const noPriceData = noPriceHistory.map((p) => p.price * 100);
      datasets.push({ data: noPriceData, color: () => colors.error, strokeWidth: 2.5 });
    }

    return {
      data: {
        labels,
        datasets,
      },
    };
  }, [priceHistory, noPriceHistory, noTokenId, colors.success, colors.error]);

  // Memoize chart config
  const chartConfig = useMemo(() => ({
    backgroundColor: colors.surfaceSecondary,
    backgroundGradientFrom: colors.surfaceSecondary,
    backgroundGradientTo: colors.surfaceSecondary,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.success,
    labelColor: () => colors.textTertiary,
    style: {
      borderRadius: 8,
      paddingRight: 0,
    },
    propsForDots: {
      r: '0',
    },
    propsForBackgroundLines: {
      stroke: 'transparent',
    },
    fillShadowGradient: colors.success,
    fillShadowGradientOpacity: 0.15,
    fillShadowGradientFrom: colors.success,
    fillShadowGradientFromOpacity: 0.3,
    fillShadowGradientTo: 'transparent',
    fillShadowGradientToOpacity: 0,
  }), [colors.surfaceSecondary, colors.textTertiary, colors.success]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        <ActivityIndicator size="small" color={color} />
      </View>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={[styles.noData, { color: colors.textTertiary }]}>No data</Text>
      </View>
    );
  }

  const timeframes = ['1H', '6H', '1D', '1W', '1M', 'ALL'];
  const timeframeMap: Record<string, string> = {
    '1H': '1h',
    '6H': '6h',
    '1D': '1d',
    '1W': '1w',
    '1M': '1m',
    'ALL': 'all',
  };

  const handleTouch = (touchXPos: number) => {
    const effectiveWidth = containerWidth - chartPadding * 2;
    const index = Math.round((touchXPos - chartPadding) / effectiveWidth * (priceHistory.length - 1));
    const clampedIndex = Math.max(0, Math.min(priceHistory.length - 1, index));
    
    if (priceHistory[clampedIndex]) {
      const touchedPrice = priceHistory[clampedIndex].price;
      const yesCents = touchedPrice * 100;
      const noCents = (1 - touchedPrice) * 100;
      setYesCentsTarget(yesCents);
      setNoCentsTarget(noCents);
      setTouchX(touchXPos);
      setTouchedIndex(clampedIndex);
    }
  };

  // Initialize PanResponder only once
  if (!panResponderRef.current) {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isTouchingRef.current = true;
        handleTouch(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        isTouchingRef.current = false;
        // Restore live prices
        setYesCentsTarget(liveYesRef.current);
        setNoCentsTarget(liveNoRef.current);
        setTouchX(null);
        setTouchedIndex(null);
      },
    });
  }

  return (
    <View style={{ width: '100%' }}>
      <View 
        style={[styles.container, { height }]}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setContainerWidth(width);
        }}
      >
        <LineChart
        data={chartMemo.data as any}
        width={containerWidth}
        height={height}
        chartConfig={chartConfig}
        bezier
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLabels={false}
        withHorizontalLabels={false}
        withShadow={false}
        withDots={false}
        segments={0}
        style={{
          marginLeft: 0,
          marginRight: 0,
          paddingRight: 0,
          borderRadius: 12,
        }}
      />

      {/* Touch overlay for interaction */}
      <View
        style={styles.touchOverlay}
        {...panResponderRef.current?.panHandlers}
      />

      {/* Touch indicators */}
      {touchX !== null && touchedIndex !== null && (
        <>
          {/* Vertical line */}
          <View
            style={[
              styles.touchLine,
              {
                left: touchX,
                height: height,
                backgroundColor: colors.border,
              }
            ]}
          />
          {/* Tooltip */}
          {priceHistory[touchedIndex] && (
            <View
              style={[
                styles.tooltip,
                {
                  left: touchX > containerWidth / 2 ? touchX - 110 : touchX + 10,
                  top: 10,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }
              ]}
            >
              <Text style={[styles.tooltipTime, { color: colors.text }]}>
                {new Date(priceHistory[touchedIndex].timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </Text>
              <Text style={[styles.tooltipDate, { color: colors.textSecondary }]}>
                {new Date(priceHistory[touchedIndex].timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
              <View style={styles.tooltipPrices}>
                <View style={styles.tooltipPriceRow}>
                  <Text style={[styles.tooltipLabel, { color: colors.success }]}>YES</Text>
                  <Text style={[styles.tooltipPrice, { color: colors.success }]}>
                    {(priceHistory[touchedIndex].price * 100).toFixed(1)}%
                  </Text>
                </View>
                {noTokenId && noPriceHistory[touchedIndex] && (
                  <View style={styles.tooltipPriceRow}>
                    <Text style={[styles.tooltipLabel, { color: colors.error }]}>NO</Text>
                    <Text style={[styles.tooltipPrice, { color: colors.error }]}>
                      {(noPriceHistory[touchedIndex].price * 100).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </>
      )}
      
      {/* LIVE indicator */}
      {isLive && (
        <View style={[styles.liveIndicator, { backgroundColor: colors.surface }]}>
          <View style={styles.liveDot} />
          <Text style={[styles.liveText, { color: colors.success }]}>LIVE</Text>
        </View>
      )}
      </View>
      
      {/* Separator line */}
      <View style={[styles.separator, { backgroundColor: colors.border }]} />
      
      {/* Timeframe selector */}
      <View style={styles.timeframeContainer}>
        {timeframes.map((tf) => (
          <TouchableOpacity
            key={tf}
            style={[
              styles.timeframeButton,
              timeframe === timeframeMap[tf] && styles.timeframeButtonActive,
            ]}
            onPress={() => setTimeframe(timeframeMap[tf])}
          >
            <Text
              style={[
                styles.timeframeText,
                { color: timeframe === timeframeMap[tf] ? colors.primary : colors.textSecondary },
              ]}
            >
              {tf}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Separator line */}
      <View style={[styles.separator, { backgroundColor: colors.border }]} />
      
      {/* YES/NO labels below chart */}
      <View style={styles.priceLabelsRow}>
        <View style={styles.priceLabel}>
          <Text style={[styles.priceLabelText, { color: colors.textSecondary }]}>YES</Text>
          <Text style={[styles.priceLabelValue, { color: colors.success }]}>{animatedYes.toFixed(1)}%</Text>
        </View>
        <View style={styles.priceLabel}>
          <Text style={[styles.priceLabelText, { color: colors.textSecondary }]}>NO</Text>
          <Text style={[styles.priceLabelValue, { color: colors.error }]}>{animatedNo.toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noData: {
    fontSize: 11,
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 998,
  },
  touchDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    zIndex: 1001,
  },
  touchLine: {
    position: 'absolute',
    width: 2,
    top: 0,
    opacity: 0.6,
    zIndex: 999,
  },
  tooltip: {
    position: 'absolute',
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    minWidth: 100,
  },
  tooltipPrices: {
    marginBottom: 3,
  },
  tooltipPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  tooltipLabel: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.8,
  },
  tooltipPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  tooltipTime: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 1,
  },
  tooltipDate: {
    fontSize: 9,
    fontWeight: '400',
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 1001,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  timeframeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  timeframeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  priceLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 4,
  },
  priceLabel: {
    alignItems: 'center',
    gap: 4,
  },
  priceLabelText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceLabelValue: {
    fontSize: 18,
    fontWeight: '800',
  },
});
