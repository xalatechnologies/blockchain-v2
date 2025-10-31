import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
import fs from "fs";

dotenvConfig();

const ROUTER_ADDRESS = "0x4A82C98A950125F17943F56273efae39dDe81763";
const FACTORY_ADDRESS = "0xe97D574A2e1B62f4d32C5cfeaFa8e6B99Da020fa";
const WXHT_ADDRESS = "0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c";

// Genesis tokens
const LITTLE_RABBIT = "0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05";
const BNB_TIGER = "0xAC68931B666E086E9de380CFDb0Fb5704a35dc2D";
const BTCBR = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
const USDT_Z = "0x4BE35Ec329343d7d9F548d42B0F8c17FFfe07db4";

async function main() {
  console.log("\n🚀 DEPLOYING COMPLETE XAHEEN ECOSYSTEM");
  console.log("======================================================================\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📍 Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 XHT Balance: ${ethers.formatEther(balance)} XHT\n`);

  const deploymentResults = {
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    dex: {
      factory: FACTORY_ADDRESS,
      router: ROUTER_ADDRESS,
      wxht: WXHT_ADDRESS
    },
    tokens: {
      littleRabbit: LITTLE_RABBIT,
      bnbTiger: BNB_TIGER,
      btcbr: BTCBR,
      usdtZ: USDT_Z
    },
    charity: null,
    crowdfunding: null,
    liquidityPairs: []
  };

  // Step 1: Deploy Charity Contract
  console.log("📝 STEP 1/3: Deploying XHT Charity Contract...");
  try {
    const CharityFactory = await ethers.getContractFactory("XHTCharity");
    const charity = await CharityFactory.deploy();
    await charity.waitForDeployment();
    const charityAddress = await charity.getAddress();
    deploymentResults.charity = charityAddress;
    console.log(`✅ Charity deployed: ${charityAddress}\n`);
  } catch (error) {
    console.error(`❌ Charity deployment failed: ${error.message}\n`);
  }

  // Step 2: Deploy Crowdfunding Contract
  console.log("📝 STEP 2/3: Deploying XHT Crowdfunding Contract...");
  try {
    const CrowdfundingFactory = await ethers.getContractFactory("XHTCrowdfunding");
    const crowdfunding = await CrowdfundingFactory.deploy();
    await crowdfunding.waitForDeployment();
    const crowdfundingAddress = await crowdfunding.getAddress();
    deploymentResults.crowdfunding = crowdfundingAddress;
    console.log(`✅ Crowdfunding deployed: ${crowdfundingAddress}\n`);
  } catch (error) {
    console.error(`❌ Crowdfunding deployment failed: ${error.message}\n`);
  }

  // Step 3: Add Liquidity for All Pairs
  console.log("📝 STEP 3/3: Adding Initial Liquidity for All Token Pairs...");
  console.log("This will create 4 main pairs:\n");
  console.log("  1. WXHT/Little Rabbit");
  console.log("  2. WXHT/Bnb Tiger");
  console.log("  3. WXHT/BTCBR");
  console.log("  4. WXHT/USDT.z\n");

  const router = await ethers.getContractAt("XaheenDEXRouter", ROUTER_ADDRESS);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  // Liquidity amounts (conservative for testing)
  const liquidityPairs = [
    {
      name: "WXHT/Little Rabbit",
      tokenAddress: LITTLE_RABBIT,
      xhtAmount: ethers.parseEther("1000"), // 1,000 XHT
      tokenAmount: ethers.parseUnits("1000000", 18), // 1M Little Rabbit (18 decimals)
    },
    {
      name: "WXHT/Bnb Tiger",
      tokenAddress: BNB_TIGER,
      xhtAmount: ethers.parseEther("1000"), // 1,000 XHT
      tokenAmount: ethers.parseUnits("1000000", 24), // 1M Bnb Tiger (24 decimals)
    },
    {
      name: "WXHT/BTCBR",
      tokenAddress: BTCBR,
      xhtAmount: ethers.parseEther("1000"), // 1,000 XHT
      tokenAmount: ethers.parseUnits("1000000", 24), // 1M BTCBR (24 decimals)
    },
    {
      name: "WXHT/USDT.z",
      tokenAddress: USDT_Z,
      xhtAmount: ethers.parseEther("1000"), // 1,000 XHT
      tokenAmount: ethers.parseUnits("1000000", 18), // 1M USDT.z (18 decimals)
    }
  ];

  for (const pair of liquidityPairs) {
    console.log(`\n  Adding liquidity for ${pair.name}...`);
    try {
      // Approve token
      const token = await ethers.getContractAt("IERC20", pair.tokenAddress);
      console.log(`    Approving ${pair.name.split('/')[1]}...`);
      const approveTx = await token.approve(ROUTER_ADDRESS, pair.tokenAmount);
      await approveTx.wait();
      console.log(`    ✅ Token approved`);

      // Add liquidity
      console.log(`    Adding liquidity with ${ethers.formatEther(pair.xhtAmount)} XHT...`);
      const liquidityTx = await router.addLiquidityETH(
        pair.tokenAddress,
        pair.tokenAmount,
        0, // min token amount (0 for initial liquidity)
        0, // min XHT amount (0 for initial liquidity)
        deployer.address,
        deadline,
        { value: pair.xhtAmount }
      );
      const receipt = await liquidityTx.wait();
      console.log(`    ✅ Liquidity added! TX: ${receipt.hash}`);

      // Get pair address
      const factory = await ethers.getContractAt("IUniswapV2Factory", FACTORY_ADDRESS);
      const pairAddress = await factory.getPair(WXHT_ADDRESS, pair.tokenAddress);
      console.log(`    📍 Pair address: ${pairAddress}`);

      deploymentResults.liquidityPairs.push({
        name: pair.name,
        pairAddress,
        tokenAddress: pair.tokenAddress,
        xhtAmount: ethers.formatEther(pair.xhtAmount),
        tokenAmount: pair.tokenAmount.toString(),
        txHash: receipt.hash
      });

    } catch (error) {
      console.error(`    ❌ Failed to add liquidity for ${pair.name}: ${error.message}`);
    }
  }

  // Calculate initial XHT price based on USDT.z pair
  console.log("\n💰 XHT PRICE ESTIMATION:");
  if (deploymentResults.liquidityPairs.find(p => p.name === "WXHT/USDT.z")) {
    const usdtPair = liquidityPairs.find(p => p.name === "WXHT/USDT.z");
    const xhtPrice = Number(ethers.formatUnits(usdtPair.tokenAmount, 18)) / Number(ethers.formatEther(usdtPair.xhtAmount));
    console.log(`  1 XHT = $${xhtPrice.toFixed(4)} USDT`);
    console.log(`  (Based on ${ethers.formatEther(usdtPair.xhtAmount)} XHT : ${ethers.formatUnits(usdtPair.tokenAmount, 18)} USDT.z)\n`);
    deploymentResults.xhtPrice = xhtPrice;
  }

  // Save deployment results
  const outputPath = "docs/deployment-logs/complete-ecosystem-deployment.json";
  fs.mkdirSync("docs/deployment-logs", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(deploymentResults, null, 2));
  console.log(`💾 Deployment results saved to: ${outputPath}\n`);

  // Summary
  console.log("======================================================================");
  console.log("🎉 ECOSYSTEM DEPLOYMENT COMPLETE!\n");
  console.log("📊 DEPLOYED CONTRACTS:");
  if (deploymentResults.charity) {
    console.log(`  Charity: ${deploymentResults.charity}`);
  }
  if (deploymentResults.crowdfunding) {
    console.log(`  Crowdfunding: ${deploymentResults.crowdfunding}`);
  }
  console.log(`\n💧 LIQUIDITY PAIRS CREATED: ${deploymentResults.liquidityPairs.length}/4`);
  deploymentResults.liquidityPairs.forEach((pair, index) => {
    console.log(`  ${index + 1}. ${pair.name}`);
    console.log(`     Pair: ${pair.pairAddress}`);
    console.log(`     Liquidity: ${pair.xhtAmount} XHT`);
  });
  console.log("\n======================================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
