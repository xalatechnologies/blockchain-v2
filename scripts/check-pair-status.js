import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("🔍 Checking Noor Chain DEX Pair Status\n");
  console.log("=" .repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);

  // Load deployment info
  const deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));
  const {
    NOR_TOKEN,
    WUSDT,
    WBNB,
    WETH,
    DIRHAMAT,
    NOORSWAP_FACTORY,
    NOORSWAP_ROUTER
  } = deployment.contracts;

  const factory = await ethers.getContractAt("NoorSwapFactory", NOORSWAP_FACTORY);

  // Check pair addresses
  console.log("\n📊 DEX Pairs:\n");

  // NOR/WUSDT
  const pair1Address = await factory.getPair(NOR_TOKEN, WUSDT);
  console.log("1. NOR/WUSDT Pair:", pair1Address);
  if (pair1Address !== ethers.ZeroAddress) {
    const pair1 = await ethers.getContractAt("NoorSwapPair", pair1Address);
    const reserves1 = await pair1.getReserves();
    const token0 = await pair1.token0();
    const token1 = await pair1.token1();
    console.log("   Token0:", token0, token0.toLowerCase() === NOR_TOKEN.toLowerCase() ? "(NOR)" : "(WUSDT)");
    console.log("   Token1:", token1, token1.toLowerCase() === NOR_TOKEN.toLowerCase() ? "(NOR)" : "(WUSDT)");
    console.log("   Reserve0:", ethers.formatEther(reserves1[0]));
    console.log("   Reserve1:", ethers.formatEther(reserves1[1]));
    const lpBalance = await pair1.balanceOf(deployer.address);
    console.log("   LP Balance:", ethers.formatEther(lpBalance));
    const totalSupply = await pair1.totalSupply();
    console.log("   Total Supply:", ethers.formatEther(totalSupply));
  }

  // NOR/WBNB
  const pair2Address = await factory.getPair(NOR_TOKEN, WBNB);
  console.log("\n2. NOR/WBNB Pair:", pair2Address);
  if (pair2Address !== ethers.ZeroAddress) {
    const pair2 = await ethers.getContractAt("NoorSwapPair", pair2Address);
    const reserves2 = await pair2.getReserves();
    console.log("   Reserves:", ethers.formatEther(reserves2[0]), "/", ethers.formatEther(reserves2[1]));
  }

  // NOR/WETH
  const pair3Address = await factory.getPair(NOR_TOKEN, WETH);
  console.log("\n3. NOR/WETH Pair:", pair3Address);
  if (pair3Address !== ethers.ZeroAddress) {
    const pair3 = await ethers.getContractAt("NoorSwapPair", pair3Address);
    const reserves3 = await pair3.getReserves();
    console.log("   Reserves:", ethers.formatEther(reserves3[0]), "/", ethers.formatEther(reserves3[1]));
  }

  // NOR/Dirhamat
  const pair4Address = await factory.getPair(NOR_TOKEN, DIRHAMAT);
  console.log("\n4. NOR/Dirhamat Pair:", pair4Address);
  if (pair4Address !== ethers.ZeroAddress) {
    const pair4 = await ethers.getContractAt("NoorSwapPair", pair4Address);
    const reserves4 = await pair4.getReserves();
    console.log("   Reserves:", ethers.formatEther(reserves4[0]), "/", ethers.formatEther(reserves4[1]));
  }

  // Dirhamat/WUSDT
  const pair5Address = await factory.getPair(DIRHAMAT, WUSDT);
  console.log("\n5. Dirhamat/WUSDT Pair:", pair5Address);
  if (pair5Address !== ethers.ZeroAddress) {
    const pair5 = await ethers.getContractAt("NoorSwapPair", pair5Address);
    const reserves5 = await pair5.getReserves();
    console.log("   Reserves:", ethers.formatEther(reserves5[0]), "/", ethers.formatEther(reserves5[1]));
  }

  // Check factory settings
  console.log("\n" + "=" .repeat(70));
  console.log("🏭 Factory Settings:");
  const feeTo = await factory.feeTo();
  const feeToSetter = await factory.feeToSetter();
  console.log("  Fee To:", feeTo);
  console.log("  Fee To Setter:", feeToSetter);

  // Check router approval
  console.log("\n" + "=" .repeat(70));
  console.log("✅ Token Approvals for Router:");
  const norToken = await ethers.getContractAt("NOR", NOR_TOKEN);
  const norAllowance = await norToken.allowance(deployer.address, NOORSWAP_ROUTER);
  console.log("  NOR Allowance:", ethers.formatUnits(norAllowance, 24));

  const wusdt = await ethers.getContractAt("WUSDTToken", WUSDT);
  const wusdtAllowance = await wusdt.allowance(deployer.address, NOORSWAP_ROUTER);
  console.log("  WUSDT Allowance:", ethers.formatEther(wusdtAllowance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
