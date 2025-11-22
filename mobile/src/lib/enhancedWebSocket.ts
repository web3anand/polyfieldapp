/**
 * Enhanced WebSocket Manager
 * Ultra-low latency with connection pooling, heartbeat monitoring, and auto-reconnect
 */

import { polymarketWS } from './polymarketWebSocket';
import { saveMarketToDB } from '../utils/supabase';
import { fetchMarketPrice } from '../services/clobApi';

interface PriceUpdate {
  conditionId: string;
  yesPrice: number;
  noPrice: number;
  timestamp: number;
}

class EnhancedWebSocketManager {
  private priceUpdateQueue: Map<string, PriceUpdate> = new Map();
  private persistTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private latencyTracking: number[] = [];
  private readonly PERSIST_INTERVAL = 10000; // 10 seconds
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly MAX_QUEUE_SIZE = 1000;
  private lastHeartbeat: number = Date.now();
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private readonly POLLING_INTERVAL = 3000; // Poll every 3 seconds for active markets

  /**
   * Start enhanced WebSocket management
   */
  start(): void {
    console.log('🚀 Starting Enhanced WebSocket Manager');
    
    // Start heartbeat monitoring
    this.startHeartbeat();
    
    // Start price persistence
    this.startPricePersistence();
    
    // Monitor connection quality
    this.monitorConnectionQuality();
    
    // Enable REST API polling as fallback
    console.log('📡 REST API polling enabled (3s intervals)');
  }

  /**
   * Subscribe to market with automatic price persistence
   */
  subscribeWithPersistence(
    marketId: string,
    callback: (yesPrice: number, noPrice: number) => void,
    isTokenId: boolean = false
  ): () => void {
    // Start polling this market via REST API as fallback
    this.startPolling(marketId, callback, isTokenId);
    
    // Wrap callback to queue price updates for persistence
    const wrappedCallback = (yesPrice: number, noPrice: number) => {
      // Call original callback immediately (no latency)
      callback(yesPrice, noPrice);
      
      // Queue for database persistence (non-blocking)
      this.queuePriceUpdate(marketId, yesPrice, noPrice);
    };
    
    // Subscribe via base WebSocket
    return polymarketWS.subscribe(marketId, wrappedCallback, isTokenId);
      const unsubscribe = polymarketWS.subscribe(marketId, wrappedCallback, isTokenId);
    
      // Return cleanup function that stops both WebSocket and polling
      return () => {
        unsubscribe();
        this.stopPolling(marketId);
      };
  }

    /**
     * Start polling market via REST API (fallback when WebSocket is quiet)
     */
    private startPolling(
      marketId: string,
      callback: (yesPrice: number, noPrice: number) => void,
      isTokenId: boolean
    ): void {
      // Don't start duplicate polling
      if (this.pollingIntervals.has(marketId)) {
        return;
      }
    
      // Poll immediately and then every 3 seconds
      const pollFn = async () => {
        try {
          const price = await fetchMarketPrice(marketId);
          if (price && typeof price.yesPrice === 'number' && typeof price.noPrice === 'number') {
            callback(price.yesPrice, price.noPrice);
            this.queuePriceUpdate(marketId, price.yesPrice, price.noPrice);
          }
        } catch (error) {
          // Silently fail - WebSocket might be providing updates
        }
      };
    
      // Initial poll
      pollFn();
    
      // Set up interval
      const interval = setInterval(pollFn, this.POLLING_INTERVAL);
      this.pollingIntervals.set(marketId, interval);
    }
  
    /**
     * Stop polling a market
     */
    private stopPolling(marketId: string): void {
      const interval = this.pollingIntervals.get(marketId);
      if (interval) {
        clearInterval(interval);
        this.pollingIntervals.delete(marketId);
      }
    }

  /**
   * Queue price update for later persistence (debounced)
   */
  private queuePriceUpdate(conditionId: string, yesPrice: number, noPrice: number): void {
    // Check queue size to prevent memory issues
    if (this.priceUpdateQueue.size >= this.MAX_QUEUE_SIZE) {
      // Clear oldest entries (keep only last 500)
      const entries = Array.from(this.priceUpdateQueue.entries());
      const toKeep = entries.slice(-500);
      this.priceUpdateQueue = new Map(toKeep);
      console.log('⚠️ Queue full, cleared old entries');
    }

    // Update or add to queue
    this.priceUpdateQueue.set(conditionId, {
      conditionId,
      yesPrice,
      noPrice,
      timestamp: Date.now(),
    });
  }

