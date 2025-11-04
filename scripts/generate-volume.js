import hre from "hardhat";
const { ethers } = hre;

/**
 * Simple Volume Generator
 *
 * Makes small back-and-forth swaps to create trading activity
 * This attracts arbitrage bots and shows your DEX is active!
 */

const ROUTER = "0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916";
const WNOR = "0x26c0eaF731885b14c031cc50dB79b36458E0b355";
const FACTORY = "0xBE254176B4f13b02f367a9feCE599ee8887E2D34";

// Your existing pairs
const USDT = "YOUR_USDT_ADDRESS"; // If you have USDT on Nor

async function main() {
  console.log("\n💹 VOLUME GENERATOR STARTING\n");

  const [signer] = await ethers.getSigners();
  console.log("Trader:", signer.address);

  const router = await ethers.getContractAt("IUniswapV2Router02", ROUTER);
  const wxht = await ethers.getContractAt("IERC20", WNOR);

  // Check balance
  const balance = await wxht.balanceOf(signer.address);
  console.log("WNOR Balance:", ethers.formatEther(balance), "NOR\n");

  console.log("🎯 STRATEGY:");
  console.log("1. Make small swaps (100-1000 NOR)");
  console.log("2. Random intervals (2-10 minutes)");
  console.log("3. Back and forth to keep balance");
  console.log("4. Creates volume, attracts bots!\n");

  let tradeCount = 0;
  let totalVolume = 0;

  // Simple trading loop
  while (true) {
    try {
      // Random trade size between 100-1000 NOR (~$0.1-1)
      const amount = ethers.parseEther((Math.random() * 900 + 100).toFixed(0));

      console.log(`\n[Trade ${++tradeCount}]`);
      console.log(`Amount: ${ethers.formatEther(amount)} NOR`);
      console.log(
        `Estimated: $${(parseFloat(ethers.formatEther(amount)) * 0.001).toFixed(
          2
        )}`
      );

      // Approve if needed
      const currentAllowance = await wxht.allowance(signer.address, ROUTER);
      if (currentAllowance < amount) {
        console.log("Approving tokens...");
        await (await wxht.approve(ROUTER, ethers.MaxUint256)).wait();
      }

      // Make swap (NOR → NOR via pair, creates volume)
      const path = [WNOR, WNOR]; // Simplified - adjust based on your pairs
      const deadline = Math.floor(Date.now() / 1000) + 600;

      console.log("Executing swap...");
      const tx = await router.swapExactTokensForTokens(
        amount,
        0, // Min output (accepting slippage for demo)
        path,
        signer.address,
        deadline,
        { gasLimit: 300000 }
      );

      await tx.wait();
      console.log(`✅ Success! TX: ${tx.hash.slice(0, 10)}...`);

      totalVolume += parseFloat(ethers.formatEther(amount)) * 0.001;
      console.log(`📊 Total volume: $${totalVolume.toFixed(2)}`);
      console.log(`💰 Your fees: $${(totalVolume * 0.003).toFixed(4)}`);

      // Random wait (2-10 minutes)
      const waitMinutes = Math.floor(Math.random() * 8) + 2;
      console.log(`⏰ Waiting ${waitMinutes} minutes...`);
      await new Promise((resolve) =>
        setTimeout(resolve, waitMinutes * 60 * 1000)
      );
    } catch (error) {
      console.error("❌ Error:", error.message);
      console.log("Retrying in 5 minutes...");
      await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));
    }
  }
}

main().catch(console.error);
