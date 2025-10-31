#!/usr/bin/env node

/**
 * Treasury Market Maker Setup
 *
 * This script implements the "Genius Strategy" where the Xaheen Treasury
 * becomes the market maker on its own DEX, controlling price and earning
 * revenue from all fiat purchases and trading activity.
 *
 * What this does:
 * 1. Wraps XHT to WXHT from treasury
 * 2. Adds massive treasury liquidity (YOU control the market)
 * 3. Sets initial price at your target
 * 4. Configures treasury as primary LP (you earn all fees)
 *
 * Usage:
 *   node scripts/treasury-market-maker.js setup 100000000 100000
 *   (100M XHT + $100K USDT initial liquidity)
 *
 *   node scripts/treasury-market-maker.js add 50000000 50000
 *   (Add 50M XHT + $50K USDT more liquidity)
 *
 *   node scripts/treasury-market-maker.js status
 *   (Check treasury LP position and earnings)
 */

import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

// Contract addresses (from previous deployment)
const WXHT_ADDRESS = "0x26c0eaF731885b14c031cc50dB79b36458E0b355";
const USDT_ADDRESS = "0xB8fa87a1dAC07e077a51999F5cE79BD236f06acf";
const ROUTER_ADDRESS = "0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916";
const FACTORY_ADDRESS = "0xBE254176B4f13b02f367a9feCE599ee8887E2D34";

// Treasury wallet (holds 10B+ XHT from genesis)
const TREASURY_PK = process.env.MAINNET_PRIVATE_KEY;

// RPC configuration
const RPC_URL = process.env.PRIVATE_CHAIN_RPC || "https://rpc.xaheen.org";

// Connect to Xaheen Chain
const provider = new ethers.JsonRpcProvider(RPC_URL);
const treasury = new ethers.Wallet(TREASURY_PK, provider);

console.log("🏦 Treasury Market Maker Setup");
console.log("===============================================");
console.log(`📍 Treasury: ${treasury.address}`);
console.log(`🌐 Network: Xaheen Chain (${RPC_URL})`);
console.log("");

// Contract ABIs (minimal)
const WXHT_ABI = [
  "function deposit() payable",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
  "function mint(address, uint256)",
  "function decimals() view returns (uint8)",
];

const ROUTER_ABI = [
  "function addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256) returns (uint256,uint256,uint256)",
  "function removeLiquidity(address,address,uint256,uint256,uint256,address,uint256) returns (uint256,uint256)",
];

const FACTORY_ABI = [
  "function getPair(address, address) view returns (address)",
];

const PAIR_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
];

// Contract instances
const wxht = new ethers.Contract(WXHT_ADDRESS, WXHT_ABI, treasury);
const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, treasury);
const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, treasury);
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, treasury);

// Helper: Format token amounts
function formatToken(amount, decimals = 18) {
  return ethers.formatUnits(amount, decimals);
}

// Helper: Parse token amounts
function parseToken(amount, decimals = 18) {
  return ethers.parseUnits(amount.toString(), decimals);
}

// Check current treasury balances
async function checkBalances() {
  console.log("📊 Current Treasury Balances:");
  console.log("----------------------------------------------");

  const xhtBalance = await provider.getBalance(treasury.address);
  const wxhtBalance = await wxht.balanceOf(treasury.address);
  const usdtBalance = await usdt.balanceOf(treasury.address);

  console.log(`  XHT:  ${formatToken(xhtBalance)} XHT`);
  console.log(`  WXHT: ${formatToken(wxhtBalance)} WXHT`);
  console.log(`  USDT: ${formatToken(usdtBalance, 6)} USDT`);
  console.log("");

  return { xhtBalance, wxhtBalance, usdtBalance };
}

