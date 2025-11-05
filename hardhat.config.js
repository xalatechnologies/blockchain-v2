import { config as dotenvConfig } from "dotenv";
import "@nomicfoundation/hardhat-toolbox";

// Load environment variables
dotenvConfig();

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    // BSC Mainnet
    bsc: {
      type: "http",
      url: process.env.BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org",
      chainId: 56,
      accounts: process.env.MAINNET_PRIVATE_KEY
        ? [process.env.MAINNET_PRIVATE_KEY]
        : [],
      gasPrice: 3000000000, // 3 gwei
    },

    // BSC Testnet (for testing before mainnet)
    bscTestnet: {
      type: "http",
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: process.env.TESTNET_PRIVATE_KEY
        ? [process.env.TESTNET_PRIVATE_KEY]
        : [],
      gasPrice: 10000000000, // 10 gwei
    },

    // Nor Chain (formerly Nor Chain, originally BTCBR Private Chain)
    btcbr: {
      type: "http",
      url: process.env.PRIVATE_CHAIN_RPC || "https://rpc.norchain.org", // migrating from rpc.xaheen.org
      chainId: 65001,
      accounts: process.env.MAIN_WALLET_PRIVATE_KEY
        ? [process.env.MAIN_WALLET_PRIVATE_KEY]
        : [],
      gasPrice: 3000000000, // 3 gwei (increased for faster deployment)
      gas: 8000000, // 8M gas limit
      timeout: 60000, // 60 second timeout
    },

    // Local development (if running local node)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 65001, // Nor Chain ID
    },
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./.build/cache",
    artifacts: "./.build/artifacts",
  },

  etherscan: {
    apiKey: {
      bsc: process.env.BSCSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
    },
  },
};
