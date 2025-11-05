import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("\n🪙 DEPLOYING NOR TOKEN TO BSC MAINNET");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deployer:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "BNB");

  if (balance < ethers.parseEther("0.01")) {
    console.log("\n⚠️  WARNING: Low BNB balance!");
    console.log("  Recommended: 0.01 BNB minimum");
    console.log("\n  Continuing with deployment anyway...");
  }

  console.log("\n" + "=".repeat(70));
  console.log("DEPLOYING NOR TOKEN");
  console.log("=".repeat(70));

  // Deploy NOR token
  console.log("\n[1/3] Deploying NOR_BSC token contract...");
  const NOR = await ethers.getContractFactory("NOR_BSC");
  const nor = await NOR.deploy();
  await nor.waitForDeployment();
  const norAddress = await nor.getAddress();
  console.log("  ✅ NOR Token deployed at:", norAddress);

  // Get token info
  console.log("\n[2/3] Verifying token information...");
  const name = await nor.name();
  const symbol = await nor.symbol();
  const decimals = await nor.decimals();
  const totalSupply = await nor.totalSupply();
  
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Decimals:", decimals);
  console.log("  Total Supply:", ethers.formatEther(totalSupply), "NOR");

  // Add bridge as minter
  console.log("\n[3/3] Configuring bridge as minter...");
  const bridgeAddress = "0xeEBA26529453B39876dAf0bE73216B71cdc07c3E"; // NOR Bridge on BSC
  console.log("  Bridge address:", bridgeAddress);
  
  const tx = await nor.addMinter(bridgeAddress);
  await tx.wait();
  console.log("  ✅ Bridge added as minter");

  // Verify minter
  const isMinter = await nor.minters(bridgeAddress);
  console.log("  Verification:", isMinter ? "✅ Bridge is minter" : "❌ Failed");

  console.log("\n" + "=".repeat(70));
  console.log("🎉 NOR TOKEN DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));

  console.log("\n📝 SAVE THESE DETAILS:");
  console.log("\n  NOR Token Address:", norAddress);
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Decimals:", decimals);
  console.log("  Bridge (Minter):", bridgeAddress);

  console.log("\n📋 NEXT STEPS:");
  console.log("  1. Verify contract on BSCScan:");
  console.log(`     npx hardhat verify --network bsc ${norAddress}`);
  console.log("\n  2. Update bridge contract to use new NOR address");
  console.log("\n  3. Add liquidity to PancakeSwap (optional):");
  console.log("     - NOR/USDT: $50k");
  console.log("\n  4. Submit to CoinGecko/CoinMarketCap");

  console.log("\n🔗 BSCScan:");
  console.log(`  https://bscscan.com/token/${norAddress}`);

  // Final balance
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  console.log("\n💰 Final Balance:", ethers.formatEther(finalBalance), "BNB");
  console.log("  Gas used:", ethers.formatEther(balance - finalBalance), "BNB");

  console.log("\n✅ DEPLOYMENT SUCCESSFUL!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
