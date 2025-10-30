import hre from "hardhat";
const { ethers } = hre;

async function main() {
    const [deployer] = await ethers.getSigners();

    const OFFICIAL_WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

    const wbnbABI = [
        "function balanceOf(address) view returns (uint256)"
    ];

    const wbnb = new ethers.Contract(OFFICIAL_WBNB, wbnbABI, deployer);

    const bnbBalance = await ethers.provider.getBalance(deployer.address);
    const wbnbBalance = await wbnb.balanceOf(deployer.address);

    console.log("\n💰 BALANCE BREAKDOWN");
    console.log("Address:", deployer.address);
    console.log("\nBNB:", ethers.formatEther(bnbBalance), "BNB");
    console.log("WBNB:", ethers.formatEther(wbnbBalance), "WBNB");
    console.log("\nTotal:", ethers.formatEther(BigInt(bnbBalance) + BigInt(wbnbBalance)), "BNB equivalent");
    console.log("USD value (@ $720/BNB): $" + (parseFloat(ethers.formatEther(BigInt(bnbBalance) + BigInt(wbnbBalance))) * 720).toFixed(2));

    if (wbnbBalance > 0) {
        console.log("\n💡 You have WBNB that can be:");
        console.log("  1. Unwrapped back to BNB");
        console.log("  2. Used directly for liquidity");
    }
}

main();
