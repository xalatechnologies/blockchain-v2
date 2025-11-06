import hre from "hardhat";
const { ethers } = hre;

// Fix SSL certificate issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  const amountToWrap = process.argv[2] || "7700000"; // Default 7.7M NOR

  console.log("\n🔄 WRAPPING NOR TO WNOR");
  console.log("=".repeat(70));

  // Connect to NorChain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n📍 Account:", wallet.address);

  const WNOR_ADDRESS = "0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c";

  const wnorABI = [
    "function deposit() external payable",
    "function balanceOf(address) view returns (uint256)"
  ];

  const wnor = new ethers.Contract(WNOR_ADDRESS, wnorABI, wallet);

  // Check balances
  const norBalance = await provider.getBalance(wallet.address);
  const wnorBalance = await wnor.balanceOf(wallet.address);

  console.log("\n💰 CURRENT BALANCES:");
  console.log("  Native NOR:", ethers.formatEther(norBalance), "NOR");
  console.log("  Wrapped NOR:", ethers.formatEther(wnorBalance), "WNOR");

  const wrapAmount = ethers.parseEther(amountToWrap);

  console.log("\n🔄 WRAPPING:");
  console.log("  Amount:", ethers.formatEther(wrapAmount), "NOR → WNOR");

  if (norBalance < wrapAmount) {
    console.log("\n❌ INSUFFICIENT NOR BALANCE");
    console.log("   Need:", ethers.formatEther(wrapAmount), "NOR");
    console.log("   Have:", ethers.formatEther(norBalance), "NOR");
    process.exit(1);
  }

  console.log("\n⏳ Wrapping NOR...");
  const tx = await wnor.deposit({ value: wrapAmount });
  console.log("  📤 Transaction:", tx.hash);

  await tx.wait();
  console.log("  ✅ Wrapped!");

  // Check new balances
  const newNORBalance = await provider.getBalance(wallet.address);
  const newWNORBalance = await wnor.balanceOf(wallet.address);

  console.log("\n💰 NEW BALANCES:");
  console.log("  Native NOR:", ethers.formatEther(newNORBalance), "NOR");
  console.log("  Wrapped NOR:", ethers.formatEther(newWNORBalance), "WNOR");

  console.log("\n✅ WRAPPED", ethers.formatEther(wrapAmount), "NOR TO WNOR!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  });
