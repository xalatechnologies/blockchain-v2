/**
 * Initialize Inventory on Mainnet
 *
 * This script initializes the inventory on BSC Mainnet spoke:
 * 1. Mints wrapped XHT to XaheenRouter for initial liquidity
 * 2. Authorizes topup on SupplyController (hub)
 *
 * Prerequisites:
 * - Hub and spoke contracts must be deployed
 * - deployment-mainnet.json must exist
 *
 * Usage:
 * node scripts/initialize-inventory-mainnet.cjs
 */

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");

async function main() {
  console.log("\n💰 Initializing Inventory on Mainnet...\n");

  // Load deployment info
  if (!fs.existsSync("deployment-mainnet.json")) {
    throw new Error("deployment-mainnet.json not found. Deploy contracts first!");
  }

  const deploymentInfo = JSON.parse(fs.readFileSync("deployment-mainnet.json", "utf8"));

  if (!deploymentInfo.hub || !deploymentInfo.spoke) {
    throw new Error("Incomplete deployment info. Both hub and spoke must be deployed!");
  }

  console.log("✅ Loaded deployment info\n");

  // Initial inventory amount (100K XHT)
  const INITIAL_INVENTORY = ethers.parseEther("100000");
  const BSC_CHAIN_ID = 56;

  console.log("Initial inventory:", ethers.formatEther(INITIAL_INVENTORY), "XHT\n");

  // ========== STEP 1: Mint Wrapped XHT on Spoke ==========
  console.log("📍 STEP 1: Minting wrapped XHT on BSC Mainnet...\n");

  // Connect to BSC Mainnet
  const bscProvider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC);
  const bscWallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, bscProvider);

  console.log("Connected to BSC Mainnet");
  console.log("Wallet:", bscWallet.address);
  console.log("Balance:", ethers.formatEther(await bscProvider.getBalance(bscWallet.address)), "BNB\n");

  // Load Wrapped XHT contract
  const wrappedXHTAbi = [
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address account) view returns (uint256)",
    "function grantRole(bytes32 role, address account) external",
    "function MINTER_ROLE() view returns (bytes32)",
  ];

  const wrappedXHT = new ethers.Contract(
    deploymentInfo.spoke.contracts.wrappedXHT,
    wrappedXHTAbi,
    bscWallet
  );

  // Mint wrapped XHT to XaheenRouter
  console.log("Minting", ethers.formatEther(INITIAL_INVENTORY), "wrapped XHT to XaheenRouter...");
  const mintTx = await wrappedXHT.mint(
    deploymentInfo.spoke.contracts.xaheenRouter,
    INITIAL_INVENTORY
  );
  await mintTx.wait();
  console.log("   ✅ Minted successfully");
  console.log("   TX:", mintTx.hash);

  // Verify balance
  const routerBalance = await wrappedXHT.balanceOf(deploymentInfo.spoke.contracts.xaheenRouter);
  console.log("   XaheenRouter balance:", ethers.formatEther(routerBalance), "wrapped XHT\n");

  // ========== STEP 2: Authorize Topup on Hub ==========
  console.log("📍 STEP 2: Authorizing topup on Xaheen Chain...\n");

  // Connect to Xaheen Chain
  const xaheenProvider = new ethers.JsonRpcProvider(process.env.XAHEEN_CHAIN_RPC);
  const xaheenWallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, xaheenProvider);

  console.log("Connected to Xaheen Chain");
  console.log("Wallet:", xaheenWallet.address);
  console.log("Balance:", ethers.formatEther(await xaheenProvider.getBalance(xaheenWallet.address)), "XHT\n");

  // Load SupplyController contract
  const supplyControllerAbi = [
    "function authorizeTopup(uint256 chainId, uint256 amount) external",
    "function getInventory(uint256 chainId) view returns (uint256)",
  ];

  const supplyController = new ethers.Contract(
    deploymentInfo.hub.hub.supplyController,
    supplyControllerAbi,
    xaheenWallet
  );

  // Authorize topup
  console.log("Authorizing", ethers.formatEther(INITIAL_INVENTORY), "XHT topup for BSC...");
  const topupTx = await supplyController.authorizeTopup(BSC_CHAIN_ID, INITIAL_INVENTORY);
  await topupTx.wait();
  console.log("   ✅ Authorized successfully");
  console.log("   TX:", topupTx.hash);

  // Verify inventory
  const inventory = await supplyController.getInventory(BSC_CHAIN_ID);
  console.log("   BSC inventory:", ethers.formatEther(inventory), "XHT\n");

  // ========== SUMMARY ==========
  console.log("═══════════════════════════════════════════════════════");
  console.log("         INVENTORY INITIALIZATION COMPLETE");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("📊 INVENTORY STATUS:");
  console.log("   Chain: BSC Mainnet (56)");
  console.log("   XaheenRouter balance:", ethers.formatEther(routerBalance), "wrapped XHT");
  console.log("   SupplyController inventory:", ethers.formatEther(inventory), "XHT");
  console.log("   Status: ✅ Ready for trading\n");

  console.log("═══════════════════════════════════════════════════════\n");

  console.log("✅ Initialization complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Initialization failed:", error);
    process.exit(1);
  });
