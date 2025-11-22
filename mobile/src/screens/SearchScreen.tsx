/**
 * Search Screen
 * Polymarket-style browse chips + recent list + search results
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard, Image, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../theme/ThemeContext';
import { getMarketsViaProxy } from '../services/polymarketProxy';
import type { Market } from '../types';

const browseChips = ['New', 'Trending', 'Popular', 'Sports', 'Football', 'Basketball', 'Cricket', 'Politics', 'Crypto', 'Business', 'Entertainment'];

export default function SearchScreen({ navigation }: any) {
  const { colors } = useThemeContext();
  const themed = styles(colors);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Market[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const marketsCache = useRef<Market[]>([]);
  const cacheTimestamp = useRef<number>(0);

  useEffect(() => {
    // Auto-focus and preload markets for instant search
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    // Preload markets in background
    const preloadMarkets = async () => {
      try {
        const markets = await getMarketsViaProxy(500, 0, undefined);
        marketsCache.current = markets;
        cacheTimestamp.current = Date.now();
      } catch (error) {
        console.error('Preload error:', error);
      }
    };
    preloadMarkets();

    return () => clearTimeout(timer);
  }, []);

  const addRecent = (text: string) => {
    if (!text.trim()) return;
    setRecent((r) => [text.trim(), ...r.filter((x) => x !== text.trim())].slice(0, 8));
  };

  // Fast local search with cached data
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(() => {
      try {
        const searchTerm = query.toLowerCase().trim();
        const searchWords = searchTerm.split(/\s+/);
        
        // Map browse chip terms to category/search logic
        const categoryMap: Record<string, string> = {
          'football': 'Football',
          'basketball': 'Basketball',
          'cricket': 'Cricket',
          'sports': 'Sports',
          'politics': 'Politics',
          'crypto': 'Crypto',
          'business': 'Business',
          'entertainment': 'Entertainment',
        };
        
        // Check if this is a category search
        const matchedCategory = categoryMap[searchTerm] || categoryMap[searchWords[0]];
        
        // Fast local search in cached markets
        const filtered = marketsCache.current
          .filter((m: Market) => {
            const title = m.title.toLowerCase();
            const category = (m.category || '').toLowerCase();
            
            // If searching by category chip, match category field
            if (matchedCategory) {
              return category === matchedCategory.toLowerCase() || 
                     title.includes(searchTerm) ||
                     title.includes(matchedCategory.toLowerCase());
            }
            
            // For "New", "Trending", "Popular" - show all recent markets
            if (['new', 'trending', 'popular'].includes(searchTerm)) {
              return true;
            }
            
            // Otherwise match title or category containing search words
            return searchWords.every(word => 
              title.includes(word) || category.includes(word)
            );
          })
          .slice(0, 100); // Increased limit to show more results

        setSearchResults(filtered);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 150); // Reduced debounce to 150ms for faster response

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const renderMarketCard = React.useCallback(({ item }: { item: Market }) => {
    const yesPrice = Math.round((item.yesPrice || 0) * 100);
    const noPrice = Math.round((item.noPrice || 0) * 100);
    
    return (
      <TouchableOpacity
        style={themed.marketCard}
        activeOpacity={0.7}
        onPress={() => {
          addRecent(item.title);
          navigation.navigate('Bet', { market: item, selectedSide: 'yes' });
        }}
      >
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={themed.marketImage}
            resizeMode="cover"
            defaultSource={require('../../assets/logo.png')}
          />
        ) : (
          <Image
            source={require('../../assets/logo.png')}
            style={themed.marketImage}
            resizeMode="contain"
          />
        )}
        <View style={themed.marketInfo}>
          <Text style={themed.marketTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={themed.priceRow}>
            <View style={[themed.priceChip, { backgroundColor: colors.success + '20' }]}>
              <Text style={[themed.priceText, { color: colors.success }]}>
                YES {yesPrice}¢
              </Text>
            </View>
            <View style={[themed.priceChip, { backgroundColor: colors.error + '20' }]}>
              <Text style={[themed.priceText, { color: colors.error }]}>
                NO {noPrice}¢
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [colors, themed, navigation]);

  return (
    <View style={[themed.container, { backgroundColor: colors.background }]}>      
      {/* Search bar */}
      <View style={[themed.searchContainer, { backgroundColor: colors.surface }]}> 
        <TouchableOpacity onPress={() => navigation.navigate('Markets')} style={themed.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={themed.searchInput}
          placeholder="Search markets..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoFocus={true}
          onSubmitEditing={() => { addRecent(query); }}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={themed.clearButton}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results */}
      {query.trim() ? (
        <View style={themed.resultsContainer}>
          {searching ? (
            <View style={themed.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : searchResults.length > 0 ? (
            <>
              <View style={themed.resultsHeader}>
                <Text style={themed.resultsCount}>
                  {searchResults.length} {searchResults.length === 1 ? 'market' : 'markets'} found
                </Text>
              </View>
              <FlatList
                data={searchResults}
                renderItem={renderMarketCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={themed.resultsList}
                showsVerticalScrollIndicator={false}
                maxToRenderPerBatch={10}
                initialNumToRender={10}
                windowSize={5}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => ({
                  length: 96,
                  offset: 96 * index,
                  index,
                })}
              />
            </>
          ) : (
            <View style={themed.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
              <Text style={themed.emptyText}>No markets found</Text>
              <Text style={themed.emptySubtext}>Try different keywords</Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Browse chips */}
          <Text style={themed.sectionHeader}>BROWSE</Text>
          <View style={themed.chipsRow}>
            {browseChips.map((chip) => (
              <TouchableOpacity 
                key={chip} 
                style={themed.chip}
                onPress={() => {
                  setQuery(chip);
                  addRecent(chip);
                }}
              >
                <Ionicons name={
                  chip === 'New' ? 'sparkles-outline' :
                  chip === 'Trending' ? 'rocket-outline' :
                  chip === 'Popular' ? 'flame-outline' :
                  chip === 'Sports' ? 'trophy-outline' :
                  chip === 'Football' ? 'football-outline' :
                  chip === 'Basketball' ? 'basketball-outline' :
                  chip === 'Cricket' ? 'baseball-outline' :
                  chip === 'Politics' ? 'megaphone-outline' :
                  chip === 'Crypto' ? 'logo-bitcoin' :
                  chip === 'Business' ? 'briefcase-outline' :
                  chip === 'Entertainment' ? 'film-outline' :
                  'help-circle-outline'
                } size={14} color={colors.textSecondary} />
                <Text style={themed.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent */}
          {recent.length > 0 && (
            <>
              <Text style={themed.sectionHeader}>RECENT</Text>
              <View style={themed.recentList}>
                {recent.map((item) => (
                  <TouchableOpacity 
                    key={item} 
                    style={themed.recentItem}
                    onPress={() => setQuery(item)}
                  >
                    <Text style={themed.recentText} numberOfLines={1}>{item}</Text>
                    <TouchableOpacity onPress={() => setRecent((r) => r.filter((x) => x !== item))}>
                      <Ionicons name="close" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  clearButton: { padding: 4 },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    paddingTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  marketCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  marketImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
  },
  marketIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marketInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  marketTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priceChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: 16,
    marginTop: 10,
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  recentList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
});
