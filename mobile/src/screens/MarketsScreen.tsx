/**
 * Markets Screen
 * Displays list of prediction markets
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  TextInput,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMarketsViaProxy, fetchSportsTags } from '../services/polymarketProxy';
import { useTheme } from '@react-navigation/native';
import { useThemeContext } from '../theme/ThemeContext';
import type { Market } from '../types';
import { polymarketWS } from '../lib/polymarketWebSocket';
import { saveMarketToDB, getMarketsFromDB } from '../utils/supabase';
import { cacheMarkets, getCachedMarkets } from '../utils/marketCache';
import PixelLoadingBar from '../components/PixelLoadingBar';
import CatLoader from '../components/CatLoader';

const categories = ['All', 'Football', 'Basketball', 'Baseball', 'Soccer', 'Tennis', 'Hockey', 'MMA', 'Boxing', 'Cricket'];

const topSuggestions = ['Trending', 'New', 'Most Traded', 'Ending Soon', 'Sports', 'Ended'];

const topSuggestionIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Trending: 'rocket',
  New: 'sparkles',
  'Most Traded': 'flame',
  'Ending Soon': 'time',
  Sports: 'trophy',
  Ended: 'checkmark-circle',
};

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  All: 'globe-outline',
  Football: 'football-outline',
  Basketball: 'basketball-outline',
  Baseball: 'baseball-outline',
  Soccer: 'football-outline',
  Tennis: 'tennisball-outline',
  Hockey: 'ice-cream-outline',
  MMA: 'fitness-outline',
  Boxing: 'fitness-outline',
  Cricket: 'baseball-outline',
};

export default function MarketsScreen({ navigation }: any) {
  const theme = useTheme();
  const { colors } = useThemeContext();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTop, setSelectedTop] = useState<string>('Trending');
  const [showEnded, setShowEnded] = useState<boolean>(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const [searchBarTop, setSearchBarTop] = useState(0);
  const unsubscribeFns = useRef<(() => void)[]>([]);
  const visibleMarketIds = useRef<Set<string>>(new Set());
  const priceUpdateQueue = useRef<Map<string, { yesPrice: number; noPrice: number }>>(new Map());
  const [visibleMarketsVersion, setVisibleMarketsVersion] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isRefreshingCustom, setIsRefreshingCustom] = useState(false);

  const openCategories = () => {
    if (categoriesOpen) return;
    setCategoriesOpen(true);
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeCategories = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 160,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setCategoriesOpen(false));
  };

  const loadMarkets = async (categoryFilter?: string) => {
    try {
      const category = categoryFilter || selectedCategory;
      
      // PERFORMANCE: Try AsyncStorage cache first (5min TTL)
      const cachedMarkets = await getCachedMarkets();
      if (cachedMarkets && cachedMarkets.length > 0 && !refreshing) {
        console.log('⚡ Loaded from AsyncStorage cache (instant)');
        const filtered = category !== 'All' 
          ? cachedMarkets.filter(m => m.category === category)
          : cachedMarkets;
        setMarkets(filtered);
        setLoading(false);
        return; // Skip API call if cache is fresh
      }
      
      // Fetch fresh data from API
      const data = await getMarketsViaProxy(500, 0, category !== 'All' ? category : undefined);
      const recentFirst = [...data].reverse();
      const categoryCount: Record<string, number> = {};
      recentFirst.forEach((m: any) => {
        categoryCount[m.category] = (categoryCount[m.category] || 0) + 1;
      });
      console.log('📊 Total markets loaded:', recentFirst.length);
      console.log('📊 Markets by category:', categoryCount);
      setMarkets(recentFirst);
      
      // Cache to AsyncStorage (fast, non-blocking)
      cacheMarkets(recentFirst);
      
      // Also cache to Supabase for cross-device sync (non-blocking)
      setTimeout(async () => {
        let cachedCount = 0;
        for (const market of recentFirst.slice(0, 100)) { // Only cache first 100 to DB
          try {
            await saveMarketToDB({
              condition_id: market.conditionId,
              title: market.title,
              yes_price: market.yesPrice,
              no_price: market.noPrice,
              category: market.category,
              end_date: market.endDate,
              image_url: market.imageUrl || '',
              liquidity: (market as any).liquidity || 0,
              volume: market.volume?.toString() || '0',
              participants: market.participants || 0,
              yes_token_id: market.yesTokenId,
              no_token_id: market.noTokenId,
            });
            cachedCount++;
          } catch (err) {
            // Silently fail for individual markets
          }
        }
        console.log(`✅ Cached ${cachedCount}/100 markets to Supabase`);
      }, 0);
    } catch (error) {
      console.error('Error loading markets:', error);
      
      // Fallback: Try AsyncStorage cache even if expired
      const cachedMarkets = await getCachedMarkets();
      if (cachedMarkets && cachedMarkets.length > 0) {
        console.log('📋 Using expired cache (offline mode)');
        setMarkets(cachedMarkets);
        setLoading(false);
        return;
      }
      
      // Last resort: Try Supabase DB cache
      try {
        const dbMarkets = await getMarketsFromDB(500, 0);
        if (dbMarkets.length > 0) {
          console.log('📋 Using Supabase cache (offline mode)');
          const uiMarkets = dbMarkets.map((m: any) => ({
            id: m.id || m.condition_id,
            conditionId: m.condition_id,
            title: m.title,
            yesPrice: m.yes_price || 0.5,
            noPrice: m.no_price || 0.5,
            category: m.category || 'All',
            endDate: m.end_date || '',
            imageUrl: m.image_url || '',
            volume: m.volume || '0',
            participants: m.participants || 0,
            yesTokenId: m.yes_token_id,
            noTokenId: m.no_token_id,
          }));
          setMarkets([...uiMarkets].reverse() as Market[]);
        }
      } catch (dbError) {
        console.error('All cache sources failed:', dbError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchSportsTags();
      await loadMarkets();
    };
    const timer = setTimeout(() => init(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (markets.length > 0) {
      loadMarkets(selectedCategory);
    }
  }, [selectedCategory]);

  // Batch price updates to reduce re-renders
  useEffect(() => {
    const flushInterval = setInterval(() => {
      if (priceUpdateQueue.current.size > 0) {
        setMarkets(prevMarkets => {
          const updates = priceUpdateQueue.current;
          priceUpdateQueue.current = new Map();
          return prevMarkets.map(m => {
            const update = updates.get(m.id);
            return update ? { ...m, yesPrice: update.yesPrice, noPrice: update.noPrice } : m;
          });
        });
      }
    }, 300); // Faster flush for snappier UI animations
    
    return () => clearInterval(flushInterval);
  }, []);

  // Subscribe to WebSocket price updates for VISIBLE markets only
  useEffect(() => {
    // Clean up previous subscriptions
    unsubscribeFns.current.forEach(fn => fn());
    unsubscribeFns.current = [];

    if (markets.length === 0) {
      return;
    }

    const visibleIds = Array.from(visibleMarketIds.current);
    const marketsToSubscribe = visibleIds.length > 0 
      ? markets.filter(m => visibleIds.includes(m.id))
      : markets.slice(0, 20); // Subscribe to first 20 on initial load

    console.log(`🔌 Subscribing to ${marketsToSubscribe.length} visible markets (was ${markets.length})`);
    
    // Subscribe to each visible market using token IDs
    marketsToSubscribe.forEach(market => {
      if (market.yesTokenId) {
        const unsubscribe = polymarketWS.subscribe(
          market.yesTokenId,
          (yesPrice: number, noPrice: number) => {
            // Queue the update instead of immediate state update
            priceUpdateQueue.current.set(market.id, { yesPrice, noPrice });
          },
          true // isTokenId = true
        );
        unsubscribeFns.current.push(unsubscribe);
      } else if (market.conditionId) {
        const unsubscribe = polymarketWS.subscribe(
          market.conditionId,
          (yesPrice: number, noPrice: number) => {
            priceUpdateQueue.current.set(market.id, { yesPrice, noPrice });
          },
          false // isTokenId = false
        );
        unsubscribeFns.current.push(unsubscribe);
      }
    });

    // Cleanup on unmount or when markets/visible items change
    return () => {
      unsubscribeFns.current.forEach(fn => fn());
      unsubscribeFns.current = [];
    };
  }, [markets.length, visibleMarketsVersion]); // Resubscribe when visible markets change

  const onRefresh = async () => {
    setRefreshing(true);
    setIsRefreshingCustom(true);
    await loadMarkets();
    // Keep loading bar visible for smooth animation
    setTimeout(() => setIsRefreshingCustom(false), 500);
  };

  // Debounce search query to reduce recomputations
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Filter markets based on search and category
  const filteredMarkets = useMemo(() => {
    const filtered = markets.filter(market => {
      // Search filter - check if search query matches title (case-insensitive)
      const searchLower = (debouncedQuery || '').toLowerCase().trim();
      const matchesSearch = searchLower === '' || 
                           market.title.toLowerCase().includes(searchLower);
      
      // Category filter - match exact category or show all
      const matchesCategory = selectedCategory === 'All' || 
                             market.category === selectedCategory;
      
      // Hide ended markets unless showEnded or Ended tab
      const now = Date.now();
      const isEnded = market.endTimestamp ? market.endTimestamp < now : false;
      if (isEnded && !showEnded && selectedTop !== 'Ended') {
        return false;
      }
      return matchesSearch && matchesCategory;
    });
    
    // Log filtered results for debugging
    if (selectedCategory !== 'All') {
      console.log(`🔍 Filtered ${filtered.length} markets for category: ${selectedCategory}`);
    }
    if (debouncedQuery) {
      console.log(`🔍 Search "${debouncedQuery}" found ${filtered.length} markets`);
    }
    
    return filtered;
  }, [markets, debouncedQuery, selectedCategory]);

  // Apply top tab sort: Trending, New, Most Traded
  const sortedMarkets = useMemo(() => {
    const arr = [...filteredMarkets];
    if (selectedTop === 'Trending') {
      // Sort by participants desc, then liquidity/volume desc
      arr.sort((a, b) => {
        const pa = a.participants || 0;
        const pb = b.participants || 0;
        if (pb !== pa) return pb - pa;
        const la = (a as any).liquidity ?? parseVolumeToNumber(a.volume);
        const lb = (b as any).liquidity ?? parseVolumeToNumber(b.volume);
        return lb - la;
      });
    } else if (selectedTop === 'Most Traded') {
      // Sort by liquidity/volume desc
      arr.sort((a, b) => {
        const la = (a as any).liquidity ?? parseVolumeToNumber(a.volume);
        const lb = (b as any).liquidity ?? parseVolumeToNumber(b.volume);
        return lb - la;
      });
    } else if (selectedTop === 'Ending Soon') {
      const now = Date.now();
      return arr.filter(m => m.endTimestamp && m.endTimestamp > now)
                 .sort((a, b) => (a.endTimestamp! - b.endTimestamp!));
    } else if (selectedTop === 'Ended') {
      // Only ended markets, sort by most recently ended
      const now = Date.now();
      return arr.filter(m => m.endTimestamp && m.endTimestamp < now)
                 .sort((a, b) => (b.endTimestamp! - a.endTimestamp!));
    } else if (selectedTop === 'New') {
      // Keep API order (already recent-first)
      return arr;
    }
    return arr;
  }, [filteredMarkets, selectedTop]);

  const handleBetClick = useCallback((market: Market, side: 'yes' | 'no') => {
    navigation.navigate('Bet', { market, selectedSide: side });
  }, [navigation]);

  const themedStyles = useMemo(() => styles(colors), [colors]);

  // Helper: parse formatted volume like "$1.2M" or "$500k" to number
  const parseVolumeToNumber = useCallback((v: string): number => {
    if (!v) return 0;
    const s = v.replace(/[$,\s]/g, '').toUpperCase();
    const mult = s.endsWith('M') ? 1_000_000 : s.endsWith('K') ? 1_000 : 1;
    const numStr = s.replace(/[MK]/g, '');
    const n = parseFloat(numStr);
    return isNaN(n) ? 0 : n * mult;
  }, []);

  const MarketCard = React.memo(({ item }: { item: Market }) => {
    const yesFlash = useRef(new Animated.Value(0)).current;
    const noFlash = useRef(new Animated.Value(0)).current;
    const yesScale = useRef(new Animated.Value(1)).current;
    const noScale = useRef(new Animated.Value(1)).current;
    const prevYes = useRef(item.yesPrice);
    const prevNo = useRef(item.noPrice);

    useEffect(() => {
      if (item.yesPrice !== prevYes.current) {
        yesFlash.setValue(0);
        Animated.sequence([
          Animated.timing(yesFlash, { toValue: 1, duration: 160, useNativeDriver: false }),
          Animated.timing(yesFlash, { toValue: 0, duration: 320, useNativeDriver: false })
        ]).start();
        prevYes.current = item.yesPrice;
      }
    }, [item.yesPrice]);

    useEffect(() => {
      if (item.noPrice !== prevNo.current) {
        noFlash.setValue(0);
        Animated.sequence([
          Animated.timing(noFlash, { toValue: 1, duration: 160, useNativeDriver: false }),
          Animated.timing(noFlash, { toValue: 0, duration: 320, useNativeDriver: false })
        ]).start();
        prevNo.current = item.noPrice;
      }
    }, [item.noPrice]);

    const yesBg = yesFlash.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255,255,255,0)', 'rgba(16,185,129,0.25)']
    });
    const noBg = noFlash.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255,255,255,0)', 'rgba(239,68,68,0.25)']
    });

    const now = Date.now();
    const isEnded = item.endTimestamp ? item.endTimestamp < now : false;

    return (
      <TouchableOpacity
        style={themedStyles.card}
        activeOpacity={0.7}
        onPress={() => handleBetClick(item, 'yes')}
      >
        <View style={themedStyles.titleRow}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={themedStyles.marketImage}
              defaultSource={require('../../assets/logo.png')}
            />
          ) : (
            <Image
              source={require('../../assets/logo.png')}
              style={themedStyles.marketImage}
              resizeMode="contain"
            />
          )}
          <View style={themedStyles.titleContainer}>
            <Text style={themedStyles.title} numberOfLines={2}>{item.title}</Text>
            {/* All stats in one line */}
            <View style={themedStyles.inlineStats}>
              <View style={[themedStyles.statusBadge, isEnded ? themedStyles.statusEnded : themedStyles.statusLive]}>
                <Text style={themedStyles.statusText}>{isEnded ? 'ENDED' : 'LIVE'}</Text>
              </View>
              <Text style={themedStyles.statDivider}>•</Text>
              <View style={themedStyles.statItem}>
                <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
                <Text style={themedStyles.statTextCompact}>{(item.participants / 1000).toFixed(1)}k</Text>
              </View>
              <Text style={themedStyles.statDivider}>•</Text>
              <View style={themedStyles.statItem}>
                <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                <Text style={themedStyles.statTextCompact}>{item.endDate}</Text>
              </View>
              <Text style={themedStyles.statDivider}>•</Text>
              <View style={themedStyles.statItem}>
                <Ionicons name="cash-outline" size={13} color={colors.textSecondary} />
                <Text style={themedStyles.statTextCompact}>{item.volume}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={themedStyles.buttonsRow}>
          <TouchableWithoutFeedback
            onPressIn={() => {
              Animated.spring(yesScale, {
                toValue: 0.95,
                useNativeDriver: true,
                speed: 50,
                bounciness: 0,
              }).start();
            }}
            onPressOut={() => {
              Animated.spring(yesScale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 8,
              }).start();
            }}
            onPress={(e) => { e.stopPropagation(); handleBetClick(item, 'yes'); }}
          >
            <Animated.View style={[themedStyles.betButton, themedStyles.yesButton, { transform: [{ scale: yesScale }] }]}>
              <View style={themedStyles.buttonContent}>
                <Text style={themedStyles.betLabel}>YES</Text>
                <Text style={themedStyles.betPrice}>{Math.round(item.yesPrice * 100)}%</Text>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback
            onPressIn={() => {
              Animated.spring(noScale, {
                toValue: 0.95,
                useNativeDriver: true,
                speed: 50,
                bounciness: 0,
              }).start();
            }}
            onPressOut={() => {
              Animated.spring(noScale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 8,
              }).start();
            }}
            onPress={(e) => { e.stopPropagation(); handleBetClick(item, 'no'); }}
          >
            <Animated.View style={[themedStyles.betButton, themedStyles.noButton, { transform: [{ scale: noScale }] }]}>
              <View style={themedStyles.buttonContent}>
                <Text style={themedStyles.betLabel}>NO</Text>
                <Text style={themedStyles.betPrice}>{Math.round(item.noPrice * 100)}%</Text>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableOpacity>
    );
  });

  const renderMarketCard = useCallback(({ item }: { item: Market }) => <MarketCard item={item} />, [handleBetClick, themedStyles]);

  const keyExtractor = useCallback((item: Market) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 170,
      offset: 170 * index,
      index,
    }),
    []
  );

  // Track which markets are visible on screen for targeted WebSocket subscriptions
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const newVisibleIds = new Set<string>(viewableItems.map((item: any) => item.item.id as string));
    
    // Check if visible markets actually changed
    const changed = newVisibleIds.size !== visibleMarketIds.current.size ||
      Array.from(newVisibleIds).some(id => !visibleMarketIds.current.has(id));
    
    if (changed) {
      visibleMarketIds.current = newVisibleIds;
      setVisibleMarketsVersion(v => v + 1); // Trigger resubscription
      console.log(`👀 ${newVisibleIds.size} markets now visible`);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Item must be 50% visible
    minimumViewTime: 100, // Must be visible for 100ms
  }).current;

  if (loading) {
    return (
      <View style={themedStyles.centered}>
        <CatLoader label="LOADING MARKETS..." />
      </View>
    );
  }

  return (
    <View style={[themedStyles.container, { backgroundColor: theme.colors.background }]}>
      {/* Blur Overlay and Loader for Pull-to-Refresh */}
      {isRefreshingCustom && (
        <>
          <BlurView
            intensity={20}
            tint="dark"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />
          <View style={{
            position: 'absolute',
            top: '40%',
            left: 0,
            right: 0,
            zIndex: 1000,
            alignItems: 'center',
          }}>
            <CatLoader label="REFRESHING..." />
          </View>
        </>
      )}
      
      {/* Fixed Header - Search Bar and Chips */}
      <View style={{ backgroundColor: theme.colors.background }}>
        {/* Search Bar */}
        <View 
          style={[themedStyles.searchContainer, { backgroundColor: theme.colors.card }]}
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            setSearchBarTop(y + height + 4);
          }}
        > 
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={themedStyles.searchIcon} />
          <TextInput
            style={themedStyles.searchInput}
            placeholder="Search markets..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => navigation.navigate('Search')}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={themedStyles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Top Category Chips - Polymarket Style */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={themedStyles.topTabsContainer}
          contentContainerStyle={themedStyles.topTabsContent}
        >
          {topSuggestions.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                themedStyles.topTab,
                selectedTop === category && themedStyles.topTabActive,
              ]}
              onPress={() => {
                setSelectedTop(category);
                if (category === 'Sports') {
                  setSelectedCategory('Football');
                  loadMarkets('Football');
                } else {
                  setSelectedCategory('All');
                  loadMarkets('All');
                }
                // Reset showEnded when switching tabs except Ended
                if (category !== 'Ended') setShowEnded(false);
              }}
            >
              <Ionicons 
                name={topSuggestionIcons[category]} 
                size={16} 
                color={selectedTop === category ? '#FFFFFF' : colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  themedStyles.topTabText,
                  selectedTop === category && themedStyles.topTabTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              themedStyles.topTab,
              showEnded && themedStyles.topTabActive,
            ]}
            onPress={() => setShowEnded(v => !v)}
          >
            <Ionicons 
              name={showEnded ? 'toggle' : 'toggle-outline'} 
              size={16} 
              color={showEnded ? '#FFFFFF' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                themedStyles.topTabText,
                showEnded && themedStyles.topTabTextActive,
              ]}
            >
              {showEnded ? 'Ended: ON' : 'Ended: OFF'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Show selected category chip beneath search when any filter applied */}
        {selectedCategory !== 'All' && !categoriesOpen && (
          <View style={[themedStyles.selectedFilterRow, { backgroundColor: theme.colors.card }]}>
            <Ionicons name={categoryIcons[selectedCategory]} size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[themedStyles.selectedFilterText, { color: theme.colors.text }]}>{selectedCategory}</Text>
            <TouchableOpacity onPress={() => setSelectedCategory('All')} style={themedStyles.clearTagButton}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Categories Dropdown */}
      {categoriesOpen && (
        <>
          <Animated.View
            style={[
              themedStyles.dropdown,
              { 
                backgroundColor: theme.colors.card, 
                top: searchBarTop,
                transform: [{ translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
                opacity: dropdownAnim
              }
            ]}
          >
            <View style={themedStyles.dropdownGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    themedStyles.categoryChipDropdown,
                    selectedCategory === category && themedStyles.categoryChipDropdownActive
                  ]}
                  onPress={() => { setSelectedCategory(category); closeCategories(); }}
                >
                  <Ionicons 
                    name={categoryIcons[category]} 
                    size={14} 
                    color={selectedCategory === category ? colors.text : colors.textSecondary}
                  />
                  <Text style={[
                    themedStyles.categoryChipText,
                    selectedCategory === category && themedStyles.categoryChipTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Tap outside to close */}
          <TouchableWithoutFeedback onPress={closeCategories}>
            <Animated.View style={[themedStyles.backdrop, { opacity: dropdownAnim }]} />
          </TouchableWithoutFeedback>
        </>
      )}

      {/* Markets List */}
       <FlatList
        data={sortedMarkets}
        renderItem={renderMarketCard}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        maxToRenderPerBatch={10}
        initialNumToRender={15}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={100}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={themedStyles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={['transparent']}
          />
        }
        ListEmptyComponent={
          <View style={themedStyles.centered}>
             <Text style={[themedStyles.emptyText, { color: theme.colors.text }]}>
              {searchQuery || selectedCategory !== 'All' 
                ? 'No markets found' 
                : 'No markets available'}
            </Text>
          </View>
        }
      />

    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  endDate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    overflow: 'hidden', // Prevent content overflow
  },
  marketImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: colors.surfaceSecondary,
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0, // Prevent overflow
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusLive: {
    backgroundColor: '#16a34a33',
    borderWidth: 1,
    borderColor: '#16a34a66',
  },
  statusEnded: {
    backgroundColor: '#6b728033',
    borderWidth: 1,
    borderColor: '#6b728066',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleChipTextActive: {
    color: '#FFFFFF',
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  inlineStats: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statTextCompact: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '400',
    marginHorizontal: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingVertical: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 4,
  },
  statText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  betButton: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  yesButton: {
    backgroundColor: colors.success,
  },
  noButton: {
    backgroundColor: colors.error,
  },
  textureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    opacity: 0,
    zIndex: 0,
  },
  shadowLayer1: {
    display: 'none',
  },
  shadowLayer2: {
    display: 'none',
  },
  shadowYes: {
    display: 'none',
  },
  shadowNo: {
    display: 'none',
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    zIndex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 3,
  },
  betLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#ffffff',
    opacity: 0.85,
  },
  betPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 22,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontVariant: ['tabular-nums'],
  },
  yesPrice: {
    color: '#10b981',
  },
  noPrice: {
    color: '#ef4444',
  },
  pricesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  priceBox: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  volume: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 0,
  },
  searchIcon: {
    marginRight: 8,
  },
  topTabsContainer: {
    marginTop: 4,
    marginBottom: 8,
    height: 50,
  },
  topTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  topTab: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  topTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  topTabTextActive: {
    color: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  clearButton: {
    padding: 4,
  },
  selectedFilterRow: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectedFilterText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  clearTagButton: {
    padding: 2,
  },
  dropdown: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 100,
  },
  dropdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChipDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
  },
  categoryChipDropdownActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.text,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    zIndex: 50,
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.text,
  },
});

