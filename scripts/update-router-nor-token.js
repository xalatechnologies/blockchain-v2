/**
 * Update CrossChainSwapRouter to support the newly deployed NOR token
 */

import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const ROUTER_ADDRESS = "0x5B5F78D3743319698cdf5613DEe64869f2a3526c";
const NEW_NOR_ADDRESS = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";

const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

async function main() {
  console.log(`${BLUE}========================================${RESET}`);
  console.log(`${BLUE}UPDATING CROSSCHAINSWAP ROUTER${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`${BLUE}Deployer:${RESET} ${deployer.address}\n`);

  console.log(`${BLUE}Router:${RESET} ${ROUTER_ADDRESS}`);
  console.log(`${BLUE}New NOR Token:${RESET} ${NEW_NOR_ADDRESS}\n`);

  // Get router contract
  const router = await ethers.getContractAt("CrossChainSwapRouter", ROUTER_ADDRESS);

  // Check if NOR is already supported
  const isSupported = await router.supportedTokens(NEW_NOR_ADDRESS);

  if (isSupported) {
    console.log(`${GREEN}✅ NOR token is already supported${RESET}\n`);
  } else {
    console.log(`${BLUE}[1/2] Adding NOR as supported token...${RESET}`);

    const addTx = await router.addSupportedToken(NEW_NOR_ADDRESS);
    console.log(`   Transaction: ${addTx.hash}`);
    await addTx.wait();

    console.log(`${GREEN}✅ NOR token added to router${RESET}\n`);
  }

  // Verify all supported tokens
  console.log(`${BLUE}[2/2] Verifying supported tokens...${RESET}`);

  const tokens = [
    { name: "NOR", address: NEW_NOR_ADDRESS },
    { name: "BTCBR", address: "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f" },
    { name: "USDT", address: "0x55d398326f99059fF775485246999027B3197955" }
  ];

  console.log(`\n${BLUE}Supported Tokens:${RESET}`);
  for (const token of tokens) {
    const supported = await router.supportedTokens(token.address);
    const status = supported ? `${GREEN}✅${RESET}` : `${RESET}❌`;
    console.log(`  ${status} ${token.name}: ${token.address}`);
  }

  console.log(`\n${BLUE}========================================${RESET}`);
  console.log(`${GREEN}ROUTER UPDATE COMPLETE${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  console.log(`${BLUE}Summary:${RESET}`);
  console.log(`  - Router: ${ROUTER_ADDRESS}`);
  console.log(`  - NOR Token: ${NEW_NOR_ADDRESS}`);
  console.log(`  - Status: Ready for cross-chain swaps\n`);

  console.log(`${BLUE}Try it:${RESET}`);
  console.log(`  1. Approve router: norToken.approve("${ROUTER_ADDRESS}", amount)`);
  console.log(`  2. Request swap: router.swapViaNorChain(NOR, USDT, amount, minOut)`);
  console.log(`  3. Watch validator service execute the swap automatically\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