// Check current LP position
async function checkLPPosition() {
  console.log("💎 Treasury LP Position:");
  console.log("----------------------------------------------");

  const pairAddress = await factory.getPair(WXHT_ADDRESS, USDT_ADDRESS);

  if (pairAddress === ethers.ZeroAddress) {
    console.log("  ❌ No WXHT/USDT pair exists yet");
    console.log("  ℹ️  Run 'setup' to create pair and add liquidity");
    return null;
  }

  const pair = new ethers.Contract(pairAddress, PAIR_ABI, treasury);

  const lpBalance = await pair.balanceOf(treasury.address);
  const totalSupply = await pair.totalSupply();
  const reserves = await pair.getReserves();
  const token0 = await pair.token0();

  // Determine which token is token0/token1
  const [reserve0, reserve1] = reserves;
  const isWXHTToken0 = token0.toLowerCase() === WXHT_ADDRESS.toLowerCase();
  const wxhtReserve = isWXHTToken0 ? reserve0 : reserve1;
  const usdtReserve = isWXHTToken0 ? reserve1 : reserve0;

  // Calculate treasury's share
  const treasurySharePct =
    totalSupply > 0n ? (lpBalance * 10000n) / totalSupply : 0n;
  const treasuryWXHT = (wxhtReserve * lpBalance) / totalSupply;
  const treasuryUSDT = (usdtReserve * lpBalance) / totalSupply;

  console.log(`  📍 Pair: ${pairAddress}`);
  console.log("");
  console.log(`  Pool Reserves:`);
  console.log(`    WXHT: ${formatToken(wxhtReserve)} WXHT`);
  console.log(`    USDT: ${formatToken(usdtReserve, 6)} USDT`);
  console.log("");
  console.log(`  Current Price: 1 WXHT = $${formatToken(usdtReserve * parseToken("1") / wxhtReserve, 6)} USDT`);
  console.log("");
  console.log(`  Treasury LP Tokens: ${formatToken(lpBalance)}`);
  console.log(`  Treasury Share: ${Number(treasurySharePct) / 100}% of pool`);
  console.log(`  Treasury WXHT: ${formatToken(treasuryWXHT)} WXHT`);
  console.log(`  Treasury USDT: ${formatToken(treasuryUSDT, 6)} USDT`);
  console.log("");

  // Calculate estimated fees earned (simplified)
  const totalVolume = 0n; // Would need to track this via events
  console.log(`  📈 Estimated Fees Earned:`);
  console.log(`    (Track via pair events for accurate data)`);
  console.log("");

  return {
    pairAddress,
    lpBalance,
    totalSupply,
    treasurySharePct,
    wxhtReserve,
    usdtReserve,
    treasuryWXHT,
    treasuryUSDT,
  };
}

