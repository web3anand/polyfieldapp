/**
 * Polymarket Builder Program Authentication
 * Generates Builder attribution headers for order requests
 * 
 * Documentation: https://docs.polymarket.com/developers/builders/builder-intro
 * Reference: https://github.com/Polymarket/builder-signing-sdk
 */

import { BuilderConfig } from '@polymarket/builder-signing-sdk';

/**
 * Builder Authentication Headers
 * These headers are required for order attribution in the Builder Program
 */
export interface BuilderAuthHeaders extends Record<string, string> {
  POLY_BUILDER_API_KEY: string;
  POLY_BUILDER_TIMESTAMP: string;
  POLY_BUILDER_PASSPHRASE: string;
  POLY_BUILDER_SIGNATURE: string;
}

/**
 * Request parameters for generating Builder signature
 */
export interface BuilderSignatureRequest {
  method: string;      // HTTP method (GET, POST, DELETE, etc.)
  requestPath: string; // API path (e.g., /order, /orders)
  body?: string;       // Request body (JSON stringified)
}

/**
 * Generate Builder authentication headers for API requests
 * 
 * This adds order attribution to your requests, allowing you to:
 * - Track your volume on the Builder leaderboard
 * - Qualify for Builder Program benefits
 * - Get attribution for orders routed through your app
 * 
 * @param builderConfig - Builder configuration with API credentials
 * @param request - Request details (method, path, body)
 * @returns Builder authentication headers or null if not configured
 */
export async function generateBuilderHeaders(
  builderConfig: BuilderConfig,
  request: BuilderSignatureRequest
): Promise<BuilderAuthHeaders | null> {
  try {
    // Check if builder config is valid
    if (!builderConfig.isValid()) {
      return null;
    }

    // Generate headers using BuilderConfig SDK
    const headers = await builderConfig.generateBuilderHeaders(
      request.method,
      request.requestPath,
      request.body,
    );

    if (!headers) {
      return null;
    }

    return headers as BuilderAuthHeaders;
  } catch (error: any) {
    console.warn('Failed to generate Builder headers:', error.message);
    return null;
  }
}

/**
 * Inject Builder headers into existing request headers
 * 
 * @param existingHeaders - Existing request headers (e.g., L2 auth headers)
 * @param builderConfig - Builder configuration (optional)
 * @param request - Request details
 * @returns Combined headers with Builder authentication
 */
export async function injectBuilderHeaders(
  existingHeaders: Record<string, string>,
  builderConfig: BuilderConfig | null,
  request: BuilderSignatureRequest
): Promise<Record<string, string>> {
  // If no builder config, return existing headers
  if (!builderConfig) {
    return existingHeaders;
  }

  try {
    const builderHeaders = await generateBuilderHeaders(builderConfig, request);
    
    // If builder headers generated, merge them
    if (builderHeaders) {
      return {
        ...existingHeaders,
        ...builderHeaders,
      };
    }
    
    return existingHeaders;
  } catch (error: any) {
    // Log error but don't fail the request
    console.warn('Failed to inject Builder headers:', error.message);
    return existingHeaders;
  }
}

/**
 * Check if Builder headers are present in request headers
 */
export function hasBuilderHeaders(headers: Record<string, string>): boolean {
  return !!(
    headers.POLY_BUILDER_API_KEY &&
    headers.POLY_BUILDER_TIMESTAMP &&
    headers.POLY_BUILDER_PASSPHRASE &&
    headers.POLY_BUILDER_SIGNATURE
  );
}
