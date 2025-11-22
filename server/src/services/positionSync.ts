/**
 * Position Sync Service
 * Syncs user positions from blockchain to Supabase
 * Runs as background service on VPS
 * 
 * NOTE: This service requires Supabase setup to be completed.
 * Currently disabled - uncomment when database is configured.
 */

// Stub export to prevent import errors
export const positionSyncService = {
  start: () => console.log('Position sync service disabled - Supabase not configured'),
  stop: () => {},
  syncUser: async (_userAddress: string) => {},
  getStatus: () => ({ isSyncing: false, syncFrequency: 0, isRunning: false })
};
