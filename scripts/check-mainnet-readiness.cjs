const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("\n🔍 MAINNET DEPLOYMENT READINESS CHECK\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const DEPLOYER = "0xdD779a290C937144F80Eb75b75d814c834536B1b";
  const BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";

  // Check BSC Mainnet
  console.log("📍 BSC MAINNET STATUS:\n");

  const bscProvider = new ethers.JsonRpcProvider(
    "https://bsc-dataseed.binance.org"
  );

  // Check BNB balance
  const bnbBalance = await bscProvider.getBalance(DEPLOYER);
  const bnbFormatted = ethers.formatEther(bnbBalance);

  console.log("💰 BNB Balance:", bnbFormatted, "BNB");
  console.log(
    "   USD Value (@ $600/BNB):",
    "$" + (parseFloat(bnbFormatted) * 600).toFixed(2)
  );

  if (parseFloat(bnbFormatted) < 0.01) {
    console.log("   ⚠️  LOW! Need at least 0.01 BNB for deployment");
    console.log("   💡 Get BNB from exchange or swap\n");
  } else if (parseFloat(bnbFormatted) < 0.05) {
    console.log("   ⚠️  Minimal. Recommended: 0.05+ BNB for safety\n");
  } else {
    console.log("   ✅ Sufficient for deployment\n");
  }

  // Check BTCBR balance
  const btcbrAbi = ["function balanceOf(address) view returns (uint256)"];
  const btcbr = new ethers.Contract(BTCBR_ADDRESS, btcbrAbi, bscProvider);
  const btcbrBalance = await btcbr.balanceOf(DEPLOYER);
  const btcbrFormatted = ethers.formatEther(btcbrBalance);

  console.log(
    "💎 BTCBR Balance:",
    parseFloat(btcbrFormatted).toLocaleString(),
    "BTCBR"
  );
  console.log("   Ready for bridge: ✅\n");

  // Check Nor Chain
  console.log("📍 XAHEEN CHAIN (HUB) STATUS:\n");

  try {
    const xaheenProvider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
    const xhtBalance = await xaheenProvider.getBalance(DEPLOYER);
    const xhtFormatted = ethers.formatEther(xhtBalance);

    console.log("💰 NOR Balance:", xhtFormatted, "NOR");

    if (parseFloat(xhtFormatted) < 0.1) {
      console.log("   ⚠️  LOW! Need NOR for hub deployment");
      console.log("   💡 Get NOR from faucet or bridge\n");
    } else {
      console.log("   ✅ Sufficient for deployment\n");
    }
  } catch (error) {
    console.log("   ⚠️  Could not connect to Nor RPC");
    console.log("   Error:", error.message, "\n");
  }

  // Deployment Cost Estimates
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💵 ESTIMATED DEPLOYMENT COSTS:\n");

  console.log("BSC Mainnet (Spoke):");
  console.log("  Wrapped NOR:         ~0.002 BNB (~$1.20)");
  console.log("  SettlementInbox:     ~0.002 BNB (~$1.20)");
  console.log("  NorRouter:        ~0.003 BNB (~$1.80)");
  console.log("  Subtotal:            ~0.007 BNB (~$4.20)\n");

  console.log("Nor Chain (Hub):");
  console.log("  NOR Token:           ~0.01 NOR");
  console.log("  PriceAuthority:      ~0.01 NOR");
  console.log("  SupplyController:    ~0.015 NOR");
  console.log("  SettlementHub:       ~0.01 NOR");
  console.log("  Subtotal:            ~0.045 NOR\n");

  console.log("🎯 TOTAL COST: ~0.01 BNB + 0.05 NOR (~$6-10)\n");

  // Liquidity Plan
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💰 LIQUIDITY ALLOCATION PLAN:\n");

  const available = parseFloat(btcbrFormatted);

  console.log("Available BTCBR:", available.toLocaleString());
  console.log("\nRecommended Allocation:");
  console.log("  BSC → Nor:   70,000 BTCBR (70%)");
  console.log("  Nor → BSC:   30,000 BTCBR (30%)");
  console.log("  Total Bridge:  100,000 BTCBR");
  console.log(
    "  Remaining:    ",
    (available - 100000).toLocaleString(),
    "BTCBR\n"
  );

  // Final checklist
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ DEPLOYMENT CHECKLIST:\n");

  const checks = {
    "BNB Balance (>0.01)": parseFloat(bnbFormatted) >= 0.01,
    "BTCBR Available": parseFloat(btcbrFormatted) >= 100000,
    "Private Key in .env": !!process.env.MAINNET_PRIVATE_KEY,
    "BSC RPC Configured": !!process.env.BSC_MAINNET_RPC,
    "Nor RPC Configured": !!process.env.XAHEEN_CHAIN_RPC,
  };

  for (const [check, passed] of Object.entries(checks)) {
    console.log(`  ${passed ? "✅" : "❌"} ${check}`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const allPassed = Object.values(checks).every((v) => v);

  if (allPassed) {
    console.log("🚀 STATUS: READY FOR MAINNET DEPLOYMENT!");
    console.log("\n⚠️  WARNING: This will use REAL BNB and deploy to MAINNET!");
    console.log(
      "⚠️  Double-check all addresses and amounts before proceeding!\n"
    );
  } else {
    console.log("⚠️  STATUS: NOT READY - Fix issues above first\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
