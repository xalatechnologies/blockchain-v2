import { ethers } from "ethers";
import fs from "fs";

/**
 * Fetch token bytecode and metadata from BSC mainnet
 * for embedding in Nor Chain genesis
 */

const BSC_RPC = "https://bsc-dataseed1.binance.org";

const TOKENS = {
  "Little Rabbit": "0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05",
  "Bnb Tiger": "0xAC68931B666E086E9de380CFDb0Fb5704a35dc2D",
  BTCBR: "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",
  USDT: "0x55d398326f99059fF775485246999027B3197955", // BSC standard USDT (will map to 0x4BE35...)
};

// ERC20 ABI for reading token metadata
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

async function main() {
  console.log("\n🔍 FETCHING BSC TOKEN DATA");
  console.log("=".repeat(70));

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  console.log("\n📡 Connected to BSC mainnet");

  const tokenData = {};

  for (const [name, address] of Object.entries(TOKENS)) {
    console.log("\n" + "=".repeat(70));
    console.log(`📝 FETCHING: ${name}`);
    console.log("=".repeat(70));
    console.log(`Address: ${address}`);

    try {
      // Fetch bytecode
      console.log("\n⏳ Fetching contract bytecode...");
      const code = await provider.getCode(address);

      if (code === "0x") {
        console.log(`❌ No contract found at ${address}`);
        continue;
      }

      console.log(`✅ Bytecode fetched: ${code.length} characters`);

      // Create contract instance
      const contract = new ethers.Contract(address, ERC20_ABI, provider);

      // Fetch metadata
      console.log("\n⏳ Fetching token metadata...");

      const [tokenName, symbol, decimals, totalSupply] = await Promise.all([
        contract.name().catch(() => name),
        contract.symbol().catch(() => "UNKNOWN"),
        contract.decimals().catch(() => 18),
        contract.totalSupply().catch(() => 0n),
      ]);

      console.log(`✅ Name: ${tokenName}`);
      console.log(`✅ Symbol: ${symbol}`);
      console.log(`✅ Decimals: ${decimals}`);
      console.log(
        `✅ Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`
      );

      // Fetch top holder (for initial balance in genesis)
      console.log("\n⏳ Fetching top holder...");

      // Common holder addresses to check
      const checkAddresses = [
        "0xdD779a290C937144F80Eb75b75d814c834536B1b", // Our deployer
        address, // Contract itself
        "0x0000000000000000000000000000000000000000", // Zero address
      ];

      const balances = {};
      for (const addr of checkAddresses) {
        try {
          const balance = await contract.balanceOf(addr);
          if (balance > 0n) {
            balances[addr] = balance.toString();
            console.log(`  ${addr}: ${ethers.formatUnits(balance, decimals)}`);
          }
        } catch (err) {
          // Skip
        }
      }

      // Calculate storage slots for ERC20
      const storageSlots = calculateStorageSlots(
        tokenName,
        symbol,
        decimals,
        totalSupply,
        balances
      );

      // Store token data
      tokenData[name] = {
        address,
        bytecode: code,
        name: tokenName,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
        balances,
        storageSlots,
      };

      console.log(`\n✅ ${name} data collected successfully`);
    } catch (error) {
      console.error(`\n❌ Error fetching ${name}:`, error.message);
    }
  }

  // Save to file
  const output = {
    timestamp: new Date().toISOString(),
    source: "BSC Mainnet",
    rpc: BSC_RPC,
    tokens: tokenData,
  };

  const outputPath = "data/bsc-token-data.json";
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log("\n" + "=".repeat(70));
  console.log(`💾 Token data saved to: ${outputPath}`);
  console.log("=".repeat(70));

  // Print summary
  console.log("\n📊 SUMMARY:");
  console.log(
    `\nTokens fetched: ${Object.keys(tokenData).length} / ${
      Object.keys(TOKENS).length
    }`
  );

  for (const [name, data] of Object.entries(tokenData)) {
    console.log(`\n${name}:`);
    console.log(`  Address: ${data.address}`);
    console.log(`  Symbol: ${data.symbol}`);
    console.log(`  Bytecode: ${data.bytecode.length} chars`);
    console.log(`  Storage slots: ${Object.keys(data.storageSlots).length}`);
  }

  console.log("\n💡 NEXT STEPS:");
  console.log("1. Review bsc-token-data.json");
  console.log("2. Run: node scripts/generate-xaheen-genesis-v2.js");
  console.log(
    "3. This will create genesis-xaheen-v2.json with all tokens embedded"
  );

  return output;
}

/**
 * Calculate ERC20 storage slots
 * Standard ERC20 layout:
 * - Slot 0: Various (owner, etc)
 * - Slot 1: mapping(address => uint256) balances
 * - Slot 2: mapping(address => mapping(address => uint256)) allowances
 * - Slot 3: uint256 totalSupply
 * - Slot 4: uint8 decimals
 * - Slot 5: string name
 * - Slot 6: string symbol
 */
function calculateStorageSlots(name, symbol, decimals, totalSupply, balances) {
  const slots = {};

  // Slot 3: Total supply
  slots["0x0000000000000000000000000000000000000000000000000000000000000003"] =
    "0x" + totalSupply.toString(16).padStart(64, "0");

  // Slot 4: Decimals
  slots["0x0000000000000000000000000000000000000000000000000000000000000004"] =
    "0x" + decimals.toString(16).padStart(64, "0");

  // Slot 5: Name (simplified - stores length + data)
  const nameHex = Buffer.from(name).toString("hex");
  const nameLength = name.length * 2; // Length in hex (2 chars per byte)
  slots["0x0000000000000000000000000000000000000000000000000000000000000005"] =
    "0x" + nameHex.padEnd(62, "0") + nameLength.toString(16).padStart(2, "0");

  // Slot 6: Symbol (simplified - stores length + data)
  const symbolHex = Buffer.from(symbol).toString("hex");
  const symbolLength = symbol.length * 2;
  slots["0x0000000000000000000000000000000000000000000000000000000000000006"] =
    "0x" +
    symbolHex.padEnd(62, "0") +
    symbolLength.toString(16).padStart(2, "0");

  // Slot 1 (mapping): Balances
  // For mapping(address => uint256) at slot 1:
  // Storage location = keccak256(address . slot)
  for (const [address, balance] of Object.entries(balances)) {
    const slot = ethers.keccak256(
      ethers.concat([
        ethers.zeroPadValue(address, 32),
        ethers.zeroPadValue("0x01", 32),
      ])
    );
    slots[slot] = "0x" + BigInt(balance).toString(16).padStart(64, "0");
  }

  return slots;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  });
