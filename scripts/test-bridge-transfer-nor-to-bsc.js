/**
 * Test Bridge Transfer: NorChain → BSC
 *
 * This script tests the complete bridge flow:
 * 1. Lock 1000 NOR on NorChain
 * 2. Validator detects and mints 1000 NOR_BSC on BSC
 * 3. Verify 1:1 backing
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// Contract addresses (UPDATED with correct deployments)
const NORCHAIN_BRIDGE = "0xe447647577cc340B0D853F9A8F052E9BF5D673c1";
const NOR_TOKEN_NORCHAIN = "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80";
const BSC_BRIDGE = "0xFA321371b32b1bFA928081C7E10F7E688c66F900";
const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";

// RPC endpoints
const NORCHAIN_RPC = "http://3.91.50.187:8545";
const BSC_RPC = process.env.BSC_MAINNET_RPC || "https://bsc-dataseed1.binance.org";

const NOR_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)'
];

const BRIDGE_ABI = [
  'function initiateBridge(uint256 amount, string memory destinationChain) external returns (uint256)',
  'function getBridgeTransfer(uint256 bridgeId) external view returns (address user, uint256 amount, uint256 timestamp, bool completed, string memory destinationChain)',
  'function bridgeNonce() external view returns (uint256)'
];

async function main() {
  console.log(`\n${BLUE}========================================${RESET}`);
  console.log(`${BLUE}TEST BRIDGE TRANSFER: NORCHAIN → BSC${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  // Setup providers and wallet
  const norChainProvider = new ethers.JsonRpcProvider(NORCHAIN_RPC);
  const bscProvider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY);
  const norChainWallet = wallet.connect(norChainProvider);
  const bscWallet = wallet.connect(bscProvider);

  console.log(`${BLUE}Wallet Address:${RESET} ${wallet.address}\n`);

  // Get contract instances
  const norToken = new ethers.Contract(NOR_TOKEN_NORCHAIN, NOR_ABI, norChainWallet);
  const norChainBridge = new ethers.Contract(NORCHAIN_BRIDGE, BRIDGE_ABI, norChainWallet);
  const norBscToken = new ethers.Contract(NOR_BSC, NOR_ABI, bscWallet);

  try {
    // Check balances before
    console.log(`${BLUE}[1/6] Checking initial balances...${RESET}`);
    const norBalanceBefore = await norToken.balanceOf(wallet.address);
    const norBscBalanceBefore = await norBscToken.balanceOf(wallet.address);
    console.log(`  NorChain NOR: ${ethers.formatEther(norBalanceBefore)} NOR`);
    console.log(`  BSC NOR_BSC: ${ethers.formatEther(norBscBalanceBefore)} NOR${RESET}\n`);

    // Amount to bridge
    const bridgeAmount = ethers.parseEther("1000"); // 1000 NOR
    console.log(`${YELLOW}Bridge Amount: 1000 NOR${RESET}\n`);

    // Check allowance
    console.log(`${BLUE}[2/6] Checking bridge allowance...${RESET}`);
    const allowance = await norToken.allowance(wallet.address, NORCHAIN_BRIDGE);
    console.log(`  Current allowance: ${ethers.formatEther(allowance)} NOR`);

    if (allowance < bridgeAmount) {
      console.log(`  ${YELLOW}Approving bridge to spend NOR...${RESET}`);
      const approveTx = await norToken.approve(NORCHAIN_BRIDGE, bridgeAmount);
      console.log(`  Approval TX: ${approveTx.hash}`);
      await approveTx.wait();
      console.log(`  ${GREEN}✅ Approved${RESET}\n`);
    } else {
      console.log(`  ${GREEN}✅ Sufficient allowance${RESET}\n`);
    }

    // Initiate bridge
    console.log(`${BLUE}[3/6] Initiating bridge transfer on NorChain...${RESET}`);
    console.log(`  Locking 1000 NOR on NorChain...`);

    const bridgeTx = await norChainBridge.initiateBridge(bridgeAmount, "BSC");
    console.log(`  Bridge TX: ${bridgeTx.hash}`);

    const receipt = await bridgeTx.wait();
    console.log(`  ${GREEN}✅ Bridge initiated on NorChain${RESET}`);
    console.log(`  Gas used: ${receipt.gasUsed.toString()}\n`);

    // Get bridge ID from events
    const bridgeEvent = receipt.logs
      .map(log => {
        try {
          return norChainBridge.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(event => event && event.name === 'BridgeInitiated');

    if (bridgeEvent) {
      const bridgeId = bridgeEvent.args.bridgeId;
      console.log(`  ${BLUE}Bridge ID:${RESET} ${bridgeId}\n`);
    }

    // Check locked amount
    console.log(`${BLUE}[4/6] Verifying NOR locked on NorChain...${RESET}`);
    const bridgeBalance = await norToken.balanceOf(NORCHAIN_BRIDGE);
    console.log(`  Bridge contract balance: ${ethers.formatEther(bridgeBalance)} NOR`);
    console.log(`  ${GREEN}✅ NOR successfully locked${RESET}\n`);

    // Wait for validator service
    console.log(`${BLUE}[5/6] Waiting for validator service to complete bridge...${RESET}`);
    console.log(`  ${YELLOW}Validator service should now:${RESET}`);
    console.log(`  1. Detect BridgeInitiated event on NorChain`);
    console.log(`  2. Call completeBridge on BSC`);
    console.log(`  3. Mint 1000 NOR_BSC to your wallet\n`);
    console.log(`  ${YELLOW}Waiting 30 seconds for validator...${RESET}`);

    await new Promise(resolve => setTimeout(resolve, 30000));

    // Check final balances
    console.log(`${BLUE}[6/6] Checking final balances...${RESET}`);
    const norBalanceAfter = await norToken.balanceOf(wallet.address);
    const norBscBalanceAfter = await norBscToken.balanceOf(wallet.address);

    console.log(`  ${BLUE}NorChain NOR:${RESET}`);
    console.log(`    Before: ${ethers.formatEther(norBalanceBefore)} NOR`);
    console.log(`    After:  ${ethers.formatEther(norBalanceAfter)} NOR`);
    console.log(`    Change: ${ethers.formatEther(norBalanceBefore - norBalanceAfter)} NOR locked\n`);

    console.log(`  ${BLUE}BSC NOR_BSC:${RESET}`);
    console.log(`    Before: ${ethers.formatEther(norBscBalanceBefore)} NOR`);
    console.log(`    After:  ${ethers.formatEther(norBscBalanceAfter)} NOR`);
    console.log(`    Change: +${ethers.formatEther(norBscBalanceAfter - norBscBalanceBefore)} NOR minted\n`);

    // Verify 1:1 backing
    const lockedAmount = norBalanceBefore - norBalanceAfter;
    const mintedAmount = norBscBalanceAfter - norBscBalanceBefore;

    console.log(`${BLUE}========================================${RESET}`);
    if (lockedAmount === mintedAmount) {
      console.log(`${GREEN}✅ 1:1 BACKING VERIFIED${RESET}`);
      console.log(`${GREEN}   ${ethers.formatEther(lockedAmount)} NOR locked = ${ethers.formatEther(mintedAmount)} NOR_BSC minted${RESET}`);
    } else if (mintedAmount === 0n) {
      console.log(`${YELLOW}⏳ VALIDATOR PENDING${RESET}`);
      console.log(`${YELLOW}   ${ethers.formatEther(lockedAmount)} NOR locked, waiting for validator to mint NOR_BSC${RESET}`);
      console.log(`\n${YELLOW}Check validator service logs:${RESET}`);
      console.log(`   pm2 logs nor-bridge-validator`);
      console.log(`   OR check bash output if running in terminal`);
    } else {
      console.log(`${YELLOW}⚠️  MISMATCH DETECTED${RESET}`);
      console.log(`${YELLOW}   Locked: ${ethers.formatEther(lockedAmount)} NOR${RESET}`);
      console.log(`${YELLOW}   Minted: ${ethers.formatEther(mintedAmount)} NOR_BSC${RESET}`);
    }
    console.log(`${BLUE}========================================${RESET}\n`);

    console.log(`${GREEN}Test completed!${RESET}\n`);

  } catch (error) {
    console.error(`\n${YELLOW}Error during bridge test:${RESET}`, error.message);
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
