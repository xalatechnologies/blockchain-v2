import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
    console.log("\n🔒 LOCKING ALL LP TOKENS");
    console.log("=".repeat(70));

    // Load deployment info
    const timelockInfo = JSON.parse(
        fs.readFileSync("docs/deployment-logs/all-lp-timelocks.json", "utf8")
    );

    console.log("\n📍 Timelocks:");
    console.log("  XHT/USDT:", timelockInfo.timelocks["XHT/USDT"].timelockContract);
    console.log("  XHT/BNB:", timelockInfo.timelocks["XHT/BNB"].timelockContract);
    console.log("  XHT/ETH:", timelockInfo.timelocks["XHT/ETH"].timelockContract);

    // Connect to Xaheen Chain
    const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
    const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

    console.log("\n👤 Wallet:", wallet.address);

    // LP Token ABI
    const lpABI = [
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function totalSupply() view returns (uint256)"
    ];

    // Timelock ABI
    const timelockABI = [
        "function lockTokens(uint256 amount, uint256 lockDurationDays, string memory description) returns (uint256)"
    ];

    const pairs = [
        {
            name: "XHT/USDT",
            address: timelockInfo.timelocks["XHT/USDT"].lpToken,
            timelock: timelockInfo.timelocks["XHT/USDT"].timelockContract,
            description: "XHT/USDT LP Lock - 2 years"
        },
        {
            name: "XHT/BNB",
            address: timelockInfo.timelocks["XHT/BNB"].lpToken,
            timelock: timelockInfo.timelocks["XHT/BNB"].timelockContract,
            description: "XHT/BNB LP Lock - 2 years"
        },
        {
            name: "XHT/ETH",
            address: timelockInfo.timelocks["XHT/ETH"].lpToken,
            timelock: timelockInfo.timelocks["XHT/ETH"].timelockContract,
            description: "XHT/ETH LP Lock - 2 years"
        }
    ];

    const lockDuration = 730; // 2 years
    const lockResults = [];

    for (const pair of pairs) {
        console.log("\n" + "=".repeat(70));
        console.log(`🔒 LOCKING ${pair.name} LP TOKENS`);
        console.log("=".repeat(70));

        const lpToken = new ethers.Contract(pair.address, lpABI, wallet);

        // Get balance
        const balance = await lpToken.balanceOf(wallet.address);
        console.log(`\n💰 Your ${pair.name} LP balance:`, ethers.formatEther(balance));

        if (balance === 0n) {
            console.log(`⚠️  No LP tokens to lock for ${pair.name}`);
            continue;
        }

        // Calculate amount to lock (lock 95%, keep 5% for future operations)
        const amountToLock = (balance * 95n) / 100n;
        console.log(`📊 Amount to lock (95%):`, ethers.formatEther(amountToLock));

        // Create timelock contract instance for this pair
        const timelock = new ethers.Contract(pair.timelock, timelockABI, wallet);

        // Approve
        console.log(`\n📝 STEP 1/2: Approving ${pair.name} LP tokens...`);
        const approveTx = await lpToken.approve(pair.timelock, amountToLock);
        await approveTx.wait();
        console.log("✅ Approved");

        // Lock
        console.log(`\n📝 STEP 2/2: Locking ${pair.name} LP tokens...`);
        console.log(`  Lock duration: ${lockDuration} days (2 years)`);
        console.log(`  Unlock date: ${new Date(Date.now() + lockDuration * 24 * 60 * 60 * 1000).toISOString()}`);

        const lockTx = await timelock.lockTokens(
            amountToLock,
            lockDuration,
            pair.description
        );
        console.log("  Transaction:", lockTx.hash);
        const receipt = await lockTx.wait();
        console.log(`✅ ${pair.name} LP tokens locked!`);

        lockResults.push({
            pair: pair.name,
            pairAddress: pair.address,
            timelockContract: pair.timelock,
            amountLocked: ethers.formatEther(amountToLock),
            lockDurationDays: lockDuration,
            unlockDate: new Date(Date.now() + lockDuration * 24 * 60 * 60 * 1000).toISOString(),
            transaction: lockTx.hash,
            description: pair.description
        });
    }

    // Save lock info
    const lockInfo = {
        timestamp: new Date().toISOString(),
        network: "Xaheen Chain",
        beneficiary: wallet.address,
        locks: lockResults
    };

    fs.writeFileSync(
        "docs/deployment-logs/all-lp-locks.json",
        JSON.stringify(lockInfo, null, 2)
    );

    console.log("\n" + "=".repeat(70));
    console.log("💾 Lock info saved to: docs/deployment-logs/all-lp-locks.json");

    console.log("\n📊 LOCK SUMMARY:");
    for (const lock of lockResults) {
        console.log(`\n${lock.pair}:`);
        console.log(`  Amount: ${lock.amountLocked} LP tokens`);
        console.log(`  Duration: ${lock.lockDurationDays} days`);
        console.log(`  Unlock: ${lock.unlockDate}`);
        console.log(`  Tx: ${lock.transaction}`);
    }

    console.log("\n🔍 VERIFY ON EXPLORER:");
    for (const lock of lockResults) {
        console.log(`  ${lock.pair} Timelock: https://explorer.xaheen.org/address/${lock.timelockContract}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎉 ALL LP TOKENS LOCKED FOR 2 YEARS!");
    console.log("=".repeat(70));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error.message);
        console.error(error);
        process.exit(1);
    });
