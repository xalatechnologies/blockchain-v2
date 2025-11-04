import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
  console.log("\n💧 ADDING NOR/BNB & NOR/ETH LIQUIDITY");
  console.log("=".repeat(70));

  // Load deployment info
  const dexDeployment = JSON.parse(
    fs.readFileSync("docs/deployment-logs/xaheen-dex-deployment.json", "utf8")
  );
  const bnbEthDeployment = JSON.parse(
    fs.readFileSync("docs/deployment-logs/test-bnb-eth-deployment.json", "utf8")
  );

  const ROUTER_ADDR = dexDeployment.contracts.Router;
  const WNOR_ADDR = dexDeployment.contracts.WNOR;
  const WBNB_ADDR = bnbEthDeployment.tokens.WBNB.address;
  const WETH_ADDR = bnbEthDeployment.tokens.WETH.address;

  console.log("\n📍 Contract Addresses:");
  console.log("  Router:", ROUTER_ADDR);
  console.log("  WNOR:", WNOR_ADDR);
  console.log("  WBNB:", WBNB_ADDR);
  console.log("  WETH:", WETH_ADDR);

  // Connect to Nor Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n👤 Wallet:", wallet.address);

  // Get contracts
  const router = await ethers.getContractAt(
    "NorDEXRouter",
    ROUTER_ADDR,
    wallet
  );
  const wbnb = await ethers.getContractAt("TestERC20", WBNB_ADDR, wallet);
  const weth = await ethers.getContractAt("TestERC20", WETH_ADDR, wallet);

  const xhtBalance = await provider.getBalance(wallet.address);
  const wbnbBalance = await wbnb.balanceOf(wallet.address);
  const wethBalance = await weth.balanceOf(wallet.address);

  console.log("\n💰 Current Balances:");
  console.log("  NOR:", ethers.formatEther(xhtBalance), "NOR");
  console.log("  WBNB:", ethers.formatEther(wbnbBalance), "WBNB");
  console.log("  WETH:", ethers.formatEther(wethBalance), "WETH");

  // Liquidity amounts
  const xhtAmountBNB = ethers.parseEther("5000000"); // 5M NOR
  const bnbAmount = ethers.parseEther("1000"); // 1,000 BNB (if BNB = $600, this is $600k worth, price = $0.12 per NOR)

  const xhtAmountETH = ethers.parseEther("5000000"); // 5M NOR
  const ethAmount = ethers.parseEther("500"); // 500 ETH (if ETH = $3000, this is $1.5M worth, price = $0.30 per NOR)

  console.log("\n📊 Liquidity to Add:");
  console.log("\nNOR/BNB Pool:");
  console.log("  NOR:", ethers.formatEther(xhtAmountBNB), "NOR");
  console.log("  BNB:", ethers.formatEther(bnbAmount), "WBNB");
  console.log("\nNOR/ETH Pool:");
  console.log("  NOR:", ethers.formatEther(xhtAmountETH), "NOR");
  console.log("  ETH:", ethers.formatEther(ethAmount), "WETH");

  // Add NOR/BNB liquidity
  console.log("\n" + "=".repeat(70));
  console.log("📝 ADDING NOR/BNB LIQUIDITY");
  console.log("=".repeat(70));

  console.log("\n📝 STEP 1/2: Approving WBNB...");
  const approveBNBTx = await wbnb.approve(ROUTER_ADDR, bnbAmount);
  await approveBNBTx.wait();
  console.log("✅ WBNB approved");

  console.log("\n📝 STEP 2/2: Approving WNOR...");
  const wxht = await ethers.getContractAt("WNOR", WNOR_ADDR, wallet);

  // Wrap NOR to WNOR
  const wrapBNBTx = await wxht.deposit({ value: xhtAmountBNB });
  await wrapBNBTx.wait();

  // Approve WNOR
  const approveWNORBNBTx = await wxht.approve(ROUTER_ADDR, xhtAmountBNB);
  await approveWNORBNBTx.wait();
  console.log("✅ WNOR approved");

  console.log("\n📝 STEP 3/3: Adding WNOR/BNB liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

  const addBNBTx = await router.addLiquidity(
    WNOR_ADDR,
    WBNB_ADDR,
    xhtAmountBNB,
    bnbAmount,
    ethers.parseEther("4750000"), // min 4.75M WNOR (5% slippage)
    ethers.parseEther("950"), // min 950 WBNB (5% slippage)
    wallet.address,
    deadline
  );

  console.log("  Transaction:", addBNBTx.hash);
  await addBNBTx.wait();
  console.log("✅ NOR/BNB liquidity added!");

  // Get BNB pair address
  const factory = await ethers.getContractAt(
    "NorDEXFactory",
    await router.factory(),
    wallet
  );
  const bnbPairAddr = await factory.getPair(WNOR_ADDR, WBNB_ADDR);
  console.log("  Pair Address:", bnbPairAddr);

  // Add NOR/ETH liquidity
  console.log("\n" + "=".repeat(70));
  console.log("📝 ADDING NOR/ETH LIQUIDITY");
  console.log("=".repeat(70));

  console.log("\n📝 STEP 1/2: Approving WETH...");
  const approveETHTx = await weth.approve(ROUTER_ADDR, ethAmount);
  await approveETHTx.wait();
  console.log("✅ WETH approved");

  console.log("\n📝 STEP 2/3: Approving WNOR...");
  // Wrap NOR to WNOR
  const wrapETHTx = await wxht.deposit({ value: xhtAmountETH });
  await wrapETHTx.wait();

  // Approve WNOR
  const approveWNORETHTx = await wxht.approve(ROUTER_ADDR, xhtAmountETH);
  await approveWNORETHTx.wait();
  console.log("✅ WNOR approved");

  console.log("\n📝 STEP 3/3: Adding WNOR/ETH liquidity...");

  const addETHTx = await router.addLiquidity(
    WNOR_ADDR,
    WETH_ADDR,
    xhtAmountETH,
    ethAmount,
    ethers.parseEther("4750000"), // min 4.75M WNOR (5% slippage)
    ethers.parseEther("475"), // min 475 WETH (5% slippage)
    wallet.address,
    deadline
  );

  console.log("  Transaction:", addETHTx.hash);
  await addETHTx.wait();
  console.log("✅ NOR/ETH liquidity added!");

  // Get ETH pair address
  const ethPairAddr = await factory.getPair(WNOR_ADDR, WETH_ADDR);
  console.log("  Pair Address:", ethPairAddr);

  // Save deployment info
  const liquidityInfo = {
    timestamp: new Date().toISOString(),
    network: "Nor Chain",
    deployer: wallet.address,
    pools: {
      "NOR/BNB": {
        pairAddress: bnbPairAddr,
        xhtAmount: ethers.formatEther(xhtAmountBNB),
        bnbAmount: ethers.formatEther(bnbAmount),
        addLiquidityTx: addBNBTx.hash,
      },
      "NOR/ETH": {
        pairAddress: ethPairAddr,
        xhtAmount: ethers.formatEther(xhtAmountETH),
        ethAmount: ethers.formatEther(ethAmount),
        addLiquidityTx: addETHTx.hash,
      },
    },
  };

  fs.writeFileSync(
    "docs/deployment-logs/bnb-eth-liquidity-deployed.json",
    JSON.stringify(liquidityInfo, null, 2)
  );

  console.log(
    "\n💾 Liquidity info saved to: docs/deployment-logs/bnb-eth-liquidity-deployed.json"
  );

  console.log("\n🎉 ALL LIQUIDITY DEPLOYED!");
  console.log("\n📊 SUMMARY:");
  console.log("  NOR/USDT Pair: 0x59a09aCEb22A5dE82222ddA235490eD7317Eb7f9");
  console.log("  NOR/BNB Pair:", bnbPairAddr);
  console.log("  NOR/ETH Pair:", ethPairAddr);

  console.log("\n🔍 VERIFY ON EXPLORER:");
  console.log(
    "  NOR/BNB:",
    `https://explorer.xaheen.org/address/${bnbPairAddr}`
  );
  console.log(
    "  NOR/ETH:",
    `https://explorer.xaheen.org/address/${ethPairAddr}`
  );

  console.log("\n" + "=".repeat(70));
  console.log("✅ NorSwap FULLY OPERATIONAL!");
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  });
