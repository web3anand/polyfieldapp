/**
 * Formatting Utility Functions
 * Common formatting functions for display
 */

/**
 * Format liquidity amount
 * @param liquidity - Liquidity amount in USD
 * @returns Formatted string (e.g., "$1.2M", "$500k", "$250")
 */
export function formatLiquidity(liquidity: number): string {
  if (liquidity >= 1000000) {
    return `$${(liquidity / 1000000).toFixed(1)}M`;
  } else if (liquidity >= 1000) {
    return `$${(liquidity / 1000).toFixed(0)}k`;
  }
  return `$${liquidity.toFixed(0)}`;
}

/**
 * Format currency amount
 * @param amount - Amount in USD
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "$1,234.56")
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format percentage
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "45.2%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format odds as percentage
 * @param odds - Odds value (0-1)
 * @returns Formatted string (e.g., "45.2%")
 */
export function formatOdds(odds: number): string {
  return formatPercentage(odds * 100);
}

/**
 * Calculate potential payout
 * @param amount - Bet amount in USD
 * @param odds - Odds (0-1)
 * @returns Potential payout amount
 */
export function calculatePayout(amount: string, odds: number): string {
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    return '0.00';
  }
  if (odds <= 0 || odds >= 1) {
    return '0.00';
  }
  return (amt / odds).toFixed(2);
}

/**
 * Format address (truncate middle)
 * @param address - Wallet address
 * @param startChars - Number of characters at start (default: 6)
 * @param endChars - Number of characters at end (default: 4)
 * @returns Formatted string (e.g., "0x1234...5678")
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format date relative to now
 * @param date - Date string or Date object
 * @returns Relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = then.getTime() - now.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const isPast = diffMs < 0;
  const absDiffDays = Math.abs(diffDays);
  const absDiffHours = Math.abs(diffHours);
  const absDiffMins = Math.abs(diffMins);

  if (absDiffDays > 7) {
    return then.toLocaleDateString();
  } else if (absDiffDays > 0) {
    return isPast
      ? `${absDiffDays} day${absDiffDays > 1 ? 's' : ''} ago`
      : `in ${absDiffDays} day${absDiffDays > 1 ? 's' : ''}`;
  } else if (absDiffHours > 0) {
    return isPast
      ? `${absDiffHours} hour${absDiffHours > 1 ? 's' : ''} ago`
      : `in ${absDiffHours} hour${absDiffHours > 1 ? 's' : ''}`;
  } else if (absDiffMins > 0) {
    return isPast
      ? `${absDiffMins} minute${absDiffMins > 1 ? 's' : ''} ago`
      : `in ${absDiffMins} minute${absDiffMins > 1 ? 's' : ''}`;
  } else {
    return 'just now';
  }
}

