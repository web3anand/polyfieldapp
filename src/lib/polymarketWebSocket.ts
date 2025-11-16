/**
 * Polymarket WebSocket Integration
 * Real-time price updates for markets
 */

export type PriceUpdateCallback = (yesPrice: number, noPrice: number) => void;

const WS_BASE_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws';

class PolymarketWebSocket {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<PriceUpdateCallback>> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private isConnecting: boolean = false;

  /**
   * Subscribe to market price updates
   * @param marketId - Market condition ID
   * @param callback - Callback function for price updates
   * @returns Unsubscribe function
   */
  subscribe(
    marketId: string,
    callback: PriceUpdateCallback
  ): () => void {
    // Add callback to subscribers
    if (!this.subscribers.has(marketId)) {
      this.subscribers.set(marketId, new Set());
    }
    this.subscribers.get(marketId)!.add(callback);

    // Connect if not already connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    } else {
      // Subscribe to this market
      this.subscribeToMarket(marketId);
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(marketId, callback);
    };
  }

  /**
   * Unsubscribe from market
   * @param marketId - Market condition ID
   * @param callback - Callback function to remove
   */
  unsubscribe(marketId: string, callback: PriceUpdateCallback): void {
    const callbacks = this.subscribers.get(marketId);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(marketId);
        this.unsubscribeFromMarket(marketId);
      }
    }
  }

  /**
   * Connect to WebSocket
   */
  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(WS_BASE_URL);

      this.ws.onopen = () => {
        console.log('✅ Polymarket WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Subscribe to all active markets
        this.subscribers.forEach((_, marketId) => {
          this.subscribeToMarket(marketId);
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        // Log WebSocket errors (but only once to avoid spam)
        if (!(window as any).__ws_error_shown) {
          console.warn('⚠️ WebSocket connection error. Will attempt to reconnect...');
          (window as any).__ws_error_shown = true;
        }
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        // Only log disconnection once to avoid spam
        if (!(window as any).__ws_close_logged) {
          console.log('WebSocket disconnected');
          (window as any).__ws_close_logged = true;
        }
        this.isConnecting = false;
        this.ws = null;

        // Attempt to reconnect if we have subscribers
        if (this.subscribers.size > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            this.connect();
          }, this.reconnectDelay);
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
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to a specific market
   * Polymarket WebSocket expects subscriptions in format:
   * - For order book: { type: 'subscribe', channel: 'orderbook', token_id: '...' }
   * - For prices: { type: 'subscribe', channel: 'prices', token_id: '...' }
   */
  private subscribeToMarket(marketId: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // Try multiple subscription formats for compatibility
      // Format 1: Order book subscription (most common)
      this.ws.send(
        JSON.stringify({
          type: 'subscribe',
          channel: 'orderbook',
          token_id: marketId,
        })
      );
      
      // Format 2: Price subscription
      this.ws.send(
        JSON.stringify({
          type: 'subscribe',
          channel: 'prices',
          token_id: marketId,
        })
      );
      
      // Format 3: Market channel (fallback)
      this.ws.send(
        JSON.stringify({
          type: 'subscribe',
          channel: `market:${marketId}`,
        })
      );
    } catch (error) {
      console.error(`Error subscribing to market ${marketId}:`, error);
    }
  }

  /**
   * Unsubscribe from a specific market
   */
  private unsubscribeFromMarket(marketId: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      this.ws.send(
        JSON.stringify({
          type: 'unsubscribe',
          channel: `market:${marketId}`,
        })
      );
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
    // We can update even if only one price is available
    if (marketId && (yesPrice !== undefined || noPrice !== undefined)) {
      const callbacks = this.subscribers.get(marketId);
      if (callbacks) {
        // If we only have one price, calculate the other (they should sum to 1)
        if (yesPrice !== undefined && noPrice === undefined) {
          noPrice = 1 - yesPrice;
        } else if (noPrice !== undefined && yesPrice === undefined) {
          yesPrice = 1 - noPrice;
        }
        
        // Only notify if we have both prices
        if (yesPrice !== undefined && noPrice !== undefined) {
          callbacks.forEach((callback) => {
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

