/**
 * Deploy NOR Token to BSC Mainnet
 *
 * This makes NOR visible on BSCScan and allows users to hold it on BSC
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
  console.log(`${BLUE}========================================${RESET}`);
  console.log(`${BLUE}DEPLOYING NOR TOKEN TO BSC MAINNET${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`${BLUE}Deployer:${RESET} ${deployer.address}`);
  console.log(`${BLUE}Balance:${RESET} ${ethers.formatEther(balance)} BNB\n`);

  if (balance < ethers.parseEther("0.01")) {
    console.log(`${YELLOW}⚠️  WARNING: Low BNB balance. Need at least 0.01 BNB${RESET}\n`);
  }

  console.log(`${BLUE}[1/4] Deploying NOR_BSC Token contract...${RESET}`);

  // Deploy NOR_BSC token (bridgeable version for BSC)
  const NOR_BSC = await ethers.getContractFactory("NOR_BSC");
  const norToken = await NOR_BSC.deploy();
  await norToken.waitForDeployment();

  const norAddress = await norToken.getAddress();
  console.log(`${GREEN}✅ NOR_BSC Token deployed to: ${norAddress}${RESET}\n`);

  // Get token info
  const name = await norToken.name();
  const symbol = await norToken.symbol();
  const decimals = await norToken.decimals();
  const totalSupply = await norToken.totalSupply();

  console.log(`${BLUE}Token Information:${RESET}`);
  console.log(`  Name: ${name}`);
  console.log(`  Symbol: ${symbol}`);
  console.log(`  Decimals: ${decimals}`);
  console.log(`  Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}\n`);

  console.log(`${BLUE}[2/4] Adding deployer as minter...${RESET}`);

  // Add deployer as minter so we can mint initial supply
  const addMinterTx = await norToken.addMinter(deployer.address);
  await addMinterTx.wait();
  console.log(`${GREEN}✅ Deployer added as minter${RESET}\n`);

  console.log(`${BLUE}[3/4] Minting initial supply to deployer...${RESET}`);

  // Mint 10 million NOR to deployer for initial liquidity and testing
  const mintAmount = ethers.parseUnits("10000000", decimals); // 10 million NOR
  const mintTx = await norToken.mint(deployer.address, mintAmount);
  await mintTx.wait();

  const deployerBalance = await norToken.balanceOf(deployer.address);
  console.log(`${GREEN}✅ Minted ${ethers.formatUnits(deployerBalance, decimals)} ${symbol} to deployer${RESET}\n`);

  console.log(`${BLUE}[4/4] Configuration complete${RESET}`);
  console.log(`${GREEN}✅ NOR Token ready for use on BSC!${RESET}\n`);

  console.log(`${BLUE}========================================${RESET}`);
  console.log(`${GREEN}DEPLOYMENT COMPLETE${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  console.log(`${BLUE}Contract Address:${RESET}`);
  console.log(`  ${norAddress}`);
  console.log(``);
  console.log(`${BLUE}BSCScan:${RESET}`);
  console.log(`  https://bscscan.com/address/${norAddress}`);
  console.log(``);
  console.log(`${BLUE}Add to MetaMask:${RESET}`);
  console.log(`  1. Open MetaMask`);
  console.log(`  2. Switch to BSC Mainnet`);
  console.log(`  3. Click "Import tokens"`);
  console.log(`  4. Paste address: ${norAddress}`);
  console.log(`  5. Token symbol and decimals will auto-fill`);
  console.log(``);
  console.log(`${BLUE}Verify on BSCScan:${RESET}`);
  console.log(`  npx hardhat verify --network bsc ${norAddress}`);
  console.log(``);

  // Save deployment info
  const deployment = {
    network: "BSC Mainnet",
    chainId: 56,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      NORToken: {
        address: norAddress,
        name: name,
        symbol: symbol,
        decimals: decimals.toString(),
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        initialMint: ethers.formatUnits(mintAmount, decimals)
      }
    }
  };

  console.log(`${BLUE}Deployment Info:${RESET}`);
  console.log(JSON.stringify(deployment, null, 2));
  console.log(``);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
