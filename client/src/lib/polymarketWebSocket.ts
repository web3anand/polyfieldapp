/**
 * Polymarket WebSocket Integration
 * Real-time price updates for markets
 * 
 * Reference: https://docs.polymarket.com/developers/CLOB/websocket/wss-overview
 */

import type { AuthHeaders } from '../services/clobAuth';

export type PriceUpdateCallback = (yesPrice: number, noPrice: number) => void;

const WS_BASE_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/';

// WebSocket auth format per Polymarket docs
interface WSAuth {
  apiKey: string;
  secret: string;
  passphrase: string;
}

interface WSAuthConfig {
  auth?: WSAuth;
  channel: 'USER' | 'MARKET';
  markets?: string[];      // Condition IDs for USER channel
  asset_ids?: string[];    // Token IDs for MARKET channel
}

class PolymarketWebSocket {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<PriceUpdateCallback>> = new Map();
  private tokenIdSubscribers: Map<string, Set<PriceUpdateCallback>> = new Map(); // Track by token ID
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private isConnecting: boolean = false;
  private authConfig: WSAuthConfig | null = null;

  /**
   * Set authentication configuration for WebSocket
   * @param apiKey - Builder API key
   * @param secret - Builder secret
   * @param passphrase - Builder passphrase
   */
  setAuth(apiKey: string, secret: string, passphrase: string): void {
    this.authConfig = {
      auth: { apiKey, secret, passphrase },
      channel: 'MARKET',  // Use MARKET channel for price data
    };
    
    // Reconnect if already connected to apply new auth
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔐 Reconnecting with authentication...');
      this.disconnect();
      this.connect();
    }
  }

  /**
   * Subscribe to market price updates
   * @param marketId - Market condition ID or token ID
   * @param callback - Callback function for price updates
   * @param isTokenId - Whether marketId is a token ID (true) or condition ID (false)
   * @returns Unsubscribe function
   */
  subscribe(
    marketId: string,
    callback: PriceUpdateCallback,
    isTokenId: boolean = false
  ): () => void {
    if (isTokenId) {
      // Subscribe by token ID (for MARKET channel)
      if (!this.tokenIdSubscribers.has(marketId)) {
        this.tokenIdSubscribers.set(marketId, new Set());
      }
      this.tokenIdSubscribers.get(marketId)!.add(callback);
    } else {
      // Subscribe by condition ID (for USER channel or fallback)
      if (!this.subscribers.has(marketId)) {
        this.subscribers.set(marketId, new Set());
      }
      this.subscribers.get(marketId)!.add(callback);
    }

    // Connect if not already connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    } else {
      // Subscribe to this market
      this.subscribeToMarket(marketId, isTokenId);
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(marketId, callback, isTokenId);
    };
  }

  /**
   * Unsubscribe from market
   * @param marketId - Market condition ID or token ID
   * @param callback - Callback function to remove
   * @param isTokenId - Whether marketId is a token ID
   */
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

  /**
   * Connect to WebSocket
   * Note: Polymarket WebSocket requires authentication for most features
   * Without auth, connection will fail gracefully - app will work with HTTP polling
   */
  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    // Check if we've already determined WebSocket won't work
    if ((window as any).__polymarket_ws_disabled) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(WS_BASE_URL);

      this.ws.onopen = () => {
        console.log('✅ Polymarket WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Send authentication and subscription message if auth is configured
        if (this.authConfig) {
          console.log('📡 Sending authenticated subscription...');
          this.sendSubscription();
        } else {
          // Subscribe without auth for public market data
          const tokenCount = this.tokenIdSubscribers.size;
          const conditionCount = this.subscribers.size;
          console.log(`📡 Subscribing to ${tokenCount} token IDs and ${conditionCount} condition IDs (public)`);
          
          this.subscribers.forEach((_, marketId) => {
            this.subscribeToMarket(marketId, false);
          });
          this.tokenIdSubscribers.forEach((_, tokenId) => {
            this.subscribeToMarket(tokenId, true);
          });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Log first few messages for debugging
          if (!(window as any).__ws_message_logged || (window as any).__ws_message_count < 3) {
            console.log('📨 WebSocket message:', data);
            (window as any).__ws_message_logged = true;
            (window as any).__ws_message_count = ((window as any).__ws_message_count || 0) + 1;
          }
          
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        // Suppress error logging if we know WebSocket won't work without auth
        if ((window as any).__polymarket_ws_disabled) {
          return;
        }
        
        // Only log first error to avoid console spam
        if (!( window as any).__ws_error_logged) {
          console.log('ℹ️ WebSocket connection error. This is expected if authentication is required.');
          (window as any).__ws_error_logged = true;
        }
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed. Code: ${event.code}, Reason: ${event.reason || 'none'}`);
        this.isConnecting = false;
        this.ws = null;

        // Code 1006: Abnormal closure (usually means server rejected connection)
        // This often happens when WebSocket requires authentication
        if (event.code === 1006 && !this.authConfig) {
          console.log('ℹ️ WebSocket connection rejected. Likely requires authentication.');
          console.log('   App will continue to work without real-time updates.');
          console.log('   Prices will be from initial HTTP fetch.');
          
          // Stop trying to reconnect without auth
          this.reconnectAttempts = this.maxReconnectAttempts;
          (window as any).__polymarket_ws_disabled = true;
          return;
        }

        // Attempt to reconnect if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => {
            this.connect();
          }, this.reconnectDelay * this.reconnectAttempts);
        } else {
          console.warn('⚠️ Max reconnection attempts reached.');
          console.log('   App will continue to work with initial prices from HTTP API.');
          console.log('   Refresh the page to get updated prices.');
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
    this.tokenIdSubscribers.clear();
    this.reconnectAttempts = 0;
    this.authConfig = null;
  }

  /**
   * Send subscription message with authentication
   * According to Polymarket docs: https://docs.polymarket.com/developers/CLOB/websocket/wss-overview
   * Correct format: type (MARKET or USER), assets_ids (with underscore), auth object
   */
  private sendSubscription(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.authConfig) {
      return;
    }

    try {
      // Collect all condition IDs and token IDs
      const conditionIds = Array.from(this.subscribers.keys());
      const tokenIds = Array.from(this.tokenIdSubscribers.keys());

      // Subscribe to MARKET channel for price updates (using token IDs)
      if (tokenIds.length > 0) {
        this.ws.send(
          JSON.stringify({
            type: 'MARKET',
            assets_ids: tokenIds,  // Note: assets_ids with underscore
            auth: this.authConfig.auth,
          })
        );
      }

      // Subscribe to USER channel for order updates (using condition IDs)
      // Only if auth is provided (USER channel requires authentication)
      if (conditionIds.length > 0 && this.authConfig.auth) {
        this.ws.send(
          JSON.stringify({
            type: 'USER',
            markets: conditionIds,
            auth: this.authConfig.auth,
          })
        );
      }
    } catch (error) {
      console.error('Error sending subscription:', error);
    }
  }

  /**
   * Subscribe to a specific market (without auth - public market data)
   * According to Polymarket docs, use type: "MARKET" with assets_ids (note the underscore)
   * @param marketId - Market condition ID or token ID
   * @param isTokenId - Whether marketId is a token ID
   */
  private subscribeToMarket(marketId: string, isTokenId: boolean): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      if (isTokenId) {
        // Subscribe to MARKET channel using token ID
        // Correct format: type (not channel), assets_ids (with underscore)
        this.ws.send(
          JSON.stringify({
            type: 'MARKET',
            assets_ids: [marketId],
          })
        );
      } else {
        // Subscribe using condition ID (markets field)
        this.ws.send(
          JSON.stringify({
            type: 'MARKET',
            markets: [marketId],
          })
        );
      }
    } catch (error) {
      console.error(`Error subscribing to market ${marketId}:`, error);
    }
  }

  /**
   * Unsubscribe from a specific market
   * @param marketId - Market condition ID or token ID
   * @param isTokenId - Whether marketId is a token ID
   */
  private unsubscribeFromMarket(marketId: string, isTokenId: boolean): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // Polymarket WebSocket doesn't seem to support unsubscribe
      // Connection will be closed when component unmounts
      // Keeping this as a placeholder for future implementation
      console.log(`Unsubscribe from ${marketId} (connection will close on unmount)`);
    } catch (error) {
      console.error(`Error unsubscribing from market ${marketId}:`, error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   * Polymarket WebSocket sends various message formats:
   * - Order book updates: { type: 'orderbook', token_id, bids: [...], asks: [...] }
   * - Price updates: { type: 'price', token_id, price, side }
   * - Market updates: { type: 'market', ... }
   */
  private handleMessage(data: any): void {
    // Handle different message formats from Polymarket WebSocket
    let marketId: string | undefined;
    let yesPrice: number | undefined;
    let noPrice: number | undefined;

    // Extract token/market ID from various possible fields
    marketId = data.token_id || data.tokenId || data.marketId || data.conditionId || data.id;

    // Format 1: Order book update (most common format)
    if (data.type === 'orderbook' || data.bids || data.asks) {
      // Extract best bid (YES price) and best ask (NO price = 1 - ask)
      if (data.bids && Array.isArray(data.bids) && data.bids.length > 0) {
        // Best bid is the highest price someone is willing to pay for YES
        const bestBid = data.bids[0];
        yesPrice = typeof bestBid === 'number' ? bestBid : (bestBid.price || bestBid[0]);
      }
      if (data.asks && Array.isArray(data.asks) && data.asks.length > 0) {
        // Best ask is the lowest price someone is willing to sell for
        // NO price = 1 - ask price
        const bestAsk = data.asks[0];
        const askPrice = typeof bestAsk === 'number' ? bestAsk : (bestAsk.price || bestAsk[0]);
        noPrice = 1 - askPrice;
      }
    }
    // Format 2: Direct price update
    else if (data.type === 'price' || data.type === 'price_update') {
      if (data.side === 'YES' || data.side === 'yes') {
        yesPrice = data.price;
      } else if (data.side === 'NO' || data.side === 'no') {
        noPrice = data.price;
      } else {
        // If no side specified, assume it's YES price
        yesPrice = data.price;
        noPrice = data.price !== undefined ? 1 - data.price : undefined;
      }
    }
    // Format 3: Market update with bestBid/bestAsk
    else if (data.type === 'market_update' || data.bestBid !== undefined || data.bestAsk !== undefined) {
      yesPrice = data.bestBid;
      if (data.bestAsk !== undefined) {
        noPrice = 1 - data.bestAsk;
      }
    }
    // Format 4: Outcomes array
    else if (data.outcomes && Array.isArray(data.outcomes)) {
      yesPrice = data.outcomes[0]?.price;
      noPrice = data.outcomes[1]?.price;
    }

    // Notify subscribers if we have valid data
    // Try to find subscribers by token ID first, then by condition ID
    if (marketId && (yesPrice !== undefined || noPrice !== undefined)) {
      // If we only have one price, calculate the other (they should sum to 1)
      if (yesPrice !== undefined && noPrice === undefined) {
        noPrice = 1 - yesPrice;
      } else if (noPrice !== undefined && yesPrice === undefined) {
        yesPrice = 1 - noPrice;
      }
      
      // Only notify if we have both prices
      if (yesPrice !== undefined && noPrice !== undefined) {
        // Notify token ID subscribers (for MARKET channel)
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
        
        // Notify condition ID subscribers (for USER channel or fallback)
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

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const polymarketWS = new PolymarketWebSocket();

