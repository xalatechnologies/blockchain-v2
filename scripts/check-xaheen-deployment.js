import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("\n🔍 XAHEEN CHAIN DEPLOYMENT STATUS CHECK");
    console.log("=".repeat(70));

    // Connect to Xaheen Chain
    const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
    const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

    console.log("\n📍 Wallet:", wallet.address);

    // Check XHT balance
    const xhtBalance = await provider.getBalance(wallet.address);
    console.log("💰 XHT Balance:", ethers.formatEther(xhtBalance), "XHT");
    console.log("   In Wei:", xhtBalance.toString());

    // Check block number
    const blockNumber = await provider.getBlockNumber();
    console.log("\n⛓️  Current Block:", blockNumber);

    // Check network
    const network = await provider.getNetwork();
    console.log("🌐 Chain ID:", network.chainId.toString());

    console.log("\n📊 CHECKING FOR DEPLOYED CONTRACTS...\n");

    // Common contract addresses to check (update these if you know them)
    const knownAddresses = {
        "WXHT (Wrapped XHT)": "0x...", // Update with actual address
        "XaheenSwap Factory": "0x...", // Update with actual address
        "XaheenSwap Router": "0x...",  // Update with actual address
        "BTCBR (Bridged)": "0x0cF8e180350253271f4b917CcFb0aCCc4862F262", // From genesis
        "USDT (Bridged)": "0x...",     // Update if deployed
    };

    for (const [name, address] of Object.entries(knownAddresses)) {
        if (address === "0x...") {
            console.log(`⏸️  ${name}: Not configured`);
            continue;
        }

        try {
            const code = await provider.getCode(address);
            if (code === "0x" || code === "0x0") {
                console.log(`❌ ${name}: No contract at ${address}`);
            } else {
                console.log(`✅ ${name}: Deployed at ${address}`);
                console.log(`   Code length: ${code.length} bytes`);
            }
        } catch (error) {
            console.log(`❌ ${name}: Error checking ${address}`);
        }
    }

    console.log("\n🔍 CHECKING GENESIS BTCBR CONTRACT...");
    const btcbrAddress = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
    const btcbrCode = await provider.getCode(btcbrAddress);

    if (btcbrCode !== "0x" && btcbrCode !== "0x0") {
        console.log("✅ BTCBR contract exists in genesis!");
        console.log("   Address:", btcbrAddress);

        // Try to check BTCBR balance
        try {
            const btcbrContract = new ethers.Contract(
                btcbrAddress,
                ["function balanceOf(address) view returns (uint256)"],
                provider
            );
            const balance = await btcbrContract.balanceOf(wallet.address);
            console.log("   Your Balance:", ethers.formatEther(balance), "BTCBR");
        } catch (error) {
            console.log("   Balance check failed (might need different ABI)");
        }
    } else {
        console.log("❌ BTCBR contract not found at genesis address");
    }

    console.log("\n💡 NEXT STEPS:");
    console.log("1. If DEX contracts not deployed, deploy them:");
    console.log("   node scripts/deploy-xaheen-dex.js");
    console.log("\n2. If USDT not available, either:");
    console.log("   a) Deploy test USDT: node scripts/deploy-test-usdt.js");
    console.log("   b) Bridge real USDT from BSC");
    console.log("\n3. Once ready, add liquidity:");
    console.log("   node scripts/add-initial-liquidity-xaheen.js");

    console.log("\n" + "=".repeat(70));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
