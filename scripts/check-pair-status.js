import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("\n🔍 CHECKING PAIR STATUS");
    console.log("=".repeat(70));

    const PAIR_ADDRESS = "0x96BEFeb7cE1a6545f0288F62b314f26852999A9B";
    const WXHT_ADDRESS = "0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651";
    const BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";

    const pairABI = [
        "function token0() external view returns (address)",
        "function token1() external view returns (address)",
        "function factory() external view returns (address)",
        "function revenueContract() external view returns (address)",
        "function getReserves() external view returns (uint256 reserve0, uint256 reserve1, uint256 blockTimestampLast)"
    ];

    const pair = new ethers.Contract(PAIR_ADDRESS, pairABI, ethers.provider);

    console.log("\n📍 Pair Address:", PAIR_ADDRESS);

    try {
        const token0 = await pair.token0();
        const token1 = await pair.token1();
        const factory = await pair.factory();
        const revenueContract = await pair.revenueContract();
        const [reserve0, reserve1, timestamp] = await pair.getReserves();

        console.log("\n✅ PAIR DETAILS:");
        console.log("  Token0:", token0);
        console.log("  Token1:", token1);
        console.log("  Factory:", factory);
        console.log("  Revenue Contract:", revenueContract);
        console.log("\n📊 RESERVES:");
        console.log("  Reserve0:", ethers.formatEther(reserve0));
        console.log("  Reserve1:", ethers.formatEther(reserve1));
        console.log("  Last Update:", new Date(Number(timestamp) * 1000).toLocaleString());

        console.log("\n🔍 TOKEN IDENTIFICATION:");
        console.log("  WXHT should be:", WXHT_ADDRESS);
        console.log("  BTCBR should be:", BTCBR_ADDRESS);

        if (token0 === "0x0000000000000000000000000000000000000000") {
            console.log("\n❌ PROBLEM: Pair not initialized! token0 is zero address");
        } else {
            console.log("\n✅ Pair is initialized");
        }

    } catch (error) {
        console.log("\n❌ ERROR:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
