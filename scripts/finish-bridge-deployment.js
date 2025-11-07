import hre from "hardhat";
const { ethers } = hre;

// Fix SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const WUSDT = "0x7Ad030f7549F02B7258F1c54E6B909b1d5F49d82";
const WBNB = "0x1a49C061d9131c90e9141D8D9754Bf4c8Bd2c82A";
const WETH = "0xEd511294b4Fa418458B2abD577F26104cdB3D4af";
const USDT_BRIDGE = "0xb9B2139a1682c07411E2e13333132C68671664Ff";
const BNB_BRIDGE = "0x70252c548B5D7220e9cdc867b188594208FD0bE7";

async function main() {
  console.log("\n🌉 FINISHING BRIDGE DEPLOYMENT");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 From:", deployer.address);

  // Deploy ETH Bridge
  console.log("\n🌉 Deploying ETH Bridge...");
  const ETHBridge = await ethers.getContractFactory("ETHBridgeNor");
  const ethBridge = await ETHBridge.deploy(WETH, 2);
  await ethBridge.waitForDeployment();
  const ethBridgeAddress = await ethBridge.getAddress();
  console.log("✅ ETH Bridge:", ethBridgeAddress);

  // Grant Minter Roles
  console.log("\n🔐 Granting minter roles...");
  const wusdt = await ethers.getContractAt("WrappedUSDT", WUSDT);
  const wbnb = await ethers.getContractAt("WrappedBNB", WBNB);
  const weth = await ethers.getContractAt("WrappedETH", WETH);

  await wusdt.grantMinterRole(USDT_BRIDGE);
  console.log("✅ WUSDT minter role granted");

  await wbnb.grantMinterRole(BNB_BRIDGE);
  console.log("✅ WBNB minter role granted");

  await weth.grantMinterRole(ethBridgeAddress);
  console.log("✅ WETH minter role granted");

  // Add Validators
  console.log("\n👥 Adding validators...");
  const validators = [
    "0x2844Ae34e062BAA32c46702EaAEe70E3B3E4Ae50",
    "0x109E44D07f2dA6eDbB989fc735d790F3D5668f33",
    "0x89DCadbA1C8128b653C63EA3519Cc158ADc67b4f"
  ];

  const usdtBridge = await ethers.getContractAt("USDTBridgeNor", USDT_BRIDGE);
  const bnbBridge = await ethers.getContractAt("BNBBridgeNor", BNB_BRIDGE);

  for (const validator of validators) {
    await usdtBridge.addValidator(validator);
    await bnbBridge.addValidator(validator);
    await ethBridge.addValidator(validator);
    console.log(`✅ Added validator: ${validator}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ BRIDGE SYSTEM COMPLETE!");
  console.log("=".repeat(70));

  console.log("\n📋 ALL CONTRACTS:\n");
  console.log("Wrapped Tokens:");
  console.log(`   WUSDT:  ${WUSDT}`);
  console.log(`   WBNB:   ${WBNB}`);
  console.log(`   WETH:   ${WETH}`);
  console.log("\nBridges:");
  console.log(`   USDT Bridge: ${USDT_BRIDGE}`);
  console.log(`   BNB Bridge:  ${BNB_BRIDGE}`);
  console.log(`   ETH Bridge:  ${ethBridgeAddress}`);

  console.log("\n💡 NEXT: Create DEX pairs with these wrapped tokens!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
