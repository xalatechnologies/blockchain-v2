import pkg from "hardhat";
const { ethers } = pkg;

const WXHT_ABI = [
  "function balanceOf(address) view returns (uint256)"
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\nDeployer: ${deployer.address}`);

  const wxhtAddress = "0x26c0eaF731885b14c031cc50dB79b36458E0b355";
  const wxht = new ethers.Contract(wxhtAddress, WXHT_ABI, deployer);

  const balance = await wxht.balanceOf(deployer.address);
  const balanceFormatted = ethers.formatEther(balance);

  console.log(`\nWXHT Balance: ${balanceFormatted} WXHT`);
  console.log(`Target: 500000000 WXHT (500M)`);
  console.log(`Percentage: ${(Number(balanceFormatted) / 500000000 * 100).toFixed(2)}%`);

  const batches = Math.floor(Number(balanceFormatted) / 1000000);
  console.log(`Batches wrapped: ${batches}/500\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
