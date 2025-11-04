#!/usr/bin/env node

/**
 * Comprehensive Contract and Liquidity Verification via RPC
 * 
 * Checks all contracts, DEX pairs, and LiquidityLock status
 */

const { ethers } = require("ethers");

// Configuration
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const HTTPS_RPC_URL = process.env.HTTPS_RPC_URL || "https://3.91.50.187";

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

// DEX Pairs
const DEX_PAIRS = {
  "NOR/USDT": "0x1ec827185880dab7372c189c9d8f248986f451fd",
  "NOR/WBNB": "0xc7df87712ef24fc8a9c733c17bfc64c61c25622a",
  "NOR/WETH": "0x9752c04e749d08bf25de413f439662a013295a2f",
  "NOR/Dirhamat": "0x549c38191ddf65238a45a75bb97d3da0cc23a9a1",
  "Dirhamat/USDT": "0xfd9797ee1cb74fbbe1934f24c1479aaad1335763",
};

async function checkContract(provider, address, name) {
  try {
    const code = await provider.getCode(address);
    if (code && code !== "0x" && code.length > 100) {
      console.log(`   ✅ ${name.padEnd(30)} ${address} (${(code.length / 2 - 1).toLocaleString()} bytes)`);
      return true;
    } else {
      console.log(`   ❌ ${name.padEnd(30)} ${address} (not deployed)`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${name.padEnd(30)} ${address} (error: ${error.message})`);
    return false;
  }
}

async function getStorage(provider, address, slot) {
  try {
    const value = await provider.getStorage(address, slot);
    return value;
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log("🔍 Comprehensive Validator and Contract Check");
  console.log("=".repeat(60));
  console.log("");

  // Try HTTPS first, fallback to HTTP
  let provider;
  try {
    provider = new ethers.JsonRpcProvider(HTTPS_RPC_URL, {
      allowInsecure: true,
    });
    await provider.getBlockNumber();
    console.log(`✅ Connected via HTTPS: ${HTTPS_RPC_URL}`);
  } catch (error) {
    try {
      provider = new ethers.JsonRpcProvider(RPC_URL);
      await provider.getBlockNumber();
      console.log(`✅ Connected via HTTP: ${RPC_URL}`);
    } catch (error2) {
      console.log(`❌ Cannot connect to RPC`);
      console.log(`   HTTP: ${RPC_URL}`);
      console.log(`   HTTPS: ${HTTPS_RPC_URL}`);
      process.exit(1);
    }
  }

  console.log("");

  // 1. Chain Information
  console.log("1. Chain Information:");
  console.log("   " + "-".repeat(50));
  try {
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    
    console.log(`   Chain ID: ${Number(network.chainId)}`);
    console.log(`   Current Block: ${blockNumber.toLocaleString()}`);
    console.log(`   Block Time: ${new Date(Number(block.timestamp) * 1000).toISOString()}`);
    console.log(`   Gas Limit: ${block.gasLimit.toLocaleString()}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log("");

  // 2. Validator Status (if on server)
  console.log("2. Validator Status:");
  console.log("   " + "-".repeat(50));
  console.log("   (Run 'docker ps | grep validator' on server to see status)");
  console.log("");

  // 3. Core Contracts
  console.log("3. Core Contracts:");
  console.log("   " + "-".repeat(50));
  let contractsOk = 0;
  let contractsTotal = 0;

  for (const [name, address] of Object.entries(CONTRACTS)) {
    contractsTotal++;
    if (await checkContract(provider, address, name)) {
      contractsOk++;
    }
  }

  console.log(`\n   Summary: ${contractsOk}/${contractsTotal} contracts deployed`);
  console.log("");

  // 4. LiquidityLock
  console.log("4. LiquidityLock Contract:");
  console.log("   " + "-".repeat(50));
  const LOCK_ADDR = CONTRACTS.LiquidityLock;
  
  if (await checkContract(provider, LOCK_ADDR, "LiquidityLock")) {
    // Check locks array length (slot 0)
    const locksLength = await getStorage(provider, LOCK_ADDR, 0);
    if (locksLength) {
      const count = Number(locksLength);
      console.log(`   Locks count: ${count}`);
      
      if (count > 0) {
        // Get first lock info
        // Locks array base: keccak256(0)
        const arraySlot = ethers.zeroPadValue("0x0", 32);
        const arrayBase = ethers.keccak256(arraySlot);
        const firstStructBase = BigInt(arrayBase);
        
        // First lock struct slots:
        // Slot 0: lpToken (address)
        // Slot 1: beneficiary (address)
        // Slot 2: amount (uint256)
        // Slot 3: lockTime (uint256)
        // Slot 4: unlockTime (uint256)
        
        const lpTokenSlot = ethers.toBeHex(firstStructBase + 0n);
        const amountSlot = ethers.toBeHex(firstStructBase + 2n);
        const unlockTimeSlot = ethers.toBeHex(firstStructBase + 4n);
        
        const lpToken = await getStorage(provider, LOCK_ADDR, lpTokenSlot);
        const amount = await getStorage(provider, LOCK_ADDR, amountSlot);
        const unlockTime = await getStorage(provider, LOCK_ADDR, unlockTimeSlot);
        
        if (lpToken && lpToken !== "0x0") {
          console.log(`   First lock LP token: ${lpToken}`);
        }
        if (amount && amount !== "0x0") {
          const amountBN = ethers.formatEther(amount);
          console.log(`   Locked amount: ${amountBN} LP tokens`);
        }
        if (unlockTime && unlockTime !== "0x0") {
          const unlockDate = new Date(Number(unlockTime) * 1000).toISOString();
          console.log(`   Unlock time: ${unlockDate}`);
        }
        
        console.log(`   ✅ ${count} LP lock(s) active`);
      } else {
        console.log(`   ⚠️  No locks found in LiquidityLock`);
      }
    }
  }

  console.log("");

  // 5. DEX Pairs and Liquidity
  console.log("5. DEX Pairs and Liquidity:");
  console.log("   " + "-".repeat(50));
  let pairsOk = 0;
  let pairsTotal = 0;

  for (const [name, address] of Object.entries(DEX_PAIRS)) {
    pairsTotal++;
    if (await checkContract(provider, address, name)) {
      pairsOk++;
      
      // Get reserves (slot 8 and 9 for Uniswap V2 style)
      const reserve0 = await getStorage(provider, address, 8);
      const reserve1 = await getStorage(provider, address, 9);
      
      if (reserve0 && reserve1 && reserve0 !== "0x0" && reserve1 !== "0x0") {
        const r0 = ethers.formatUnits(reserve0, 24); // NOR has 24 decimals
        const r1 = ethers.formatUnits(reserve1, 18); // USDT/BNB/ETH have 18 decimals
        
        console.log(`      Reserves: ${Number(r0).toLocaleString()} / ${Number(r1).toLocaleString()}`);
        
        // Get LP token supply (slot 2)
        const lpSupply = await getStorage(provider, address, 2);
        if (lpSupply && lpSupply !== "0x0") {
          const supply = ethers.formatEther(lpSupply);
          console.log(`      LP Supply: ${Number(supply).toLocaleString()} LP`);
        }
      } else {
        console.log(`      ⚠️  Reserves not initialized`);
      }
    }
  }

  console.log(`\n   Summary: ${pairsOk}/${pairsTotal} pairs deployed`);
  console.log("");

  // Summary
  console.log("=".repeat(60));
  console.log("Summary:");
  console.log(`   Contracts: ${contractsOk}/${contractsTotal}`);
  console.log(`   DEX Pairs: ${pairsOk}/${pairsTotal}`);
  console.log(`   LiquidityLock: ${await getStorage(provider, LOCK_ADDR, 0).then(v => v ? Number(v) : 0) || 0} locks`);
  console.log("=".repeat(60));
  console.log("");

  if (contractsOk === contractsTotal && pairsOk === pairsTotal) {
    console.log("✅ All contracts and pairs verified!");
  } else {
    console.log("⚠️  Some contracts or pairs may not be accessible yet");
    console.log("   (Validators may still be initializing)");
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

