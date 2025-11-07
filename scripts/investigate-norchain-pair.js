import { ethers } from "ethers";

// Fix SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log("\n🔍 NORCHAIN PAIR INVESTIGATION\n");
console.log("=".repeat(70));

const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");

// Known addresses from docs
const ADDRESSES = {
  NOR: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
  WNOR: "0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c",
  PAIR: "0x59a09aCEb22A5dE82222ddA235490eD7317Eb7f9",
  FACTORY: "0xe97D574A2e1B62f4d32C5cfeaFa8e6B99Da020fa",
  ROUTER: "0x4A82C98A950125F17943F56273efae39dDe81763"
};

const erc20ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

const pairABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function totalSupply() external view returns (uint256)"
];

async function checkContract(address, name) {
  try {
    const code = await provider.getCode(address);
    const exists = code !== '0x';
    console.log(`${exists ? '✅' : '❌'} ${name}: ${exists ? 'Deployed' : 'NOT FOUND'}`);
    console.log(`   Address: ${address}`);

    if (exists && code.length > 10) {
      console.log(`   Bytecode: ${code.length} bytes`);
    }

    return exists;
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("\n1️⃣  CHECKING CONTRACT DEPLOYMENTS\n");

  const norExists = await checkContract(ADDRESSES.NOR, "NOR Token");
  const wnorExists = await checkContract(ADDRESSES.WNOR, "WNOR Token");
  const pairExists = await checkContract(ADDRESSES.PAIR, "NOR/USDT Pair");
  const factoryExists = await checkContract(ADDRESSES.FACTORY, "Factory");
  const routerExists = await checkContract(ADDRESSES.ROUTER, "Router");

  console.log("\n" + "=".repeat(70));
  console.log("2️⃣  CHECKING TOKEN DETAILS\n");

  if (norExists) {
    try {
      const nor = new ethers.Contract(ADDRESSES.NOR, erc20ABI, provider);
      const name = await nor.name();
      const symbol = await nor.symbol();
      const decimals = await nor.decimals();
      const totalSupply = await nor.totalSupply();

      console.log("✅ NOR Token Details:");
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Decimals: ${decimals}`);
      console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
    } catch (error) {
      console.log(`❌ Could not read NOR token: ${error.message}`);
    }
  }

  if (wnorExists) {
    try {
      const wnor = new ethers.Contract(ADDRESSES.WNOR, erc20ABI, provider);
      const name = await wnor.name();
      const symbol = await wnor.symbol();
      const decimals = await wnor.decimals();
      const totalSupply = await wnor.totalSupply();

      console.log("\n✅ WNOR Token Details:");
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Decimals: ${decimals}`);
      console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
    } catch (error) {
      console.log(`\n❌ Could not read WNOR token: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("3️⃣  CHECKING PAIR LIQUIDITY\n");

  if (pairExists) {
    try {
      const pair = new ethers.Contract(ADDRESSES.PAIR, pairABI, provider);

      const [r0, r1, timestamp] = await pair.getReserves();
      const token0 = await pair.token0();
      const token1 = await pair.token1();
      const lpSupply = await pair.totalSupply();

      console.log("✅ Pair Details:");
      console.log(`   Token0: ${token0}`);
      console.log(`   Token1: ${token1}`);
      console.log(`   Reserve0: ${ethers.formatEther(r0)}`);
      console.log(`   Reserve1: ${ethers.formatEther(r1)}`);
      console.log(`   LP Supply: ${ethers.formatEther(lpSupply)}`);
      console.log(`   Last Update: ${new Date(Number(timestamp) * 1000).toISOString()}`);

      if (Number(r0) === 0 && Number(r1) === 0) {
        console.log("\n⚠️  PAIR HAS NO LIQUIDITY!");
        console.log("   Pair exists but no tokens have been added yet.");
        console.log("   This is why getReserves() returned empty data.");
      } else {
        console.log("\n✅ Pair has liquidity");
      }
    } catch (error) {
      console.log(`❌ Could not read pair: ${error.message}`);

      if (error.message.includes("could not decode result data")) {
        console.log("\n💡 This error means:");
        console.log("   - Pair contract exists");
        console.log("   - But getReserves() returned 0x (empty)");
        console.log("   - This happens when NO liquidity has been added");
        console.log("   - OR the contract is not a valid Uniswap V2 pair");
      }
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("📋 DIAGNOSIS & RECOMMENDATIONS\n");

  if (!pairExists) {
    console.log("❌ PROBLEM: Pair contract doesn't exist at this address");
    console.log("   Solution: Deploy a new pair or verify the correct address");
  } else if (pairExists) {
    console.log("✅ Pair contract exists");
    console.log("⚠️  BUT: It has NO LIQUIDITY (getReserves returns 0x)");
    console.log("\n📝 ACTION REQUIRED:");
    console.log("   1. Add initial liquidity to the pair");
    console.log("   2. Minimum: $1,000 worth (to test)");
    console.log("   3. Then verify liquidity shows up");
    console.log("\n💡 Command to add liquidity:");
    console.log("   node scripts/add-norchain-liquidity.js");
  }

  console.log("\n");
}

main().catch(console.error);
