/**
 * @title Redeploy Dirhamat with Correct Symbol
 * @notice Deploys Dirhamat with "DIRHAMAT" symbol (was "DIRHAM")
 * @dev Run with: npx hardhat run scripts/redeploy-dirhamat.js --network btcbr
 */

import hre from "hardhat";

const { ethers } = hre;

// Oracle addresses from previous deployment
const GOLD_ORACLE = "0xe97D574A2e1B62f4d32C5cfeaFa8e6B99Da020fa";
const AED_USD_ORACLE = "0x4A82C98A950125F17943F56273efae39dDe81763";

async function main() {
  console.log("\n🔄 Redeploying Dirhamat with correct symbol...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployer:", deployer.address);

  const Dirhamat = await ethers.getContractFactory("Dirhamat");
  const dirhamat = await Dirhamat.deploy(
    GOLD_ORACLE,
    AED_USD_ORACLE,
    ethers.ZeroAddress // Compliance core can be set later
  );

  await dirhamat.waitForDeployment();
  const dirhamatAddress = await dirhamat.getAddress();

  console.log("✅ Dirhamat deployed to:", dirhamatAddress);
  console.log("   Name:", await dirhamat.name());
  console.log("   Symbol:", await dirhamat.symbol());
  console.log("   Decimals:", await dirhamat.decimals());

  console.log("\n✅ Dirhamat redeployed successfully with symbol: DIRHAMAT\n");
  console.log("📝 New address:", dirhamatAddress);
  console.log("🗑️  Old address (ignore): 0x0f8498072DB1611497e2068f9896aeFfcf173583\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
