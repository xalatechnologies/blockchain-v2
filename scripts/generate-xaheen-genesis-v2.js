import { ethers } from "ethers";
import fs from "fs";
import crypto from "crypto";

/**
 * Generate Xaheen Chain Genesis v2
 * - 4 tokens embedded at exact addresses (Little Rabbit, Bnb Tiger, BTCBR, USDT)
 * - 7 validators with geographic distribution
 * - Chain ID: 65001
 * - 3-second block time (Parlia consensus)
 */

const CHAIN_ID = 65001;
const NETWORK_ID = 65001;
const BLOCK_TIME = 3; // seconds
const EPOCH = 30000; // blocks

// Token address mapping (BSC → Xaheen)
const TOKEN_ADDRESSES = {
    "Little Rabbit": "0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05",
    "Bnb Tiger": "0xAC68931B666E086E9de380CFDb0Fb5704a35dc2D",
    "BTCBR": "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",
    "USDT": "0x4BE35Ec329343d7d9F548d42B0F8c17FFfe07db4" // Maps BSC USDT to this address
};

// Custom token configurations (overrides BSC data)
const TOKEN_OVERRIDES = {
    "Little Rabbit": {
        decimals: 18,
        totalSupply: ethers.parseUnits("21000000000000000000000000", 18) // 21 septillion
    },
    "Bnb Tiger": {
        decimals: 24,
        totalSupply: ethers.parseUnits("21000000000000000000000000", 24) // 21 septillion
    },
    "BTCBR": {
        decimals: 24,
        totalSupply: ethers.parseUnits("21000000000000000000000000", 24) // 21 septillion
    },
    "USDT": {
        decimals: 18,
        totalSupply: ethers.parseUnits("21000000000000000000000000", 18) // 21 septillion
    }
};

// Pre-funded accounts
const DEPLOYER_ADDRESS = "0xdD779a290C937144F80Eb75b75d814c834536B1b";
const DEPLOYER_BALANCE = ethers.parseEther("21000000000"); // 21 billion XHT

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

    // Convert totalSupply to BigInt if it's not already
    const supply = typeof totalSupply === 'bigint' ? totalSupply : BigInt(totalSupply);

    // Slot 3: Total supply
    slots["0x0000000000000000000000000000000000000000000000000000000000000003"] =
        "0x" + supply.toString(16).padStart(64, "0");

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
        "0x" + symbolHex.padEnd(62, "0") + symbolLength.toString(16).padStart(2, "0");

    // Slot 1 (mapping): Balances
    // For mapping(address => uint256) at slot 1:
    // Storage location = keccak256(address . slot)
    for (const [address, balance] of Object.entries(balances)) {
        const slot = ethers.keccak256(
            ethers.concat([
                ethers.zeroPadValue(address, 32),
                ethers.zeroPadValue("0x01", 32)
            ])
        );
        const bal = typeof balance === 'bigint' ? balance : BigInt(balance);
        slots[slot] = "0x" + bal.toString(16).padStart(64, "0");
    }

    return slots;
}

