import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
  console.log("🔍 Finding CREATE2 Salt for Exact BTCBR Address\n");
  console.log("=".repeat(70));

  const TARGET_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
  console.log("🎯 Target Address:", TARGET_ADDRESS);

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);

  // Get factory address (we need to deploy it first or use existing)
  // For now, let's compute what factory address would be at nonce 0
  const factoryNonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("Current nonce:", factoryNonce);

  // Compute factory address (assuming we deploy it next)
  const factoryAddress = ethers.getCreateAddress({
    from: deployer.address,
    nonce: factoryNonce
  });
  console.log("🏭 Predicted Factory Address:", factoryAddress);

  // Get BTCBR bytecode
  const BTCBRFactory = await ethers.getContractFactory("MintableBTCBR");
  const btcbrBytecode = BTCBRFactory.bytecode;
  const initCodeHash = ethers.keccak256(btcbrBytecode);
  console.log("📝 BTCBR InitCode Hash:", initCodeHash);

  console.log("\n" + "=".repeat(70));
  console.log("🔨 BRUTE-FORCING SALT (this may take a while...)");
  console.log("=".repeat(70));

  let attempts = 0;
  const startTime = Date.now();
  let found = false;

  console.log("\nSearching for salt...");
  console.log("(Checking 100,000 salts at a time, progress every 10 seconds)\n");

  // Try sequential salts
  for (let i = 0; i < 10000000; i++) {
    // Generate salt from number
    const salt = ethers.zeroPadValue(ethers.toBeHex(i), 32);

    // Compute CREATE2 address
    const hash = ethers.keccak256(
      ethers.concat([
        "0xff",
        factoryAddress,
        salt,
        initCodeHash
      ])
    );

    const computedAddress = "0x" + hash.slice(-40);
    attempts++;

    // Check if match (case-insensitive)
    if (computedAddress.toLowerCase() === TARGET_ADDRESS.toLowerCase()) {
      console.log("\n🎉 FOUND IT!");
      console.log("Salt:", salt);
      console.log("Salt (number):", i);
      console.log("Computed Address:", computedAddress);
      console.log("Attempts:", attempts.toLocaleString());
      console.log("Time:", ((Date.now() - startTime) / 1000).toFixed(2), "seconds");
      found = true;
      break;
    }

    // Progress update every 100k attempts
    if (attempts % 100000 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = attempts / elapsed;
      console.log(`Progress: ${(attempts / 1000).toFixed(0)}k attempts | ${rate.toFixed(0)} attempts/sec | ${elapsed.toFixed(0)}s elapsed`);
    }
  }

  if (!found) {
    console.log("\n⚠️  Salt not found in first 10 million attempts");
    console.log("📊 Statistics:");
    console.log("  Total attempts:", attempts.toLocaleString());
    console.log("  Time:", ((Date.now() - startTime) / 1000).toFixed(2), "seconds");
    console.log("\n💡 Recommendations:");
    console.log("  1. The address may have been generated with a different factory");
    console.log("  2. It may have been deployed normally (not CREATE2)");
    console.log("  3. Finding it could take billions of attempts");
    console.log("  4. Better to use a new CREATE2 address or deploy normally");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Search failed:");
    console.error(error);
    process.exit(1);
  });
