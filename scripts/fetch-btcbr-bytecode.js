const { ethers } = require("ethers");

async function fetchBytecode() {
  const provider = new ethers.JsonRpcProvider(
    "https://bsc-dataseed.binance.org/"
  );
  const bytecode = await provider.getCode(
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
  );
  console.log(bytecode);
}

fetchBytecode();
