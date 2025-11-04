import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("\n🔧 DEPLOYING NEW WORKING PAIR");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();

  const WNOR = "0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651";
  const BTCBR = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
  const FACTORY = "0x502ec2Ce7cd266Eff9e147d66Df3e4D4fcB9e812";

  // Deploy new pair manually
  console.log("\n[1/3] Deploying NorDEXPair...");
  const Pair = await ethers.getContractFactory("NorDEXPair");
  const pair = await Pair.deploy();
  await pair.waitForDeployment();
  const pairAddr = await pair.getAddress();
  console.log("  ✅ Pair deployed:", pairAddr);

  // Initialize with address(0) for revenue (no fees)
  console.log("\n[2/3] Initializing pair (NO FEES)...");
  await (await pair.initialize(BTCBR, WNOR, ethers.ZeroAddress)).wait();
  console.log("  ✅ Initialized");

  // Add liquidity
  const wxhtABI = [
    "function deposit() payable",
    "function transfer(address,uint256) returns(bool)",
  ];
  const erc20ABI = ["function transfer(address,uint256) returns(bool)"];
  const pairABI = [
    "function mint(address) returns(uint256)",
    "function getReserves() view returns(uint256,uint256,uint256)",
  ];

  const wxht = new ethers.Contract(WNOR, wxhtABI, deployer);
  const btcbr = new ethers.Contract(BTCBR, erc20ABI, deployer);
  const pairContract = new ethers.Contract(pairAddr, pairABI, deployer);

  const amount = ethers.parseEther("10000");

  console.log("\n[3/3] Adding liquidity...");
  await (await wxht.deposit({ value: amount })).wait();
  console.log("  ✅ Wrapped NOR");

  await (await btcbr.transfer(pairAddr, amount)).wait();
  console.log("  ✅ Sent BTCBR");

  await (await wxht.transfer(pairAddr, amount)).wait();
  console.log("  ✅ Sent WNOR");

  await (
    await pairContract.mint(deployer.address, { gasLimit: 500000 })
  ).wait();
  console.log("  ✅ Minted LP tokens");

  const [r0, r1] = await pairContract.getReserves();
  console.log("\n📊 RESERVES:");
  console.log("  BTCBR:", ethers.formatEther(r0));
  console.log("  WNOR:", ethers.formatEther(r1));

  console.log("\n" + "=".repeat(70));
  console.log("🎉 WORKING PAIR DEPLOYED!");
  console.log("=".repeat(70));
  console.log("\n📍 New Pair Address:", pairAddr);
  console.log("\n✅ You now have a working DEX on Nor!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
