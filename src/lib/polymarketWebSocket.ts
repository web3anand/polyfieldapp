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

    // Skip WebSocket connection if no backend is configured
    // WebSocket requires backend proxy for authentication
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!apiBaseUrl || apiBaseUrl.trim() === '') {
      // Silently skip - WebSocket requires backend proxy
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(WS_BASE_URL);

      this.ws.onopen = () => {
        console.log('Polymarket WebSocket connected');
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
        // Only log WebSocket errors once to avoid console spam
        if (!(window as any).__ws_error_shown) {
          console.error('WebSocket connection failed. This is expected if backend proxy is not configured.');
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
   */
  private subscribeToMarket(marketId: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
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
   */
  private handleMessage(data: any): void {
    // Handle different message formats from Polymarket WebSocket
    let marketId: string | undefined;
    let yesPrice: number | undefined;
    let noPrice: number | undefined;

    // Format 1: Direct price update
    if (data.type === 'price_update' || data.type === 'market_update') {
      marketId = data.marketId || data.conditionId || data.id;
      yesPrice = data.yesPrice || data.bestBid || data.outcomes?.[0]?.price;
      noPrice = data.noPrice || (data.bestAsk !== undefined ? 1 - data.bestAsk : undefined) || data.outcomes?.[1]?.price;
    }
    // Format 2: Order book update (extract prices from bids/asks)
    else if (data.type === 'orderbook_update' || data.bids || data.asks) {
      marketId = data.token_id || data.marketId || data.conditionId;
      // Extract best bid/ask from order book
      if (data.bids && data.bids.length > 0) {
        yesPrice = data.bids[0].price;
      }
      if (data.asks && data.asks.length > 0) {
        noPrice = 1 - data.asks[0].price;
      }
    }
    // Format 3: Market data object
    else if (data.market || data.question) {
      marketId = data.id || data.conditionId || data.market?.id;
      yesPrice = data.bestBid || data.market?.bestBid;
      noPrice = data.bestAsk !== undefined ? 1 - data.bestAsk : undefined || (data.market?.bestAsk !== undefined ? 1 - data.market.bestAsk : undefined);
    }

    // Notify subscribers if we have valid data
    if (marketId && yesPrice !== undefined && noPrice !== undefined) {
      const callbacks = this.subscribers.get(marketId);
      if (callbacks) {
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

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const polymarketWS = new PolymarketWebSocket();

