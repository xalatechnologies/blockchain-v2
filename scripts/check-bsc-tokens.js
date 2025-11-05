import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("\n🔍 CHECKING NOR AND BTCBR ON BSC MAINNET");
  console.log("=".repeat(70));

  // Connect to BSC mainnet
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org");

  // Token addresses we used in bridge deployment
  const NOR_BSC = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";
  const BTCBR_BSC = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";

  console.log("\n📍 Checking NOR Token:", NOR_BSC);
  try {
    const norCode = await provider.getCode(NOR_BSC);
    if (norCode === "0x") {
      console.log("  ❌ NOR token NOT deployed on BSC");
      console.log("  Need to deploy NOR token first!");
    } else {
      console.log("  ✅ NOR token EXISTS on BSC");
      
      const norToken = new ethers.Contract(
        NOR_BSC,
        ["function name() view returns (string)", "function symbol() view returns (string)", "function decimals() view returns (uint8)", "function totalSupply() view returns (uint256)"],
        provider
      );
      
      try {
        const name = await norToken.name();
        const symbol = await norToken.symbol();
        const decimals = await norToken.decimals();
        const supply = await norToken.totalSupply();
        
        console.log("  Name:", name);
        console.log("  Symbol:", symbol);
        console.log("  Decimals:", decimals);
        console.log("  Total Supply:", ethers.formatUnits(supply, decimals));
      } catch (e) {
        console.log("  ⚠️  Cannot read token info:", e.message);
      }
    }
  } catch (e) {
    console.log("  ❌ Error:", e.message);
  }

  console.log("\n📍 Checking BTCBR Token:", BTCBR_BSC);
  try {
    const btcbrCode = await provider.getCode(BTCBR_BSC);
    if (btcbrCode === "0x") {
      console.log("  ❌ BTCBR token NOT deployed on BSC");
    } else {
      console.log("  ✅ BTCBR token EXISTS on BSC");
      
      const btcbrToken = new ethers.Contract(
        BTCBR_BSC,
        ["function name() view returns (string)", "function symbol() view returns (string)", "function decimals() view returns (uint8)", "function totalSupply() view returns (uint256)"],
        provider
      );
      
      try {
        const name = await btcbrToken.name();
        const symbol = await btcbrToken.symbol();
        const decimals = await btcbrToken.decimals();
        const supply = await btcbrToken.totalSupply();
        
        console.log("  Name:", name);
        console.log("  Symbol:", symbol);
        console.log("  Decimals:", decimals);
        console.log("  Total Supply:", ethers.formatUnits(supply, decimals));
      } catch (e) {
        console.log("  ⚠️  Cannot read token info:", e.message);
      }
    }
  } catch (e) {
    console.log("  ❌ Error:", e.message);
  }

  console.log("\n" + "=".repeat(70));
}

main();
