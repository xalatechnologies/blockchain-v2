import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const routerAddress = "0x704cf9Fd1977365426Bd15A1aD348B17B401877B";

  console.log("Checking router at:", routerAddress);

  const code = await ethers.provider.getCode(routerAddress);
  console.log("Has code:", code !== "0x");
  console.log("Code length:", code.length);

  if (code === "0x") {
    console.log("\n❌ Router contract NOT deployed at this address!");
    console.log("Need to redeploy liquidity infrastructure");
  } else {
    console.log("\n✅ Contract exists!");
    const router = await ethers.getContractAt("XaheenDEXRouter", routerAddress);
    try {
      const wxhtAddr = await router.wxht();
      console.log("WXHT address:", wxhtAddr);
    } catch (error) {
      console.error("Error calling wxht():", error.message);
    }
  }
}

main().catch(console.error);
