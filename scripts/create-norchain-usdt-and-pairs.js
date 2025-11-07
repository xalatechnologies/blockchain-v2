import hre from "hardhat";
const { ethers } = hre;

// Fix SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * CREATE NORCHAIN USDT AND TRADING PAIRS
 *
 * 1. Deploy mock USDT on NorChain
 * 2. Create NOR/USDT pair
 * 3. Add initial liquidity
 */

const WNOR_ADDRESS = "0x793c849f6207E9a7B1C8Bdf99D0743400f6bB658";
const FACTORY_ADDRESS = "0x1FD987bE228Af52e58c8c0b64d97E4D30755ffa9";
const ROUTER_ADDRESS = "0x22344B3995cB5f9882fcf1775C2e072A96CA8588";

async function main() {
  console.log("\n🚀 NORCHAIN USDT & LIQUIDITY SETUP");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deploying from:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", ethers.formatEther(balance), "NOR");

  // Step 1: Deploy Mock USDT
  console.log("\n" + "=".repeat(70));
  console.log("1️⃣  DEPLOYING MOCK USDT");
  console.log("=".repeat(70));

  const USDT = await ethers.getContractFactory("MockUSDT");
  const usdt = await USDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();

  console.log("✅ USDT deployed at:", usdtAddress);

  // Mint USDT for deployer
  const mintAmount = ethers.parseUnits("1000000", 18); // 1M USDT
  await usdt.mint(deployer.address, mintAmount);
  console.log("   Minted:", ethers.formatUnits(mintAmount, 18), "USDT");

  // Step 2: Create NOR/USDT Pair
  console.log("\n" + "=".repeat(70));
  console.log("2️⃣  CREATING NOR/USDT PAIR");
  console.log("=".repeat(70));

  const factory = await ethers.getContractAt("NorSwapFactory", FACTORY_ADDRESS);

  // Create pair
  const createTx = await factory.createPair(WNOR_ADDRESS, usdtAddress);
  await createTx.wait();

  const pairAddress = await factory.getPair(WNOR_ADDRESS, usdtAddress);
  console.log("✅ NOR/USDT Pair created at:", pairAddress);

  // Step 3: Add Liquidity
  console.log("\n" + "=".repeat(70));
  console.log("3️⃣  ADDING INITIAL LIQUIDITY");
  console.log("=".repeat(70));

  const router = await ethers.getContractAt("NorSwapRouter", ROUTER_ADDRESS);

  // Amounts: 10,000 NOR + 10,000 USDT (1:1 ratio)
  const norAmount = ethers.parseEther("10000");
  const usdtAmount = ethers.parseUnits("10000", 18);

  console.log("   NOR:", ethers.formatEther(norAmount));
  console.log("   USDT:", ethers.formatUnits(usdtAmount, 18));

  // Approve tokens
  console.log("\n📝 Approving tokens...");
  const wnor = await ethers.getContractAt("WNOR", WNOR_ADDRESS);

  // Wrap NOR
  console.log("   Wrapping NOR...");
  const wrapTx = await wnor.deposit({ value: norAmount });
  await wrapTx.wait();
  console.log("   ✅ Wrapped", ethers.formatEther(norAmount), "NOR");

  // Approve WNOR
  const approveWnorTx = await wnor.approve(ROUTER_ADDRESS, norAmount);
  await approveWnorTx.wait();
  console.log("   ✅ WNOR approved");

  // Approve USDT
  const approveUsdtTx = await usdt.approve(ROUTER_ADDRESS, usdtAmount);
  await approveUsdtTx.wait();
  console.log("   ✅ USDT approved");

  // Add liquidity
  console.log("\n💧 Adding liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  const addLiquidityTx = await router.addLiquidity(
    WNOR_ADDRESS,
    usdtAddress,
    norAmount,
    usdtAmount,
    0, // min NOR
    0, // min USDT
    deployer.address,
    deadline
  );

  const receipt = await addLiquidityTx.wait();
  console.log("✅ Liquidity added!");
  console.log("   TX:", receipt.hash);

  // Verify pair
  const pair = await ethers.getContractAt("NorSwapPair", pairAddress);
  const reserves = await pair.getReserves();
  const token0 = await pair.token0();
  const token1 = await pair.token1();

  console.log("\n📊 PAIR RESERVES:");
  console.log("   Token0:", token0);
  console.log("   Reserve0:", ethers.formatEther(reserves[0]));
  console.log("   Token1:", token1);
  console.log("   Reserve1:", ethers.formatEther(reserves[1]));

  // Get LP token balance
  const lpBalance = await pair.balanceOf(deployer.address);
  console.log("\n💎 LP TOKEN BALANCE:", ethers.formatEther(lpBalance));

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("✅ SETUP COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n📋 DEPLOYED ADDRESSES:");
  console.log("   USDT:", usdtAddress);
  console.log("   NOR/USDT Pair:", pairAddress);
  console.log("   LP Tokens:", ethers.formatEther(lpBalance));
  console.log("\n💡 NEXT: Deploy liquidity lock contract");
  console.log("   Run: npx hardhat run scripts/deploy-lp-timelock.js --network btcbr");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
