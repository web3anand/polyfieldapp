import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗ MISSING');
  console.error('EXPO_PUBLIC_SUPABASE_KEY:', supabaseAnonKey ? '✓' : '✗ MISSING');
  console.error('Please check your .env.local file');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Database types
export interface Market {
  id: string;
  title: string;
  question?: string;
  condition_id: string;
  token_id?: string;
  yes_token_id?: string;
  no_token_id?: string;
  category?: string;
  end_date?: string;
  image_url?: string;
  liquidity?: number;
  volume?: string;
  participants?: number;
  yes_price?: number;
  no_price?: number;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Position {
  id: string;
  user_address: string;
  market_id: string;
  side: 'yes' | 'no';
  shares: number;
  invested: number;
  current_value: number;
  current_price: number;
  status: 'open' | 'closed';
  closed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Bet {
  id: string;
  user_address: string;
  market_id: string;
  side: 'yes' | 'no';
  amount: number;
  price: number;
  shares: number;
  status: 'pending' | 'filled' | 'cancelled' | 'failed';
  transaction_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  address: string;
  proxy_wallet_address?: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  total_trades?: number;
  total_volume?: number;
  win_rate?: number;
  created_at: string;
  updated_at: string;
}

// Markets functions
export async function getMarketsFromDB(limit = 100, offset = 0) {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('active', true)
    .order('liquidity', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data as Market[];
}

export async function saveMarketToDB(market: Partial<Market>) {
  const { data, error } = await supabase
    .from('markets')
    .upsert(market, { onConflict: 'condition_id' })
    .select()
    .single();

  if (error) throw error;
  return data as Market;
}

// User functions
export async function getOrCreateUser(address: string): Promise<UserProfile> {
  console.log('🔍 Getting or creating user:', address.slice(0, 8));
  
  // Try to get existing user
  const { data: existing, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('address', address.toLowerCase())
    .single();

  if (existing) {
    console.log('✅ User exists:', existing.address.slice(0, 8));
    return existing;
  }

  console.log('➕ Creating new user...');
  
  // Create new user if doesn't exist
  const { data, error } = await supabase
    .from('users')
    .insert({
      address: address.toLowerCase(),
      total_trades: 0,
      total_volume: 0,
      win_rate: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create user:', error);
    throw new Error(`Failed to create user: ${error.message}`);
  }
  
  console.log('✅ User created:', data.address.slice(0, 8));
  return data as UserProfile;
}

export async function updateUserProfile(address: string, updates: Partial<UserProfile>) {
  console.log('🔄 Updating user profile:', { address: address.slice(0, 8), updates });
  
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('address', address.toLowerCase())
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase update error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to update profile: ${error.message}`);
  }
  
  console.log('✅ Profile updated in Supabase:', data);
  return data as UserProfile;
}

// Positions functions
export async function getUserPositions(userAddress: string): Promise<Position[]> {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('user_address', userAddress.toLowerCase())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Position[];
}

export async function getOpenPositions(userAddress: string): Promise<Position[]> {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('user_address', userAddress.toLowerCase())
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Position[];
}

export async function getClosedPositions(userAddress: string): Promise<Position[]> {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('user_address', userAddress.toLowerCase())
    .eq('status', 'closed')
    .order('closed_date', { ascending: false });

  if (error) throw error;
  return data as Position[];
}

export async function savePosition(position: Partial<Position>) {
  const { data, error } = await supabase
    .from('positions')
    .insert(position)
    .select()
    .single();

  if (error) throw error;
  return data as Position;
}

export async function updatePosition(id: string, updates: Partial<Position>) {
  const { data, error } = await supabase
    .from('positions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Position;
}

// Bets/Trade history functions
export async function getUserBets(userAddress: string): Promise<Bet[]> {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('user_address', userAddress.toLowerCase())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Bet[];
}

export async function saveBet(bet: Partial<Bet>) {
  const { data, error } = await supabase
    .from('bets')
    .insert(bet)
    .select()
    .single();

  if (error) throw error;
  return data as Bet;
}

export async function updateBetStatus(
  id: string,
  status: Bet['status'],
  transactionHash?: string
) {
  const updates: Partial<Bet> = { status, updated_at: new Date().toISOString() };
  if (transactionHash) updates.transaction_hash = transactionHash;

  const { data, error } = await supabase
    .from('bets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Bet;
}
