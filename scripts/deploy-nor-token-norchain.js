/**
 * Deploy NOR Token to NorChain
 *
 * Deploys ERC20 NOR token to NorChain for bridge testing
 */

import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

async function main() {
  console.log(`\n${BLUE}========================================${RESET}`);
  console.log(`${BLUE}DEPLOYING NOR TOKEN TO NORCHAIN${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`${BLUE}Deployer:${RESET} ${deployer.address}`);
  console.log(`${BLUE}Balance:${RESET} ${ethers.formatEther(balance)} NOR\n`);

  console.log(`${BLUE}[1/4] Deploying NOR token contract...${RESET}`);

  const NOR = await ethers.getContractFactory("NOR_BSC"); // Reuse same contract
  const norToken = await NOR.deploy();
  await norToken.waitForDeployment();

  const norAddress = await norToken.getAddress();
  console.log(`${GREEN}✅ NOR deployed to NorChain: ${norAddress}${RESET}\n`);

  console.log(`${BLUE}[2/4] Adding deployer as minter...${RESET}`);
  const addMinterTx = await norToken.addMinter(deployer.address);
  await addMinterTx.wait();
  console.log(`${GREEN}✅ Deployer is now a minter${RESET}\n`);

  console.log(`${BLUE}[3/4] Minting initial supply for testing...${RESET}`);
  const decimals = 18;
  const mintAmount = ethers.parseUnits("100000000", decimals); // 100 million NOR
  const mintTx = await norToken.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log(`${GREEN}✅ Minted 100,000,000 NOR to deployer${RESET}\n`);

  console.log(`${BLUE}[4/4] Verifying deployment...${RESET}`);
  const totalSupply = await norToken.totalSupply();
  const deployerBalance = await norToken.balanceOf(deployer.address);
  const isMinter = await norToken.minters(deployer.address);

  console.log(`  Total Supply: ${ethers.formatEther(totalSupply)} NOR`);
  console.log(`  Deployer Balance: ${ethers.formatEther(deployerBalance)} NOR`);
  console.log(`  Deployer is Minter: ${isMinter ? GREEN + '✅' : '❌'}${RESET}\n`);

  console.log(`${GREEN}========================================${RESET}`);
  console.log(`${GREEN}DEPLOYMENT COMPLETE${RESET}`);
  console.log(`${GREEN}========================================${RESET}\n`);

  console.log(`${BLUE}Contract Address:${RESET} ${norAddress}`);
  console.log(`${BLUE}Network:${RESET} NorChain`);
  console.log(`${BLUE}Symbol:${RESET} NOR`);
  console.log(`${BLUE}Decimals:${RESET} 18`);
  console.log(`${BLUE}Initial Supply:${RESET} 100,000,000 NOR\n`);

  console.log(`${YELLOW}⚠️  IMPORTANT: Update bridge deployment script with this address!${RESET}\n`);

  console.log(`${BLUE}Next Steps:${RESET}`);
  console.log(`  1. Add bridge as minter:`);
  console.log(`     await norToken.addMinter(BRIDGE_ADDRESS)\n`);
  console.log(`  2. Update bridge token address in config\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
