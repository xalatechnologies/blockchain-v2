import hre from "hardhat";
const { ethers } = hre;

async function main() {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("\n💰 Current BSC Balance");
    console.log("Address:", deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "BNB");
    console.log("USD value (@ $720/BNB): $" + (parseFloat(ethers.formatEther(balance)) * 720).toFixed(2));
}

main();
