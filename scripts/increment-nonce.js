import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Send a tiny transaction to self to increment nonce
  const tx = await deployer.sendTransaction({
    to: deployer.address,
    value: ethers.parseEther("0.0001"),
    gasPrice: ethers.parseUnits("10", "gwei"),
  });

  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("✅ Nonce incremented");
}

main().catch(console.error);