// Setup: Initial liquidity deployment
async function setupTreasuryMarketMaker(xhtAmount, usdtAmount) {
  console.log("🚀 Setting Up Treasury Market Maker");
  console.log("===============================================");
  console.log(`  Deploying: ${xhtAmount.toLocaleString()} XHT + $${usdtAmount.toLocaleString()} USDT`);
  console.log("");

  const xhtWei = parseToken(xhtAmount);
  const usdtWei = parseToken(usdtAmount, 6);

  // Calculate initial price
  const pricePerXHT = usdtAmount / xhtAmount;
  console.log(`  Initial Price: 1 XHT = $${pricePerXHT.toFixed(8)} USDT`);
  console.log("");

  // Step 1: Wrap XHT to WXHT
  console.log("📦 Step 1: Wrapping XHT to WXHT...");
  const wrapTx = await wxht.deposit({ value: xhtWei, gasLimit: 200000 });
  await wrapTx.wait();
  console.log(`  ✅ Wrapped ${xhtAmount.toLocaleString()} XHT to WXHT`);
  console.log("");

  // Step 2: Mint USDT (test token - replace with real USDT transfer in production)
  console.log("💵 Step 2: Preparing USDT...");
  try {
    const mintTx = await usdt.mint(treasury.address, usdtWei, {
      gasLimit: 200000,
    });
    await mintTx.wait();
    console.log(`  ✅ Minted $${usdtAmount.toLocaleString()} USDT`);
  } catch (error) {
    console.log(`  ℹ️  Using existing USDT balance`);
  }
  console.log("");

  // Step 3: Approve tokens for router
  console.log("🔓 Step 3: Approving tokens...");
  const approveWXHT = await wxht.approve(ROUTER_ADDRESS, xhtWei, {
    gasLimit: 200000,
  });
  await approveWXHT.wait();
  console.log(`  ✅ Approved WXHT`);

  const approveUSDT = await usdt.approve(ROUTER_ADDRESS, usdtWei, {
    gasLimit: 200000,
  });
  await approveUSDT.wait();
  console.log(`  ✅ Approved USDT`);
  console.log("");

  // Step 4: Add liquidity
  console.log("💎 Step 4: Adding liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

  const addLiqTx = await router.addLiquidity(
    WXHT_ADDRESS,
    USDT_ADDRESS,
    xhtWei,
    usdtWei,
    (xhtWei * 95n) / 100n, // 5% slippage
    (usdtWei * 95n) / 100n,
    treasury.address,
    deadline,
    { gasLimit: 5000000 }
  );

  console.log(`  ⏳ Transaction submitted: ${addLiqTx.hash}`);
  const receipt = await addLiqTx.wait();
  console.log(`  ✅ Liquidity added! Gas used: ${receipt.gasUsed.toString()}`);
  console.log("");

  // Step 5: Verify
  await checkLPPosition();

  console.log("🎉 Treasury Market Maker Setup Complete!");
  console.log("");
  console.log("💡 What This Means:");
  console.log("  ✅ YOU now control the XHT/USDT market");
  console.log("  ✅ YOU earn ALL trading fees (0.3%)");
  console.log("  ✅ YOU capture the spread on every fiat purchase");
  console.log("  ✅ YOU can adjust price by adding/removing liquidity");
  console.log("");
  console.log("📈 Next Steps:");
  console.log("  1. Integrate MoonPay widget (already built)");
  console.log("  2. MoonPay will swap USDT → XHT on YOUR DEX");
  console.log("  3. You earn fees + spread on every sale!");
  console.log("");
}

// Add more liquidity
async function addMoreLiquidity(xhtAmount, usdtAmount) {
  console.log("📈 Adding More Treasury Liquidity");
  console.log("===============================================");
  console.log(`  Adding: ${xhtAmount.toLocaleString()} XHT + $${usdtAmount.toLocaleString()} USDT`);
  console.log("");

  // Reuse setup logic
  await setupTreasuryMarketMaker(xhtAmount, usdtAmount);
}

// Main CLI
async function main() {
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  try {
    if (command === "status") {
      await checkBalances();
      await checkLPPosition();
    } else if (command === "setup") {
      if (!arg1 || !arg2) {
        console.error("❌ Usage: node treasury-market-maker.js setup <XHT_AMOUNT> <USDT_AMOUNT>");
        console.error("   Example: node treasury-market-maker.js setup 100000000 100000");
        process.exit(1);
      }

      const xhtAmount = parseFloat(arg1);
      const usdtAmount = parseFloat(arg2);

      await checkBalances();
      await setupTreasuryMarketMaker(xhtAmount, usdtAmount);
    } else if (command === "add") {
      if (!arg1 || !arg2) {
        console.error("❌ Usage: node treasury-market-maker.js add <XHT_AMOUNT> <USDT_AMOUNT>");
        process.exit(1);
      }

      const xhtAmount = parseFloat(arg1);
      const usdtAmount = parseFloat(arg2);

      await checkBalances();
      await addMoreLiquidity(xhtAmount, usdtAmount);
    } else {
      console.log("📖 Treasury Market Maker - Usage:");
      console.log("");
      console.log("Commands:");
      console.log("  status                     Check treasury balances and LP position");
      console.log("  setup <XHT> <USDT>        Initial liquidity deployment");
      console.log("  add <XHT> <USDT>          Add more liquidity");
      console.log("");
      console.log("Examples:");
      console.log("  node scripts/treasury-market-maker.js status");
      console.log("  node scripts/treasury-market-maker.js setup 100000000 100000");
      console.log("  node scripts/treasury-market-maker.js add 50000000 50000");
      console.log("");
    }
  } catch (error) {
    console.error("");
    console.error("❌ Error:", error.message);
    if (error.reason) console.error("   Reason:", error.reason);
    process.exit(1);
  }
}

main();
