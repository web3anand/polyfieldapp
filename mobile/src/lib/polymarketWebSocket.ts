/**
 * Polymarket WebSocket Integration (React Native)
 * Real-time price updates for markets
 */

export type PriceUpdateCallback = (yesPrice: number, noPrice: number) => void;
export type OrderLevel = { price: number; size: number };
export type OrderBookUpdateCallback = (bids: OrderLevel[], asks: OrderLevel[]) => void;

// Polymarket CLOB WebSocket for market data
// Docs: https://docs.polymarket.com/quickstart/websocket/WSS-Quickstart
// Channel: market (for public market data)
const WS_BASE_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/market';

interface WSAuth {
  apiKey: string;
  secret: string;
  passphrase: string;
}

class PolymarketWebSocket {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<PriceUpdateCallback>> = new Map();
  private tokenIdSubscribers: Map<string, Set<PriceUpdateCallback>> = new Map();
  private orderBookSubscribers: Map<string, Set<OrderBookUpdateCallback>> = new Map();
  private subscribedMarkets: Set<string> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private isConnecting: boolean = false;
  private auth: WSAuth | null = null;
  private wsDisabled: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
    private messageCount: number = 0;

  constructor() {
    // ⚠️ SECURITY: Never load API credentials in the client app
    // WebSocket authentication should be handled by your backend
    // Public market data doesn't require authentication
    console.log('📡 Polymarket WebSocket initialized (public data only)');
  }

