import pkg from "hardhat";
const { ethers } = pkg;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

// Existing deployment addresses
const WNOR_ADDRESS = "0x26c0eaF731885b14c031cc50dB79b36458E0b355";

async function main() {
  console.log("\n🚀 Resuming Nor Chain Deployment");
  console.log("=".repeat(70));

  const privateKey = process.env.MAIN_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("MAIN_WALLET_PRIVATE_KEY not found in .env");
  }

  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const deployer = new ethers.Wallet(privateKey, provider);

  console.log("\n📍 Deployer:", deployer.address);

  const xhtBalance = await provider.getBalance(deployer.address);
  console.log("💰 NOR Balance:", ethers.formatEther(xhtBalance), "NOR");

  const blockNumber = await provider.getBlockNumber();
  console.log("📦 Block:", blockNumber);

  // Check WNOR balance
  const wxhtContract = new ethers.Contract(
    WNOR_ADDRESS,
    [
      "function balanceOf(address) view returns (uint256)",
      "function deposit() payable",
      "function approve(address spender, uint256 amount) returns (bool)",
    ],
    deployer
  );

  const wxhtBalance = await wxhtContract.balanceOf(deployer.address);
  const wxhtFormatted = ethers.formatEther(wxhtBalance);
  console.log(
    "\n✅ WNOR Balance:",
    Number(wxhtFormatted).toLocaleString(),
    "WNOR"
  );

  const batchesComplete = Math.floor(Number(wxhtFormatted) / 1000000);
  const batchesRemaining = 500 - batchesComplete;
  console.log(
    `📊 Progress: ${batchesComplete}/500 batches (${batchesRemaining} remaining)`
  );

  // STEP 1: Complete WNOR wrapping
  if (batchesRemaining > 0) {
    console.log("\n🔄 Step 1: Completing WNOR wrapping...");
    const batchSize = ethers.parseEther("1000000"); // 1M NOR per batch

    for (let i = 0; i < batchesRemaining; i++) {
      const batchNum = batchesComplete + i + 1;
      process.stdout.write(
        `  Batch ${batchNum}/500: Wrapping 1,000,000 NOR... `
      );

      const tx = await wxhtContract.deposit({
        value: batchSize,
        gasLimit: 100000,
      });
      await tx.wait();
      console.log("✅");
    }
    console.log("\n✅ Wrapping complete! 500M WNOR ready");
  } else {
    console.log("\n✅ Wrapping already complete (500M WNOR)");
  }

  // STEP 2: Deploy DEX Factory
  console.log("\n🏭 Step 2: Deploying Nor DEX Factory...");
  const Factory = await ethers.getContractFactory("NorDEXFactory", deployer);
  const factory = await Factory.deploy(deployer.address, deployer.address); // feeToSetter, revenueContract
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory deployed:", factoryAddress);

  // STEP 3: Deploy DEX Router
  console.log("\n🔀 Step 3: Deploying Nor DEX Router...");
  const Router = await ethers.getContractFactory("NorDEXRouter", deployer);
  const router = await Router.deploy(factoryAddress, WNOR_ADDRESS); // factory, WNOR
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ Router deployed:", routerAddress);

  // STEP 4: Deploy test tokens
  console.log("\n🪙 Step 4: Deploying test tokens...");

  const ERC20 = await ethers.getContractFactory("TestERC20", deployer);

  console.log("  Deploying USDT...");
  const usdt = await ERC20.deploy("Tether USD", "USDT", 18);
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("  ✅ USDT:", usdtAddress);

  console.log("  Deploying BNB...");
  const bnb = await ERC20.deploy("Binance Coin", "BNB", 18);
  await bnb.waitForDeployment();
  const bnbAddress = await bnb.getAddress();
  console.log("  ✅ BNB:", bnbAddress);

  console.log("  Deploying ETH...");
  const eth = await ERC20.deploy("Ethereum", "ETH", 18);
  await eth.waitForDeployment();
  const ethAddress = await eth.getAddress();
  console.log("  ✅ ETH:", ethAddress);

  // STEP 5: Mint test tokens
  console.log("\n💰 Step 5: Minting test tokens...");
  const mintAmount = ethers.parseEther("1000000"); // 1M tokens each

  await (await usdt.mint(deployer.address, mintAmount)).wait();
  console.log("  ✅ Minted 1,000,000 USDT");

  await (await bnb.mint(deployer.address, mintAmount)).wait();
  console.log("  ✅ Minted 1,000,000 BNB");

  await (await eth.mint(deployer.address, mintAmount)).wait();
  console.log("  ✅ Minted 1,000,000 ETH");

  // STEP 6: Add liquidity pools
  console.log("\n💧 Step 6: Adding liquidity pools...");

  // NOR/USDT pair
  console.log("\n  Creating NOR/USDT pair...");
  const xhtForUsdt = ethers.parseEther("500000000"); // 500M NOR
  const usdtAmount = ethers.parseEther("1200"); // $1,200 worth

  await (await wxhtContract.approve(routerAddress, xhtForUsdt)).wait();
  await (await usdt.approve(routerAddress, usdtAmount)).wait();

  const deadline = Math.floor(Date.now() / 1000) + 3600;
  await (
    await router.addLiquidity(
      WNOR_ADDRESS,
      usdtAddress,
      xhtForUsdt,
      usdtAmount,
      0,
      0,
      deployer.address,
      deadline,
      { gasLimit: 5000000 }
    )
  ).wait();
  console.log("  ✅ NOR/USDT liquidity added");

  // NOR/BNB pair
  console.log("\n  Creating NOR/BNB pair...");
  const xhtForBnb = ethers.parseEther("50000000"); // 50M NOR
  const bnbAmount = ethers.parseEther("100"); // 100 BNB

  await (await bnb.approve(routerAddress, bnbAmount)).wait();

  // First wrap 50M NOR
  console.log("  Wrapping 50M NOR for BNB pair...");
  await (await wxhtContract.deposit({ value: xhtForBnb })).wait();
  await (await wxhtContract.approve(routerAddress, xhtForBnb)).wait();

  await (
    await router.addLiquidity(
      WNOR_ADDRESS,
      bnbAddress,
      xhtForBnb,
      bnbAmount,
      0,
      0,
      deployer.address,
      deadline,
      { gasLimit: 5000000 }
    )
  ).wait();
  console.log("  ✅ NOR/BNB liquidity added");

  // NOR/ETH pair
  console.log("\n  Creating NOR/ETH pair...");
  const xhtForEth = ethers.parseEther("50000000"); // 50M NOR
  const ethAmount = ethers.parseEther("2"); // 2 ETH

  await (await eth.approve(routerAddress, ethAmount)).wait();

  // First wrap 50M NOR
  console.log("  Wrapping 50M NOR for ETH pair...");
  await (await wxhtContract.deposit({ value: xhtForEth })).wait();
  await (await wxhtContract.approve(routerAddress, xhtForEth)).wait();

  await (
    await router.addLiquidity(
      WNOR_ADDRESS,
      ethAddress,
      xhtForEth,
      ethAmount,
      0,
      0,
      deployer.address,
      deadline,
      { gasLimit: 5000000 }
    )
  ).wait();
  console.log("  ✅ NOR/ETH liquidity added");

  // Save deployment info
  console.log("\n📝 Deployment Summary:");
  console.log("=".repeat(70));
  console.log("WNOR:", WNOR_ADDRESS);
  console.log("Factory:", factoryAddress);
  console.log("Router:", routerAddress);
  console.log("USDT:", usdtAddress);
  console.log("BNB:", bnbAddress);
  console.log("ETH:", ethAddress);
  console.log("\n✅ DEPLOYMENT COMPLETE!");
  console.log("\n🌐 RPC Endpoint: https://rpc.xaheen.org");
  console.log("⛓️  Chain ID: 65001");
  console.log("🔗 Add to MetaMask and start trading!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
