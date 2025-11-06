import hre from "hardhat";

async function main() {
  console.log("\n🔍 VERIFYING NOR_BSC ON BSCSCAN (SIMPLE METHOD)");
  console.log("=".repeat(70));

  const contractAddress = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";

  console.log("\n📍 Contract:", contractAddress);
  console.log("📝 Contract Name: NOR_BSC");
  console.log("🌐 Network: BSC Mainnet");

  try {
    console.log("\n⏳ Verifying contract...");
    console.log("   (This may take 30-60 seconds)");

    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
      contract: "contracts/tokens/NOR_BSC.sol:NOR_BSC" // Explicitly specify contract path
    });

    console.log("\n✅ VERIFICATION SUCCESSFUL!");
    console.log("\n🔗 View on BSCScan:");
    console.log(`   https://bscscan.com/address/${contractAddress}#code`);

  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract is already verified!");
      console.log(`\n🔗 https://bscscan.com/address/${contractAddress}#code`);
    } else if (error.message.includes("BSCSCAN_API_KEY")) {
      console.log("\n⚠️  BSCScan API Key not found!");
      console.log("\n📝 TO GET YOUR API KEY:");
      console.log("   1. Go to: https://bscscan.com/myapikey");
      console.log("   2. Sign up/Login");
      console.log("   3. Create API key (free)");
      console.log("   4. Add to .env:");
      console.log("      BSCSCAN_API_KEY=YOUR_KEY_HERE");
      process.exit(1);
    } else {
      console.error("\n❌ Verification failed:", error.message);

      console.log("\n📋 TRY STANDARD JSON INPUT METHOD:");
      console.log("   Go to: https://bscscan.com/verifyContract");
      console.log("   Select: 'Solidity (Standard Json Input)'");
      console.log("   We'll generate the JSON file for you...");

      throw error;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
