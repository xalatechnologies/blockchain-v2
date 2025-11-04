import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("\n💧 ADDING LIQUIDITY DIRECTLY TO PAIR");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deployer:", deployer.address);

  const WNOR_ADDRESS = "0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651";
  const BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
  const PAIR_ADDRESS = "0x96BEFeb7cE1a6545f0288F62b314f26852999A9B";

  const wxhtABI = [
    "function deposit() external payable",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
  ];

  const btcbrABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
  ];

  const pairABI = [
    "function mint(address to) external returns (uint256 liquidity)",
    "function getReserves() external view returns (uint256 reserve0, uint256 reserve1, uint256 blockTimestampLast)",
    "function token0() external view returns (address)",
    "function balanceOf(address) view returns (uint256)",
  ];

  const wxht = new ethers.Contract(WNOR_ADDRESS, wxhtABI, deployer);
  const btcbr = new ethers.Contract(BTCBR_ADDRESS, btcbrABI, deployer);
  const pair = new ethers.Contract(PAIR_ADDRESS, pairABI, deployer);

  const xhtBalance = await ethers.provider.getBalance(deployer.address);
  const btcbrBalance = await btcbr.balanceOf(deployer.address);

  console.log("\n💰 BALANCES:");
  console.log("  NOR:", ethers.formatEther(xhtBalance));
  console.log("  BTCBR:", ethers.formatEther(btcbrBalance));

  const xhtAmount = ethers.parseEther("10000");
  const btcbrAmount = ethers.parseEther("10000");

  console.log("\n[1/3] Wrapping NOR...");
  const wrapTx = await wxht.deposit({ value: xhtAmount });
  await wrapTx.wait();
  console.log("  ✅ Wrapped");

  console.log("\n[2/3] Transferring to pair...");
  await (await btcbr.transfer(PAIR_ADDRESS, btcbrAmount)).wait();
  console.log("  ✅ BTCBR sent");
  await (await wxht.transfer(PAIR_ADDRESS, xhtAmount)).wait();
  console.log("  ✅ WNOR sent");

  console.log("\n[3/3] Minting LP tokens...");
  const mintTx = await pair.mint(deployer.address, { gasLimit: 500000 });
  await mintTx.wait();
  console.log("  ✅ Success!");

  const [r0, r1] = await pair.getReserves();
  console.log("\n📊 RESERVES:");
  console.log("  BTCBR:", ethers.formatEther(r0));
  console.log("  WNOR:", ethers.formatEther(r1));

  console.log("\n🎉 LIQUIDITY ADDED!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
