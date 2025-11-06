import hre from "hardhat";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

async function main() {
  console.log("\n🔍 VERIFYING NOR_BSC TOKEN ON BSCSCAN");
  console.log("=".repeat(70));

  // Contract address
  const norAddress = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";

  console.log("\n📍 Contract Address:", norAddress);
  console.log("🌐 Network: BSC Mainnet");

  // Check if API key exists
  if (!process.env.BSCSCAN_API_KEY) {
    console.log("\n⚠️  BSCScan API Key not found in .env file!");
    console.log("\n📝 TO GET YOUR API KEY:");
    console.log("  1. Go to: https://bscscan.com/myapikey");
    console.log("  2. Sign up/Login to BSCScan");
    console.log("  3. Create a new API key (free)");
    console.log("  4. Add to your .env file:");
    console.log("     BSCSCAN_API_KEY=YOUR_API_KEY_HERE");
    console.log("\n  Then run this script again.");

    console.log("\n📋 ALTERNATIVE: MANUAL VERIFICATION");
    console.log("  1. Go to: https://bscscan.com/verifyContract");
    console.log("  2. Enter contract address:", norAddress);
    console.log("  3. Select:");
    console.log("     - Compiler: v0.8.20");
    console.log("     - Optimization: Yes, 200 runs");
    console.log("     - EVM Version: default");
    console.log("  4. Upload flattened source (see below)");

    console.log("\n🔨 TO FLATTEN CONTRACT:");
    console.log("  npx hardhat flatten contracts/tokens/NOR_BSC.sol > NOR_BSC_flattened.sol");
    console.log("\n  Then upload NOR_BSC_flattened.sol to BSCScan");

    process.exit(1);
  }

  // Verify with Hardhat
  console.log("\n[1/2] Verifying contract on BSCScan...");
  console.log("  This may take 30-60 seconds...");

  try {
    await hre.run("verify:verify", {
      address: norAddress,
      constructorArguments: [], // No constructor arguments
      network: "bsc"
    });

    console.log("\n✅ CONTRACT VERIFIED SUCCESSFULLY!");
    console.log("\n🔗 View on BSCScan:");
    console.log(`  https://bscscan.com/address/${norAddress}#code`);

    console.log("\n📝 CONTRACT INFO:");
    console.log("  Name: Nor");
    console.log("  Symbol: NOR");
    console.log("  Decimals: 18");
    console.log("  Type: ERC20, Burnable, Ownable");
    console.log("  Features: Mintable by bridge");

  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract is already verified on BSCScan!");
      console.log("\n🔗 View contract:");
      console.log(`  https://bscscan.com/address/${norAddress}#code`);
    } else {
      console.error("\n❌ Verification failed:", error.message);

      console.log("\n📋 TRY MANUAL VERIFICATION:");
      console.log("  1. Flatten contract:");
      console.log("     npx hardhat flatten contracts/tokens/NOR_BSC.sol > NOR_BSC_flattened.sol");
      console.log("\n  2. Go to: https://bscscan.com/verifyContract");
      console.log("     - Address:", norAddress);
      console.log("     - Compiler: v0.8.20");
      console.log("     - Optimization: Yes, 200 runs");
      console.log("     - Paste flattened source code");

      throw error;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("🎉 VERIFICATION COMPLETE!");
  console.log("=".repeat(70));

  console.log("\n✅ WHAT THIS MEANS:");
  console.log("  - Contract source code is publicly visible");
  console.log("  - Users can read the contract logic");
  console.log("  - Green checkmark on BSCScan");
  console.log("  - Increased trust and transparency");
  console.log("  - Better integration with wallets/explorers");

  console.log("\n📋 NEXT STEPS:");
  console.log("  1. Upload logo to BSCScan (Update Token Info button)");
  console.log("  2. Submit to Trust Wallet (GitHub PR)");
  console.log("  3. Submit to CoinGecko");
  console.log("  4. Submit to CoinMarketCap");

  console.log("\n✅ VERIFICATION DONE!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  });
