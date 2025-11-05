/**
 * Redeploy NorChain Bridge with Correct NOR Token Address
 */

import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

// Token address from previous deployment
const NOR_TOKEN_NORCHAIN = "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80";

async function main() {
  console.log(`\n${BLUE}========================================${RESET}`);
  console.log(`${BLUE}REDEPLOYING NORCHAIN BRIDGE${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`${BLUE}Deployer:${RESET} ${deployer.address}`);
  console.log(`${BLUE}Balance:${RESET} ${ethers.formatEther(balance)} NOR`);
  console.log(`${BLUE}NOR Token:${RESET} ${NOR_TOKEN_NORCHAIN}\n`);

  console.log(`${BLUE}[1/5] Deploying NORBridge contract...${RESET}`);

  const NORBridge = await ethers.getContractFactory("NORBridge");
  const bridgeNorChain = await NORBridge.deploy(
    NOR_TOKEN_NORCHAIN,  // token address
    false                // isMintBurnMode = false (NorChain locks/unlocks)
  );
  await bridgeNorChain.waitForDeployment();

  const bridgeAddress = await bridgeNorChain.getAddress();
  console.log(`${GREEN}✅ Bridge deployed: ${bridgeAddress}${RESET}\n`);

  console.log(`${BLUE}[2/5] Adding deployer as validator...${RESET}`);
  const addValidatorTx = await bridgeNorChain.addValidator(deployer.address);
  await addValidatorTx.wait();
  console.log(`${GREEN}✅ Validator added${RESET}\n`);

  console.log(`${BLUE}[3/5] Setting transfer limits...${RESET}`);
  const limitsTx = await bridgeNorChain.updateLimits(
    ethers.parseEther("100"),      // min: 100 NOR
    ethers.parseEther("1000000"),  // max: 1M NOR
    ethers.parseEther("5000000")   // daily: 5M NOR
  );
  await limitsTx.wait();
  console.log(`${GREEN}✅ Limits configured${RESET}\n`);

  console.log(`${BLUE}[4/5] Granting approval for bridge to spend NOR...${RESET}`);
  const norToken = await ethers.getContractAt("NOR_BSC", NOR_TOKEN_NORCHAIN);

  // Approve bridge to spend deployer's NOR for testing
  const approveTx = await norToken.approve(bridgeAddress, ethers.parseEther("10000000"));
  await approveTx.wait();
  console.log(`${GREEN}✅ Bridge approved to spend NOR${RESET}\n`);

  console.log(`${BLUE}[5/5] Verifying configuration...${RESET}`);
  const isValidator = await bridgeNorChain.validators(deployer.address);
  const minTransfer = await bridgeNorChain.minTransfer();
  const maxTransfer = await bridgeNorChain.maxTransfer();
  const dailyLimit = await bridgeNorChain.dailyLimit();

  console.log(`  Validator status: ${isValidator ? `${GREEN}✅` : `${RED}❌`}${RESET}`);
  console.log(`  Min transfer: ${ethers.formatEther(minTransfer)} NOR`);
  console.log(`  Max transfer: ${ethers.formatEther(maxTransfer)} NOR`);
  console.log(`  Daily limit: ${ethers.formatEther(dailyLimit)} NOR\n`);

  console.log(`${GREEN}========================================${RESET}`);
  console.log(`${GREEN}NORCHAIN BRIDGE DEPLOYMENT COMPLETE${RESET}`);
  console.log(`${GREEN}========================================${RESET}\n`);

  console.log(`${BLUE}Bridge Address:${RESET} ${bridgeAddress}`);
  console.log(`${BLUE}Token Address:${RESET} ${NOR_TOKEN_NORCHAIN}`);
  console.log(`${BLUE}Mode:${RESET} lock/unlock`);
  console.log(`${BLUE}Network:${RESET} NorChain\n`);

  console.log(`${YELLOW}⚠️  IMPORTANT: Update validator service with new bridge address!${RESET}\n`);

  console.log(`${BLUE}Update the following in your configuration:${RESET}`);
  console.log(`  NOR_TOKEN_NORCHAIN: ${NOR_TOKEN_NORCHAIN}`);
  console.log(`  NORCHAIN_BRIDGE: ${bridgeAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
