/**
 * Deploy NORBridgeV2 to BSC with Real Mint/Burn
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

const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";

async function main() {
  console.log(`\n${BLUE}========================================${RESET}`);
  console.log(`${BLUE}DEPLOYING NORBRIDGEV2 TO BSC${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`${BLUE}Deployer:${RESET} ${deployer.address}`);
  console.log(`${BLUE}Balance:${RESET} ${ethers.formatEther(balance)} BNB`);
  console.log(`${BLUE}NOR_BSC Token:${RESET} ${NOR_BSC}\n`);

  console.log(`${BLUE}[1/5] Deploying NORBridgeV2 contract...${RESET}`);

  const NORBridgeV2 = await ethers.getContractFactory("NORBridgeV2");
  const bridge = await NORBridgeV2.deploy(
    NOR_BSC,     // token address
    true          // isMintBurnMode = true (BSC mints/burns)
  );
  await bridge.waitForDeployment();

  const bridgeAddress = await bridge.getAddress();
  console.log(`${GREEN}✅ Bridge deployed: ${bridgeAddress}${RESET}\n`);

  console.log(`${BLUE}[2/5] Adding deployer as validator...${RESET}`);
  const addValidatorTx = await bridge.addValidator(deployer.address);
  await addValidatorTx.wait();
  console.log(`${GREEN}✅ Validator added${RESET}\n`);

  console.log(`${BLUE}[3/5] Granting minter role to bridge...${RESET}`);
  const norToken = await ethers.getContractAt("NOR_BSC", NOR_BSC);
  const grantMinterTx = await norToken.addMinter(bridgeAddress);
  await grantMinterTx.wait();
  console.log(`${GREEN}✅ Bridge can now mint NOR_BSC tokens${RESET}\n`);

  console.log(`${BLUE}[4/5] Setting transfer limits...${RESET}`);
  const limitsTx = await bridge.updateLimits(
    ethers.parseEther("100"),      // min: 100 NOR
    ethers.parseEther("1000000"),  // max: 1M NOR
    ethers.parseEther("5000000")   // daily: 5M NOR
  );
  await limitsTx.wait();
  console.log(`${GREEN}✅ Limits configured${RESET}\n`);

  console.log(`${BLUE}[5/5] Verifying configuration...${RESET}`);
  const isValidator = await bridge.validators(deployer.address);
  const isMinter = await norToken.minters(bridgeAddress);
  const minTransfer = await bridge.minTransfer();
  const maxTransfer = await bridge.maxTransfer();

  console.log(`  Validator status: ${isValidator ? `${GREEN}✅` : `${RED}❌`}${RESET}`);
  console.log(`  Minter status: ${isMinter ? `${GREEN}✅` : `${RED}❌`}${RESET}`);
  console.log(`  Min transfer: ${ethers.formatEther(minTransfer)} NOR`);
  console.log(`  Max transfer: ${ethers.formatEther(maxTransfer)} NOR\n`);

  console.log(`${GREEN}========================================${RESET}`);
  console.log(`${GREEN}DEPLOYMENT COMPLETE${RESET}`);
  console.log(`${GREEN}========================================${RESET}\n`);

  console.log(`${BLUE}Bridge Address:${RESET} ${bridgeAddress}`);
  console.log(`${BLUE}Token Address:${RESET} ${NOR_BSC}`);
  console.log(`${BLUE}Mode:${RESET} mint/burn (with REAL minting!)${RESET}`);
  console.log(`${BLUE}Network:${RESET} BSC Mainnet\n`);

  console.log(`${YELLOW}⚠️  UPDATE validator service with new bridge address!${RESET}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
