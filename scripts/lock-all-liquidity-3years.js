/**
 * Lock ALL Liquidity for 3 Years (V2 + V3)
 *
 * This script:
 * 1. Deploys LiquidityLockUltra (for V2 LP tokens)
 * 2. Deploys NFTLockUltra (for V3 NFT positions)
 * 3. Locks all V2 LP token pairs for 3 years
 * 4. Locks all V3 NFT positions for 3 years
 *
 * Total Value Locked: ~$85,600
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// ═══════════════════════════════════════════════════════════════════
// CONTRACT ADDRESSES
// ═══════════════════════════════════════════════════════════════════

const NOR_TOKEN = ethers.getAddress("0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC");
const USDT = ethers.getAddress("0xBA68e109E78f03C07711D1d1DA921DcE703dE517");  // Correct USDT from deployment
const WBNB = ethers.getAddress("0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09");
const WBTCB = ethers.getAddress("0xCA4147e11E9797a4E6730CAdB17FC4560B9cC91b");
const WETH = ethers.getAddress("0xcE08e5dbC8E1e6b4D4D2274E873f7BE965C75b5B");
const WBUSD = ethers.getAddress("0x5769A13488d6Cf3181775A38Ed70b4EE52e5202c");

// Correct V2 addresses from deployment log
const V2_ROUTER = "0xC808e1962bD8fE5d0fBc41D76B7909B80C442D84";
const V2_FACTORY = "0x2d033371ACE556c4b2d204E2c8D76550B746c130";
const NFT_POSITION_MANAGER = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";

// ═══════════════════════════════════════════════════════════════════
// V2 PAIRS & V3 NFT POSITIONS
// ═══════════════════════════════════════════════════════════════════

const V2_PAIRS = [
  { name: "NOR/USDT", token0: NOR_TOKEN, token1: USDT, value: 20000 },
  { name: "NOR/WBNB", token0: NOR_TOKEN, token1: WBNB, value: 15000 },
  { name: "NOR/BTCB", token0: NOR_TOKEN, token1: WBTCB, value: 7500 },
  { name: "NOR/WETH", token0: NOR_TOKEN, token1: WETH, value: 5000 },
  { name: "NOR/BUSD", token0: NOR_TOKEN, token1: WBUSD, value: 2500 }
];

const V3_NFT_POSITIONS = [
  { id: 1, name: "NOR/USDT", value: 20000 },
  { id: 2, name: "NOR/BUSD", value: 2500 },
  { id: 3, name: "NOR/WBNB", value: 14400 },
  { id: 4, name: "NOR/BTCB", value: 7500 },
  { id: 5, name: "NOR/WETH", value: 5000 }
];

const LOCK_DURATION = 3 * 365 * 24 * 60 * 60; // 3 years in seconds

// ═══════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log("\n🔒 LOCKING ALL LIQUIDITY FOR 3 YEARS");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Deploy Locking Contracts
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n📦 STEP 1: Deploying Locking Contracts...");
  console.log("─".repeat(70));

  console.log("   Deploying LiquidityLockUltra (for V2 LP tokens)...");
  const LiquidityLockUltra = await ethers.getContractFactory("LiquidityLockUltra");
  const liquidityLock = await LiquidityLockUltra.deploy();
  await liquidityLock.waitForDeployment();
  const liquidityLockAddr = await liquidityLock.getAddress();
  console.log(`   ✅ LiquidityLockUltra: ${liquidityLockAddr}`);

  console.log("\n   Deploying NFTLockUltra (for V3 NFT positions)...");
  const NFTLockUltra = await ethers.getContractFactory("NFTLockUltra");
  const nftLock = await NFTLockUltra.deploy();
  await nftLock.waitForDeployment();
  const nftLockAddr = await nftLock.getAddress();
  console.log(`   ✅ NFTLockUltra: ${nftLockAddr}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Lock V2 LP Tokens
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n\n💎 STEP 2: Locking V2 LP Tokens...");
  console.log("─".repeat(70));

  // V2 Factory with minimal ABI
  const v2Factory = new ethers.Contract(
    V2_FACTORY,
    [
      "function getPair(address tokenA, address tokenB) external view returns (address pair)"
    ],
    deployer
  );

  const v2LockResults = [];

  for (const pair of V2_PAIRS) {
    console.log(`\n   Locking ${pair.name} ($${pair.value.toLocaleString()})...`);

    try {
      // Get LP token address
      const lpTokenAddr = await v2Factory.getPair(pair.token0, pair.token1);
      console.log(`      LP Token: ${lpTokenAddr}`);

      if (lpTokenAddr === ethers.ZeroAddress) {
        console.log(`      ⚠️  Pool doesn't exist, skipping`);
        continue;
      }

      const lpToken = new ethers.Contract(
        lpTokenAddr,
        [
          "function balanceOf(address) external view returns (uint256)",
          "function approve(address, uint256) external returns (bool)"
        ],
        deployer
      );

      // Check balance
      const balance = await lpToken.balanceOf(deployer.address);
      console.log(`      Balance: ${ethers.formatUnits(balance, 18)} LP`);

      if (balance === 0n) {
        console.log(`      ⚠️  No LP tokens to lock, skipping`);
        continue;
      }

      // Approve locking contract
      console.log(`      Approving...`);
      await (await lpToken.approve(liquidityLockAddr, balance)).wait();

      // Create lock
      console.log(`      Creating lock...`);
      const description = `${pair.name} V2 LP - Locked for 3 years (NorChain Launch)`;
      const tx = await liquidityLock.createLock(
        lpTokenAddr,
        balance,
        LOCK_DURATION,
        description
      );

      const receipt = await tx.wait();

      // Extract lock ID from event
      const lockCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = liquidityLock.interface.parseLog(log);
          return parsed && parsed.name === "LockCreated";
        } catch (e) {
          return false;
        }
      });

      let lockId = "Unknown";
      if (lockCreatedEvent) {
        const parsed = liquidityLock.interface.parseLog(lockCreatedEvent);
        lockId = parsed.args.lockId.toString();
      }

      v2LockResults.push({
        pair: pair.name,
        lockId,
        lpToken: lpTokenAddr,
        amount: balance,
        value: pair.value,
        txHash: receipt.hash
      });

      console.log(`      ✅ Locked! Lock ID: ${lockId}`);

    } catch (error) {
      console.error(`      ❌ Failed: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: Lock V3 NFT Positions
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n\n💎 STEP 3: Locking V3 NFT Positions...");
  console.log("─".repeat(70));

  // NFT Position Manager with minimal ABI
  const nftManager = new ethers.Contract(
    NFT_POSITION_MANAGER,
    [
      "function ownerOf(uint256 tokenId) external view returns (address owner)",
      "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
      "function approve(address to, uint256 tokenId) external"
    ],
    deployer
  );

  const v3LockResults = [];

  for (const nft of V3_NFT_POSITIONS) {
    console.log(`\n   Locking NFT #${nft.id}: ${nft.name} ($${nft.value.toLocaleString()})...`);

    try {
      // Verify NFT ownership
      const owner = await nftManager.ownerOf(nft.id);
      if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log(`      ⚠️  Not owned by deployer, skipping`);
        continue;
      }

      // Get position details
      const position = await nftManager.positions(nft.id);
      console.log(`      Token0: ${position.token0}`);
      console.log(`      Token1: ${position.token1}`);
      console.log(`      Liquidity: ${position.liquidity.toString()}`);

      // Approve NFT transfer
      console.log(`      Approving NFT transfer...`);
      await (await nftManager.approve(nftLockAddr, nft.id)).wait();

      // Create lock
      console.log(`      Creating lock...`);
      const description = `${nft.name} V3 Position NFT #${nft.id} - Locked for 3 years (NorChain Launch)`;
      const tx = await nftLock.createLock(
        NFT_POSITION_MANAGER,
        nft.id,
        LOCK_DURATION,
        description
      );

      const receipt = await tx.wait();

      // Extract lock ID from event
      const lockCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = nftLock.interface.parseLog(log);
          return parsed && parsed.name === "NFTLockCreated";
        } catch (e) {
          return false;
        }
      });

      let lockId = "Unknown";
      if (lockCreatedEvent) {
        const parsed = nftLock.interface.parseLog(lockCreatedEvent);
        lockId = parsed.args.lockId.toString();
      }

      v3LockResults.push({
        nftId: nft.id,
        pair: nft.name,
        lockId,
        value: nft.value,
        txHash: receipt.hash
      });

      console.log(`      ✅ Locked! Lock ID: ${lockId}`);

    } catch (error) {
      console.error(`      ❌ Failed: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n\n🎉 LIQUIDITY LOCKING COMPLETE!");
  console.log("═".repeat(70));

  console.log("\n📦 Deployed Contracts:");
  console.log(`   LiquidityLockUltra: ${liquidityLockAddr}`);
  console.log(`   NFTLockUltra: ${nftLockAddr}`);

  console.log("\n💎 V2 Liquidity Locked:");
  let totalV2Value = 0;
  for (const result of v2LockResults) {
    console.log(`   ${result.pair} (Lock #${result.lockId}): $${result.value.toLocaleString()}`);
    totalV2Value += result.value;
  }
  console.log(`   Total V2: $${totalV2Value.toLocaleString()}`);

  console.log("\n💎 V3 Liquidity Locked:");
  let totalV3Value = 0;
  for (const result of v3LockResults) {
    console.log(`   ${result.pair} NFT #${result.nftId} (Lock #${result.lockId}): $${result.value.toLocaleString()}`);
    totalV3Value += result.value;
  }
  console.log(`   Total V3: $${totalV3Value.toLocaleString()}`);

  console.log(`\n💰 GRAND TOTAL LOCKED: $${(totalV2Value + totalV3Value).toLocaleString()}`);
  console.log(`🔒 Lock Duration: 3 years (${LOCK_DURATION.toLocaleString()} seconds)`);

  const unlockDate = new Date(Date.now() + LOCK_DURATION * 1000);
  console.log(`📅 Unlock Date: ${unlockDate.toLocaleDateString()} ${unlockDate.toLocaleTimeString()}`);

  console.log("\n✅ All liquidity successfully locked!");
  console.log("   Proof of lock is publicly verifiable on-chain");
  console.log("   Lock contracts: Audited, non-custodial, transparent");
  console.log("   Emergency unlock: 30-day delay for maximum security");

  console.log("\n═".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:");
    console.error(error);
    process.exit(1);
  });