  setAuth(apiKey: string, secret: string, passphrase: string): void {
    this.auth = { apiKey, secret, passphrase };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔐 Reconnecting with authentication...');
      this.disconnect();
      this.connect();
    }
  }

  subscribe(
    marketId: string,
    callback: PriceUpdateCallback,
    isTokenId: boolean = false
  ): () => void {
    if (isTokenId) {
      if (!this.tokenIdSubscribers.has(marketId)) {
        this.tokenIdSubscribers.set(marketId, new Set());
      }
      this.tokenIdSubscribers.get(marketId)!.add(callback);
    } else {
      if (!this.subscribers.has(marketId)) {
        this.subscribers.set(marketId, new Set());
      }
      this.subscribers.get(marketId)!.add(callback);
    }

    // Auto-connect if not connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    } else {
      this.subscribeToMarket(marketId, isTokenId);
    }

    return () => {
      this.unsubscribe(marketId, callback, isTokenId);
    };
  }

  // Subscribe to order book updates for a token (asset_id)
  subscribeOrderBook(tokenId: string, callback: OrderBookUpdateCallback): () => void {
    if (!this.orderBookSubscribers.has(tokenId)) {
      this.orderBookSubscribers.set(tokenId, new Set());
    }
    this.orderBookSubscribers.get(tokenId)!.add(callback);

    // Auto-connect if not connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    } else {
      this.subscribeToMarket(tokenId, true);
    }

    return () => {
      const cbs = this.orderBookSubscribers.get(tokenId);
      if (cbs) {
        cbs.delete(callback);
        if (cbs.size === 0) {
          this.orderBookSubscribers.delete(tokenId);
        }
      }
    };
  }

  unsubscribe(marketId: string, callback: PriceUpdateCallback, isTokenId: boolean = false): void {
    if (isTokenId) {
      const callbacks = this.tokenIdSubscribers.get(marketId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.tokenIdSubscribers.delete(marketId);
          this.unsubscribeFromMarket(marketId, true);
        }
      }
    } else {
      const callbacks = this.subscribers.get(marketId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(marketId);
          this.unsubscribeFromMarket(marketId, false);
        }
      }
    }
  }

  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(WS_BASE_URL);

      this.ws.onopen = () => {
        console.log('✅ Polymarket CLOB WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Start PING heartbeat every 10 seconds
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send('PING');
          }
        }, 10000);
        
        // Re-subscribe to all markets
        const tokenCount = this.tokenIdSubscribers.size + this.orderBookSubscribers.size;
        const conditionCount = this.subscribers.size;
        console.log(`📡 Subscribing to ${tokenCount} tokens, ${conditionCount} markets`);
        
        this.subscribers.forEach((_, marketId) => {
          this.subscribeToMarket(marketId, false);
        });
        this.tokenIdSubscribers.forEach((_, tokenId) => {
          this.subscribeToMarket(tokenId, true);
        });
        this.orderBookSubscribers.forEach((_, tokenId) => {
          this.subscribeToMarket(tokenId, true);
        });
      };

      this.ws.onmessage = (event) => {
        const msgStr = event.data as string;
        
        // Handle PONG heartbeat responses (not JSON)
        if (msgStr === 'PONG') {
          return;
        }
        
        try {
          const data = JSON.parse(msgStr);
          
            // Debug: Log first 10 messages
            if (this.messageCount < 10) {
              console.log('📨 WS:', JSON.stringify(data).slice(0, 150));
              this.messageCount++;
            }
          
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error: any) => {
        console.error('❌ WebSocket error:', error.message || error);
        this.isConnecting = false;
      };

      this.ws.onclose = (event: any) => {
        this.isConnecting = false;
        this.ws = null;
        
        // Clear ping interval
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }

        // Reconnect with exponential backoff
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * this.reconnectAttempts;
          console.log(`🔄 Reconnecting in ${delay/1000}s (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, delay);
        } else {
          console.log('⚠️ Max reconnect attempts reached. Call connect() to retry.');
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
    this.tokenIdSubscribers.clear();
    this.orderBookSubscribers.clear();
    this.subscribedMarkets.clear();
    this.reconnectAttempts = 0;
  }

  private subscribeToMarket(marketId: string, isTokenId: boolean): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Don't subscribe to same market multiple times
    if (this.subscribedMarkets.has(marketId)) {
      return;
    }

    try {
      // Polymarket CLOB market channel expects: type='market' and assets_ids array
      const message: any = {
        type: 'market',
        assets_ids: [marketId],
      };

      // Auth is optional for public market data
      if (this.auth) {
        message.auth = this.auth;
      }

      this.ws.send(JSON.stringify(message));
      this.subscribedMarkets.add(marketId);
      console.log(`📊 Subscribed to asset: ${marketId.slice(0, 12)}...`);
    } catch (error) {
      console.error(`Error subscribing to market ${marketId}:`, error);
    }
  }

  private unsubscribeFromMarket(marketId: string, isTokenId: boolean): void {
    console.log(`Unsubscribe from ${marketId} (will close on unmount)`);
  }

  private handleMessage(data: any): void {
    // CLOB WebSocket message format
    // event_type can be: 'book', 'price_change', 'last_trade_price'
    const eventType = data.event_type || data.type;
    const marketId = data.market || data.asset_id || data.token_id;
    
    if (!marketId) {
        // Log non-market messages
        if (this.messageCount < 15) {
          console.log('📭 Non-market message:', JSON.stringify(data).slice(0, 100));
        }
        return;
    }
    
      // Log events (first 20)
      if (this.messageCount < 20) {
        console.log(`🔔 ${eventType} → ${marketId.toString().slice(0, 12)}...`);
      }

    let yesPrice: number | undefined;
    let noPrice: number | undefined;
    let bidsLevels: OrderLevel[] | undefined;
    let asksLevels: OrderLevel[] | undefined;

    // Parse CLOB WebSocket messages
    if (eventType === 'book') {
      // Full order book snapshot
      const parseLevel = (lvl: any): OrderLevel | null => {
        if (!lvl) return null;
        const price = Number(lvl.price);
        const size = Number(lvl.size);
        return !isNaN(price) && !isNaN(size) ? { price, size } : null;
      };

      if (data.bids && Array.isArray(data.bids)) {
        bidsLevels = data.bids.map(parseLevel).filter(Boolean) as OrderLevel[];
        if (bidsLevels.length > 0) {
          yesPrice = bidsLevels[0].price;
        }
      }
      if (data.asks && Array.isArray(data.asks)) {
        asksLevels = data.asks.map(parseLevel).filter(Boolean) as OrderLevel[];
        if (asksLevels.length > 0) {
          noPrice = 1 - asksLevels[0].price;
        }
      }
    } 
    else if (eventType === 'price_change') {
      // Price change events
      if (data.price_changes && Array.isArray(data.price_changes)) {
        for (const change of data.price_changes) {
          if (change.best_bid !== undefined) {
            yesPrice = Number(change.best_bid);
          }
          if (change.best_ask !== undefined) {
            noPrice = 1 - Number(change.best_ask);
          }
        }
      }
    }
    else if (eventType === 'last_trade_price') {
      // Last trade price
      const price = Number(data.price);
      if (!isNaN(price)) {
        if (data.side === 'BUY') {
          yesPrice = price;
          noPrice = 1 - price;
        } else {
          noPrice = price;
          yesPrice = 1 - price;
        }
      }
    }

    // Dispatch order book updates IMMEDIATELY if we have subscribers and levels
    if (marketId && (bidsLevels || asksLevels)) {
      const obSubs = this.orderBookSubscribers.get(marketId);
      if (obSubs && obSubs.size > 0) {
        const b = bidsLevels ?? [];
        const a = asksLevels ?? [];
        // Execute callbacks immediately without queueing
        obSubs.forEach((cb) => {
          try { 
            cb(b, a); 
          } catch (e) { 
            console.error('Error in orderbook callback:', e); 
          }
        });
      }
    }

    if (marketId && (yesPrice !== undefined || noPrice !== undefined)) {
      if (yesPrice !== undefined && noPrice === undefined) {
        noPrice = 1 - yesPrice;
      } else if (noPrice !== undefined && yesPrice === undefined) {
        yesPrice = 1 - noPrice;
      }
      
      if (yesPrice !== undefined && noPrice !== undefined) {
        const tokenCallbacks = this.tokenIdSubscribers.get(marketId);
        if (tokenCallbacks) {
          tokenCallbacks.forEach((callback) => {
            try {
              callback(yesPrice!, noPrice!);
            } catch (error) {
              console.error('Error in price update callback:', error);
            }
          });
        }
        
        const conditionCallbacks = this.subscribers.get(marketId);
        if (conditionCallbacks) {
          conditionCallbacks.forEach((callback) => {
            try {
              callback(yesPrice!, noPrice!);
            } catch (error) {
              console.error('Error in price update callback:', error);
            }
          });
        }
      }
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const polymarketWS = new PolymarketWebSocket();
