const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
  const YOUR_WALLET = "0xdD779a290C937144F80Eb75b75d814c834536B1b";

  console.log("\n🔍 Checking BTCBR Balance on BSC Mainnet...\n");

  // ERC20 ABI
  const abi = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function owner() view returns (address)",
  ];

  const provider = new ethers.JsonRpcProvider(
    "https://bsc-dataseed.binance.org"
  );
  const btcbr = new ethers.Contract(BTCBR_ADDRESS, abi, provider);

  try {
    // Get token info
    const name = await btcbr.name();
    const symbol = await btcbr.symbol();
    const decimals = await btcbr.decimals();
    const totalSupply = await btcbr.totalSupply();

    console.log("📊 Token Information:");
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Decimals:", decimals);
    console.log("   Total Supply:", ethers.formatUnits(totalSupply, decimals));
    console.log("");

    // Try to get owner
    try {
      const owner = await btcbr.owner();
      console.log("👤 Contract Owner:", owner);
      console.log(
        "   You are owner:",
        owner.toLowerCase() === YOUR_WALLET.toLowerCase() ? "✅ YES" : "❌ NO"
      );
      console.log("");
    } catch (e) {
      console.log(
        "⚠️  No owner() function (may use different access control)\n"
      );
    }

    // Get your balance
    const balance = await btcbr.balanceOf(YOUR_WALLET);
    const balanceFormatted = ethers.formatUnits(balance, decimals);

    console.log("💰 Your BTCBR Balance:");
    console.log("   Address:", YOUR_WALLET);
    console.log("   Balance:", balanceFormatted, "BTCBR");
    console.log("   Raw:", balance.toString());
    console.log("");

    // Calculate liquidity scenarios
    const balanceNum = parseFloat(balanceFormatted);

    console.log("📈 Bridge Liquidity Scenarios:\n");

    if (balanceNum >= 40000) {
      console.log("✅ CONSERVATIVE (40,000 BTCBR):");
      console.log("   BSC Side: 30,000 BTCBR");
      console.log("   Nor Side: 10,000 BTCBR");
      console.log(
        "   Remaining: " + (balanceNum - 40000).toLocaleString() + " BTCBR"
      );
      console.log("");
    }

    if (balanceNum >= 60000) {
      console.log("✅ RECOMMENDED (60,000 BTCBR):");
      console.log("   BSC Side: 45,000 BTCBR");
      console.log("   Nor Side: 15,000 BTCBR");
      console.log(
        "   Remaining: " + (balanceNum - 60000).toLocaleString() + " BTCBR"
      );
      console.log("");
    }

    if (balanceNum >= 80000) {
      console.log("✅ AGGRESSIVE (80,000 BTCBR):");
      console.log("   BSC Side: 60,000 BTCBR");
      console.log("   Nor Side: 20,000 BTCBR");
      console.log(
        "   Remaining: " + (balanceNum - 80000).toLocaleString() + " BTCBR"
      );
      console.log("");
    }

    if (balanceNum < 40000) {
      console.log("⚠️  INSUFFICIENT for recommended liquidity");
      console.log("   You have: " + balanceNum.toLocaleString() + " BTCBR");
      console.log("   Need: 40,000 BTCBR minimum");
      console.log(
        "   Shortfall: " + (40000 - balanceNum).toLocaleString() + " BTCBR"
      );
      console.log("");

      console.log("💡 Options:");
      console.log(
        "   1. Use all " +
          balanceNum.toLocaleString() +
          " BTCBR for smaller bridge"
      );
      console.log("   2. Acquire more BTCBR");
      console.log("   3. Start with NOR DEX (doesn't need BTCBR)");
      console.log("");
    }

    // Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 SUMMARY:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Your BTCBR: " + balanceNum.toLocaleString() + " tokens");

    if (balanceNum >= 60000) {
      console.log("✅ Status: READY for recommended bridge launch!");
      console.log("💰 Cost: $0 (using your existing BTCBR)");
      console.log("🚀 Can launch BOTH NOR DEX + BTCBR Bridge");
    } else if (balanceNum >= 40000) {
      console.log("✅ Status: READY for conservative bridge launch");
      console.log("💰 Cost: $0 (using your existing BTCBR)");
      console.log("🚀 Can launch BOTH NOR DEX + BTCBR Bridge");
    } else {
      console.log("⚠️  Status: Insufficient for standard bridge");
      console.log("💡 Recommendation: Start with NOR DEX first");
      console.log("🚀 Then add BTCBR bridge when you have more");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ Error fetching balance:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
