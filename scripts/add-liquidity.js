import pkg from "hardhat";
const { ethers } = pkg;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

// Contract addresses
const ROUTER_ADDRESS = "0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916";
const WXHT_ADDRESS = "0x26c0eaF731885b14c031cc50dB79b36458E0b355";
const USDT_ADDRESS = "0xB8fa87a1dAC07e077a51999F5cE79BD236f06acf";
const BNB_ADDRESS = "0xa4cBBcbd8146482E5618c833faFf5fA4C29B78a6";
const ETH_ADDRESS = "0xc6E0cD72723C9409ba221197e06830EB928a7A76";

async function main() {
  console.log("\n💧 Adding More Liquidity to Xaheen Chain DEX");
  console.log("=" .repeat(70));

  const privateKey = process.env.MAIN_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("MAIN_WALLET_PRIVATE_KEY not found in .env");
  }

  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const deployer = new ethers.Wallet(privateKey, provider);

  console.log("\n📍 Liquidity Provider:", deployer.address);
  const xhtBalance = await provider.getBalance(deployer.address);
  console.log("💰 XHT Balance:", ethers.formatEther(xhtBalance), "XHT");

  const blockNumber = await provider.getBlockNumber();
  console.log("📦 Block:", blockNumber);

  // Contract interfaces
  const routerABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)"
  ];

  const erc20ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function mint(address to, uint256 amount) external"
  ];

  const wxhtABI = [
    "function deposit() payable external",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
  ];

  const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, deployer);
  const wxht = new ethers.Contract(WXHT_ADDRESS, wxhtABI, deployer);
  const usdt = new ethers.Contract(USDT_ADDRESS, erc20ABI, deployer);
  const bnb = new ethers.Contract(BNB_ADDRESS, erc20ABI, deployer);
  const eth = new ethers.Contract(ETH_ADDRESS, erc20ABI, deployer);

  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

  // POOL 1: Add more XHT/USDT liquidity
  console.log("\n💧 Pool 1: Adding XHT/USDT Liquidity");
  console.log("-".repeat(70));

  const xhtForUsdt = ethers.parseEther("100000000"); // 100M XHT
  const usdtAmount = ethers.parseEther("240"); // $240 USDT (maintains ratio)

  console.log(`Wrapping ${ethers.formatEther(xhtForUsdt)} XHT...`);
  const wrapTx = await wxht.deposit({ value: xhtForUsdt });
  await wrapTx.wait();
  console.log("✅ XHT wrapped to WXHT");

  console.log("Minting USDT...");
  const mintUsdtTx = await usdt.mint(deployer.address, usdtAmount);
  await mintUsdtTx.wait();
  console.log("✅ USDT minted");

  console.log("Approving tokens...");
  await (await wxht.approve(ROUTER_ADDRESS, xhtForUsdt)).wait();
  await (await usdt.approve(ROUTER_ADDRESS, usdtAmount)).wait();
  console.log("✅ Tokens approved");

  console.log("Adding liquidity...");
  const addLiq1Tx = await router.addLiquidity(
    WXHT_ADDRESS,
    USDT_ADDRESS,
    xhtForUsdt,
    usdtAmount,
    0, // Accept any amount
    0, // Accept any amount
    deployer.address,
    deadline,
    { gasLimit: 5000000 }
  );
  await addLiq1Tx.wait();
  console.log("✅ XHT/USDT liquidity added!");
  console.log(`   ${ethers.formatEther(xhtForUsdt)} WXHT + ${ethers.formatEther(usdtAmount)} USDT`);

  // POOL 2: Add more XHT/BNB liquidity
  console.log("\n💧 Pool 2: Adding XHT/BNB Liquidity");
  console.log("-".repeat(70));

  const xhtForBnb = ethers.parseEther("50000000"); // 50M XHT
  const bnbAmount = ethers.parseEther("100"); // 100 BNB

  console.log(`Wrapping ${ethers.formatEther(xhtForBnb)} XHT...`);
  const wrap2Tx = await wxht.deposit({ value: xhtForBnb });
  await wrap2Tx.wait();
  console.log("✅ XHT wrapped to WXHT");

  console.log("Minting BNB...");
  const mintBnbTx = await bnb.mint(deployer.address, bnbAmount);
  await mintBnbTx.wait();
  console.log("✅ BNB minted");

  console.log("Approving tokens...");
  await (await wxht.approve(ROUTER_ADDRESS, xhtForBnb)).wait();
  await (await bnb.approve(ROUTER_ADDRESS, bnbAmount)).wait();
  console.log("✅ Tokens approved");

  console.log("Adding liquidity...");
  const addLiq2Tx = await router.addLiquidity(
    WXHT_ADDRESS,
    BNB_ADDRESS,
    xhtForBnb,
    bnbAmount,
    0,
    0,
    deployer.address,
    deadline,
    { gasLimit: 5000000 }
  );
  await addLiq2Tx.wait();
  console.log("✅ XHT/BNB liquidity added!");
  console.log(`   ${ethers.formatEther(xhtForBnb)} WXHT + ${ethers.formatEther(bnbAmount)} BNB`);

  // POOL 3: Add more XHT/ETH liquidity
  console.log("\n💧 Pool 3: Adding XHT/ETH Liquidity");
  console.log("-".repeat(70));

  const xhtForEth = ethers.parseEther("50000000"); // 50M XHT
  const ethAmount = ethers.parseEther("2"); // 2 ETH

  console.log(`Wrapping ${ethers.formatEther(xhtForEth)} XHT...`);
  const wrap3Tx = await wxht.deposit({ value: xhtForEth });
  await wrap3Tx.wait();
  console.log("✅ XHT wrapped to WXHT");

  console.log("Minting ETH...");
  const mintEthTx = await eth.mint(deployer.address, ethAmount);
  await mintEthTx.wait();
  console.log("✅ ETH minted");

  console.log("Approving tokens...");
  await (await wxht.approve(ROUTER_ADDRESS, xhtForEth)).wait();
  await (await eth.approve(ROUTER_ADDRESS, ethAmount)).wait();
  console.log("✅ Tokens approved");

  console.log("Adding liquidity...");
  const addLiq3Tx = await router.addLiquidity(
    WXHT_ADDRESS,
    ETH_ADDRESS,
    xhtForEth,
    ethAmount,
    0,
    0,
    deployer.address,
    deadline,
    { gasLimit: 5000000 }
  );
  await addLiq3Tx.wait();
  console.log("✅ XHT/ETH liquidity added!");
  console.log(`   ${ethers.formatEther(xhtForEth)} WXHT + ${ethers.formatEther(ethAmount)} ETH`);

  // Summary
  console.log("\n📊 Liquidity Addition Summary");
  console.log("=" .repeat(70));
  console.log("✅ XHT/USDT: +100M WXHT + $240 USDT");
  console.log("✅ XHT/BNB:  +50M WXHT + 100 BNB");
  console.log("✅ XHT/ETH:  +50M WXHT + 2 ETH");
  console.log("\n💰 Total Additional Liquidity:");
  console.log("   200M WXHT wrapped");
  console.log("   $240 USDT + 100 BNB + 2 ETH added");

  console.log("\n🎉 Liquidity pools enhanced!");
  console.log("   Better prices for larger trades");
  console.log("   Lower slippage");
  console.log("   More trading volume capacity");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