async function main() {
    console.log("\n🏗️  GENERATING XAHEEN CHAIN GENESIS V2");
    console.log("=".repeat(70));

    // Load BSC token data
    console.log("\n📂 Loading BSC token data...");
    const tokenDataPath = "data/bsc-token-data.json";

    if (!fs.existsSync(tokenDataPath)) {
        throw new Error("BSC token data not found! Run: node scripts/fetch-bsc-tokens.js");
    }

    const bscData = JSON.parse(fs.readFileSync(tokenDataPath, "utf8"));
    console.log(`✅ Loaded data for ${Object.keys(bscData.tokens).length} tokens`);

    // Generate 7 validators
    console.log("\n👥 Generating 7 validators...");
    const validators = [];
    const validatorPasswords = [];

    for (let i = 1; i <= 7; i++) {
        const wallet = ethers.Wallet.createRandom();
        const password = crypto.randomBytes(32).toString("hex");

        validators.push({
            index: i,
            address: wallet.address,
            privateKey: wallet.privateKey,
            password
        });

        console.log(`  Validator ${i}: ${wallet.address}`);
    }

    // Create validator extraData (Parlia format)
    console.log("\n🔐 Creating validator extraData...");
    const extraData = createExtraData(validators.map(v => v.address));
    console.log(`✅ ExtraData: ${extraData.substring(0, 66)}...${extraData.substring(extraData.length - 66)}`);

    // Build genesis alloc
    console.log("\n💰 Building genesis alloc...");
    const alloc = {};

    // 1. Add deployer account
    alloc[DEPLOYER_ADDRESS.toLowerCase()] = {
        balance: "0x" + DEPLOYER_BALANCE.toString(16)
    };
    console.log(`✅ Deployer: ${DEPLOYER_ADDRESS} (21B XHT)`);

    // 2. Add validators with initial balance
    const validatorBalance = ethers.parseEther("1000"); // 1,000 XHT each
    for (const validator of validators) {
        alloc[validator.address.toLowerCase()] = {
            balance: "0x" + validatorBalance.toString(16)
        };
    }
    console.log(`✅ 7 validators with 1,000 XHT each`);

    // 3. Add tokens from BSC
    console.log("\n📦 Embedding tokens...");

    for (const [tokenName, bscAddress] of Object.entries(TOKEN_ADDRESSES)) {
        console.log(`\n  Processing: ${tokenName}`);

        // Find token data (may be under different key name)
        let tokenData = null;
        for (const [key, data] of Object.entries(bscData.tokens)) {
            if (data.address.toLowerCase() === bscAddress.toLowerCase() ||
                key === tokenName ||
                (tokenName === "USDT" && data.symbol === "USDT")) {
                tokenData = data;
                break;
            }
        }

        if (!tokenData) {
            console.log(`    ⚠️  Token data not found, skipping ${tokenName}`);
            continue;
        }

        const targetAddress = TOKEN_ADDRESSES[tokenName];
        const override = TOKEN_OVERRIDES[tokenName] || {};

        // Apply overrides if specified
        const finalDecimals = override.decimals !== undefined ? override.decimals : tokenData.decimals;
        const finalSupply = override.totalSupply !== undefined ? override.totalSupply : BigInt(tokenData.totalSupply);

        // Recalculate storage slots with custom values
        const customStorage = calculateStorageSlots(
            tokenData.name,
            tokenData.symbol,
            finalDecimals,
            finalSupply,
            { [DEPLOYER_ADDRESS]: finalSupply.toString() } // Give all supply to deployer
        );

        alloc[targetAddress.toLowerCase()] = {
            balance: "0x0",
            code: tokenData.bytecode,
            storage: customStorage
        };

        console.log(`    ✅ ${tokenData.symbol} embedded at ${targetAddress}`);
        console.log(`    📊 Decimals: ${finalDecimals}`);
        console.log(`    📊 Supply: ${ethers.formatUnits(finalSupply, finalDecimals)}`);
    }

    // 4. Build complete genesis
    console.log("\n🏗️  Building complete genesis...");

    const genesis = {
        config: {
            chainId: CHAIN_ID,
            homesteadBlock: 0,
            eip150Block: 0,
            eip155Block: 0,
            eip158Block: 0,
            byzantiumBlock: 0,
            constantinopleBlock: 0,
            petersburgBlock: 0,
            istanbulBlock: 0,
            muirGlacierBlock: 0,
            ramanujanBlock: 0,
            nielsBlock: 0,
            mirrorSyncBlock: 0,
            brunoBlock: 0,
            eulerBlock: 0,
            gibbsBlock: 0,
            nanoBlock: 0,
            moran: 0,
            planckBlock: 0,
            lubanBlock: 0,
            platoBlock: 0,
            hertzBlock: 0,
            hertzfixBlock: 0,
            parlia: {
                period: BLOCK_TIME,
                epoch: EPOCH
            }
        },
        nonce: "0x0",
        timestamp: "0x0",
        extraData: extraData,
        gasLimit: "0x2FAF080", // 50,000,000
        difficulty: "0x1",
        mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        coinbase: "0x0000000000000000000000000000000000000000",
        alloc: alloc,
        number: "0x0",
        gasUsed: "0x0",
        parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    // Save genesis file
    const genesisPath = "data/genesis-xaheen-v2.json";
    fs.writeFileSync(genesisPath, JSON.stringify(genesis, null, 2));
    console.log(`\n✅ Genesis saved: ${genesisPath}`);

    // Save validator information
    const validatorData = {
        timestamp: new Date().toISOString(),
        chainId: CHAIN_ID,
        networkId: NETWORK_ID,
        blockTime: BLOCK_TIME,
        epoch: EPOCH,
        validators: validators.map(v => ({
            index: v.index,
            address: v.address,
            password: v.password,
            recommendedLocation: getValidatorLocation(v.index)
        }))
    };

    const validatorInfoPath = "data/validators-info-v2.json";
    fs.writeFileSync(validatorInfoPath, JSON.stringify(validatorData, null, 2));
    console.log(`✅ Validator info saved: ${validatorInfoPath}`);

    // Save keystores
    console.log("\n🔑 Generating keystores...");
    const keystoreDir = "data/validator-keystores-v2";
    if (!fs.existsSync(keystoreDir)) {
        fs.mkdirSync(keystoreDir, { recursive: true });
    }

    for (const validator of validators) {
        const wallet = new ethers.Wallet(validator.privateKey);
        const keystore = await wallet.encrypt(validator.password);

        const keystorePath = `${keystoreDir}/validator-${validator.index}.json`;
        fs.writeFileSync(keystorePath, keystore);

        const passwordPath = `${keystoreDir}/validator-${validator.index}-password.txt`;
        fs.writeFileSync(passwordPath, validator.password);

        console.log(`  ✅ Validator ${validator.index} keystore created`);
    }

    // Create deployment summary
    console.log("\n" + "=".repeat(70));
    console.log("📊 GENESIS GENERATION COMPLETE");
    console.log("=".repeat(70));

    console.log("\n🔗 BLOCKCHAIN CONFIGURATION:");
    console.log(`  Chain ID: ${CHAIN_ID}`);
    console.log(`  Network ID: ${NETWORK_ID}`);
    console.log(`  Block Time: ${BLOCK_TIME} seconds`);
    console.log(`  Epoch: ${EPOCH} blocks (~${(EPOCH * BLOCK_TIME / 3600).toFixed(1)} hours)`);

    console.log("\n💰 PRE-FUNDED ACCOUNTS:");
    console.log(`  Deployer: ${DEPLOYER_ADDRESS}`);
    console.log(`  Balance: ${ethers.formatEther(DEPLOYER_BALANCE)} XHT`);

    console.log("\n👥 VALIDATORS (7):");
    for (const validator of validators) {
        console.log(`  ${validator.index}. ${validator.address} → ${getValidatorLocation(validator.index)}`);
    }

    console.log("\n📦 EMBEDDED TOKENS (4):");
    const tokenList = Object.entries(TOKEN_ADDRESSES);
    for (const [name, address] of tokenList) {
        const tokenData = findTokenData(bscData, name, address);
        if (tokenData) {
            console.log(`  ${tokenData.symbol}: ${address}`);
            console.log(`     Supply: ${ethers.formatUnits(tokenData.totalSupply, tokenData.decimals)}`);
        }
    }

    console.log("\n📁 GENERATED FILES:");
    console.log(`  Genesis: ${genesisPath}`);
    console.log(`  Validators: ${validatorInfoPath}`);
    console.log(`  Keystores: ${keystoreDir}/ (7 files)`);

    console.log("\n💡 NEXT STEPS:");
    console.log("1. Review genesis-xaheen-v2.json");
    console.log("2. Test on staging environment:");
    console.log("   geth init --datadir ./test-node data/genesis-xaheen-v2.json");
    console.log("3. Deploy to production (REQUIRES DOWNTIME):");
    console.log("   - Stop all validators");
    console.log("   - Backup current data");
    console.log("   - Delete blockchain data");
    console.log("   - Initialize with new genesis");
    console.log("   - Deploy 7 validators across 4 regions");

    console.log("\n🌍 RECOMMENDED VALIDATOR DISTRIBUTION:");
    console.log("  Validators 1-2: AWS us-east-1 (Virginia)");
    console.log("  Validators 3-4: AWS us-west-2 (Oregon)");
    console.log("  Validators 5-6: AWS eu-west-1 (Ireland)");
    console.log("  Validator 7:    AWS ap-southeast-1 (Singapore)");

    console.log("\n" + "=".repeat(70));
    console.log("🎉 GENESIS V2 READY FOR DEPLOYMENT!");
    console.log("=".repeat(70));

    return {
        genesis,
        validators: validatorData,
        files: {
            genesis: genesisPath,
            validators: validatorInfoPath,
            keystores: keystoreDir
        }
    };
}

/**
 * Create Parlia extraData
 * Format: 32 bytes vanity + N * 20 bytes validators + 65 bytes seal
 */
function createExtraData(validatorAddresses) {
    const vanity = Buffer.alloc(32, 0);

    const validators = Buffer.concat(
        validatorAddresses.map(addr => Buffer.from(addr.substring(2), "hex"))
    );

    const seal = Buffer.alloc(65, 0);

    return "0x" + Buffer.concat([vanity, validators, seal]).toString("hex");
}

/**
 * Get recommended validator location
 */
function getValidatorLocation(index) {
    const locations = {
        1: "AWS us-east-1 (Virginia)",
        2: "AWS us-east-1 (Virginia)",
        3: "AWS us-west-2 (Oregon)",
        4: "AWS us-west-2 (Oregon)",
        5: "AWS eu-west-1 (Ireland)",
        6: "AWS eu-west-1 (Ireland)",
        7: "AWS ap-southeast-1 (Singapore)"
    };
    return locations[index] || "Unknown";
}

/**
 * Find token data by name or address
 */
function findTokenData(bscData, name, address) {
    for (const [key, data] of Object.entries(bscData.tokens)) {
        if (data.address.toLowerCase() === address.toLowerCase() ||
            key === name ||
            (name === "USDT" && data.symbol === "USDT")) {
            return data;
        }
    }
    return null;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error.message);
        console.error(error);
        process.exit(1);
    });