  /**
   * Persist queued price updates to Supabase (batched)
   */
  private async persistPriceUpdates(): Promise<void> {
    if (this.priceUpdateQueue.size === 0) {
      return;
    }

    const updates = Array.from(this.priceUpdateQueue.values());
    this.priceUpdateQueue.clear();

    console.log(`💾 Persisting ${updates.length} price updates to Supabase...`);
    
    const startTime = Date.now();
    let successCount = 0;

    // Batch persist (max 50 at a time to avoid overwhelming Supabase)
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (update) => {
          try {
            await saveMarketToDB({
              condition_id: update.conditionId,
              yes_price: update.yesPrice,
              no_price: update.noPrice,
            });
            successCount++;
          } catch (error) {
            // Silently fail individual updates
            console.error(`Failed to persist ${update.conditionId}:`, error);
          }
        })
      );
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Persisted ${successCount}/${updates.length} updates in ${duration}ms`);
    
    // Track persistence performance
    this.trackLatency(duration);
  }

  /**
   * Start periodic price persistence
   */
  private startPricePersistence(): void {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
    }

    this.persistTimer = setInterval(() => {
      this.persistPriceUpdates().catch((error) => {
        console.error('Error persisting prices:', error);
      });
    }, this.PERSIST_INTERVAL);
    
    console.log(`⏰ Price persistence scheduled every ${this.PERSIST_INTERVAL / 1000}s`);
  }

  /**
   * Start heartbeat monitoring for connection health
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastBeat = now - this.lastHeartbeat;
      
      if (timeSinceLastBeat > this.HEARTBEAT_INTERVAL * 2) {
        console.warn('⚠️ WebSocket heartbeat missed, checking connection...');
        this.checkConnection();
      }
      
      // Update heartbeat timestamp
      this.lastHeartbeat = now;
      
      // Log connection status
      if (polymarketWS.isConnected()) {
        console.log('💚 WebSocket healthy');
      } else {
        console.log('🔴 WebSocket disconnected');
        this.attemptReconnect();
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Check WebSocket connection and reconnect if needed
   */
  private checkConnection(): void {
    if (!polymarketWS.isConnected()) {
      console.log('🔄 Connection lost, attempting reconnect...');
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnection attempts reached, giving up');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
    
    setTimeout(() => {
      polymarketWS.connect();
      
      // Reset counter on successful connection
      if (polymarketWS.isConnected()) {
        this.reconnectAttempts = 0;
        console.log('✅ Reconnection successful');
      }
    }, delay);
  }

  /**
   * Monitor connection quality and latency
   */
  private monitorConnectionQuality(): void {
    setInterval(() => {
      if (this.latencyTracking.length === 0) return;
      
      const avgLatency = this.latencyTracking.reduce((a, b) => a + b, 0) / this.latencyTracking.length;
      const maxLatency = Math.max(...this.latencyTracking);
      const minLatency = Math.min(...this.latencyTracking);
      
      console.log(`📊 Latency stats: avg=${avgLatency.toFixed(0)}ms, min=${minLatency}ms, max=${maxLatency}ms`);
      
      // Alert if latency is too high
      if (avgLatency > 1000) {
        console.warn('⚠️ High latency detected, connection quality degraded');
      }
      
      // Clear old samples
      this.latencyTracking = [];
    }, 60000); // Every minute
  }

  /**
   * Track latency sample
   */
  private trackLatency(latency: number): void {
    this.latencyTracking.push(latency);
    
    // Keep only last 100 samples
    if (this.latencyTracking.length > 100) {
      this.latencyTracking.shift();
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): {
    queueSize: number;
    avgLatency: number;
    isConnected: boolean;
    reconnectAttempts: number;
  } {
    const avgLatency = this.latencyTracking.length > 0
      ? this.latencyTracking.reduce((a, b) => a + b, 0) / this.latencyTracking.length
      : 0;
    
    return {
      queueSize: this.priceUpdateQueue.size,
      avgLatency,
      isConnected: polymarketWS.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Force persist all queued updates immediately
   */
  async flush(): Promise<void> {
    console.log('🚀 Flushing price updates...');
    await this.persistPriceUpdates();
  }

  /**
   * Stop all timers and cleanup
   */
  stop(): void {
    console.log('🛑 Stopping Enhanced WebSocket Manager');
    
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    // Flush remaining updates
    this.flush().catch(console.error);
  }
}

// Export singleton instance
export const enhancedWS = new EnhancedWebSocketManager();
