import hre from "hardhat";
const { ethers } = hre;

// Fix SSL certificate issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  console.log("\n💰 CHECKING NORCHAIN BALANCES");
  console.log("=".repeat(70));

  // Connect to NorChain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n📍 Account:", wallet.address);

  // Contract addresses
  const WNOR_ADDRESS = "0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c";
  const USDT_ADDRESS = "0xA37C1f80Bd02D9d70ce0188831A85c65fdFBeEDe";

  const erc20ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];

  // Get balances
  console.log("\n💰 BALANCES:");

  // Native NOR
  const norBalance = await provider.getBalance(wallet.address);
  console.log("  Native NOR:", ethers.formatEther(norBalance), "NOR");

  // WNOR
  const wnor = new ethers.Contract(WNOR_ADDRESS, erc20ABI, provider);
  const wnorBalance = await wnor.balanceOf(wallet.address);
  console.log("  Wrapped NOR (WNOR):", ethers.formatEther(wnorBalance), "WNOR");

  // USDT
  const usdt = new ethers.Contract(USDT_ADDRESS, erc20ABI, provider);
  const usdtBalance = await usdt.balanceOf(wallet.address);
  console.log("  USDT:", ethers.formatEther(usdtBalance), "USDT");

  console.log("\n📊 LIQUIDITY REQUIREMENTS:");
  console.log("  To balance price to $0.0065/NOR:");
  console.log("  Need: 50,000 USDT + 7,700,000 WNOR");

  console.log("\n✅ HAVE vs NEED:");
  console.log("  USDT:", ethers.formatEther(usdtBalance), "/ 50,000");
  console.log("  WNOR:", ethers.formatEther(wnorBalance), "/ 7,700,000");
  console.log("  Native NOR (can wrap):", ethers.formatEther(norBalance));

  // Check if sufficient
  const needUSDT = ethers.parseEther("50000");
  const needWNOR = ethers.parseEther("7700000");

  console.log("\n🎯 STATUS:");
  if (usdtBalance >= needUSDT && wnorBalance >= needWNOR) {
    console.log("  ✅ You have enough! Ready to balance price");
    console.log("\n💡 NEXT STEP:");
    console.log("  node scripts/balance-norchain-price.js");
  } else {
    console.log("  ⚠️ Insufficient balance");

    if (usdtBalance < needUSDT) {
      const shortfall = needUSDT - usdtBalance;
      console.log("\n  USDT Shortfall:", ethers.formatEther(shortfall), "USDT");
      console.log("  💡 OPTIONS:");
      console.log("     1. Bridge USDT from BSC to NorChain");
      console.log("     2. Deploy test USDT on NorChain");
      console.log("     3. Reduce liquidity amount (add less)");
    }

    if (wnorBalance < needWNOR) {
      const shortfall = needWNOR - wnorBalance;
      console.log("\n  WNOR Shortfall:", ethers.formatEther(shortfall), "WNOR");

      if (norBalance >= shortfall) {
        console.log("  ✅ You have enough native NOR to wrap!");
        console.log("  💡 NEXT STEP:");
        console.log("     node scripts/wrap-nor.js", ethers.formatEther(shortfall));
      } else {
        console.log("  ⚠️ Not enough native NOR either");
        console.log("  💡 Need:", ethers.formatEther(shortfall - norBalance), "more NOR");
      }
    }
  }

  console.log("\n" + "=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  });
