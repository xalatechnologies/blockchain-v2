/**
 * NorTokenUltra Configuration Script
 *
 * Configure token after deployment and before enabling trading
 *
 * Usage:
 *   node scripts/configure-nor-ultra.js <contract-address>
 *
 * Example:
 *   node scripts/configure-nor-ultra.js 0x1234...
 */

import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";
import readline from "readline";
dotenvConfig();

const CONTRACT_ADDRESS = process.argv[2];
const PRIVATE_KEY = process.env.MAIN_WALLET_PRIVATE_KEY;
const RPC_URL = process.env.BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org";

const ABI = [
  "function whitelist(address) external",
  "function setExchange(address, bool) external",
  "function setBridge(address, bool) external",
  "function updateLimits(uint256, uint256, uint256) external",
  "function updateCooldowns(uint256, uint256) external",
  "function updateMinHoldTime(uint256) external",
  "function updateMaxGasPrice(uint256) external",
  "function getProtectionSettings() view returns (bool, uint8, uint256, uint256, uint256, uint256, uint256, uint256)",
  "function totalSupply() view returns (uint256)",
];

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  if (!CONTRACT_ADDRESS) {
    console.error("❌ Usage: node scripts/configure-nor-ultra.js <contract-address>");
    process.exit(1);
  }

  if (!PRIVATE_KEY) {
    console.error("❌ MAIN_WALLET_PRIVATE_KEY not set in .env");
    process.exit(1);
  }

  console.log("\n🔧 NorTokenUltra Configuration Tool");
  console.log("═".repeat(70));
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`RPC: ${RPC_URL}\n`);

  // Connect
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  // Get current settings
  console.log("📋 Current Settings:");
  console.log("─".repeat(70));

  const settings = await contract.getProtectionSettings();
  const totalSupply = await contract.totalSupply();

  console.log(`Max TX Buy: ${ethers.formatUnits(settings[2], 24)} NOR`);
  console.log(`Max TX Sell: ${ethers.formatUnits(settings[3], 24)} NOR`);
  console.log(`Max Wallet: ${ethers.formatUnits(settings[4], 24)} NOR`);
  console.log(`Buy Cooldown: ${settings[5]} seconds`);
  console.log(`Sell Cooldown: ${settings[6]} seconds`);
  console.log(`Min Hold Time: ${settings[7]} seconds`);

  console.log("\n" + "═".repeat(70));
  console.log("Configuration Menu:");
  console.log("═".repeat(70));
  console.log("1. Whitelist team addresses");
  console.log("2. Set exchange addresses (PancakeSwap, etc.)");
  console.log("3. Set bridge addresses");
  console.log("4. Update transaction limits");
  console.log("5. Update cooldown times");
  console.log("6. Update min hold time");
  console.log("7. Update max gas price");
  console.log("8. Complete pre-launch configuration");
  console.log("0. Exit");
  console.log("═".repeat(70));

  const choice = await question("\nSelect option: ");

  switch (choice.trim()) {
    case "1":
      await whitelistAddresses(contract);
      break;
    case "2":
      await setExchanges(contract);
      break;
    case "3":
      await setBridges(contract);
      break;
    case "4":
      await updateLimits(contract, totalSupply);
      break;
    case "5":
      await updateCooldowns(contract);
      break;
    case "6":
      await updateMinHoldTime(contract);
      break;
    case "7":
      await updateMaxGasPrice(contract);
      break;
    case "8":
      await completeConfiguration(contract, totalSupply);
      break;
    case "0":
      console.log("Exiting...");
      rl.close();
      process.exit(0);
    default:
      console.log("Invalid option");
  }

  rl.close();
}

