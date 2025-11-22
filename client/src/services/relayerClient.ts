/**
 * Polymarket Relayer Client Service
 * Handles gasless transactions via Polymarket's Polygon relayer
 * 
 * Features:
 * - Deploy Safe Wallets for users (Polymarket pays gas)
 * - Execute token approvals
 * - CTF operations (split/merge/redeem positions)
 * 
 * Documentation: https://docs.polymarket.com/developers/builders/relayer-client
 */

import { RelayClient, SafeTransaction, OperationType, RelayerTransactionState } from '@polymarket/builder-relayer-client';
import type { Wallet } from 'ethers';
import { getBuilderConfig, POLYMARKET_RELAYER_URL, POLYGON_CONTRACTS } from '../config/builderConfig';

const POLYGON_CHAIN_ID = 137;

/**
 * Create a Relayer Client instance
 * 
 * @param wallet - Ethers wallet instance
 * @returns RelayClient instance or null if builder config not available
 */
export function createRelayerClient(wallet: Wallet): RelayClient | null {
  const builderConfig = getBuilderConfig();
  
  if (!builderConfig) {
    console.warn('Builder configuration not available - relayer client disabled');
    return null;
  }

  try {
    return new RelayClient(
      POLYMARKET_RELAYER_URL,
      POLYGON_CHAIN_ID,
      wallet,
      builderConfig
    );
  } catch (error) {
    console.error('Failed to create relayer client:', error);
    return null;
  }
}

/**
 * Deploy a Safe Wallet for a user (gasless)
 * Polymarket pays the gas fees
 * 
 * @param client - RelayClient instance
 * @returns Deployment result with Safe address and transaction hash
 */
export async function deploySafeWallet(client: RelayClient) {
  try {
    console.log('Deploying Safe wallet...');
    const response = await client.deploy();
    const result = await response.wait();

    if (result) {
      console.log('✅ Safe wallet deployed successfully!');
      console.log('   Transaction Hash:', result.transactionHash);
      console.log('   Safe Address:', result.proxyAddress);
      return {
        success: true,
        transactionHash: result.transactionHash,
        safeAddress: result.proxyAddress,
      };
    } else {
      console.error('❌ Safe wallet deployment failed');
      return {
        success: false,
        error: 'Deployment failed or timed out',
      };
    }
  } catch (error: any) {
    console.error('❌ Error deploying Safe wallet:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Create a token approval transaction
 * Allows a spender to use tokens on behalf of the user
 * 
 * @param tokenAddress - Address of the token to approve
 * @param spenderAddress - Address that will be allowed to spend tokens
 * @param amount - Amount to approve (optional, defaults to max uint256)
 * @returns SafeTransaction for approval
 */
export function createApprovalTransaction(
  tokenAddress: string,
  spenderAddress: string,
  amount?: string
): SafeTransaction {
  // ERC20 approve function signature
  const approveSignature = '0x095ea7b3'; // approve(address,uint256)
  
  // Encode parameters: spender address and amount
  const spenderPadded = spenderAddress.slice(2).padStart(64, '0');
  const amountHex = amount || 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; // Max uint256
  const amountPadded = amountHex.replace('0x', '').padStart(64, '0');
  
  const data = approveSignature + spenderPadded + amountPadded;

  return {
    to: tokenAddress,
    operation: OperationType.Call,
    data,
    value: '0',
  };
}

/**
 * Approve USDC for CTF (Conditional Token Framework)
 * Required before trading on Polymarket
 * 
 * @param client - RelayClient instance
 * @returns Approval result
 */
export async function approveUSDCForCTF(client: RelayClient) {
  try {
    console.log('Approving USDC for CTF...');
    
    const approvalTx = createApprovalTransaction(
      POLYGON_CONTRACTS.USDC,
      POLYGON_CONTRACTS.CTF
    );

    const response = await client.execute(
      [approvalTx],
      'Approve USDC for CTF'
    );

    const result = await response.wait();

    if (result) {
      console.log('✅ USDC approved for CTF');
      console.log('   Transaction Hash:', result.transactionHash);
      return {
        success: true,
        transactionHash: result.transactionHash,
      };
    } else {
      console.error('❌ USDC approval failed');
      return {
        success: false,
        error: 'Approval failed or timed out',
      };
    }
  } catch (error: any) {
    console.error('❌ Error approving USDC:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Approve USDC for CTF Exchange
 * Required for trading on the exchange
 * 
 * @param client - RelayClient instance
 * @returns Approval result
 */
export async function approveUSDCForExchange(client: RelayClient) {
  try {
    console.log('Approving USDC for CTF Exchange...');
    
    const approvalTx = createApprovalTransaction(
      POLYGON_CONTRACTS.USDC,
      POLYGON_CONTRACTS.CTF_EXCHANGE
    );

    const response = await client.execute(
      [approvalTx],
      'Approve USDC for CTF Exchange'
    );

    const result = await response.wait();

    if (result) {
      console.log('✅ USDC approved for CTF Exchange');
      console.log('   Transaction Hash:', result.transactionHash);
      return {
        success: true,
        transactionHash: result.transactionHash,
      };
    } else {
      console.error('❌ Exchange approval failed');
      return {
        success: false,
        error: 'Approval failed or timed out',
      };
    }
  } catch (error: any) {
    console.error('❌ Error approving USDC for exchange:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Execute multiple Safe transactions with metadata
 * 
 * @param client - RelayClient instance
 * @param transactions - Array of SafeTransaction objects
 * @param metadata - Description of transaction purpose (max 500 chars)
 * @returns Execution result
 */
export async function executeSafeTransactions(
  client: RelayClient,
  transactions: SafeTransaction[],
  metadata: string
) {
  try {
    console.log(`Executing ${transactions.length} Safe transaction(s)...`);
    console.log(`Metadata: ${metadata}`);

    const response = await client.execute(transactions, metadata);
    const result = await response.wait();

    if (result) {
      console.log('✅ Transactions executed successfully');
      console.log('   Transaction Hash:', result.transactionHash);
      console.log('   State:', result.state);
      return {
        success: true,
        transactionHash: result.transactionHash,
        state: result.state,
      };
    } else {
      console.error('❌ Transaction execution failed');
      return {
        success: false,
        error: 'Execution failed or timed out',
      };
    }
  } catch (error: any) {
    console.error('❌ Error executing transactions:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Check transaction state
 * 
 * States:
 * - STATE_NEW: Transaction received by relayer
 * - STATE_EXECUTED: Transaction executed on-chain
 * - STATE_MINED: Transaction included in a block
 * - STATE_CONFIRMED: Transaction confirmed (final state)
 * - STATE_FAILED: Transaction failed (terminal state)
 * - STATE_INVALID: Transaction rejected as invalid (terminal state)
 */
export function isTransactionFinal(state: string): boolean {
  return [
    RelayerTransactionState.STATE_CONFIRMED,
    RelayerTransactionState.STATE_FAILED,
    RelayerTransactionState.STATE_INVALID,
  ].includes(state as RelayerTransactionState);
}

export default {
  createRelayerClient,
  deploySafeWallet,
  createApprovalTransaction,
  approveUSDCForCTF,
  approveUSDCForExchange,
  executeSafeTransactions,
  isTransactionFinal,
};
