import hre from "hardhat";
const { ethers } = hre;

// Fix SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * CREATE CROSS-CHAIN DEX PAIRS
 *
 * Creates trading pairs on NorSwap for bridged tokens:
 * - NOR/WUSDT
 * - NOR/WBNB
 * - NOR/WETH
 * - BTCBR/WUSDT (bonus)
 */

// Deployed Contracts
const NOR_TOKEN = "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80";
const BTCBR = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";

const WUSDT = "0x7Ad030f7549F02B7258F1c54E6B909b1d5F49d82";
const WBNB = "0x1a49C061d9131c90e9141D8D9754Bf4c8Bd2c82A";
const WETH = "0xEd511294b4Fa418458B2abD577F26104cdB3D4af";

const FACTORY = "0x1FD987bE228Af52e58c8c0b64d97E4D30755ffa9";
const ROUTER = "0x22344B3995cB5f9882fcf1775C2e072A96CA8588";

async function main() {
  console.log("\n🌉 CREATING CROSS-CHAIN DEX PAIRS");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 From:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", ethers.formatEther(balance), "NOR");

  // Get Factory contract
  const factory = await ethers.getContractAt("NorSwapFactory", FACTORY);
  console.log("\n✅ Factory loaded:", FACTORY);

  const pairs = [];

  // Create NOR/WUSDT Pair
  console.log("\n" + "=".repeat(70));
  console.log("1️⃣  CREATING NOR/WUSDT PAIR");
  console.log("=".repeat(70));

  try {
    const tx1 = await factory.createPair(NOR_TOKEN, WUSDT);
    await tx1.wait();
    const pair1 = await factory.getPair(NOR_TOKEN, WUSDT);
    console.log("✅ NOR/WUSDT pair created:", pair1);
    pairs.push({ name: "NOR/WUSDT", address: pair1, token0: NOR_TOKEN, token1: WUSDT });
  } catch (error) {
    if (error.message.includes("PAIR_EXISTS")) {
      const pair1 = await factory.getPair(NOR_TOKEN, WUSDT);
      console.log("ℹ️  NOR/WUSDT pair already exists:", pair1);
      pairs.push({ name: "NOR/WUSDT", address: pair1, token0: NOR_TOKEN, token1: WUSDT });
    } else {
      throw error;
    }
  }

  // Create NOR/WBNB Pair
  console.log("\n" + "=".repeat(70));
  console.log("2️⃣  CREATING NOR/WBNB PAIR");
  console.log("=".repeat(70));

  try {
    const tx2 = await factory.createPair(NOR_TOKEN, WBNB);
    await tx2.wait();
    const pair2 = await factory.getPair(NOR_TOKEN, WBNB);
    console.log("✅ NOR/WBNB pair created:", pair2);
    pairs.push({ name: "NOR/WBNB", address: pair2, token0: NOR_TOKEN, token1: WBNB });
  } catch (error) {
    if (error.message.includes("PAIR_EXISTS")) {
      const pair2 = await factory.getPair(NOR_TOKEN, WBNB);
      console.log("ℹ️  NOR/WBNB pair already exists:", pair2);
      pairs.push({ name: "NOR/WBNB", address: pair2, token0: NOR_TOKEN, token1: WBNB });
    } else {
      throw error;
    }
  }

  // Create NOR/WETH Pair
  console.log("\n" + "=".repeat(70));
  console.log("3️⃣  CREATING NOR/WETH PAIR");
  console.log("=".repeat(70));

  try {
    const tx3 = await factory.createPair(NOR_TOKEN, WETH);
    await tx3.wait();
    const pair3 = await factory.getPair(NOR_TOKEN, WETH);
    console.log("✅ NOR/WETH pair created:", pair3);
    pairs.push({ name: "NOR/WETH", address: pair3, token0: NOR_TOKEN, token1: WETH });
  } catch (error) {
    if (error.message.includes("PAIR_EXISTS")) {
      const pair3 = await factory.getPair(NOR_TOKEN, WETH);
      console.log("ℹ️  NOR/WETH pair already exists:", pair3);
      pairs.push({ name: "NOR/WETH", address: pair3, token0: NOR_TOKEN, token1: WETH });
    } else {
      throw error;
    }
  }

  // Create BTCBR/WUSDT Pair (bonus)
  console.log("\n" + "=".repeat(70));
  console.log("4️⃣  CREATING BTCBR/WUSDT PAIR");
  console.log("=".repeat(70));

  try {
    const tx4 = await factory.createPair(BTCBR, WUSDT);
    await tx4.wait();
    const pair4 = await factory.getPair(BTCBR, WUSDT);
    console.log("✅ BTCBR/WUSDT pair created:", pair4);
    pairs.push({ name: "BTCBR/WUSDT", address: pair4, token0: BTCBR, token1: WUSDT });
  } catch (error) {
    if (error.message.includes("PAIR_EXISTS")) {
      const pair4 = await factory.getPair(BTCBR, WUSDT);
      console.log("ℹ️  BTCBR/WUSDT pair already exists:", pair4);
      pairs.push({ name: "BTCBR/WUSDT", address: pair4, token0: BTCBR, token1: WUSDT });
    } else {
      throw error;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("✅ ALL PAIRS CREATED!");
  console.log("=".repeat(70));

  console.log("\n📋 TRADING PAIRS:\n");
  pairs.forEach(pair => {
    console.log(`   ${pair.name}: ${pair.address}`);
  });

  console.log("\n💡 NEXT STEPS:\n");
  console.log("   1. Bridge tokens from BSC to NorChain:");
  console.log("      - Lock USDT on BSC → Mint WUSDT on NorChain");
  console.log("      - Lock BNB on BSC → Mint WBNB on NorChain");
  console.log("      - Lock ETH on BSC → Mint WETH on NorChain");
  console.log("");
  console.log("   2. Add liquidity to pairs:");
  console.log("      node scripts/add-cross-chain-liquidity.js");
  console.log("");
  console.log("   3. Lock LP tokens for security:");
  console.log("      node scripts/lock-liquidity.js");

  // Save pair info
  const fs = await import('fs');
  const path = await import('path');

  const pairInfo = {
    network: "NorChain",
    chainId: 65001,
    createdAt: new Date().toISOString(),
    factory: FACTORY,
    router: ROUTER,
    pairs: pairs.map(p => ({
      name: p.name,
      address: p.address,
      token0: p.token0,
      token1: p.token1
    }))
  };

  const logsDir = path.join(process.cwd(), 'docs', 'deployment-logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(logsDir, 'cross-chain-pairs.json'),
    JSON.stringify(pairInfo, null, 2)
  );

  console.log("\n✅ Pair info saved to: docs/deployment-logs/cross-chain-pairs.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
