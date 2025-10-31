import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
    console.log("\n🔐 DEPLOYING LP TOKEN TIMELOCK CONTRACT");
    console.log("=".repeat(70));

    // Load liquidity info
    const liquidityInfo = JSON.parse(
        fs.readFileSync("docs/deployment-logs/xaheen-liquidity-deployed.json", "utf8")
    );

    const LP_TOKEN_ADDRESS = liquidityInfo.pair;
    const BENEFICIARY_ADDRESS = liquidityInfo.deployer; // Deployer is beneficiary

    console.log("\n📍 Configuration:");
    console.log("  LP Token:", LP_TOKEN_ADDRESS);
    console.log("  Beneficiary:", BENEFICIARY_ADDRESS);

    // Connect to Xaheen Chain
    const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
    const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

    console.log("\n👤 Deployer:", wallet.address);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log("  Balance:", ethers.formatEther(balance), "XHT");

    if (balance < ethers.parseEther("0.1")) {
        throw new Error("❌ Insufficient balance for deployment (need at least 0.1 XHT)");
    }

    console.log("\n📝 DEPLOYING CONTRACT...");

    // Deploy timelock contract
    const LPTokenTimelock = await ethers.getContractFactory(
        "contracts/governance/LPTokenTimelock.sol:LPTokenTimelock",
        wallet
    );

    console.log("  ⏳ Deploying LPTokenTimelock...");

    const timelock = await LPTokenTimelock.deploy(LP_TOKEN_ADDRESS, BENEFICIARY_ADDRESS, {
        gasLimit: 3000000
    });

    await timelock.waitForDeployment();

    const timelockAddress = await timelock.getAddress();

    console.log("  ✅ LPTokenTimelock deployed!");
    console.log("  Contract:", timelockAddress);

    // Verify deployment
    console.log("\n🔍 VERIFYING DEPLOYMENT...");

    const lpToken = await timelock.lpToken();
    const beneficiary = await timelock.beneficiary();
    const totalLocked = await timelock.totalLocked();
    const totalLocks = await timelock.getTotalLocks();

    console.log("  LP Token:", lpToken);
    console.log("  Beneficiary:", beneficiary);
    console.log("  Total Locked:", ethers.formatEther(totalLocked), "LP tokens");
    console.log("  Total Locks:", totalLocks.toString());

    // Verify configuration
    if (lpToken.toLowerCase() !== LP_TOKEN_ADDRESS.toLowerCase()) {
        throw new Error("❌ LP token address mismatch!");
    }
    if (beneficiary.toLowerCase() !== BENEFICIARY_ADDRESS.toLowerCase()) {
        throw new Error("❌ Beneficiary address mismatch!");
    }

    console.log("  ✅ Configuration verified!");

    console.log("\n✅ DEPLOYMENT SUCCESSFUL!");

    // Save deployment info
    const deploymentInfo = {
        network: "Xaheen Chain",
        timestamp: new Date().toISOString(),
        contract: {
            name: "LPTokenTimelock",
            address: timelockAddress,
            lpToken: lpToken,
            beneficiary: beneficiary
        },
        configuration: {
            emergencyDelay: "7 days",
            totalLocked: ethers.formatEther(totalLocked) + " LP tokens",
            totalLocks: totalLocks.toString()
        },
        deployer: wallet.address,
        verificationUrl: `https://explorer.xaheen.org/address/${timelockAddress}`
    };

    fs.writeFileSync(
        "docs/deployment-logs/lp-timelock-deployment.json",
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n💾 Deployment info saved to: docs/deployment-logs/lp-timelock-deployment.json");

    console.log("\n🔗 VERIFICATION:");
    console.log("  Contract:", `https://explorer.xaheen.org/address/${timelockAddress}`);

    console.log("\n💡 NEXT STEPS:");
    console.log("  1. Verify contract on explorer (optional)");
    console.log("  2. Approve LP tokens for timelock contract:");
    console.log("     node scripts/approve-lp-for-lock.js");
    console.log("  3. Lock LP tokens:");
    console.log("     node scripts/lock-lp-tokens.js");
    console.log("  4. Verify lock on explorer");
    console.log("  5. Announce lock publicly");

    console.log("\n" + "=".repeat(70));
    console.log("🔐 TIMELOCK CONTRACT READY!");
    console.log("=".repeat(70));

    return deploymentInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error.message);
        console.error(error);
        process.exit(1);
    });
