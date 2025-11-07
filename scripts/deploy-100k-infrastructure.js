/**
 * Deploy $100K Multi-Pair Infrastructure on NorChain
 *
 * This script deploys:
 * 1. Wrapped tokens (WUSDT, WBNB, WBTCB, WETH, WBUSD)
 * 2. Creates liquidity pairs with NOR
 * 3. Prepares for $100k liquidity addition
 *
 * Usage:
 *   npx hardhat run scripts/deploy-100k-infrastructure.js --network btcbr
 */

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
require("dotenv").config();

// NorChain contracts
const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const NORSWAP_FACTORY = "0x2d033371ACE556c4b2d204E2c8D76550B746c130";
const NORSWAP_ROUTER = "0xC808e1962bD8fE5d0fBc41D76B7909B80C442D84";

async function main() {
  console.log("\n🏗️  DEPLOYING $100K MULTI-PAIR INFRASTRUCTURE");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`\n📋 Deployment Configuration:`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} NOR`);
  console.log(`   Network: NorChain (Chain ID: 65001)`);

  const deployed = {
    timestamp: new Date().toISOString(),
    network: "NorChain",
    chainId: 65001,
    deployer: deployer.address,
    wrappedTokens: {},
    pairs: {}
  };

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: DEPLOY WRAPPED TOKENS
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n📦 STEP 1: DEPLOYING WRAPPED TOKENS`);
  console.log("═".repeat(70));

  // Deploy WrappedUSDT
  console.log(`\n   💵 Deploying WrappedUSDT...`);
  const WrappedUSDT = await ethers.getContractFactory("WrappedUSDT");
  const wusdt = await WrappedUSDT.deploy();
  await wusdt.waitForDeployment();
  deployed.wrappedTokens.WUSDT = await wusdt.getAddress();
  console.log(`   ✅ WUSDT: ${deployed.wrappedTokens.WUSDT}`);

  // Deploy WrappedBNB (in addition to WNOR)
  console.log(`\n   💰 Deploying WrappedBNB...`);
  const WrappedBNB = await ethers.getContractFactory("WrappedBNB");
  const wbnb = await WrappedBNB.deploy();
  await wbnb.waitForDeployment();
  deployed.wrappedTokens.WBNB = await wbnb.getAddress();
  console.log(`   ✅ WBNB: ${deployed.wrappedTokens.WBNB}`);

  // Deploy WrappedBTCBR (Bitcoin) - requires bridge address
  console.log(`\n   ₿  Deploying WrappedBTCBR...`);
  const WrappedBTCBR = await ethers.getContractFactory("WrappedBTCBR");
  const wbtcb = await WrappedBTCBR.deploy(deployer.address); // Use deployer as bridge for now
  await wbtcb.waitForDeployment();
  deployed.wrappedTokens.WBTCB = await wbtcb.getAddress();
  console.log(`   ✅ WBTCB: ${deployed.wrappedTokens.WBTCB}`);

  // Deploy WrappedETH
  console.log(`\n   ⟠  Deploying WrappedETH...`);
  const WrappedETH = await ethers.getContractFactory("WrappedETH");
  const weth = await WrappedETH.deploy();
  await weth.waitForDeployment();
  deployed.wrappedTokens.WETH = await weth.getAddress();
  console.log(`   ✅ WETH: ${deployed.wrappedTokens.WETH}`);

  // For BUSD, we'll use WUSDT with a different instance (both are stablecoins)
  console.log(`\n   💲 Deploying WrappedBUSD (using USDT contract)...`);
  const WrappedBUSD = await ethers.getContractFactory("WrappedUSDT");
  const wbusd = await WrappedBUSD.deploy();
  await wbusd.waitForDeployment();
  deployed.wrappedTokens.WBUSD = await wbusd.getAddress();
  console.log(`   ✅ WBUSD: ${deployed.wrappedTokens.WBUSD}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: WHITELIST ALL TOKENS
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n🔓 STEP 2: WHITELISTING ALL TOKENS`);
  console.log("═".repeat(70));

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);

  const tokensToWhitelist = [
    { name: "WUSDT", address: deployed.wrappedTokens.WUSDT },
    { name: "WBNB", address: deployed.wrappedTokens.WBNB },
    { name: "WBTCB", address: deployed.wrappedTokens.WBTCB },
    { name: "WETH", address: deployed.wrappedTokens.WETH },
    { name: "WBUSD", address: deployed.wrappedTokens.WBUSD }
  ];

  for (const token of tokensToWhitelist) {
    console.log(`\n   📝 Whitelisting ${token.name}...`);
    const tx = await norToken.whitelist(token.address);
    await tx.wait();
    console.log(`   ✅ ${token.name} whitelisted: ${token.address}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: CREATE LIQUIDITY PAIRS
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n🏭 STEP 3: CREATING LIQUIDITY PAIRS`);
  console.log("═".repeat(70));

  const factory = await ethers.getContractAt("IPancakeFactory", NORSWAP_FACTORY);

  const pairs = [
    { name: "NOR/USDT", tokenA: NOR_TOKEN, tokenB: deployed.wrappedTokens.WUSDT, allocation: "$40k (40%)" },
    { name: "NOR/WBNB", tokenA: NOR_TOKEN, tokenB: deployed.wrappedTokens.WBNB, allocation: "$30k (30%)" },
    { name: "NOR/BTCB", tokenA: NOR_TOKEN, tokenB: deployed.wrappedTokens.WBTCB, allocation: "$15k (15%)" },
    { name: "NOR/WETH", tokenA: NOR_TOKEN, tokenB: deployed.wrappedTokens.WETH, allocation: "$10k (10%)" },
    { name: "NOR/BUSD", tokenA: NOR_TOKEN, tokenB: deployed.wrappedTokens.WBUSD, allocation: "$5k (5%)" }
  ];

  for (const pair of pairs) {
    console.log(`\n   🏭 Creating ${pair.name} pair...`);

    // Check if pair exists
    let pairAddress = await factory.getPair(pair.tokenA, pair.tokenB);

    if (pairAddress === ethers.ZeroAddress) {
      const createTx = await factory.createPair(pair.tokenA, pair.tokenB);
      await createTx.wait();
      pairAddress = await factory.getPair(pair.tokenA, pair.tokenB);
      console.log(`   ✅ Pair created: ${pairAddress}`);
    } else {
      console.log(`   ✅ Pair exists: ${pairAddress}`);
    }

    // Whitelist pair
    console.log(`   📝 Whitelisting pair...`);
    const whitelistTx = await norToken.whitelist(pairAddress);
    await whitelistTx.wait();
    console.log(`   ✅ Pair whitelisted`);

    deployed.pairs[pair.name] = {
      address: pairAddress,
      tokenA: pair.tokenA,
      tokenB: pair.tokenB,
      allocation: pair.allocation
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 4: MINT INITIAL WRAPPED TOKENS (FOR TESTING)
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n💰 STEP 4: MINTING WRAPPED TOKENS (FOR LIQUIDITY)`);
  console.log("═".repeat(70));

  // Grant MINTER_ROLE and mint WUSDT (for $40k + $5k = $45k liquidity)
  console.log(`\n   💵 Granting MINTER_ROLE and minting WUSDT...`);
  const wusdtContract = await ethers.getContractAt("WrappedUSDT", deployed.wrappedTokens.WUSDT);
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

  const grantUsdtTx = await wusdtContract.grantRole(MINTER_ROLE, deployer.address);
  await grantUsdtTx.wait();

  const mintUsdtTx = await wusdtContract.mint(deployer.address, ethers.parseUnits("45000", 18), 1); // 45k USDT, nonce 1
  await mintUsdtTx.wait();
  console.log(`   ✅ Minted 45,000 WUSDT`);

  // Mint WBNB (for $30k liquidity = 50 BNB at $600/BNB)
  console.log(`\n   💰 Minting WBNB...`);
  const wbnbContract = await ethers.getContractAt("WrappedBNB", deployed.wrappedTokens.WBNB);

  const grantBnbTx = await wbnbContract.grantRole(MINTER_ROLE, deployer.address);
  await grantBnbTx.wait();

  const mintBnbTx = await wbnbContract.mint(deployer.address, ethers.parseEther("50"), 2); // 50 WBNB, nonce 2
  await mintBnbTx.wait();
  console.log(`   ✅ Minted 50 WBNB`);

  // Mint WBTCB (for $15k liquidity = 0.25 BTC at $60k/BTC)
  console.log(`\n   ₿  Minting WBTCB...`);
  const wbtcbContract = await ethers.getContractAt("WrappedBTCBR", deployed.wrappedTokens.WBTCB);
  const dummyTxHash = ethers.keccak256(ethers.toUtf8Bytes("initial-mint-" + Date.now()));
  const mintBtcTx = await wbtcbContract.mint(deployer.address, ethers.parseUnits("0.25", 18), dummyTxHash); // 0.25 WBTCB
  await mintBtcTx.wait();
  console.log(`   ✅ Minted 0.25 WBTCB`);

  // Mint WETH (for $10k liquidity = 4 ETH at $2.5k/ETH)
  console.log(`\n   ⟠  Minting WETH...`);
  const wethContract = await ethers.getContractAt("WrappedETH", deployed.wrappedTokens.WETH);

  const grantEthTx = await wethContract.grantRole(MINTER_ROLE, deployer.address);
  await grantEthTx.wait();

  const mintEthTx = await wethContract.mint(deployer.address, ethers.parseEther("4"), 4); // 4 WETH, nonce 4
  await mintEthTx.wait();
  console.log(`   ✅ Minted 4 WETH`);

  // WBUSD uses same contract as WUSDT
  console.log(`\n   💲 Minting WBUSD...`);
  const wbusdContract = await ethers.getContractAt("WrappedUSDT", deployed.wrappedTokens.WBUSD);

  const grantBusdTx = await wbusdContract.grantRole(MINTER_ROLE, deployer.address);
  await grantBusdTx.wait();

  const mintBusdTx = await wbusdContract.mint(deployer.address, ethers.parseUnits("5000", 18), 5); // 5k BUSD, nonce 5
  await mintBusdTx.wait();
  console.log(`   ✅ Minted 5,000 WBUSD`);

  // ═══════════════════════════════════════════════════════════════════
  // SUCCESS SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n🎉 INFRASTRUCTURE DEPLOYMENT COMPLETE!`);
  console.log("═".repeat(70));

  console.log(`\n✅ WRAPPED TOKENS DEPLOYED:`);
  console.log(`   WUSDT: ${deployed.wrappedTokens.WUSDT}`);
  console.log(`   WBNB:  ${deployed.wrappedTokens.WBNB}`);
  console.log(`   WBTCB: ${deployed.wrappedTokens.WBTCB}`);
  console.log(`   WETH:  ${deployed.wrappedTokens.WETH}`);
  console.log(`   WBUSD: ${deployed.wrappedTokens.WBUSD}`);

  console.log(`\n✅ LIQUIDITY PAIRS CREATED:`);
  Object.entries(deployed.pairs).forEach(([name, pair]) => {
    console.log(`   ${name}: ${pair.address} (${pair.allocation})`);
  });

  console.log(`\n✅ WRAPPED TOKENS MINTED:`);
  console.log(`   45,000 WUSDT (for $45k liquidity)`);
  console.log(`   50 WBNB (for $30k liquidity)`);
  console.log(`   0.25 WBTCB (for $15k liquidity)`);
  console.log(`   4 WETH (for $10k liquidity)`);
  console.log(`   5,000 WBUSD (for $5k liquidity)`);

  console.log(`\n📝 NEXT STEPS:`);
  console.log("═".repeat(70));
  console.log(`\n1. Add $100k liquidity across all pairs:`);
  console.log(`   npx hardhat run scripts/add-100k-liquidity-all-pairs.js --network btcbr`);
  console.log(`\n2. Lock all liquidity for 3 years:`);
  console.log(`   npx hardhat run scripts/lock-all-liquidity.js --network btcbr`);

  // Save deployment info
  const deploymentLog = `docs/deployment-logs/100k-infrastructure-${Date.now()}.json`;
  fs.mkdirSync("docs/deployment-logs", { recursive: true });
  fs.writeFileSync(deploymentLog, JSON.stringify(deployed, null, 2));

  console.log(`\n💾 Deployment info saved: ${deploymentLog}`);

  console.log(`\n═`.repeat(70));
  console.log(`✅ Ready for $100k Multi-Pair Launch!`);
  console.log(`═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Infrastructure Deployment Failed:");
    console.error(error);
    process.exit(1);
  });
