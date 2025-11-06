/**
 * Add BSC Bridge as Minter on NOR_BSC Token
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const BSC_BRIDGE = "0xFA321371b32b1bFA928081C7E10F7E688c66F900";
const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
const BSC_RPC = process.env.BSC_MAINNET_RPC || "https://bsc-dataseed1.binance.org";

const NOR_ABI = [
  'function addMinter(address minter) external',
  'function minters(address minter) external view returns (bool)'
];

async function main() {
  console.log('\n🔧 Adding BSC Bridge as Minter on NOR_BSC...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);
  const norToken = new ethers.Contract(NOR_BSC, NOR_ABI, wallet);

  // Check if already minter
  const isMinter = await norToken.minters(BSC_BRIDGE);
  if (isMinter) {
    console.log('✅ Bridge is already a minter!\n');
    return;
  }

  console.log(`Adding ${BSC_BRIDGE} as minter...`);
  const tx = await norToken.addMinter(BSC_BRIDGE);
  console.log(`TX: ${tx.hash}`);
  await tx.wait();

  console.log('✅ Bridge added as minter!\n');

  // Verify
  const isNowMinter = await norToken.minters(BSC_BRIDGE);
  console.log(`Verification: ${isNowMinter ? '✅ Success' : '❌ Failed'}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
