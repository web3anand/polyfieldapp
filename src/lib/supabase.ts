/**
 * Supabase Database Functions
 * Handles all database operations for markets, bets, and users
 */

// Supabase client will be initialized here
// For now, using placeholder types

export interface DatabaseMarket {
  id: string;
  question: string;
  liquidity: number;
  odds: {
    yes: number;
    no: number;
  };
  sport?: string;
  end_date?: string;
  image_url?: string;
  active: boolean;
  created_at: string;
}

export interface DatabaseBet {
  id: string;
  user_address: string;
  market_id: string;
  outcome: 'YES' | 'NO';
  amount: string;
  odds: number;
  transaction_hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
}

export interface DatabaseUser {
  address: string;
  proxy_wallet_address?: string;
  email?: string;
  created_at: string;
  last_login?: string;
}

// TODO: Initialize Supabase client when credentials are available
let supabaseClient: any = null;

/**
 * Initialize Supabase Client
 * Call this once with your Supabase credentials
 */
export function initSupabase(url: string, anonKey: string) {
  // TODO: Initialize Supabase client
  // import { createClient } from '@supabase/supabase-js';
  // supabaseClient = createClient(url, anonKey);
}

/**
 * Get Markets from Database
 * @param limit - Number of markets to fetch (default: 100)
 * @param offset - Pagination offset (default: 0)
 * @returns Array of Market objects
 */
export async function getMarkets(
  limit: number = 100,
  offset: number = 0
): Promise<DatabaseMarket[]> {
  if (!supabaseClient) {
    // Supabase disabled - markets fetched from API
    return [];
  }

  try {
    const { data, error } = await supabaseClient
      .from('markets')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching markets from database:', error);
    return [];
  }
}

/**
 * Save Market to Database
 * @param market - Market data to save
 */
export async function saveMarket(market: Partial<DatabaseMarket>): Promise<void> {
  if (!supabaseClient) {
    // Supabase disabled
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('markets')
      .upsert(market, { onConflict: 'id' });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error saving market to database:', error);
    throw error;
  }
}

/**
 * Save Bet to Database
 * @param bet - Bet data to save
 * @returns Created bet ID
 */
export async function saveBet(bet: {
  user_address: string;
  market_id: string;
  outcome: 'YES' | 'NO';
  amount: string;
  odds: number;
  transaction_hash?: string;
}): Promise<string> {
  if (!supabaseClient) {
    // Supabase disabled
    return '';
  }

  try {
    const { data, error } = await supabaseClient
      .from('bets')
      .insert({
        ...bet,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('Error saving bet to database:', error);
    throw error;
  }
}

/**
 * Get User Bets
 * @param userAddress - User's wallet address
 * @returns Array of user's bets
 */
export async function getUserBets(
  userAddress: string
): Promise<DatabaseBet[]> {
  if (!supabaseClient) {
    // Supabase disabled
    return [];
  }

  try {
    const { data, error } = await supabaseClient
      .from('bets')
      .select('*')
      .eq('user_address', userAddress)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user bets:', error);
    return [];
  }
}

/**
 * Update Bet Status
 * @param betId - Bet ID
 * @param status - New status
 * @param transactionHash - Optional transaction hash
 */
export async function updateBetStatus(
  betId: string,
  status: 'pending' | 'confirmed' | 'failed',
  transactionHash?: string
): Promise<void> {
  if (!supabaseClient) {
    // Supabase disabled
    return;
  }

  try {
    const updateData: any = { status };
    if (transactionHash) {
      updateData.transaction_hash = transactionHash;
    }

    const { error } = await supabaseClient
      .from('bets')
      .update(updateData)
      .eq('id', betId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating bet status:', error);
    throw error;
  }
}

/**
 * Get or Create User
 * @param address - User's wallet address
 * @returns User data
 */
export async function getOrCreateUser(
  address: string
): Promise<DatabaseUser> {
  if (!supabaseClient) {
    // Supabase disabled - return minimal user object
    return {
      address,
      created_at: new Date().toISOString(),
    };
  }

  try {
    // Try to get existing user
    const { data: existingUser, error: fetchError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('address', address)
      .single();

    if (existingUser && !fetchError) {
      // Update last login
      await supabaseClient
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('address', address);

      return existingUser;
    }

    // Create new user
    const { data: newUser, error: createError } = await supabaseClient
      .from('users')
      .insert({
        address,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return newUser;
  } catch (error) {
    console.error('Error getting/creating user:', error);
    throw error;
  }
}

/**
 * Update User Proxy Wallet
 * @param address - User's wallet address
 * @param proxyAddress - Proxy wallet address
 */
export async function updateUserProxyWallet(
  address: string,
  proxyAddress: string
): Promise<void> {
  if (!supabaseClient) {
    // Supabase disabled
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('users')
      .update({ proxy_wallet_address: proxyAddress })
      .eq('address', address);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating user proxy wallet:', error);
    throw error;
  }
}

