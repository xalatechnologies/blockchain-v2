import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("\n🔧 CHECKING REVENUE CONTRACT ISSUE");

  const PAIR_ADDRESS = "0x96BEFeb7cE1a6545f0288F62b314f26852999A9B";
  const REVENUE_ADDRESS = "0xE4bC805e5ED3eB8715A27D4CBAdDF510764aAF53";

  // Check if revenue contract exists
  const code = await ethers.provider.getCode(REVENUE_ADDRESS);
  console.log("\nRevenue contract code length:", code.length);

  if (code === "0x") {
    console.log("❌ Revenue contract doesn't exist!");
    console.log(
      "\nSOLUTION: We need to re-create the pair with revenue contract set to address(0)"
    );

    const FACTORY_ADDRESS = "0x502ec2Ce7cd266Eff9e147d66Df3e4D4fcB9e812";
    const WNOR = "0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651";
    const BTCBR = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";

    const factoryABI = [
      "function createPair(address tokenA, address tokenB) external returns (address pair)",
    ];

    const [deployer] = await ethers.getSigners();
    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, deployer);

    console.log(
      "\nThis will fail because pair already exists, but shows the issue."
    );
  } else {
    console.log("✅ Revenue contract exists");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
