import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
  console.log("\n🔍 CHECKING ETH BRIDGE CONTRACT...\n");

  const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC);
  const wallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, provider);

  const bridgeAddress = process.env.ETH_BRIDGE_BSC;
  console.log(`Bridge Address: ${bridgeAddress}\n`);

  // Full ETH Bridge ABI
  const bridgeAbi = [
    "function ethToken() view returns (address)",
    "function minTransferAmount() view returns (uint256)",
    "function maxTransferAmount() view returns (uint256)",
    "function bridgeFeePercent() view returns (uint256)",
    "function requiredSignatures() view returns (uint256)",
    "function validators(address) view returns (bool)",
    "function bridgeETH(address recipient, uint256 amount) external"
  ];

  const bridge = new ethers.Contract(bridgeAddress, bridgeAbi, provider);

  // Check configuration
  console.log("📋 BRIDGE CONFIGURATION:");

  try {
    const ethToken = await bridge.ethToken();
    console.log(`ETH Token: ${ethToken}`);
  } catch (e) {
    console.log(`ETH Token: Error - ${e.message}`);
  }

  try {
    const minAmount = await bridge.minTransferAmount();
    console.log(`Min Amount: ${ethers.formatEther(minAmount)} ETH`);
  } catch (e) {
    console.log(`Min Amount: Error - ${e.message}`);
  }

  try {
    const maxAmount = await bridge.maxTransferAmount();
    console.log(`Max Amount: ${ethers.formatEther(maxAmount)} ETH`);
  } catch (e) {
    console.log(`Max Amount: Error - ${e.message}`);
  }

  try {
    const feePercent = await bridge.bridgeFeePercent();
    console.log(`Fee: ${Number(feePercent) / 100}%`);
  } catch (e) {
    console.log(`Fee: Error - ${e.message}`);
  }

  try {
    const reqSigs = await bridge.requiredSignatures();
    console.log(`Required Signatures: ${reqSigs}`);
  } catch (e) {
    console.log(`Required Signatures: Error - ${e.message}`);
  }

  try {
    const isValidator = await bridge.validators(wallet.address);
    console.log(`Is Validator: ${isValidator}\n`);
  } catch (e) {
    console.log(`Is Validator: Error - ${e.message}\n`);
  }

  // Check ETH token allowance
  const ethAddress = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";
  const ethAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];
  const ethToken = new ethers.Contract(ethAddress, ethAbi, provider);

  const balance = await ethToken.balanceOf(wallet.address);
  const allowance = await ethToken.allowance(wallet.address, bridgeAddress);

  console.log("💰 ETH TOKEN STATUS:");
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`Allowance: ${ethers.formatEther(allowance)} ETH`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
