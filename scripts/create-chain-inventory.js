import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("📋 NOOR CHAIN COMPLETE INVENTORY");
  console.log("=".repeat(80));
  console.log("\n🔍 Gathering comprehensive chain data...\n");

  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;

  let inventory = {
    timestamp: new Date().toISOString(),
    chainInfo: {},
    genesis: {},
    validators: {},
    contracts: {},
    liquidity: {},
    transactions: {},
    issues: {},
    statistics: {}
  };

  // ==========================================
  // CHAIN INFO
  // ==========================================
  console.log("=".repeat(80));
  console.log("🌐 CHAIN INFORMATION");
  console.log("=".repeat(80));

  const network = await provider.getNetwork();
  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);
  const gasPrice = await provider.getFeeData();

  inventory.chainInfo = {
    name: "Noor Chain",
    chainId: Number(network.chainId),
    rpcUrl: "https://rpc.noorchain.org",
    explorerUrl: "https://explorer.noorchain.org",
    currentBlock: blockNumber,
    blockTime: 3, // seconds
    consensus: "Parlia PoSA",
    timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
    gasPrice: ethers.formatUnits(gasPrice.gasPrice, "gwei") + " gwei"
  };

  console.log("  Chain ID:", inventory.chainInfo.chainId);
  console.log("  Current Block:", inventory.chainInfo.currentBlock);
  console.log("  Block Timestamp:", inventory.chainInfo.timestamp);
  console.log("  Gas Price:", inventory.chainInfo.gasPrice);

  // ==========================================
  // GENESIS CONFIGURATION
  // ==========================================
  console.log("\n" + "=".repeat(80));
  console.log("🌱 GENESIS CONFIGURATION");
  console.log("=".repeat(80));

  const genesisFiles = fs.readdirSync("./data").filter(f => f.startsWith("genesis"));
  console.log("\n📁 Genesis Files Found:", genesisFiles.length);
  genesisFiles.forEach(f => console.log("   -", f));

  // Load active genesis (genesis-clean.json or latest)
  let genesis;
  try {
    genesis = JSON.parse(fs.readFileSync("./data/genesis-clean.json", "utf8"));
    console.log("\n✅ Active Genesis: genesis-clean.json");
  } catch (e) {
    genesis = JSON.parse(fs.readFileSync("./data/genesis.json", "utf8"));
    console.log("\n✅ Active Genesis: genesis.json");
  }

  inventory.genesis = {
    chainId: genesis.config.chainId,
    consensus: "Parlia PoSA",
    epochLength: genesis.config.parlia?.epoch || "unknown",
    blockPeriod: genesis.config.parlia?.period || 3,
    gasLimit: parseInt(genesis.gasLimit, 16),
    difficulty: parseInt(genesis.difficulty, 16),
    preFundedAccounts: Object.keys(genesis.alloc || {}).length,
    genesisValidators: []
  };

  // Extract validators from extraData
  if (genesis.extraData && genesis.extraData.length > 66) {
    const validatorsHex = genesis.extraData.slice(66, -130);
    for (let i = 0; i < validatorsHex.length; i += 40) {
      const validator = "0x" + validatorsHex.slice(i, i + 40);
      inventory.genesis.genesisValidators.push(validator);
    }
  }

  console.log("  Epoch Length:", inventory.genesis.epochLength);
  console.log("  Block Period:", inventory.genesis.blockPeriod, "seconds");
  console.log("  Gas Limit:", inventory.genesis.gasLimit.toLocaleString());
  console.log("  Genesis Validators:", inventory.genesis.genesisValidators.length);
  inventory.genesis.genesisValidators.forEach((v, i) => {
    console.log(`    ${i + 1}. ${v}`);
  });

  // ==========================================
  // DEPLOYED CONTRACTS
  // ==========================================
  console.log("\n" + "=".repeat(80));
  console.log("📜 DEPLOYED CONTRACTS");
  console.log("=".repeat(80));

  let deployment;
  try {
    deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));
  } catch (e) {
    deployment = { contracts: {}, funds: {} };
  }

  inventory.contracts = {
    tokens: {},
    dex: {},
    funds: {},
    reserves: {},
    governance: {}
  };

  // Tokens
  console.log("\n💰 TOKENS:");
  const tokens = {
    NOR: deployment.contracts?.NOR_TOKEN,
    DIRHAMAT: deployment.contracts?.DIRHAMAT,
    WUSDT: deployment.contracts?.WUSDT,
    WBNB: deployment.contracts?.WBNB,
    WETH: deployment.contracts?.WETH,
    WNOR: deployment.contracts?.WNOR
  };

  for (const [name, address] of Object.entries(tokens)) {
    if (address) {
      try {
        const code = await provider.getCode(address);
        const exists = code !== "0x";
        inventory.contracts.tokens[name] = { address, deployed: exists };
        console.log(`  ${name}: ${address} ${exists ? "✅" : "❌"}`);

        if (exists) {
          try {
            const token = await ethers.getContractAt("IERC20", address);
            const supply = await token.totalSupply();
            const balance = await token.balanceOf(deployer.address);
            inventory.contracts.tokens[name].totalSupply = ethers.formatEther(supply);
            inventory.contracts.tokens[name].deployerBalance = ethers.formatEther(balance);
            console.log(`         Supply: ${ethers.formatEther(supply)}`);
            console.log(`         Deployer Balance: ${ethers.formatEther(balance)}`);
          } catch (e) {
            console.log(`         (Could not read token data)`);
          }
        }
      } catch (e) {
        console.log(`  ${name}: ${address} ⚠️  (Error checking)`);
      }
    }
  }

  // DEX
  console.log("\n🔄 DEX CONTRACTS:");
  const dexContracts = {
    Factory: deployment.contracts?.NOORSWAP_FACTORY,
    Router: deployment.contracts?.NOORSWAP_ROUTER,
    LiquidityLock: deployment.contracts?.LIQUIDITY_LOCK
  };

  for (const [name, address] of Object.entries(dexContracts)) {
    if (address) {
      const code = await provider.getCode(address);
      const exists = code !== "0x";
      inventory.contracts.dex[name] = { address, deployed: exists };
      console.log(`  ${name}: ${address} ${exists ? "✅" : "❌"}`);
    }
  }

  // Funds
  console.log("\n🏦 FUND CONTRACTS:");
  const fundContracts = {
    Factory: deployment.funds?.FACTORY,
    GoldSavingsFund: deployment.funds?.GOLD_SAVINGS_FUND
  };

  for (const [name, address] of Object.entries(fundContracts)) {
    if (address) {
      const code = await provider.getCode(address);
      const exists = code !== "0x";
      inventory.contracts.funds[name] = { address, deployed: exists };
      console.log(`  ${name}: ${address} ${exists ? "✅" : "❌"}`);
    }
  }

  // ==========================================
  // LIQUIDITY ANALYSIS
  // ==========================================
  console.log("\n" + "=".repeat(80));
  console.log("💧 LIQUIDITY ANALYSIS");
  console.log("=".repeat(80));

  // Read deployment summary
  const summaryFiles = fs.readdirSync("./docs").filter(f =>
    f.includes("DEPLOYMENT") || f.includes("SUMMARY") || f.includes("SESSION")
  );

  console.log("\n📄 Deployment Documentation:");
  summaryFiles.forEach(f => console.log("   -", f));

  // Extract liquidity info from SESSION_COMPLETE_SUMMARY.md if exists
  try {
    const summary = fs.readFileSync("./docs/SESSION_COMPLETE_SUMMARY.md", "utf8");

    // Parse liquidity data
    const liquidityMatch = summary.match(/DEX Liquidity.*?\$([0-9,]+)/);
    const lockDurationMatch = summary.match(/([0-9]+)[- ]month LP locks/i);
    const pairsMatch = summary.match(/([0-9]+) pairs live/i) || summary.match(/([0-9]+) Active Trading Pairs/);

    inventory.liquidity = {
      totalValue: liquidityMatch ? "$" + liquidityMatch[1] : "Unknown",
      lockDuration: lockDurationMatch ? lockDurationMatch[1] + " months" : "Unknown",
      activePairs: pairsMatch ? parseInt(pairsMatch[1]) : 0,
      unlockDate: "November 1, 2028"
    };

    console.log("\n  Total Liquidity:", inventory.liquidity.totalValue);
    console.log("  Lock Duration:", inventory.liquidity.lockDuration);
    console.log("  Active Pairs:", inventory.liquidity.activePairs);
    console.log("  Unlock Date:", inventory.liquidity.unlockDate);
  } catch (e) {
    console.log("\n  ⚠️  Liquidity data not available");
  }

  // ==========================================
  // TRANSACTION ANALYSIS
  // ==========================================
  console.log("\n" + "=".repeat(80));
  console.log("📊 TRANSACTION ANALYSIS");
  console.log("=".repeat(80));

  const latestBlocks = Math.min(100, blockNumber);
  let txCount = 0;
  let gasUsed = 0n;

  console.log(`\n  Analyzing last ${latestBlocks} blocks...`);

  for (let i = blockNumber - latestBlocks; i <= blockNumber; i++) {
    try {
      const block = await provider.getBlock(i, true);
      if (block && block.transactions) {
        txCount += block.transactions.length;
        gasUsed += block.gasUsed || 0n;
      }
    } catch (e) {
      // Skip error blocks
    }
  }

  inventory.transactions = {
    totalTransactions: txCount,
    averagePerBlock: (txCount / latestBlocks).toFixed(2),
    totalGasUsed: gasUsed.toString(),
    blocksAnalyzed: latestBlocks
  };

  console.log("  Total Transactions:", inventory.transactions.totalTransactions);
  console.log("  Average per Block:", inventory.transactions.averagePerBlock);
  console.log("  Total Gas Used:", ethers.formatUnits(gasUsed, "gwei"), "gwei");

  // ==========================================
  // ISSUES & RESOLUTIONS
  // ==========================================
  console.log("\n" + "=".repeat(80));
  console.log("⚠️  ISSUES ENCOUNTERED & RESOLUTIONS");
  console.log("=".repeat(80));

  inventory.issues = {
    blockCreation: [
      {
        issue: "Chain stalled at epoch boundary (block 10,000)",
        cause: "Epoch too short (10k blocks = 8 hours), caused frequent validator revalidation",
        resolution: "Extended epoch to 9,000,000 blocks (~1.5 years)",
        status: "✅ RESOLVED"
      },
      {
        issue: "Validators not peering correctly",
        cause: "NAT configuration and static-nodes.json issues",
        resolution: "Added --nat=none flag and properly configured static-nodes.json with correct enodes",
        status: "✅ RESOLVED"
      },
      {
        issue: "Blocks producing but then stopping",
        cause: "Genesis mismatch across validators, epoch boundary deadlock",
        resolution: "Synchronized genesis files, cleaned blockchain data, reinitialize d all validators with same genesis",
        status: "✅ RESOLVED"
      }
    ],
    contracts: [
      {
        issue: "NoorSwapPair deployment failed - minimum liquidity minting",
        cause: "OpenZeppelin ERC20 prevents minting to address(0)",
        resolution: "Changed to mint to address(0xdEaD) instead",
        status: "✅ RESOLVED",
        location: "contracts/dex/NoorSwapPair.sol:168"
      },
      {
        issue: "Dirhamat INSUFFICIENT_RESERVES error",
        cause: "Attempted to mint without proper backing",
        resolution: "Transferred $108k WUSDT as reserves before minting",
        status: "✅ RESOLVED"
      },
      {
        issue: "Fund access control error",
        cause: "Factory didn't transfer admin role to creator",
        resolution: "Added role transfer in NoorFundFactory.createFund()",
        status: "✅ RESOLVED",
        location: "contracts/funds/NoorFundFactory.sol:98-101"
      }
    ],
    infrastructure: [
      {
        issue: "SSL/HTTPS configuration for public RPC",
        cause: "Nginx reverse proxy configuration needed",
        resolution: "Configured Nginx with Let's Encrypt SSL for https://rpc.noorchain.org",
        status: "✅ RESOLVED"
      },
      {
        issue: "Docker network host mode required for validators",
        cause: "P2P discovery issues with bridge networking",
        resolution: "Used --network host for all validator containers",
        status: "✅ RESOLVED"
      }
    ]
  };

  console.log("\n📋 Block Creation Issues:");
  inventory.issues.blockCreation.forEach((issue, i) => {
    console.log(`\n  ${i + 1}. ${issue.issue}`);
    console.log(`     Cause: ${issue.cause}`);
    console.log(`     Resolution: ${issue.resolution}`);
    console.log(`     Status: ${issue.status}`);
  });

  console.log("\n📋 Smart Contract Issues:");
  inventory.issues.contracts.forEach((issue, i) => {
    console.log(`\n  ${i + 1}. ${issue.issue}`);
    console.log(`     Cause: ${issue.cause}`);
    console.log(`     Resolution: ${issue.resolution}`);
    if (issue.location) console.log(`     Location: ${issue.location}`);
    console.log(`     Status: ${issue.status}`);
  });

  // ==========================================
  // CHAIN STATISTICS
  // ==========================================
  console.log("\n" + "=".repeat(80));
  console.log("📈 CHAIN STATISTICS");
  console.log("=".repeat(80));

  const deployerBalance = await provider.getBalance(deployer.address);

  inventory.statistics = {
    totalBlocks: blockNumber,
    estimatedUptime: ((blockNumber * 3) / 3600).toFixed(2) + " hours",
    deployerAddress: deployer.address,
    deployerBalance: ethers.formatEther(deployerBalance) + " NOR",
    activeValidators: inventory.genesis.genesisValidators.length,
    deployedContracts: Object.keys(deployment.contracts || {}).length + Object.keys(deployment.funds || {}).length,
    totalValueLocked: "$3,336,000 (estimate)",
    documentation: {
      files: summaryFiles.length,
      totalLines: "1,500+"
    }
  };

  console.log("\n  Total Blocks:", inventory.statistics.totalBlocks);
  console.log("  Estimated Uptime:", inventory.statistics.estimatedUptime);
  console.log("  Deployer:", inventory.statistics.deployerAddress);
  console.log("  Deployer Balance:", inventory.statistics.deployerBalance);
  console.log("  Active Validators:", inventory.statistics.activeValidators);
  console.log("  Deployed Contracts:", inventory.statistics.deployedContracts);
  console.log("  Total Value Locked:", inventory.statistics.totalValueLocked);
  console.log("  Documentation Files:", inventory.statistics.documentation.files);

  // ==========================================
  // SAVE INVENTORY
  // ==========================================
  const inventoryPath = "./docs/NOOR_CHAIN_COMPLETE_INVENTORY.json";
  fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));

  console.log("\n" + "=".repeat(80));
  console.log("✅ INVENTORY COMPLETE");
  console.log("=".repeat(80));
  console.log("\n💾 Saved to:", inventoryPath);
  console.log("📄 Full JSON report available for detailed analysis");

  // Create human-readable markdown version
  const mdContent = `# 🌙 Noor Chain - Complete Inventory

**Generated:** ${inventory.timestamp}

---

## 🌐 Chain Information

- **Name:** ${inventory.chainInfo.name}
- **Chain ID:** ${inventory.chainInfo.chainId}
- **RPC URL:** ${inventory.chainInfo.rpcUrl}
- **Current Block:** ${inventory.chainInfo.currentBlock.toLocaleString()}
- **Block Time:** ${inventory.chainInfo.blockTime} seconds
- **Consensus:** ${inventory.chainInfo.consensus}
- **Gas Price:** ${inventory.chainInfo.gasPrice}

---

## 🌱 Genesis Configuration

- **Chain ID:** ${inventory.genesis.chainId}
- **Epoch Length:** ${inventory.genesis.epochLength} blocks
- **Block Period:** ${inventory.genesis.blockPeriod} seconds
- **Gas Limit:** ${inventory.genesis.gasLimit.toLocaleString()}
- **Genesis Validators:** ${inventory.genesis.genesisValidators.length}

### Validators
${inventory.genesis.genesisValidators.map((v, i) => `${i + 1}. \`${v}\``).join('\n')}

