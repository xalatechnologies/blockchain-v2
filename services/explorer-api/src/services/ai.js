/**
 * AI Functionality Service
 * Smart contract analysis, transaction insights, and intelligent features
 */

import { getProvider } from '../utils/provider.js';
import { ethers } from 'ethers';

/**
 * Analyze smart contract for potential issues
 */
export const analyzeContract = async (contractAddress) => {
  const provider = getProvider();
  
  try {
    const code = await provider.getCode(contractAddress);
    
    if (code === '0x') {
      return {
        isContract: false,
        error: 'Not a contract address'
      };
    }

    // Basic contract analysis
    const analysis = {
      isContract: true,
      codeSize: (code.length - 2) / 2, // Bytes (hex string length / 2)
      hasProxy: code.includes('delegatecall') || code.includes('DELEGATECALL'),
      hasSelfDestruct: code.includes('selfdestruct') || code.includes('SELFDESTRUCT'),
      hasPausable: code.includes('paused') || code.includes('PAUSED'),
      hasReentrancyGuard: code.includes('nonReentrant') || code.includes('ReentrancyGuard'),
      riskLevel: 'medium',
      recommendations: []
    };

    // Risk assessment
    if (analysis.hasSelfDestruct) {
      analysis.riskLevel = 'high';
      analysis.recommendations.push('Contract contains selfdestruct - ensure proper access controls');
    }

    if (!analysis.hasReentrancyGuard && analysis.codeSize > 1000) {
      analysis.riskLevel = 'medium';
      analysis.recommendations.push('Consider adding reentrancy protection for complex contracts');
    }

    if (analysis.hasProxy) {
      analysis.recommendations.push('Proxy contract detected - verify implementation address');
    }

    return analysis;
  } catch (error) {
    return {
      isContract: false,
      error: error.message
    };
  }
};

/**
 * Analyze transaction for insights
 */
export const analyzeTransaction = async (txHash) => {
  const provider = getProvider();
  
  try {
    const [tx, receipt, block] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash),
      provider.getBlock('latest')
    ]);

    if (!tx || !receipt) {
      return {
        error: 'Transaction not found'
      };
    }

    const insights = {
      hash: txHash,
      status: receipt.status === 1 ? 'success' : 'failed',
      gasEfficiency: {
        gasUsed: receipt.gasUsed.toString(),
        gasLimit: tx.gas.toString(),
        efficiency: ((Number(receipt.gasUsed) / Number(tx.gas)) * 100).toFixed(2) + '%'
      },
      value: {
        amount: ethers.formatEther(tx.value),
        usdValue: null // Would need price oracle
      },
      contractInteraction: {
        isContractCreation: receipt.contractAddress !== null,
        contractAddress: receipt.contractAddress,
        hasEvents: receipt.logs.length > 0,
        eventCount: receipt.logs.length
      },
      timing: {
        blockNumber: receipt.blockNumber,
        confirmations: block.number - receipt.blockNumber + 1,
        age: Date.now() - (block.timestamp * 1000)
      },
      riskAssessment: {
        level: 'low',
        factors: []
      },
      recommendations: []
    };

    // Risk assessment
    if (receipt.status === 0) {
      insights.riskAssessment.level = 'high';
      insights.riskAssessment.factors.push('Transaction failed');
    }

    if (Number(receipt.gasUsed) / Number(tx.gas) > 0.9) {
      insights.riskAssessment.level = 'medium';
      insights.riskAssessment.factors.push('High gas usage - near limit');
      insights.recommendations.push('Consider optimizing gas usage');
    }

    if (receipt.logs.length === 0 && receipt.contractAddress === null) {
      insights.recommendations.push('Simple transfer transaction');
    }

    return insights;
  } catch (error) {
    return {
      error: error.message
    };
  }
};

/**
 * Detect token type (ERC-20, ERC-721, ERC-1155)
 */
