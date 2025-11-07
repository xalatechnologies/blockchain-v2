import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

let provider = null;
let wsProvider = null;

export const getProvider = () => {
  if (!provider) {
    const rpcUrl = process.env.RPC_URL || 'https://rpc.xaheen.org';
    provider = new ethers.JsonRpcProvider(rpcUrl, {
      name: 'Nor Chain',
      chainId: parseInt(process.env.CHAIN_ID) || 65001
    });
  }
  return provider;
};

export const getWsProvider = () => {
  if (!wsProvider && process.env.WS_URL) {
    wsProvider = new ethers.WebSocketProvider(process.env.WS_URL);
  }
  return wsProvider;
};

export const validateAddress = (address) => {
  try {
    return ethers.getAddress(address);
  } catch (error) {
    return null;
  }
};

export const validateBlockNumber = (blockNumber) => {
  if (blockNumber === 'latest' || blockNumber === 'earliest' || blockNumber === 'pending') {
    return blockNumber;
  }
  
  const num = parseInt(blockNumber);
  if (isNaN(num) || num < 0) {
    return null;
  }
  
  return num;
};

export const formatResponse = (status, result, message = null) => {
  const response = {
    status,
    message: message || (status === '1' ? 'OK' : 'NOTOK'),
    result
  };
  
  return response;
};


