import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
    console.log("\n💧 ADDING INITIAL XHT/USDT LIQUIDITY");
    console.log("=".repeat(70));

    // Load deployment addresses
    const dexDeployment = JSON.parse(
        fs.readFileSync("docs/deployment-logs/xaheen-dex-deployment.json", "utf8")
    );
    const usdtDeployment = JSON.parse(
        fs.readFileSync("docs/deployment-logs/test-usdt-deployment.json", "utf8")
    );

    const ROUTER_ADDRESS = dexDeployment.contracts.Router;
    const FACTORY_ADDRESS = dexDeployment.contracts.Factory;
    const WXHT_ADDRESS = dexDeployment.contracts.WXHT;
    const USDT_ADDRESS = usdtDeployment.contract.address;

    console.log("\n📍 Contract Addresses:");
    console.log("  Router:", ROUTER_ADDRESS);
    console.log("  Factory:", FACTORY_ADDRESS);
    console.log("  WXHT:", WXHT_ADDRESS);
    console.log("  USDT:", USDT_ADDRESS);

    // Connect to Xaheen Chain
    const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
    const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

    console.log("\n👤 Wallet:", wallet.address);

    // Check balances
    const xhtBalance = await provider.getBalance(wallet.address);
    console.log("\n💰 Current Balances:");
    console.log("  XHT:", ethers.formatEther(xhtBalance), "XHT");

    const usdt = new ethers.Contract(
        USDT_ADDRESS,
        ["function balanceOf(address) view returns (uint256)", "function approve(address,uint256) returns (bool)"],
        wallet
    );
    const usdtBalance = await usdt.balanceOf(wallet.address);
    console.log("  USDT:", ethers.formatUnits(usdtBalance, 18), "USDT");

    // Liquidity amounts for $10,000 total ($5k XHT + $5k USDT)
    // At $0.0000024/XHT: need 2,083,333,333 XHT (~2.08B)
    const XHT_AMOUNT = ethers.parseEther("2083333333"); // 2.08B XHT
    const USDT_AMOUNT = ethers.parseUnits("5000", 18);   // 5000 USDT

    console.log("\n📊 Liquidity to Add:");
    console.log("  XHT:", ethers.formatEther(XHT_AMOUNT), "XHT");
    console.log("  USDT:", ethers.formatUnits(USDT_AMOUNT, 18), "USDT");
    console.log("  Total Value: ~$10,000");
    console.log("  Target Price: $0.0000024 per XHT");

    // Verify sufficient balance
    if (xhtBalance < XHT_AMOUNT) {
        throw new Error("❌ Insufficient XHT balance");
    }
    if (usdtBalance < USDT_AMOUNT) {
        throw new Error("❌ Insufficient USDT balance");
    }

    console.log("\n✅ Balance check passed!");

    // Load router contract
    const router = new ethers.Contract(
        ROUTER_ADDRESS,
        [
            "function factory() view returns (address)",
            "function addLiquidityXHT(address token, uint amountTokenDesired, uint amountTokenMin, uint amountXHTMin, address to, uint deadline) payable returns (uint amountToken, uint amountXHT, uint liquidity)"
        ],
        wallet
    );

    // Step 1: Approve USDT
    console.log("\n📝 STEP 1/3: Approving USDT...");
    const approveTx = await usdt.approve(ROUTER_ADDRESS, USDT_AMOUNT);
    console.log("  Transaction:", approveTx.hash);
    await approveTx.wait();
    console.log("✅ USDT approved");

    // Step 2: Add liquidity
    console.log("\n📝 STEP 2/3: Adding liquidity...");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const slippage = 5; // 5% slippage tolerance

    const amountTokenMin = (USDT_AMOUNT * BigInt(100 - slippage)) / 100n;
    const amountXHTMin = (XHT_AMOUNT * BigInt(100 - slippage)) / 100n;

    console.log("  Slippage tolerance: 5%");
    console.log("  Deadline:", new Date(deadline * 1000).toISOString());

    const tx = await router.addLiquidityXHT(
        USDT_ADDRESS,
        USDT_AMOUNT,
        amountTokenMin,
        amountXHTMin,
        wallet.address,
        deadline,
        { value: XHT_AMOUNT, gasLimit: 5000000 }
    );

    console.log("  Transaction:", tx.hash);
    console.log("  ⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Liquidity added!");

    // Step 3: Get pair address and verify
    console.log("\n📝 STEP 3/3: Verifying pair...");

    const factory = new ethers.Contract(
        FACTORY_ADDRESS,
        ["function getPair(address,address) view returns (address)"],
        provider
    );

    const pairAddress = await factory.getPair(USDT_ADDRESS, WXHT_ADDRESS);
    console.log("  Pair Address:", pairAddress);

    if (pairAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("❌ Pair not created");
    }

    // Get pair reserves
    const pair = new ethers.Contract(
        pairAddress,
        [
            "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() view returns (address)",
            "function token1() view returns (address)",
            "function totalSupply() view returns (uint256)"
        ],
        provider
    );

    const reserves = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    const totalSupply = await pair.totalSupply();

    console.log("\n📊 PAIR INFO:");
    console.log("  Token0:", token0);
    console.log("  Token1:", token1);
    console.log("  Reserve0:", reserves[0].toString());
    console.log("  Reserve1:", reserves[1].toString());
    console.log("  LP Total Supply:", ethers.formatEther(totalSupply));

    // Calculate price
    let xhtReserve, usdtReserve;
    if (token0.toLowerCase() === WXHT_ADDRESS.toLowerCase()) {
        xhtReserve = reserves[0];
        usdtReserve = reserves[1];
    } else {
        xhtReserve = reserves[1];
        usdtReserve = reserves[0];
    }

    const pricePerXHT = (Number(usdtReserve) / Number(xhtReserve)).toFixed(10);
    console.log("\n💹 CURRENT PRICE:");
    console.log("  1 XHT =", pricePerXHT, "USDT");
    console.log("  Target was: $0.0000024");

    // Save liquidity info
    const liquidityInfo = {
        network: "Xaheen Chain",
        timestamp: new Date().toISOString(),
        pair: pairAddress,
        router: ROUTER_ADDRESS,
        factory: FACTORY_ADDRESS,
        tokens: {
            XHT: WXHT_ADDRESS,
            USDT: USDT_ADDRESS
        },
        reserves: {
            XHT: xhtReserve.toString(),
            USDT: usdtReserve.toString()
        },
        price: pricePerXHT,
        lpTokenSupply: totalSupply.toString(),
        transaction: receipt.hash,
        deployer: wallet.address
    };

    const liquidityPath = "docs/deployment-logs/xaheen-liquidity-deployed.json";
    fs.writeFileSync(liquidityPath, JSON.stringify(liquidityInfo, null, 2));

    console.log("\n💾 Liquidity info saved to:", liquidityPath);

    console.log("\n🎉 LIQUIDITY DEPLOYMENT COMPLETE!");

    console.log("\n🔍 VERIFY ON EXPLORER:");
    console.log("  Pair:", `https://explorer.xaheen.org/address/${pairAddress}`);
    console.log("  Transaction:", `https://explorer.xaheen.org/tx/${receipt.hash}`);

    console.log("\n💡 NEXT STEPS:");
    console.log("1. Lock LP tokens via Unicrypt:");
    console.log("   https://app.unicrypt.network/");
    console.log("\n2. Test a swap:");
    console.log("   node scripts/test-swap-xaheen.js");
    console.log("\n3. Announce on social media!");

    console.log("\n🚀 XaheenSwap is LIVE!");
    console.log("=".repeat(70));

    return liquidityInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error.message);
        console.error(error);
        process.exit(1);
    });