---

## 📜 Deployed Contracts

### 💰 Tokens
${Object.entries(inventory.contracts.tokens).map(([name, data]) =>
  `- **${name}:** \`${data.address}\` ${data.deployed ? '✅' : '❌'}${data.totalSupply ? `\n  - Supply: ${data.totalSupply}` : ''}`
).join('\n')}

### 🔄 DEX
${Object.entries(inventory.contracts.dex).map(([name, data]) =>
  `- **${name}:** \`${data.address}\` ${data.deployed ? '✅' : '❌'}`
).join('\n')}

### 🏦 Funds
${Object.entries(inventory.contracts.funds).map(([name, data]) =>
  `- **${name}:** \`${data.address}\` ${data.deployed ? '✅' : '❌'}`
).join('\n')}

---

## 💧 Liquidity

- **Total Value:** ${inventory.liquidity?.totalValue || 'Unknown'}
- **Lock Duration:** ${inventory.liquidity?.lockDuration || 'Unknown'}
- **Active Pairs:** ${inventory.liquidity?.activePairs || 0}
- **Unlock Date:** ${inventory.liquidity?.unlockDate || 'Unknown'}

---

## 📊 Transaction Statistics

- **Total Transactions:** ${inventory.transactions.totalTransactions.toLocaleString()}
- **Average per Block:** ${inventory.transactions.averagePerBlock}
- **Blocks Analyzed:** ${inventory.transactions.blocksAnalyzed}

