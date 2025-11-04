/**
 * Initialize Inventory on Mainnet
 *
 * This script initializes the inventory on BSC Mainnet spoke:
 * 1. Mints wrapped NOR to NorRouter for initial liquidity
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
    throw new Error(
      "deployment-mainnet.json not found. Deploy contracts first!"
    );
  }

  const deploymentInfo = JSON.parse(
    fs.readFileSync("deployment-mainnet.json", "utf8")
  );

  if (!deploymentInfo.hub || !deploymentInfo.spoke) {
    throw new Error(
      "Incomplete deployment info. Both hub and spoke must be deployed!"
    );
  }

  console.log("✅ Loaded deployment info\n");

  // Initial inventory amount (100K NOR)
  const INITIAL_INVENTORY = ethers.parseEther("100000");
  const BSC_CHAIN_ID = 56;

  console.log(
    "Initial inventory:",
    ethers.formatEther(INITIAL_INVENTORY),
    "NOR\n"
  );

  // ========== STEP 1: Mint Wrapped NOR on Spoke ==========
  console.log("📍 STEP 1: Minting wrapped NOR on BSC Mainnet...\n");

  // Connect to BSC Mainnet
  const bscProvider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC);
  const bscWallet = new ethers.Wallet(
    process.env.MAINNET_PRIVATE_KEY,
    bscProvider
  );

  console.log("Connected to BSC Mainnet");
  console.log("Wallet:", bscWallet.address);
  console.log(
    "Balance:",
    ethers.formatEther(await bscProvider.getBalance(bscWallet.address)),
    "BNB\n"
  );

  // Load Wrapped NOR contract
  const wrappedNORAbi = [
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address account) view returns (uint256)",
    "function grantRole(bytes32 role, address account) external",
    "function MINTER_ROLE() view returns (bytes32)",
  ];

  const wrappedNOR = new ethers.Contract(
    deploymentInfo.spoke.contracts.wrappedNOR,
    wrappedNORAbi,
    bscWallet
  );

  // Mint wrapped NOR to NorRouter
  console.log(
    "Minting",
    ethers.formatEther(INITIAL_INVENTORY),
    "wrapped NOR to NorRouter..."
  );
  const mintTx = await wrappedNOR.mint(
    deploymentInfo.spoke.contracts.xaheenRouter,
    INITIAL_INVENTORY
  );
  await mintTx.wait();
  console.log("   ✅ Minted successfully");
  console.log("   TX:", mintTx.hash);

  // Verify balance
  const routerBalance = await wrappedNOR.balanceOf(
    deploymentInfo.spoke.contracts.xaheenRouter
  );
  console.log(
    "   NorRouter balance:",
    ethers.formatEther(routerBalance),
    "wrapped NOR\n"
  );

  // ========== STEP 2: Authorize Topup on Hub ==========
  console.log("📍 STEP 2: Authorizing topup on Nor Chain...\n");

  // Connect to Nor Chain
  const xaheenProvider = new ethers.JsonRpcProvider(
    process.env.XAHEEN_CHAIN_RPC
  );
  const xaheenWallet = new ethers.Wallet(
    process.env.MAINNET_PRIVATE_KEY,
    xaheenProvider
  );

  console.log("Connected to Nor Chain");
  console.log("Wallet:", xaheenWallet.address);
  console.log(
    "Balance:",
    ethers.formatEther(await xaheenProvider.getBalance(xaheenWallet.address)),
    "NOR\n"
  );

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
  console.log(
    "Authorizing",
    ethers.formatEther(INITIAL_INVENTORY),
    "NOR topup for BSC..."
  );
  const topupTx = await supplyController.authorizeTopup(
    BSC_CHAIN_ID,
    INITIAL_INVENTORY
  );
  await topupTx.wait();
  console.log("   ✅ Authorized successfully");
  console.log("   TX:", topupTx.hash);

  // Verify inventory
  const inventory = await supplyController.getInventory(BSC_CHAIN_ID);
  console.log("   BSC inventory:", ethers.formatEther(inventory), "NOR\n");

  // ========== SUMMARY ==========
  console.log("═══════════════════════════════════════════════════════");
  console.log("         INVENTORY INITIALIZATION COMPLETE");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("📊 INVENTORY STATUS:");
  console.log("   Chain: BSC Mainnet (56)");
  console.log(
    "   NorRouter balance:",
    ethers.formatEther(routerBalance),
    "wrapped NOR"
  );
  console.log(
    "   SupplyController inventory:",
    ethers.formatEther(inventory),
    "NOR"
  );
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
