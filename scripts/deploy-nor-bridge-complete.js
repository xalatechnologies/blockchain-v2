/**
 * Deploy Complete NOR Bridge System
 *
 * Deploys bridge contracts to both BSC and NorChain,
 * configures validators, and sets up minting permissions
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

// Token addresses
const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";  // BSC
const NOR_NORCHAIN = "0x0cf8e180350253271f4b917ccfb0accc4862f263";  // NorChain

async function deployBridgeToBSC() {
  console.log(`\n${BLUE}========================================${RESET}`);
  console.log(`${BLUE}DEPLOYING NOR BRIDGE TO BSC MAINNET${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`${BLUE}Deployer:${RESET} ${deployer.address}`);
  console.log(`${BLUE}Balance:${RESET} ${ethers.formatEther(balance)} BNB\n`);

  console.log(`${BLUE}[1/5] Deploying NORBridge contract (BSC)...${RESET}`);

  const NORBridge = await ethers.getContractFactory("NORBridge");
  const bridgeBSC = await NORBridge.deploy(
    NOR_BSC,          // token address
    true              // isMintBurnMode = true (BSC mints/burns)
  );
  await bridgeBSC.waitForDeployment();

  const bridgeBSCAddress = await bridgeBSC.getAddress();
  console.log(`${GREEN}✅ Bridge deployed to BSC: ${bridgeBSCAddress}${RESET}\n`);

  console.log(`${BLUE}[2/5] Adding deployer as validator...${RESET}`);
  const addValidatorTx = await bridgeBSC.addValidator(deployer.address);
  await addValidatorTx.wait();
  console.log(`${GREEN}✅ Validator added${RESET}\n`);

  console.log(`${BLUE}[3/5] Granting minter role to bridge on NOR_BSC...${RESET}`);
  const norToken = await ethers.getContractAt("NOR_BSC", NOR_BSC);
  const grantMinterTx = await norToken.addMinter(bridgeBSCAddress);
  await grantMinterTx.wait();
  console.log(`${GREEN}✅ Bridge can now mint NOR_BSC tokens${RESET}\n`);

  console.log(`${BLUE}[4/5] Setting transfer limits...${RESET}`);
  // Min: 100 NOR, Max: 1M NOR, Daily: 5M NOR
  const limitsT = await bridgeBSC.updateLimits(
    ethers.parseEther("100"),
    ethers.parseEther("1000000"),
    ethers.parseEther("5000000")
  );
  await limitsT.wait();
  console.log(`${GREEN}✅ Limits configured${RESET}\n`);

  console.log(`${BLUE}[5/5] Verifying configuration...${RESET}`);
  const isValidator = await bridgeBSC.validators(deployer.address);
  const isMinter = await norToken.minters(bridgeBSCAddress);

  console.log(`  Validator status: ${isValidator ? `${GREEN}✅` : `${RED}❌`}${RESET}`);
  console.log(`  Minter status: ${isMinter ? `${GREEN}✅` : `${RED}❌`}${RESET}\n`);

  console.log(`${GREEN}========================================${RESET}`);
  console.log(`${GREEN}BSC BRIDGE DEPLOYMENT COMPLETE${RESET}`);
  console.log(`${GREEN}========================================${RESET}\n`);

  return {
    address: bridgeBSCAddress,
    token: NOR_BSC,
    mode: "mint/burn"
  };
}

async function deployBridgeToNorChain() {
  console.log(`\n${BLUE}========================================${RESET}`);
  console.log(`${BLUE}DEPLOYING NOR BRIDGE TO NORCHAIN${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`${BLUE}Deployer:${RESET} ${deployer.address}`);
  console.log(`${BLUE}Balance:${RESET} ${ethers.formatEther(balance)} NOR\n`);

  console.log(`${BLUE}[1/4] Deploying NORBridge contract (NorChain)...${RESET}`);

  const NORBridge = await ethers.getContractFactory("NORBridge");
  const bridgeNorChain = await NORBridge.deploy(
    NOR_NORCHAIN,     // token address
    false             // isMintBurnMode = false (NorChain locks/unlocks)
  );
  await bridgeNorChain.waitForDeployment();

  const bridgeNorChainAddress = await bridgeNorChain.getAddress();
  console.log(`${GREEN}✅ Bridge deployed to NorChain: ${bridgeNorChainAddress}${RESET}\n`);

  console.log(`${BLUE}[2/4] Adding deployer as validator...${RESET}`);
  const addValidatorTx = await bridgeNorChain.addValidator(deployer.address);
  await addValidatorTx.wait();
  console.log(`${GREEN}✅ Validator added${RESET}\n`);

  console.log(`${BLUE}[3/4] Setting transfer limits...${RESET}`);
  const limitsTx = await bridgeNorChain.updateLimits(
    ethers.parseEther("100"),
    ethers.parseEther("1000000"),
    ethers.parseEther("5000000")
  );
  await limitsTx.wait();
  console.log(`${GREEN}✅ Limits configured${RESET}\n`);

  console.log(`${BLUE}[4/4] Verifying configuration...${RESET}`);
  const isValidator = await bridgeNorChain.validators(deployer.address);
  console.log(`  Validator status: ${isValidator ? `${GREEN}✅` : `${RED}❌`}${RESET}\n`);

  console.log(`${GREEN}========================================${RESET}`);
  console.log(`${GREEN}NORCHAIN BRIDGE DEPLOYMENT COMPLETE${RESET}`);
  console.log(`${GREEN}========================================${RESET}\n`);

  return {
    address: bridgeNorChainAddress,
    token: NOR_NORCHAIN,
    mode: "lock/unlock"
  };
}

async function main() {
  const network = hre.network.name;

  console.log(`\n${BLUE}========================================${RESET}`);
  console.log(`${BLUE}NOR BRIDGE DEPLOYMENT${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);
  console.log(`${BLUE}Network:${RESET} ${network}\n`);

  let result;

  if (network === "bsc") {
    result = await deployBridgeToBSC();
  } else if (network === "btcbr") {
    result = await deployBridgeToNorChain();
  } else {
    console.log(`${RED}❌ Unsupported network: ${network}${RESET}`);
    console.log(`${YELLOW}   Use --network bsc or --network btcbr${RESET}\n`);
    process.exit(1);
  }

  console.log(`\n${BLUE}========================================${RESET}`);
  console.log(`${GREEN}DEPLOYMENT SUMMARY${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  console.log(`${BLUE}Bridge Address:${RESET} ${result.address}`);
  console.log(`${BLUE}Token Address:${RESET} ${result.token}`);
  console.log(`${BLUE}Mode:${RESET} ${result.mode}`);
  console.log(`${BLUE}Network:${RESET} ${network}\n`);

  console.log(`${BLUE}Transfer Limits:${RESET}`);
  console.log(`  Min: 100 NOR`);
  console.log(`  Max: 1,000,000 NOR`);
  console.log(`  Daily: 5,000,000 NOR per user\n`);

  console.log(`${BLUE}Next Steps:${RESET}`);
  if (network === "bsc") {
    console.log(`  1. Deploy bridge to NorChain:`);
    console.log(`     npx hardhat run scripts/deploy-nor-bridge-complete.js --network btcbr\n`);
    console.log(`  2. Update validator service with bridge addresses\n`);
    console.log(`  3. Test bridge transfers\n`);
  } else {
    console.log(`  1. Update validator service with bridge addresses\n`);
    console.log(`  2. Test complete bridge flow\n`);
    console.log(`  3. Monitor bridge activity\n`);
  }

  console.log(`${BLUE}BSCScan Verification:${RESET}`);
  console.log(`  npx hardhat verify --network ${network} ${result.address} "${result.token}" ${result.mode === "mint/burn" ? "true" : "false"}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
