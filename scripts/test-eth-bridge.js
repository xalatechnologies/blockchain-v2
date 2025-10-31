import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
  console.log("\n🧪 TESTING ETH BRIDGE...\n");

  const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC);
  const wallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, provider);

  console.log(`💼 Wallet: ${wallet.address}\n`);

  // ETH contract on BSC (Binance-Peg Ethereum)
  const ethAddress = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";
  const ethAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];
  const ethToken = new ethers.Contract(ethAddress, ethAbi, wallet);

  // Check ETH balance
  const ethBalance = await ethToken.balanceOf(wallet.address);
  console.log(`Current ETH Balance: ${ethers.formatEther(ethBalance)} ETH\n`);

  if (parseFloat(ethers.formatEther(ethBalance)) < 0.005) {
    console.log("❌ Not enough ETH! Need at least 0.005 ETH (~$12.50).");
    console.log("📝 Follow instructions in GET_TEST_TOKENS.md to get ETH\n");
    process.exit(1);
  }

  // ETH Bridge contract
  const bridgeAddress = process.env.ETH_BRIDGE_BSC;
  const bridgeAbi = [
    "function bridgeETH(address recipient, uint256 amount) external",
    "function minTransferAmount() view returns (uint256)",
    "function bridgeFeePercent() view returns (uint256)",
    "function currentNonce() view returns (uint256)",
    "event BridgeDeposit(address indexed user, address indexed recipient, uint256 amount, uint256 fee, uint256 indexed nonce, uint256 timestamp)"
  ];
  const bridge = new ethers.Contract(bridgeAddress, bridgeAbi, wallet);

  console.log(`🌉 ETH Bridge: ${bridgeAddress}\n`);

  // Check fee
  const feePercent = await bridge.bridgeFeePercent();
  console.log(`Bridge Fee: ${Number(feePercent) / 100}% (${feePercent} basis points)\n`);

  // Test amount: 0.005 ETH (~$12.50)
  const testAmount = ethers.parseEther("0.005");
  console.log(`Test Amount: 0.005 ETH (~$12.50)\n`);

  // Calculate expected fee
  const fee = (testAmount * feePercent) / 10000n;
  const netAmount = testAmount - fee;
  console.log(`Expected Fee: ${ethers.formatEther(fee)} ETH (~$${(parseFloat(ethers.formatEther(fee)) * 2500).toFixed(4)})`);
  console.log(`Expected Net: ${ethers.formatEther(netAmount)} ETH\n`);

  // Step 1: Approve ETH
  console.log("📝 Step 1: Approving ETH...");
  const currentAllowance = await ethToken.allowance(wallet.address, bridgeAddress);

  if (currentAllowance < testAmount) {
    const approveTx = await ethToken.approve(bridgeAddress, testAmount);
    console.log(`Approve TX: ${approveTx.hash}`);
    await approveTx.wait();
    console.log("✅ ETH Approved!\n");
  } else {
    console.log("✅ Already approved!\n");
  }

  // Step 2: Bridge ETH
  console.log("🌉 Step 2: Bridging ETH to Xaheen Chain...");
  const recipient = wallet.address; // Same address on Xaheen

  const nonceBefore = await bridge.currentNonce();
  console.log(`Current nonce: ${nonceBefore}`);

  const bridgeTx = await bridge.bridgeETH(recipient, testAmount, {
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
    console.log(`   Amount: ${ethers.formatEther(event.args.amount)} ETH`);
    console.log(`   Fee: ${ethers.formatEther(event.args.fee)} ETH`);
    console.log(`   Nonce: ${event.args.nonce}`);
    console.log(`   Timestamp: ${new Date(Number(event.args.timestamp) * 1000).toISOString()}\n`);
  }

  console.log("═".repeat(60));
  console.log("\n✅ ETH BRIDGE TEST SUCCESSFUL!\n");

  console.log("💰 REVENUE EARNED:");
  console.log(`   Fee collected: ${ethers.formatEther(fee)} ETH (~$${(parseFloat(ethers.formatEther(fee)) * 2500).toFixed(4)})`);
  console.log(`   Your cut: 100% = $${(parseFloat(ethers.formatEther(fee)) * 2500).toFixed(4)}\n`);

  console.log("🎯 NEXT STEPS:");
  console.log("1. Wait 30-60 seconds for validator to mint WETH");
  console.log("2. Check PM2 logs: pm2 logs bridge-validator");
  console.log("3. Add WETH to MetaMask:");
  console.log(`   Address: ${process.env.WETH_TOKEN_XAHEEN}`);
  console.log("   Symbol: WETH");
  console.log("   Decimals: 18");
  console.log(`4. Expected balance: ${ethers.formatEther(netAmount)} WETH\n`);

  console.log("═".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