export const detectTokenType = async (contractAddress) => {
  const provider = getProvider();
  
  const ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)'
  ];

  const ERC721_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function tokenURI(uint256) view returns (string)',
    'function ownerOf(uint256) view returns (address)'
  ];

  const ERC1155_ABI = [
    'function uri(uint256) view returns (string)',
    'function balanceOf(address,uint256) view returns (uint256)'
  ];

  try {
    // Try ERC-20
    const erc20 = new ethers.Contract(contractAddress, ERC20_ABI, provider);
    try {
      await erc20.decimals();
      return {
        type: 'ERC-20',
        standard: true,
        details: {
          name: await erc20.name().catch(() => 'Unknown'),
          symbol: await erc20.symbol().catch(() => 'UNKNOWN'),
          decimals: await erc20.decimals().catch(() => 18)
        }
      };
    } catch {}

    // Try ERC-721
    const erc721 = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    try {
      await erc721.name();
      return {
        type: 'ERC-721',
        standard: true,
        details: {
          name: await erc721.name().catch(() => 'Unknown'),
          symbol: await erc721.symbol().catch(() => 'UNKNOWN')
        }
      };
    } catch {}

    // Try ERC-1155
    const erc1155 = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
    try {
      await erc1155.uri(1);
      return {
        type: 'ERC-1155',
        standard: true
      };
    } catch {}

    return {
      type: 'Unknown',
      standard: false,
      note: 'Contract does not match standard token interfaces'
    };
  } catch (error) {
    return {
      type: 'Error',
      error: error.message
    };
  }
};

/**
 * Generate transaction summary with AI insights
 */
export const generateTransactionSummary = async (txHash) => {
  const analysis = await analyzeTransaction(txHash);
  
  if (analysis.error) {
    return analysis;
  }

  const summary = {
    overview: `Transaction ${analysis.status === 'success' ? 'successfully' : 'failed to'} execute`,
    keyMetrics: {
      gasEfficiency: analysis.gasEfficiency.efficiency,
      value: analysis.value.amount + ' NOR',
      confirmations: analysis.timing.confirmations
    },
    insights: [],
    recommendations: analysis.recommendations
  };

  if (analysis.contractInteraction.isContractCreation) {
    summary.insights.push('Contract creation transaction');
  }

  if (analysis.contractInteraction.hasEvents) {
    summary.insights.push(`Emitted ${analysis.contractInteraction.eventCount} events`);
  }

  if (analysis.gasEfficiency.efficiency < 50) {
    summary.insights.push('Low gas efficiency - significant unused gas');
  }

  return summary;
};

/**
 * Predict gas price based on network conditions
 */
export const predictGasPrice = async () => {
  const provider = getProvider();
  
  try {
    const [block, feeData] = await Promise.all([
      provider.getBlock('latest'),
      provider.getFeeData()
    ]);

    const gasUsedRatio = Number(block.gasUsed) / Number(block.gasLimit);
    
    const prediction = {
      current: {
        gasPrice: feeData.gasPrice ? feeData.gasPrice.toString() : '0',
        gasUsedRatio: (gasUsedRatio * 100).toFixed(2) + '%'
      },
      prediction: {
        safe: feeData.gasPrice ? feeData.gasPrice.toString() : '3000000000',
        standard: feeData.gasPrice ? (feeData.gasPrice * BigInt(110) / BigInt(100)).toString() : '3300000000',
        fast: feeData.gasPrice ? (feeData.gasPrice * BigInt(120) / BigInt(100)).toString() : '3600000000'
      },
      recommendation: gasUsedRatio > 0.8 
        ? 'Network is busy - use higher gas price for faster confirmation'
        : 'Network is normal - standard gas price should work'
    };

    return prediction;
  } catch (error) {
    return {
      error: error.message
    };
  }
};

export default {
  analyzeContract,
  analyzeTransaction,
  detectTokenType,
  generateTransactionSummary,
  predictGasPrice
};

