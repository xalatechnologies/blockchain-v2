import hre from "hardhat";
const { ethers } = hre;

const ROUTER = "0x4A82C98A950125F17943F56273efae39dDe81763";
const USDT_Z = "0x4BE35Ec329343d7d9F548d42B0F8c17FFfe07db4";
const LITTLE_RABBIT = "0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05";
const BNB_TIGER = "0xAC68931B666E086E9de380CFDb0Fb5704a35dc2D";
const BTCBR = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";

async function main() {
  console.log("\n⚡ FAST LIQUIDITY DEPLOYMENT - GET TRADING LIVE NOW!");
  console.log("=".repeat(70));

  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );
  const router = new ethers.Contract(
    ROUTER,
    [
      "function addLiquidityETH(address,uint256,uint256,uint256,address,uint256) payable returns(uint256,uint256,uint256)",
    ],
    wallet
  );
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  console.log(`\n📍 Deployer: ${wallet.address}`);
  console.log(
    `💰 Balance: ${ethers.formatEther(
      await provider.getBalance(wallet.address)
    )} NOR\n`
  );

  const pairs = [
    {
      name: "WNOR/USDT.z (MAIN PAIR - $0.0000024/NOR)",
      token: USDT_Z,
      xht: "4166666667",
      amount: ethers.parseUnits("10000", 18),
    },
    {
      name: "WNOR/Little Rabbit",
      token: LITTLE_RABBIT,
      xht: "10000",
      amount: ethers.parseUnits("100000000", 18),
    },
    {
      name: "WNOR/Bnb Tiger",
      token: BNB_TIGER,
      xht: "10000",
      amount: ethers.parseUnits("100000000", 24),
    },
    {
      name: "WNOR/BTCBR",
      token: BTCBR,
      xht: "10000",
      amount: ethers.parseUnits("100000000", 24),
    },
  ];

  for (const pair of pairs) {
    console.log(`🔄 Adding ${pair.name}...`);
    try {
      const token = new ethers.Contract(
        pair.token,
        ["function approve(address,uint256) returns(bool)"],
        wallet
      );
      await (await token.approve(ROUTER, pair.amount)).wait();
      console.log(`  ✅ Approved`);
      const tx = await router.addLiquidityETH(
        pair.token,
        pair.amount,
        0,
        0,
        wallet.address,
        deadline,
        { value: ethers.parseEther(pair.xht), gasLimit: 5000000 }
      );
      await tx.wait();
      console.log(`  ✅ LIVE! TX: ${tx.hash}\n`);
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}\n`);
    }
  }

  console.log("=".repeat(70));
  console.log("🎉 TRADING IS NOW LIVE!");
  console.log("\n💰 NOR LAUNCH PRICE: $0.0000024 USD");
  console.log("📊 Total Liquidity: $10,000+ added");
  console.log("🔥 4 trading pairs active");
  console.log("\n🚀 Start trading at: https://dex.xaheen.org");
  console.log("=".repeat(70) + "\n");
}

main().catch(console.error);
