import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
  console.log("\n🧪 TESTING USDT BRIDGE...\n");

  const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC);
  const wallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, provider);

  console.log(`💼 Wallet: ${wallet.address}\n`);

  // USDT contract on BSC
  const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
  const usdtAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];
  const usdt = new ethers.Contract(usdtAddress, usdtAbi, wallet);

  // Check USDT balance
  const usdtBalance = await usdt.balanceOf(wallet.address);
  console.log(`Current USDT Balance: ${ethers.formatEther(usdtBalance)} USDT\n`);

  if (parseFloat(ethers.formatEther(usdtBalance)) < 10) {
    console.log("❌ Not enough USDT! Need at least 10 USDT.");
    console.log("📝 Follow instructions in GET_TEST_TOKENS.md to get USDT\n");
    process.exit(1);
  }

  // USDT Bridge contract
  const bridgeAddress = process.env.USDT_BRIDGE_BSC;
  const bridgeAbi = [
    "function bridgeUSDT(address recipient, uint256 amount) external",
    "function minTransferAmount() view returns (uint256)",
    "function bridgeFeePercent() view returns (uint256)",
    "function currentNonce() view returns (uint256)",
    "event BridgeDeposit(address indexed user, address indexed recipient, uint256 amount, uint256 fee, uint256 indexed nonce, uint256 timestamp)"
  ];
  const bridge = new ethers.Contract(bridgeAddress, bridgeAbi, wallet);

  console.log(`🌉 USDT Bridge: ${bridgeAddress}\n`);

  // Check fee
  const feePercent = await bridge.bridgeFeePercent();
  console.log(`Bridge Fee: ${Number(feePercent) / 100}% (${feePercent} basis points)\n`);

  // Test amount: 10 USDT
  const testAmount = ethers.parseEther("10");
  console.log(`Test Amount: 10 USDT\n`);

  // Calculate expected fee
  const fee = (testAmount * feePercent) / 10000n;
  const netAmount = testAmount - fee;
  console.log(`Expected Fee: ${ethers.formatEther(fee)} USDT`);
  console.log(`Expected Net: ${ethers.formatEther(netAmount)} USDT\n`);

  // Step 1: Approve USDT
  console.log("📝 Step 1: Approving USDT...");
  const currentAllowance = await usdt.allowance(wallet.address, bridgeAddress);

  if (currentAllowance < testAmount) {
    const approveTx = await usdt.approve(bridgeAddress, testAmount);
    console.log(`Approve TX: ${approveTx.hash}`);
    await approveTx.wait();
    console.log("✅ USDT Approved!\n");
  } else {
    console.log("✅ Already approved!\n");
  }

  // Step 2: Bridge USDT
  console.log("🌉 Step 2: Bridging USDT to Xaheen Chain...");
  const recipient = wallet.address; // Same address on Xaheen

  const nonceBefore = await bridge.currentNonce();
  console.log(`Current nonce: ${nonceBefore}`);

  const bridgeTx = await bridge.bridgeUSDT(recipient, testAmount, {
    gasLimit: 500000
  });

  console.log(`Bridge TX: ${bridgeTx.hash}`);
  console.log(`View on BSCScan: https://bscscan.com/tx/${bridgeTx.hash}`);

  console.log("\n⏳ Waiting for confirmation...");
  const receipt = await bridgeTx.wait();
  console.log("✅ Bridge transaction confirmed!\n");

  // Parse event
  const event = receipt.logs
    .map(log => {
      try {
        return bridge.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .find(e => e && e.name === "BridgeDeposit");

  if (event) {
    console.log("📋 BRIDGE DEPOSIT EVENT:");
    console.log(`   User: ${event.args.user}`);
    console.log(`   Recipient: ${event.args.recipient}`);
    console.log(`   Amount: ${ethers.formatEther(event.args.amount)} USDT`);
    console.log(`   Fee: ${ethers.formatEther(event.args.fee)} USDT`);
    console.log(`   Nonce: ${event.args.nonce}`);
    console.log(`   Timestamp: ${new Date(Number(event.args.timestamp) * 1000).toISOString()}\n`);
  }

  console.log("═".repeat(60));
  console.log("\n✅ USDT BRIDGE TEST SUCCESSFUL!\n");

  console.log("💰 REVENUE EARNED:");
  console.log(`   Fee collected: ${ethers.formatEther(fee)} USDT (~$${ethers.formatEther(fee)})`);
  console.log(`   Your cut: 100% = $${ethers.formatEther(fee)}\n`);

  console.log("🎯 NEXT STEPS:");
  console.log("1. Wait 30-60 seconds for validator to mint WUSDT");
  console.log("2. Check PM2 logs: pm2 logs bridge-validator");
  console.log("3. Add WUSDT to MetaMask:");
  console.log(`   Address: ${process.env.WUSDT_TOKEN_XAHEEN}`);
  console.log("   Symbol: WUSDT");
  console.log("   Decimals: 18");
  console.log(`4. Expected balance: ${ethers.formatEther(netAmount)} WUSDT\n`);

  console.log("═".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
