import pkg from "hardhat";
const { ethers } = pkg;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const ADDRESSES = {
  WXHT: "0x26c0eaF731885b14c031cc50dB79b36458E0b355",
  Factory: "0x3f66b6118148c5661BfBC11e994300e78753Ff04",
  Router: "0xdb8D0D2b28E9f33d750304CaBf89F3ea4e654a5d",
  USDT: "0xa1dB969394FE35EE6e00b3F55e1f6D19C2d96786"
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;
  
  console.log("\n=== Xaheen Chain Deployment Status ===\n");
  console.log("Deployer:", deployer.address);
  console.log("Block:", await provider.getBlockNumber());
  console.log("");
  
  for (const [name, address] of Object.entries(ADDRESSES)) {
    const code = await provider.getCode(address);
    console.log((code !== "0x" ? "✅" : "❌"), name, "at", address);
  }
  
  const wxhtCode = await provider.getCode(ADDRESSES.WXHT);
  if (wxhtCode !== "0x") {
    const wxht = new ethers.Contract(
      ADDRESSES.WXHT,
      ["function balanceOf(address) view returns (uint256)"],
      deployer
    );
    const balance = await wxht.balanceOf(deployer.address);
    const formatted = ethers.formatEther(balance);
    console.log("\nWXHT Balance:", Number(formatted).toLocaleString(), "WXHT");
    console.log("Target: 500,000,000 WXHT");
    console.log("Progress:", (Number(formatted) / 500000000 * 100).toFixed(2), "%");
  }
}

main().then(() => process.exit(0)).catch(console.error);
