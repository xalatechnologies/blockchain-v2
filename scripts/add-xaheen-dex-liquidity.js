import hre from "hardhat";
const { ethers } = hre;

/**
 * ADD LIQUIDITY TO XAHEEN NATIVE DEX
 *
 * Adds liquidity to the XHT/BTCBR pair on Xaheen's native DEX
 * This enables trading directly on Xaheen chain without bridging to BSC
 */

async function main() {
    console.log("\n💧 ADDING LIQUIDITY TO XAHEEN NATIVE DEX");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer:", deployer.address);

    // Deployed contract addresses from previous deployment
    const WXHT_ADDRESS = "0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651";
    const ROUTER_ADDRESS = "0x0D8e7Ed1B328302bbAA0249CeFD6ca52E050F86e";
    const BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
    const PAIR_ADDRESS = "0x96BEFeb7cE1a6545f0288F62b314f26852999A9B";

    // ABIs
    const routerABI = [
        "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
        "function addLiquidityXHT(address token, uint amountTokenDesired, uint amountTokenMin, uint amountXHTMin, address to, uint deadline) external payable returns (uint amountToken, uint amountXHT, uint liquidity)"
    ];

    const btcbrABI = [
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
    ];

    const wxhtABI = [
        "function deposit() external payable",
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
    ];

    const pairABI = [
        "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
        "function token0() external view returns (address)",
        "function token1() external view returns (address)"
    ];

    // Get contracts
    const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, deployer);
    const btcbr = new ethers.Contract(BTCBR_ADDRESS, btcbrABI, deployer);
    const wxht = new ethers.Contract(WXHT_ADDRESS, wxhtABI, deployer);
    const pair = new ethers.Contract(PAIR_ADDRESS, pairABI, deployer);

    // Check balances
    const xhtBalance = await ethers.provider.getBalance(deployer.address);
    const btcbrBalance = await btcbr.balanceOf(deployer.address);

    console.log("\n💰 CURRENT BALANCES:");
    console.log("  XHT:", ethers.formatEther(xhtBalance), "XHT");
    console.log("  BTCBR:", ethers.formatEther(btcbrBalance), "BTCBR");

    // Check if pair already has liquidity
    try {
        const [reserve0, reserve1] = await pair.getReserves();
        const token0 = await pair.token0();
        const token1 = await pair.token1();

        console.log("\n📊 CURRENT PAIR RESERVES:");
        console.log("  Token0 (" + token0 + "):", ethers.formatEther(reserve0));
        console.log("  Token1 (" + token1 + "):", ethers.formatEther(reserve1));

        if (reserve0 > 0n || reserve1 > 0n) {
            console.log("\n✅ Pair already has liquidity!");
            return;
        }
    } catch (error) {
        console.log("\n📝 Pair has no liquidity yet (expected for first time)");
    }

    // Liquidity amounts (use 10,000 XHT and 10,000 BTCBR)
    const xhtAmount = ethers.parseEther("10000");
    const btcbrAmount = ethers.parseEther("10000");

    console.log("\n💧 LIQUIDITY TO ADD:");
    console.log("  XHT:", ethers.formatEther(xhtAmount), "XHT");
    console.log("  BTCBR:", ethers.formatEther(btcbrAmount), "BTCBR");

    if (xhtBalance < xhtAmount) {
        console.log("\n❌ Insufficient XHT balance");
        return;
    }

    if (btcbrBalance < btcbrAmount) {
        console.log("\n❌ Insufficient BTCBR balance");
        return;
    }

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    console.log("\n[1/2] Approving BTCBR...");
    const approveTx = await btcbr.approve(ROUTER_ADDRESS, btcbrAmount);
    await approveTx.wait();
    console.log("  ✅ BTCBR approved");

    console.log("\n[2/2] Adding liquidity with addLiquidityXHT...");
    console.log("  Using native XHT (not WXHT) for liquidity");

    try {
        const addLiqTx = await router.addLiquidityXHT(
            BTCBR_ADDRESS,
            btcbrAmount,
            0, // Accept any amount of BTCBR
            0, // Accept any amount of XHT
            deployer.address,
            deadline,
            {
                value: xhtAmount,
                gasLimit: 500000
            }
        );

        console.log("  📤 Transaction sent:", addLiqTx.hash);
        console.log("  ⏳ Waiting for confirmation...");

        const receipt = await addLiqTx.wait();
        console.log("  ✅ Liquidity added!");
        console.log("  🎉 Transaction confirmed!");

    } catch (error) {
        console.log("\n❌ Error adding liquidity:", error.message);
        throw error;
    }

    // Check final pair reserves
    const [finalReserve0, finalReserve1] = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();

    console.log("\n📊 FINAL PAIR RESERVES:");
    console.log("  Token0 (" + token0 + "):", ethers.formatEther(finalReserve0));
    console.log("  Token1 (" + token1 + "):", ethers.formatEther(finalReserve1));

    console.log("\n" + "=".repeat(70));
    console.log("🎉 LIQUIDITY ADDED TO XAHEEN DEX!");
    console.log("=".repeat(70));

    console.log("\n📋 XAHEEN DEX INFO:");
    console.log("  Router:", ROUTER_ADDRESS);
    console.log("  XHT/BTCBR Pair:", PAIR_ADDRESS);
    console.log("  WXHT:", WXHT_ADDRESS);
    console.log("  BTCBR:", BTCBR_ADDRESS);

    console.log("\n✅ NOW YOU HAVE TWO DEXES:");
    console.log("  1. PancakeSwap on BSC (for real USD value)");
    console.log("  2. Native DEX on Xaheen (fast, cheap trades)");

    console.log("\n💡 TRADING OPTIONS:");
    console.log("  - Fast trades: Use Xaheen DEX (cheap gas, instant)");
    console.log("  - Cash out: Bridge to BSC → Trade on PancakeSwap");
    console.log("  - Arbitrage: Price differences between chains");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
