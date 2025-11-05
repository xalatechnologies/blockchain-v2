/**
 * Send NOR tokens to another address on BSC
 */

import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";

const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

async function main() {
  // Get recipient and amount from command line
  const recipient = process.argv[2];
  const amount = process.argv[3];

  if (!recipient || !amount) {
    console.log(`\n${YELLOW}Usage:${RESET}`);
    console.log(`  npx hardhat run scripts/send-nor-bsc.js --network bsc <recipient> <amount>\n`);
    console.log(`${BLUE}Example:${RESET}`);
    console.log(`  npx hardhat run scripts/send-nor-bsc.js --network bsc 0x742e5f7a5C3cC66e1c4E69D76b77fE28D0f9d59D 1000\n`);
    process.exit(1);
  }

  console.log(`\n${BLUE}========================================${RESET}`);
  console.log(`${BLUE}Sending NOR on BSC Mainnet${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  const [sender] = await ethers.getSigners();
  const nor = await ethers.getContractAt("NOR_BSC", NOR_BSC);

  console.log(`${BLUE}From:${RESET}     ${sender.address}`);
  console.log(`${BLUE}To:${RESET}       ${recipient}`);
  console.log(`${BLUE}Amount:${RESET}   ${amount} NOR\n`);

  // Check balance
  const balance = await nor.balanceOf(sender.address);
  const amountWei = ethers.parseEther(amount);

  console.log(`${BLUE}Your Balance:${RESET} ${ethers.formatEther(balance)} NOR\n`);

  if (balance < amountWei) {
    console.log(`${YELLOW}❌ Insufficient balance!${RESET}\n`);
    process.exit(1);
  }

  // Check BNB for gas
  const bnbBalance = await ethers.provider.getBalance(sender.address);
  console.log(`${BLUE}BNB for Gas:${RESET}  ${ethers.formatEther(bnbBalance)} BNB\n`);

  if (bnbBalance < ethers.parseEther("0.001")) {
    console.log(`${YELLOW}⚠️  Low BNB balance for gas${RESET}\n`);
  }

  // Send tokens
  console.log(`${BLUE}[1/2] Sending tokens...${RESET}`);
  const tx = await nor.transfer(recipient, amountWei);
  console.log(`  Transaction: ${tx.hash}`);

  console.log(`${BLUE}[2/2] Waiting for confirmation...${RESET}`);
  const receipt = await tx.wait();

  console.log(`${GREEN}✅ Transfer complete!${RESET}`);
  console.log(`  Block: ${receipt.blockNumber}`);
  console.log(`  Gas used: ${receipt.gasUsed.toString()}\n`);

  // Check new balances
  const newSenderBalance = await nor.balanceOf(sender.address);
  const recipientBalance = await nor.balanceOf(recipient);

  console.log(`${BLUE}========================================${RESET}`);
  console.log(`${GREEN}TRANSFER SUCCESSFUL${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  console.log(`${BLUE}Updated Balances:${RESET}`);
  console.log(`  Your balance:      ${ethers.formatEther(newSenderBalance)} NOR`);
  console.log(`  Recipient balance: ${ethers.formatEther(recipientBalance)} NOR\n`);

  console.log(`${BLUE}BSCScan:${RESET}`);
  console.log(`  https://bscscan.com/tx/${tx.hash}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
