#!/usr/bin/env node

/**
 * Get Unique Addresses and Token Prices
 * 
 * Lists all unique contract addresses and calculates token prices from DEX pairs
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Configuration
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const HTTPS_RPC_URL = process.env.HTTPS_RPC_URL || "https://3.91.50.187";

// Known token addresses
const TOKENS = {
  BTCBR: "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",
  NOR: "0x0cF8e180350253271f4b917CcFb0aCCc4862F263",
  NRG: "0x0cF8e180350253271f4b917CcFb0aCCc4862F264",
  WNOR: "0x0cF8e180350253271f4b917CcFb0aCCc4862F265",
  WBNB: "0x0cF8e180350253271f4b917CcFb0aCCc4862F268",
  WUSDT: "0x0cF8e180350253271f4b917CcFb0aCCc4862F269",
  WETH: "0x0cF8e180350253271f4b917CcFb0aCCc4862F26A",
  Dirhamat: "0x0cF8e180350253271f4b917CcFb0aCCc4862F26B",
  DigitalKES: "0x0cF8e180350253271f4b917CcFb0aCCc4862F26C",
  NORDCoin: "0x0cF8e180350253271f4b917CcFb0aCCc4862F26D",
};

// DEX Pairs
const DEX_PAIRS = {
  "NOR/USDT": {
    address: "0x1ec827185880dab7372c189c9d8f248986f451fd",
    token0: TOKENS.NOR,
    token1: TOKENS.WUSDT,
    token0Name: "NOR",
    token1Name: "USDT",
    token0Decimals: 24,
    token1Decimals: 18,
  },
  "NOR/WBNB": {
    address: "0xc7df87712ef24fc8a9c733c17bfc64c61c25622a",
    token0: TOKENS.NOR,
    token1: TOKENS.WBNB,
    token0Name: "NOR",
    token1Name: "WBNB",
    token0Decimals: 24,
    token1Decimals: 18,
  },
  "NOR/WETH": {
    address: "0x9752c04e749d08bf25de413f439662a013295a2f",
    token0: TOKENS.NOR,
    token1: TOKENS.WETH,
    token0Name: "NOR",
    token1Name: "WETH",
    token0Decimals: 24,
    token1Decimals: 18,
  },
  "NOR/Dirhamat": {
    address: "0x549c38191ddf65238a45a75bb97d3da0cc23a9a1",
    token0: TOKENS.NOR,
    token1: TOKENS.Dirhamat,
    token0Name: "NOR",
    token1Name: "Dirhamat",
    token0Decimals: 24,
    token1Decimals: 18,
  },
  "Dirhamat/USDT": {
    address: "0xfd9797ee1cb74fbbe1934f24c1479aaad1335763",
    token0: TOKENS.Dirhamat,
    token1: TOKENS.WUSDT,
    token0Name: "Dirhamat",
    token1Name: "USDT",
    token0Decimals: 18,
    token1Decimals: 18,
  },
};

// Contract addresses
const CONTRACTS = {
  BTCBR: "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",
  NOR: "0x0cF8e180350253271f4b917CcFb0aCCc4862F263",
  NRG: "0x0cF8e180350253271f4b917CcFb0aCCc4862F264",
  WNOR: "0x0cF8e180350253271f4b917CcFb0aCCc4862F265",
  NorSwapFactory: "0x0cF8e180350253271f4b917CcFb0aCCc4862F266",
  NorSwapRouter: "0x0cF8e180350253271f4b917CcFb0aCCc4862F267",
  WBNB: "0x0cF8e180350253271f4b917CcFb0aCCc4862F268",
  WUSDT: "0x0cF8e180350253271f4b917CcFb0aCCc4862F269",
  WETH: "0x0cF8e180350253271f4b917CcFb0aCCc4862F26A",
  Dirhamat: "0x0cF8e180350253271f4b917CcFb0aCCc4862F26B",
  DigitalKES: "0x0cF8e180350253271f4b917CcFb0aCCc4862F26C",
  NORDCoin: "0x0cF8e180350253271f4b917CcFb0aCCc4862F26D",
  CrossChainBridge: "0x0cF8e180350253271f4b917CcFb0aCCc4862F26E",
  BNBBridgeNor: "0x0cF8e180350253271f4b917CcFb0aCCc4862F26F",
  USDTBridgeNor: "0x0cF8e180350253271f4b917CcFb0aCCc4862F270",
  ETHBridgeNor: "0x0cF8e180350253271f4b917CcFb0aCCc4862F271",
  NorGovernance: "0x0cF8e180350253271f4b917CcFb0aCCc4862F272",
  NorStaking: "0x0cF8e180350253271f4b917CcFb0aCCc4862F273",
  NorFarming: "0x0cF8e180350253271f4b917CcFb0aCCc4862F274",
  LiquidityLock: "0x0cF8e180350253271f4b917CcFb0aCCc4862F275",
  NORBurnMechanism: "0x0cF8e180350253271f4b917CcFb0aCCc4862F276",
  NORRevenue: "0x0cF8e180350253271f4b917CcFb0aCCc4862F277",
  WeeklyBuyback: "0x0cF8e180350253271f4b917CcFb0aCCc4862F278",
  PriceOracle: "0x0cF8e180350253271f4b917CcFb0aCCc4862F279",
  OracleAggregator: "0x0cF8e180350253271f4b917CcFb0aCCc4862F27A",
  MultiAssetReserveVault: "0x0cF8e180350253271f4b917CcFb0aCCc4862F27B",
  NorFundFactory: "0x0cF8e180350253271f4b917CcFb0aCCc4862F27C",
  NorRouter: "0x0cF8e180350253271f4b917CcFb0aCCc4862F27D",
  SettlementHub: "0x0cF8e180350253271f4b917CcFb0aCCc4862F27E",
  PriceAuthority: "0x0cF8e180350253271f4b917CcFb0aCCc4862F27F",
  SupplyController: "0x0cF8e180350253271f4b917CcFb0aCCc4862F280",
};

// Pair ABI
const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function totalSupply() external view returns (uint256)",
];

// Token ABI
const TOKEN_ABI = [
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
  "function totalSupply() external view returns (uint256)",
];

async function getProvider() {
  // Configure provider with explicit chain ID (65001) to avoid network detection issues
  const networkConfig = {
      name: "Nor Chain",
      chainId: 65001,
      ensAddress: null,
  };

  // Try HTTPS first
  try {
    const provider = new ethers.JsonRpcProvider(HTTPS_RPC_URL, networkConfig);
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Connected via HTTPS: ${HTTPS_RPC_URL}`);
    console.log(`   Current block: ${blockNumber}\n`);
    return provider;
  } catch (error) {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL, networkConfig);
      const blockNumber = await provider.getBlockNumber();
      console.log(`✅ Connected via HTTP: ${RPC_URL}`);
      console.log(`   Current block: ${blockNumber}\n`);
      return provider;
    } catch (error2) {
      console.error(`❌ Cannot connect to RPC`);
      console.error(`   HTTP: ${RPC_URL}`);
      console.error(`   HTTPS: ${HTTPS_RPC_URL}`);
      console.error(`   Error: ${error2.message || error2}`);
      process.exit(1);
    }
  }
}

async function getPairReserves(provider, pairAddress) {
  try {
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    const reserves = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    const totalSupply = await pair.totalSupply();

    return {
      reserve0: reserves[0],
      reserve1: reserves[1],
      token0,
      token1,
      totalSupply,
    };
  } catch (error) {
    console.error(`   Error getting reserves: ${error.message}`);
    return null;
  }
}

async function calculatePrice(provider, pairConfig) {
  return new Promise(async (resolve) => {
    const { address, token0Name, token1Name, token0Decimals, token1Decimals } =
      pairConfig;

    try {
      const reserves = await getPairReserves(provider, address);
      if (!reserves) {
        resolve(null);
        return;
      }

      // Get actual token addresses from pair
      const token0Contract = new ethers.Contract(
        reserves.token0,
        TOKEN_ABI,
        provider
      );
      const token1Contract = new ethers.Contract(
        reserves.token1,
        TOKEN_ABI,
        provider
      );

      let token0Dec, token1Dec;
      try {
        token0Dec = await token0Contract.decimals();
        token1Dec = await token1Contract.decimals();
      } catch (error) {
        // Fallback to configured decimals
        token0Dec = token0Decimals;
        token1Dec = token1Decimals;
      }

      const reserve0 = Number(
        ethers.formatUnits(reserves.reserve0, token0Dec)
      );
      const reserve1 = Number(
        ethers.formatUnits(reserves.reserve1, token1Dec)
      );

      // Calculate price based on which token is which
      let price, priceToken, baseToken;
      if (
        reserves.token0.toLowerCase() ===
        pairConfig.token0.toLowerCase()
      ) {
        // token0 is the base token (NOR, Dirhamat)
        price = reserve1 / reserve0;
        priceToken = token1Name;
        baseToken = token0Name;
      } else {
        // token1 is the base token
        price = reserve0 / reserve1;
        priceToken = token0Name;
        baseToken = token1Name;
      }

      resolve({
        pair: `${token0Name}/${token1Name}`,
        baseToken,
        priceToken,
        price,
        reserve0,
        reserve1,
        reserve0Formatted: reserve0.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        }),
        reserve1Formatted: reserve1.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        }),
        totalSupply: Number(ethers.formatEther(reserves.totalSupply)),
      });
    } catch (error) {
      console.error(`   Error calculating price: ${error.message}`);
      resolve(null);
    }
  });
}

async function getAllUniqueAddresses() {
  const addresses = new Set();

  // Add all contracts
  Object.values(CONTRACTS).forEach((addr) => {
    if (addr && addr !== "0x0000000000000000000000000000000000000000") {
      addresses.add(addr.toLowerCase());
    }
  });

  // Add all DEX pairs
  Object.values(DEX_PAIRS).forEach((pair) => {
    if (pair.address) {
      addresses.add(pair.address.toLowerCase());
    }
  });

  // Try to load from deployment files
  const deploymentDir = "deployments";
  if (fs.existsSync(deploymentDir)) {
    const files = fs.readdirSync(deploymentDir);
    files.forEach((file) => {
      if (file.endsWith(".json")) {
        try {
          const content = fs.readFileSync(
            path.join(deploymentDir, file),
            "utf8"
          );
          const data = JSON.parse(content);

          // Recursively extract addresses
          const extractAddresses = (obj) => {
            if (typeof obj === "string" && obj.startsWith("0x") && obj.length === 42) {
              addresses.add(obj.toLowerCase());
            } else if (Array.isArray(obj)) {
              obj.forEach(extractAddresses);
            } else if (typeof obj === "object" && obj !== null) {
              Object.values(obj).forEach(extractAddresses);
            }
          };

          extractAddresses(data);
        } catch (error) {
          // Ignore parse errors
        }
      }
    });
  }

  return Array.from(addresses).sort();
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
  console.log("║          UNIQUE ADDRESSES AND TOKEN PRICES                              ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
  console.log("");

  const provider = await getProvider();

  // 1. Get unique addresses
  console.log("1. UNIQUE CONTRACT ADDRESSES");
  console.log("   " + "─".repeat(70));
  const addresses = await getAllUniqueAddresses();
  console.log(`   Total unique addresses: ${addresses.length}`);
  console.log("");
  console.log("   Addresses:");
  addresses.forEach((addr, index) => {
    console.log(`   ${(index + 1).toString().padStart(4)}. ${addr}`);
  });

  console.log("");
  console.log("");

  // 2. Get token prices from DEX pairs
  console.log("2. TOKEN PRICES FROM DEX PAIRS");
  console.log("   " + "─".repeat(70));

  const prices = {};
  const pricePromises = Object.entries(DEX_PAIRS).map(async ([pairName, pairConfig]) => {
    const priceData = await calculatePrice(provider, pairConfig);
    if (priceData) {
      prices[pairName] = priceData;
    }
  });

  await Promise.all(pricePromises);

  if (Object.keys(prices).length === 0) {
    console.log("   ⚠️  No price data available (pairs may not be initialized)");
  } else {
    // Display prices
    for (const [pairName, priceData] of Object.entries(prices)) {
      console.log(`\n   ${pairName}:`);
      console.log(`      Price: 1 ${priceData.baseToken} = ${priceData.price.toFixed(10)} ${priceData.priceToken}`);
      if (priceData.priceToken === "USDT") {
        console.log(`      USD Price: $${priceData.price.toFixed(6)}`);
      }
      console.log(`      Reserves: ${priceData.reserve0Formatted} ${priceData.baseToken} / ${priceData.reserve1Formatted} ${priceData.priceToken}`);
      console.log(`      LP Supply: ${priceData.totalSupply.toLocaleString(undefined, { maximumFractionDigits: 2 })} LP tokens`);
    }

    // Calculate NOR price in USD
    const norUsdtPrice = prices["NOR/USDT"];
    if (norUsdtPrice && norUsdtPrice.priceToken === "USDT") {
      console.log(`\n   💰 NOR Price: $${norUsdtPrice.price.toFixed(6)} USD`);
    }

    // Calculate Dirhamat price in USD
    const dirhamatUsdtPrice = prices["Dirhamat/USDT"];
    if (dirhamatUsdtPrice) {
      const dirhamatPrice = dirhamatUsdtPrice.priceToken === "USDT" 
        ? dirhamatUsdtPrice.price 
        : (dirhamatUsdtPrice.priceToken === "Dirhamat" ? 1 / dirhamatUsdtPrice.price : null);
      if (dirhamatPrice) {
        console.log(`   💰 Dirhamat Price: $${dirhamatPrice.toFixed(6)} USD`);
      }
    }
  }

  console.log("");
  console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
  console.log("║                          SUMMARY                                         ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
  console.log(`   Total Unique Addresses: ${addresses.length}`);
  console.log(`   Active DEX Pairs: ${Object.keys(prices).length}/${Object.keys(DEX_PAIRS).length}`);
  console.log("");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