---

## ⚠️ Issues & Resolutions

### Block Creation Issues
${inventory.issues.blockCreation.map((issue, i) => `
#### ${i + 1}. ${issue.issue}
- **Cause:** ${issue.cause}
- **Resolution:** ${issue.resolution}
- **Status:** ${issue.status}
`).join('\n')}

### Smart Contract Issues
${inventory.issues.contracts.map((issue, i) => `
#### ${i + 1}. ${issue.issue}
- **Cause:** ${issue.cause}
- **Resolution:** ${issue.resolution}
${issue.location ? `- **Location:** \`${issue.location}\`` : ''}
- **Status:** ${issue.status}
`).join('\n')}

### Infrastructure Issues
${inventory.issues.infrastructure.map((issue, i) => `
#### ${i + 1}. ${issue.issue}
- **Cause:** ${issue.cause}
- **Resolution:** ${issue.resolution}
- **Status:** ${issue.status}
`).join('\n')}

---

## 📈 Chain Statistics

- **Total Blocks:** ${inventory.statistics.totalBlocks.toLocaleString()}
- **Estimated Uptime:** ${inventory.statistics.estimatedUptime}
- **Deployer:** \`${inventory.statistics.deployerAddress}\`
- **Deployer Balance:** ${inventory.statistics.deployerBalance}
- **Active Validators:** ${inventory.statistics.activeValidators}
- **Deployed Contracts:** ${inventory.statistics.deployedContracts}
- **Total Value Locked:** ${inventory.statistics.totalValueLocked}

---

## 📚 Documentation

- **Files:** ${inventory.statistics.documentation.files}
- **Estimated Lines:** ${inventory.statistics.documentation.totalLines}

---

**Generated by Noor Chain Inventory System**
**Date:** ${new Date().toISOString()}
`;

  const mdPath = "./docs/NOOR_CHAIN_COMPLETE_INVENTORY.md";
  fs.writeFileSync(mdPath, mdContent);
  console.log("📄 Markdown version:", mdPath);

  console.log("\n🎉 Complete inventory generated!");
  console.log("   - JSON (detailed): NOOR_CHAIN_COMPLETE_INVENTORY.json");
  console.log("   - Markdown (readable): NOOR_CHAIN_COMPLETE_INVENTORY.md");

  return inventory;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Inventory failed:");
    console.error(error);
    process.exit(1);
  });
