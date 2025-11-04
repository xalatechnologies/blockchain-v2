import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  const WNOR = "0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651";
  const BTCBR = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
  const PAIR = "0x96BEFeb7cE1a6545f0288F62b314f26852999A9B";

  const wxhtABI = [
    "function deposit() payable",
    "function transfer(address,uint256) returns(bool)",
  ];
  const erc20ABI = ["function transfer(address,uint256) returns(bool)"];
  const pairABI = ["function mint(address) returns(uint256)"];

  const wxht = new ethers.Contract(WNOR, wxhtABI, deployer);
  const btcbr = new ethers.Contract(BTCBR, erc20ABI, deployer);
  const pair = new ethers.Contract(PAIR, pairABI, deployer);

  // Try with 1000 tokens instead of 10000
  const amount = ethers.parseEther("1000");

  console.log("Wrapping...");
  await (await wxht.deposit({ value: amount })).wait();

  console.log("Transferring...");
  await (await btcbr.transfer(PAIR, amount)).wait();
  await (await wxht.transfer(PAIR, amount)).wait();

  console.log("Minting...");
  const tx = await pair.mint(deployer.address, { gasLimit: 1000000 });
  await tx.wait();

  console.log("✅ SUCCESS!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERROR:", e.shortMessage || e.message);
    process.exit(1);
  });
