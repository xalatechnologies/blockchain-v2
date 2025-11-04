import pkg from "hardhat";
const { ethers } = pkg;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";

dotenvConfig();

const WNOR_ABI = [
  "function deposit() public payable",
  "function withdraw(uint wad) public",
  "function totalSupply() public view returns (uint)",
  "function approve(address guy, uint wad) public returns (bool)",
  "function transfer(address dst, uint wad) public returns (bool)",
  "function transferFrom(address src, address dst, uint wad) public returns (bool)",
  "function balanceOf(address) public view returns (uint)",
];

async function main() {
  console.log("\n🚀 COMPLETE XAHEEN CHAIN DEPLOYMENT");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`\n📍 Deployer: ${deployer.address}`);
  console.log(`💰 NOR Balance: ${ethers.formatEther(balance)} NOR\n`);

  const deploymentLog = {
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    chainId: 65001,
    contracts: {},
  };

  // STEP 1: Deploy WNOR
  console.log("📝 STEP 1/6: Deploying WNOR (Wrapped NOR)...");
  const WNOR = await ethers.getContractFactory("WNOR");
  const wxht = await WNOR.deploy();
  await wxht.waitForDeployment();
  const wxhtAddress = await wxht.getAddress();
  console.log(`✅ WNOR deployed: ${wxhtAddress}\n`);
  deploymentLog.contracts.WNOR = wxhtAddress;

  // STEP 2: Deploy Factory
  console.log("📝 STEP 2/6: Deploying NorDEXFactory...");
  const Factory = await ethers.getContractFactory("NorDEXFactory");
  // Constructor parameters: feeToSetter, revenueContract (using deployer for both initially)
  const factory = await Factory.deploy(deployer.address, deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`✅ NorDEXFactory deployed: ${factoryAddress}\n`);
  deploymentLog.contracts.Factory = factoryAddress;

  // STEP 3: Deploy Router
  console.log("📝 STEP 3/6: Deploying NorDEXRouter...");
  const Router = await ethers.getContractFactory("NorDEXRouter");
  const router = await Router.deploy(factoryAddress, wxhtAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log(`✅ NorDEXRouter deployed: ${routerAddress}\n`);
  deploymentLog.contracts.Router = routerAddress;

  // STEP 4: Deploy Test Tokens
  console.log("📝 STEP 4/6: Deploying Test Tokens...");

  const TestToken = await ethers.getContractFactory("SimpleERC20");

  const usdt = await TestToken.deploy(
    "Test USDT",
    "USDT",
    ethers.parseEther("1000000")
  );
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log(`✅ TestUSDT deployed: ${usdtAddress}`);

  const bnb = await TestToken.deploy(
    "Test BNB",
    "BNB",
    ethers.parseEther("100000")
  );
  await bnb.waitForDeployment();
  const bnbAddress = await bnb.getAddress();
  console.log(`✅ TestBNB deployed: ${bnbAddress}`);

  const eth = await TestToken.deploy(
    "Test ETH",
    "ETH",
    ethers.parseEther("100000")
  );
  await eth.waitForDeployment();
  const ethAddress = await eth.getAddress();
  console.log(`✅ TestETH deployed: ${ethAddress}\n`);

  deploymentLog.contracts.TestUSDT = usdtAddress;
  deploymentLog.contracts.TestBNB = bnbAddress;
  deploymentLog.contracts.TestETH = ethAddress;

  // STEP 5: Add Initial Liquidity (NOR/USDT)
  console.log("📝 STEP 5/6: Adding Initial Liquidity (NOR/USDT)...");
  console.log("Target: $10,000 USDT + 4.17B NOR @ $0.0000024/NOR");

  const liquidityNOR = ethers.parseEther("4170000000"); // 4.17B NOR
  const liquidityUSDT = ethers.parseEther("10000"); // 10,000 USDT

  // Approve tokens
  console.log("Approving USDT...");
  await usdt.approve(routerAddress, liquidityUSDT);

  // Wrap NOR to WNOR
  console.log("Wrapping NOR to WNOR...");
  const wxhtContract = new ethers.Contract(wxhtAddress, WNOR_ABI, deployer);
  await wxhtContract.deposit({ value: liquidityNOR });

  // Approve WNOR
  console.log("Approving WNOR...");
  await wxhtContract.approve(routerAddress, liquidityNOR);

  // Add liquidity
  console.log("Adding liquidity to NOR/USDT pair...");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  const addLiquidityTx = await router.addLiquidity(
    wxhtAddress,
    usdtAddress,
    liquidityNOR,
    liquidityUSDT,
    0, // Min amounts (accept any)
    0,
    deployer.address,
    deadline
  );
  await addLiquidityTx.wait();

  const pairAddress = await factory.getPair(wxhtAddress, usdtAddress);
  console.log(`✅ NOR/USDT Pair created: ${pairAddress}`);
  console.log(`✅ Liquidity added: 4.17B NOR + 10,000 USDT\n`);

  deploymentLog.contracts.NOR_USDT_Pair = pairAddress;
  deploymentLog.liquidity = {
    xht: "4170000000",
    usdt: "10000",
    price: "$0.0000024",
  };

  // STEP 6: Deploy Tokenomics
  console.log("📝 STEP 6/6: Deploying Tokenomics Contracts...");

  // Staking
  const Staking = await ethers.getContractFactory("NORStaking");
  const staking = await Staking.deploy(wxhtAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log(`✅ NORStaking deployed: ${stakingAddress}`);

  // Buyback
  const Buyback = await ethers.getContractFactory("NORBuyback");
  const buyback = await Buyback.deploy(
    routerAddress,
    wxhtAddress,
    usdtAddress,
    deployer.address,
    deployer.address
  );
  await buyback.waitForDeployment();
  const buybackAddress = await buyback.getAddress();
  console.log(`✅ NORBuyback deployed: ${buybackAddress}`);

  // Burn
  const Burn = await ethers.getContractFactory("NORBurn");
  const burn = await Burn.deploy(wxhtAddress);
  await burn.waitForDeployment();
  const burnAddress = await burn.getAddress();
  console.log(`✅ NORBurn deployed: ${burnAddress}\n`);

  deploymentLog.contracts.NORStaking = stakingAddress;
  deploymentLog.contracts.NORBuyback = buybackAddress;
  deploymentLog.contracts.NORBurn = burnAddress;

  // Save deployment log
  const logPath = `docs/deployment-logs/complete-deployment-${Date.now()}.json`;
  fs.writeFileSync(logPath, JSON.stringify(deploymentLog, null, 2));

  console.log("=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n📋 CONTRACT ADDRESSES:\n");
  console.log("DEX CONTRACTS:");
  console.log(`  WNOR:           ${wxhtAddress}`);
  console.log(`  Factory:        ${factoryAddress}`);
  console.log(`  Router:         ${routerAddress}`);
  console.log(`\nTEST TOKENS:`);
  console.log(`  USDT:           ${usdtAddress}`);
  console.log(`  BNB:            ${bnbAddress}`);
  console.log(`  ETH:            ${ethAddress}`);
  console.log(`\nLIQUIDITY PAIRS:`);
  console.log(`  NOR/USDT:       ${pairAddress}`);
  console.log(`\nTOKENOMICS:`);
  console.log(`  Staking:        ${stakingAddress}`);
  console.log(`  Buyback:        ${buybackAddress}`);
  console.log(`  Burn:           ${burnAddress}`);
  console.log(
    `\n📊 Initial Liquidity: 4.17B NOR + $10,000 USDT @ $0.0000024/NOR`
  );
  console.log(`\n💾 Deployment log saved: ${logPath}`);
  console.log(`\n✅ READY FOR TRADING!\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
