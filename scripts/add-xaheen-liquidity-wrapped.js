import hre from "hardhat";
const { ethers } = hre;

/**
 * ADD LIQUIDITY TO XAHEEN DEX WITH WRAPPED XHT
 *
 * Wraps XHT to WXHT first, then adds liquidity using addLiquidity (ERC20 + ERC20)
 */

async function main() {
    console.log("\n💧 ADDING LIQUIDITY TO XAHEEN DEX (WRAPPED METHOD)");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer:", deployer.address);

    const WXHT_ADDRESS = "0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651";
    const ROUTER_ADDRESS = "0x0D8e7Ed1B328302bbAA0249CeFD6ca52E050F86e";
    const BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
    const PAIR_ADDRESS = "0x96BEFeb7cE1a6545f0288F62b314f26852999A9B";

    // ABIs
    const wxhtABI = [
        "function deposit() external payable",
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
    ];

    const btcbrABI = [
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
    ];

    const routerABI = [
        "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)"
    ];

    const pairABI = [
        "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
        "function token0() external view returns (address)",
        "function token1() external view returns (address)"
    ];

    const wxht = new ethers.Contract(WXHT_ADDRESS, wxhtABI, deployer);
    const btcbr = new ethers.Contract(BTCBR_ADDRESS, btcbrABI, deployer);
    const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, deployer);
    const pair = new ethers.Contract(PAIR_ADDRESS, pairABI, deployer);

    // Check balances
    const xhtBalance = await ethers.provider.getBalance(deployer.address);
    const btcbrBalance = await btcbr.balanceOf(deployer.address);
    const wxhtBalance = await wxht.balanceOf(deployer.address);

    console.log("\n💰 CURRENT BALANCES:");
    console.log("  XHT:", ethers.formatEther(xhtBalance), "XHT");
    console.log("  BTCBR:", ethers.formatEther(btcbrBalance), "BTCBR");
    console.log("  WXHT:", ethers.formatEther(wxhtBalance), "WXHT");

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
        console.log("\n📝 Pair has no liquidity yet");
    }

    // Amounts: 10,000 XHT and 10,000 BTCBR
    const xhtAmount = ethers.parseEther("10000");
    const btcbrAmount = ethers.parseEther("10000");

    console.log("\n💧 LIQUIDITY TO ADD:");
    console.log("  XHT → WXHT:", ethers.formatEther(xhtAmount));
    console.log("  BTCBR:", ethers.formatEther(btcbrAmount));

    if (xhtBalance < xhtAmount) {
        console.log("\n❌ Insufficient XHT balance");
        return;
    }

    if (btcbrBalance < btcbrAmount) {
        console.log("\n❌ Insufficient BTCBR balance");
        return;
    }

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    // Step 1: Wrap XHT to WXHT
    console.log("\n[1/4] Wrapping XHT to WXHT...");
    const wrapTx = await wxht.deposit({ value: xhtAmount });
    await wrapTx.wait();
    console.log("  ✅ Wrapped", ethers.formatEther(xhtAmount), "XHT to WXHT");

    const newWxhtBalance = await wxht.balanceOf(deployer.address);
    console.log("  💰 WXHT balance:", ethers.formatEther(newWxhtBalance), "WXHT");

    // Step 2: Approve WXHT
    console.log("\n[2/4] Approving WXHT for router...");
    const approveWxhtTx = await wxht.approve(ROUTER_ADDRESS, xhtAmount);
    await approveWxhtTx.wait();
    console.log("  ✅ WXHT approved");

    // Step 3: Approve BTCBR
    console.log("\n[3/4] Approving BTCBR for router...");
    const approveBtcbrTx = await btcbr.approve(ROUTER_ADDRESS, btcbrAmount);
    await approveBtcbrTx.wait();
    console.log("  ✅ BTCBR approved");

    // Step 4: Add liquidity
    console.log("\n[4/4] Adding liquidity to DEX...");
    console.log("  WXHT:", ethers.formatEther(xhtAmount));
    console.log("  BTCBR:", ethers.formatEther(btcbrAmount));

    try {
        const addLiqTx = await router.addLiquidity(
            WXHT_ADDRESS,
            BTCBR_ADDRESS,
            xhtAmount,
            btcbrAmount,
            0, // Accept any amount
            0, // Accept any amount
            deployer.address,
            deadline,
            {
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

    console.log("\n📋 SUMMARY:");
    console.log("  ✅ Native DEX deployed on Xaheen");
    console.log("  ✅ WXHT/BTCBR pair created");
    console.log("  ✅ Liquidity added (10,000 WXHT + 10,000 BTCBR)");
    console.log("\n  Router:", ROUTER_ADDRESS);
    console.log("  Pair:", PAIR_ADDRESS);

    console.log("\n💡 NOW YOUR USERS CAN:");
    console.log("  - Trade XHT ↔ BTCBR on Xaheen (cheap gas)");
    console.log("  - Bridge BTCBR to BSC for real USD value");
    console.log("  - Trade on PancakeSwap for cash out");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
