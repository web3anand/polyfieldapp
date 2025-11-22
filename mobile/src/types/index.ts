/**
 * Shared Types
 * Used across mobile app
 */

export interface Market {
  id: string;
  conditionId?: string;
  yesTokenId?: string;
  noTokenId?: string;
  title: string;
  category: 'Football' | 'Basketball' | 'Baseball' | 'Soccer' | 'Tennis' | 'Hockey' | 'MMA' | 'Boxing' | 'Cricket';
  yesPrice: number;
  noPrice: number;
  volume: string;
  liquidity?: number;
  participants: number;
  endDate: string;
  endTimestamp?: number; // epoch ms for sorting/filtering
  imageUrl?: string;
  trending?: 'up' | 'down';
}

export interface Position {
  id: string;
  marketTitle: string;
  side: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  invested: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  date: string;
  status: 'completed' | 'pending';
  method: string;
}

export interface Trade {
  id: string;
  marketTitle: string;
  side: 'yes' | 'no';
  action: 'buy' | 'sell';
  shares: number;
  price: number;
  total: number;
  date: string;
  time: string;
}

export interface ClosedPosition {
  id: string;
  marketTitle: string;
  side: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  closedPrice: number;
  invested: number;
  closedValue: number;
  pnl: number;
  pnlPercentage: number;
  closedDate: string;
}