async function whitelistAddresses(contract) {
  console.log("\n🔐 Whitelist Team Addresses");
  console.log("─".repeat(70));

  const addresses = await question("Enter addresses (comma-separated): ");
  const addressList = addresses.split(",").map(a => a.trim());

  console.log(`\nWhitelisting ${addressList.length} addresses...`);

  for (const addr of addressList) {
    if (!ethers.isAddress(addr)) {
      console.log(`❌ Invalid address: ${addr}`);
      continue;
    }

    try {
      const tx = await contract.whitelist(addr);
      console.log(`⏳ Whitelisting ${addr}...`);
      await tx.wait();
      console.log(`✅ Whitelisted ${addr}`);
    } catch (error) {
      console.log(`❌ Failed to whitelist ${addr}: ${error.message}`);
    }
  }
}

async function setExchanges(contract) {
  console.log("\n🏦 Set Exchange Addresses");
  console.log("─".repeat(70));
  console.log("Common BSC addresses:");
  console.log("PancakeSwap V2 Router: 0x10ED43C718714eb63d5aA57B78B54704E256024E");
  console.log("PancakeSwap V2 Factory: 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73");
  console.log("");

  const addresses = await question("Enter exchange addresses (comma-separated): ");
  const addressList = addresses.split(",").map(a => a.trim());

  for (const addr of addressList) {
    if (!ethers.isAddress(addr)) {
      console.log(`❌ Invalid address: ${addr}`);
      continue;
    }

    try {
      const tx = await contract.setExchange(addr, true);
      console.log(`⏳ Setting ${addr} as exchange...`);
      await tx.wait();
      console.log(`✅ Set ${addr} as exchange`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
}

async function setBridges(contract) {
  console.log("\n🌉 Set Bridge Addresses");
  console.log("─".repeat(70));

  const addresses = await question("Enter bridge addresses (comma-separated): ");
  const addressList = addresses.split(",").map(a => a.trim());

  for (const addr of addressList) {
    if (!ethers.isAddress(addr)) {
      console.log(`❌ Invalid address: ${addr}`);
      continue;
    }

    try {
      const tx = await contract.setBridge(addr, true);
      console.log(`⏳ Setting ${addr} as bridge...`);
      await tx.wait();
      console.log(`✅ Set ${addr} as bridge`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
}

async function updateLimits(contract, totalSupply) {
  console.log("\n📊 Update Transaction Limits");
  console.log("─".repeat(70));

  const maxTxBuyPercent = await question("Max TX Buy (% of supply, e.g., 0.5): ");
  const maxTxSellPercent = await question("Max TX Sell (% of supply, e.g., 0.5): ");
  const maxWalletPercent = await question("Max Wallet (% of supply, e.g., 2): ");

  const maxTxBuy = (totalSupply * BigInt(Math.floor(parseFloat(maxTxBuyPercent) * 100))) / 10000n;
  const maxTxSell = (totalSupply * BigInt(Math.floor(parseFloat(maxTxSellPercent) * 100))) / 10000n;
  const maxWallet = (totalSupply * BigInt(Math.floor(parseFloat(maxWalletPercent) * 100))) / 10000n;

  console.log(`\nNew limits:`);
  console.log(`Max TX Buy: ${ethers.formatUnits(maxTxBuy, 24)} NOR (${maxTxBuyPercent}%)`);
  console.log(`Max TX Sell: ${ethers.formatUnits(maxTxSell, 24)} NOR (${maxTxSellPercent}%)`);
  console.log(`Max Wallet: ${ethers.formatUnits(maxWallet, 24)} NOR (${maxWalletPercent}%)`);

  const confirm = await question("\nConfirm update? (yes/no): ");
  if (confirm.toLowerCase() !== "yes") {
    console.log("Cancelled");
    return;
  }

  try {
    const tx = await contract.updateLimits(maxTxBuy, maxTxSell, maxWallet);
    console.log(`⏳ Updating limits...`);
    await tx.wait();
    console.log(`✅ Limits updated`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
}

async function updateCooldowns(contract) {
  console.log("\n⏱️  Update Cooldown Times");
  console.log("─".repeat(70));

  const buyCooldown = await question("Buy cooldown (seconds, e.g., 30): ");
  const sellCooldown = await question("Sell cooldown (seconds, e.g., 60): ");

  console.log(`\nNew cooldowns:`);
  console.log(`Buy: ${buyCooldown} seconds`);
  console.log(`Sell: ${sellCooldown} seconds`);

  const confirm = await question("\nConfirm update? (yes/no): ");
  if (confirm.toLowerCase() !== "yes") {
    console.log("Cancelled");
    return;
  }

  try {
    const tx = await contract.updateCooldowns(buyCooldown, sellCooldown);
    console.log(`⏳ Updating cooldowns...`);
    await tx.wait();
    console.log(`✅ Cooldowns updated`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
}

async function updateMinHoldTime(contract) {
  console.log("\n⏱️  Update Minimum Hold Time");
  console.log("─".repeat(70));

  const minHoldTime = await question("Min hold time (seconds, e.g., 600): ");

  try {
    const tx = await contract.updateMinHoldTime(minHoldTime);
    console.log(`⏳ Updating min hold time...`);
    await tx.wait();
    console.log(`✅ Min hold time updated to ${minHoldTime} seconds`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
}

async function updateMaxGasPrice(contract) {
  console.log("\n⛽ Update Max Gas Price");
  console.log("─".repeat(70));

  const maxGasPrice = await question("Max gas price (gwei, e.g., 50): ");
  const maxGasPriceWei = ethers.parseUnits(maxGasPrice, "gwei");

  try {
    const tx = await contract.updateMaxGasPrice(maxGasPriceWei);
    console.log(`⏳ Updating max gas price...`);
    await tx.wait();
    console.log(`✅ Max gas price updated to ${maxGasPrice} gwei`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
}

async function completeConfiguration(contract, totalSupply) {
  console.log("\n🚀 Complete Pre-Launch Configuration");
  console.log("═".repeat(70));
  console.log("\nThis will configure recommended settings for launch:");
  console.log("\n1. Whitelist PancakeSwap Router");
  console.log("2. Set PancakeSwap as exchange");
  console.log("3. Set conservative limits (0.5% TX, 2% wallet)");
  console.log("4. Set bot protection cooldowns (30s buy, 60s sell)");
  console.log("5. Set min hold time (10 minutes)");

  const confirm = await question("\nProceed with recommended configuration? (yes/no): ");
  if (confirm.toLowerCase() !== "yes") {
    console.log("Cancelled");
    return;
  }

  try {
    // PancakeSwap Router
    const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

    console.log("\n⏳ Step 1/5: Whitelisting PancakeSwap Router...");
    let tx = await contract.whitelist(routerAddress);
    await tx.wait();
    console.log("✅ Done");

    console.log("\n⏳ Step 2/5: Setting PancakeSwap as exchange...");
    tx = await contract.setExchange(routerAddress, true);
    await tx.wait();
    console.log("✅ Done");

    console.log("\n⏳ Step 3/5: Setting transaction limits...");
    const maxTxBuy = (totalSupply * 5n) / 1000n;    // 0.5%
    const maxTxSell = (totalSupply * 5n) / 1000n;   // 0.5%
    const maxWallet = (totalSupply * 2n) / 100n;    // 2%
    tx = await contract.updateLimits(maxTxBuy, maxTxSell, maxWallet);
    await tx.wait();
    console.log("✅ Done");

    console.log("\n⏳ Step 4/5: Setting cooldowns...");
    tx = await contract.updateCooldowns(30, 60);
    await tx.wait();
    console.log("✅ Done");

    console.log("\n⏳ Step 5/5: Setting min hold time...");
    tx = await contract.updateMinHoldTime(600);
    await tx.wait();
    console.log("✅ Done");

    console.log("\n" + "═".repeat(70));
    console.log("✅ CONFIGURATION COMPLETE!");
    console.log("═".repeat(70));
    console.log("\n📋 Next Steps:");
    console.log("1. Add liquidity ($50k+ recommended)");
    console.log("2. Lock liquidity for 2+ years");
    console.log("3. Publish lock proof");
    console.log("4. Enable trading when ready");

  } catch (error) {
    console.log(`\n❌ Configuration failed: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:");
    console.error(error);
    process.exit(1);
  });
