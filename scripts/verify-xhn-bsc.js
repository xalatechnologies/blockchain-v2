import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("\n🔍 VERIFYING XHN TOKEN ON BSC");
  console.log("=".repeat(70));

  const XHN_BSC = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";

  console.log("\n📍 XHN Address:", XHN_BSC);

  // Try to read the contract
  try {
    const code = await ethers.provider.getCode(XHN_BSC);

    if (code === "0x") {
      console.log("\n❌ NO CONTRACT FOUND AT THIS ADDRESS!");
      console.log("  The address exists but has no contract code deployed.");
      console.log("\n💡 This means:");
      console.log("  - XHN was NOT deployed to BSC mainnet");
      console.log("  - Only exists on Nor private chain");
      console.log("  - We need to deploy it to BSC");
      return;
    }

    console.log("\n✅ Contract found!");
    console.log("  Code length:", code.length, "bytes");

    // Try to call name() function
    const xhnABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address) view returns (uint256)",
    ];

    const xhn = new ethers.Contract(XHN_BSC, xhnABI, ethers.provider);

    try {
      const name = await xhn.name();
      const symbol = await xhn.symbol();
      const decimals = await xhn.decimals();
      const totalSupply = await xhn.totalSupply();

      console.log("\n📊 TOKEN INFO:");
      console.log("  Name:", name);
      console.log("  Symbol:", symbol);
      console.log("  Decimals:", decimals);
      console.log("  Total Supply:", ethers.formatUnits(totalSupply, decimals));

      // Check deployer balance
      const [deployer] = await ethers.getSigners();
      const balance = await xhn.balanceOf(deployer.address);
      console.log(
        "\n💰 Your Balance:",
        ethers.formatUnits(balance, decimals),
        symbol
      );
    } catch (error) {
      console.log("\n⚠️  Contract exists but can't read token info:");
      console.log("  Error:", error.message);
    }
  } catch (error) {
    console.log("\n❌ ERROR checking contract:", error.message);
  }

  console.log("\n" + "=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
