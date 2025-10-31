import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

/**
 * Bridge Validator Service
 *
 * Monitors BSC for bridge deposits and mints tokens on Xaheen Chain
 * Supports: BNB, USDT, ETH bridges
 */

class BridgeValidator {
  constructor() {
    this.bscProvider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC);
    this.xaheenProvider = new ethers.JsonRpcProvider(process.env.PRIVATE_CHAIN_RPC);

    // Validator wallet (signs mint transactions)
    this.validator = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, this.xaheenProvider);

    // Bridge contracts on BSC
    this.bnbBridgeBSC = null;
    this.usdtBridgeBSC = null;
    this.ethBridgeBSC = null;

    // Bridge contracts on Xaheen
    this.bnbBridgeXaheen = null;
    this.usdtBridgeXaheen = null;
    this.ethBridgeXaheen = null;

    // Wrapped token contracts on Xaheen
    this.wbnb = null;
    this.wusdt = null;
    this.weth = null;

    // Processed nonces to avoid duplicates
    this.processedNonces = {
      bnb: new Set(),
      usdt: new Set(),
      eth: new Set()
    };
  }

  async initialize() {
    console.log("\n🚀 INITIALIZING BRIDGE VALIDATOR SERVICE\n");
    console.log("=" .repeat(60));
    console.log("💼 Validator Address:", this.validator.address);

    const balance = await this.xaheenProvider.getBalance(this.validator.address);
    console.log("💰 XHT Balance:", ethers.formatEther(balance));

    if (balance < ethers.parseEther("1")) {
      console.warn("⚠️  Low XHT balance! Need gas for minting.");
    }

    console.log("\n📋 LOADING CONTRACTS...\n");

    // Load BSC bridge contracts
    const BNBBridgeMainnet = await ethers.getContractFactory("BNBBridgeMainnet");
    const USDTBridgeMainnet = await ethers.getContractFactory("USDTBridgeMainnet");
    const ETHBridgeMainnet = await ethers.getContractFactory("ETHBridgeMainnet");

    this.bnbBridgeBSC = BNBBridgeMainnet.attach(process.env.BNB_BRIDGE_BSC).connect(this.bscProvider);
    this.usdtBridgeBSC = USDTBridgeMainnet.attach(process.env.USDT_BRIDGE_BSC).connect(this.bscProvider);
    this.ethBridgeBSC = ETHBridgeMainnet.attach(process.env.ETH_BRIDGE_BSC).connect(this.bscProvider);

    console.log("✅ BNB Bridge BSC:", process.env.BNB_BRIDGE_BSC);
    console.log("✅ USDT Bridge BSC:", process.env.USDT_BRIDGE_BSC);
    console.log("✅ ETH Bridge BSC:", process.env.ETH_BRIDGE_BSC);

    // Load Xaheen bridge contracts
    const BNBBridgeXaheen = await ethers.getContractFactory("BNBBridgeXaheen");
    const USDTBridgeXaheen = await ethers.getContractFactory("USDTBridgeXaheen");
    const ETHBridgeXaheen = await ethers.getContractFactory("ETHBridgeXaheen");

    this.bnbBridgeXaheen = BNBBridgeXaheen.attach(process.env.BNB_BRIDGE_XAHEEN).connect(this.validator);
    this.usdtBridgeXaheen = USDTBridgeXaheen.attach(process.env.USDT_BRIDGE_XAHEEN).connect(this.validator);
    this.ethBridgeXaheen = ETHBridgeXaheen.attach(process.env.ETH_BRIDGE_XAHEEN).connect(this.validator);

    console.log("\n✅ BNB Bridge Xaheen:", process.env.BNB_BRIDGE_XAHEEN);
    console.log("✅ USDT Bridge Xaheen:", process.env.USDT_BRIDGE_XAHEEN);
    console.log("✅ ETH Bridge Xaheen:", process.env.ETH_BRIDGE_XAHEEN);

    // Load wrapped token contracts
    const WBNBToken = await ethers.getContractFactory("WBNBToken");
    const WUSDTToken = await ethers.getContractFactory("WUSDTToken");
    const WETHToken = await ethers.getContractFactory("WETHToken");

    this.wbnb = WBNBToken.attach(process.env.WBNB_TOKEN_XAHEEN).connect(this.validator);
    this.wusdt = WUSDTToken.attach(process.env.WUSDT_TOKEN_XAHEEN).connect(this.validator);
    this.weth = WETHToken.attach(process.env.WETH_TOKEN_XAHEEN).connect(this.validator);

    console.log("\n✅ WBNB Token:", process.env.WBNB_TOKEN_XAHEEN);
    console.log("✅ WUSDT Token:", process.env.WUSDT_TOKEN_XAHEEN);
    console.log("✅ WETH Token:", process.env.WETH_TOKEN_XAHEEN);

    console.log("\n=" .repeat(60));
    console.log("✅ INITIALIZATION COMPLETE!\n");
  }

  async startListening() {
    console.log("👂 STARTING EVENT LISTENERS...\n");

    // Listen to BNB bridge
    this.bnbBridgeBSC.on("BridgeDeposit", async (user, recipient, amount, fee, nonce, timestamp, event) => {
      await this.handleBNBDeposit(user, recipient, amount, fee, nonce, timestamp, event);
    });
    console.log("✅ Listening to BNB Bridge events");

    // Listen to USDT bridge
    this.usdtBridgeBSC.on("BridgeDeposit", async (user, recipient, amount, fee, nonce, timestamp, event) => {
      await this.handleUSDTDeposit(user, recipient, amount, fee, nonce, timestamp, event);
    });
    console.log("✅ Listening to USDT Bridge events");

    // Listen to ETH bridge
    this.ethBridgeBSC.on("BridgeDeposit", async (user, recipient, amount, fee, nonce, timestamp, event) => {
      await this.handleETHDeposit(user, recipient, amount, fee, nonce, timestamp, event);
    });
    console.log("✅ Listening to ETH Bridge events");

    console.log("\n🎯 VALIDATOR SERVICE IS RUNNING!");
    console.log("Waiting for bridge deposits...\n");
  }

  async handleBNBDeposit(user, recipient, amount, fee, nonce, timestamp, event) {
    console.log("\n🔵 BNB BRIDGE DEPOSIT DETECTED!");
    console.log("=" .repeat(60));
    console.log("👤 User:", user);
    console.log("📬 Recipient:", recipient);
    console.log("💰 Amount:", ethers.formatEther(amount), "BNB");
    console.log("💸 Fee:", ethers.formatEther(fee), "BNB");
    console.log("🔢 Nonce:", nonce.toString());
    console.log("⏰ Timestamp:", new Date(Number(timestamp) * 1000).toISOString());
    console.log("📦 Block:", event.log.blockNumber);
    console.log("📝 TX:", event.log.transactionHash);

    // Check if already processed
    if (this.processedNonces.bnb.has(nonce.toString())) {
      console.log("⚠️  Already processed, skipping");
      return;
    }

    try {
      await this.mintWBNB(recipient, amount, nonce);
      this.processedNonces.bnb.add(nonce.toString());
      console.log("✅ BNB deposit processed successfully!\n");
    } catch (error) {
      console.error("❌ Error processing BNB deposit:", error.message);
    }
  }

  async handleUSDTDeposit(user, recipient, amount, fee, nonce, timestamp, event) {
    console.log("\n💵 USDT BRIDGE DEPOSIT DETECTED!");
    console.log("=" .repeat(60));
    console.log("👤 User:", user);
    console.log("📬 Recipient:", recipient);
    console.log("💰 Amount:", ethers.formatEther(amount), "USDT");
    console.log("💸 Fee:", ethers.formatEther(fee), "USDT");
    console.log("🔢 Nonce:", nonce.toString());
    console.log("⏰ Timestamp:", new Date(Number(timestamp) * 1000).toISOString());
    console.log("📦 Block:", event.log.blockNumber);
    console.log("📝 TX:", event.log.transactionHash);

    if (this.processedNonces.usdt.has(nonce.toString())) {
      console.log("⚠️  Already processed, skipping");
      return;
    }

    try {
      await this.mintWUSDT(recipient, amount, nonce);
      this.processedNonces.usdt.add(nonce.toString());
      console.log("✅ USDT deposit processed successfully!\n");
    } catch (error) {
      console.error("❌ Error processing USDT deposit:", error.message);
    }
  }

  async handleETHDeposit(user, recipient, amount, fee, nonce, timestamp, event) {
    console.log("\n💠 ETH BRIDGE DEPOSIT DETECTED!");
    console.log("=" .repeat(60));
    console.log("👤 User:", user);
    console.log("📬 Recipient:", recipient);
    console.log("💰 Amount:", ethers.formatEther(amount), "ETH");
    console.log("💸 Fee:", ethers.formatEther(fee), "ETH");
    console.log("🔢 Nonce:", nonce.toString());
    console.log("⏰ Timestamp:", new Date(Number(timestamp) * 1000).toISOString());
    console.log("📦 Block:", event.log.blockNumber);
    console.log("📝 TX:", event.log.transactionHash);

    if (this.processedNonces.eth.has(nonce.toString())) {
      console.log("⚠️  Already processed, skipping");
      return;
    }

    try {
      await this.mintWETH(recipient, amount, nonce);
      this.processedNonces.eth.add(nonce.toString());
      console.log("✅ ETH deposit processed successfully!\n");
    } catch (error) {
      console.error("❌ Error processing ETH deposit:", error.message);
    }
  }

  async mintWBNB(recipient, amount, nonce) {
    console.log("\n🔨 MINTING WBNB ON XAHEEN...");

    // Generate signature
    const chainId = 65001; // Xaheen Chain ID
    const message = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      [recipient, amount, nonce, chainId]
    );
    const signature = await this.validator.signMessage(ethers.getBytes(message));

    console.log("✍️  Signature generated");

    // Single signature for now (requirement set to 1)
    // For production, use multiple validators with 2-of-3 or 3-of-3
    const signatures = [signature];

    console.log("📡 Calling mintWBNB on Xaheen...");

    const tx = await this.bnbBridgeXaheen.mintWBNB(
      recipient,
      amount,
      nonce,
      signatures,
      { gasLimit: 500000 }
    );

    console.log("⏰ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("✅ WBNB Minted!");
    console.log("📝 TX:", receipt.hash);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    console.log("📬 Recipient now has", ethers.formatEther(amount), "WBNB on Xaheen");
  }

  async mintWUSDT(recipient, amount, nonce) {
    console.log("\n🔨 MINTING WUSDT ON XAHEEN...");

    const chainId = 65001;
    const message = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      [recipient, amount, nonce, chainId]
    );
    const signature = await this.validator.signMessage(ethers.getBytes(message));

    console.log("✍️  Signature generated");

    const signatures = [signature];

    console.log("📡 Calling mintWUSDT on Xaheen...");

    const tx = await this.usdtBridgeXaheen.mintWUSDT(
      recipient,
      amount,
      nonce,
      signatures,
      { gasLimit: 500000 }
    );

    console.log("⏰ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("✅ WUSDT Minted!");
    console.log("📝 TX:", receipt.hash);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    console.log("📬 Recipient now has", ethers.formatEther(amount), "WUSDT on Xaheen");
  }

  async mintWETH(recipient, amount, nonce) {
    console.log("\n🔨 MINTING WETH ON XAHEEN...");

    const chainId = 65001;
    const message = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      [recipient, amount, nonce, chainId]
    );
    const signature = await this.validator.signMessage(ethers.getBytes(message));

    console.log("✍️  Signature generated");

    const signatures = [signature];

    console.log("📡 Calling mintWETH on Xaheen...");

    const tx = await this.ethBridgeXaheen.mintWETH(
      recipient,
      amount,
      nonce,
      signatures,
      { gasLimit: 500000 }
    );

    console.log("⏰ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("✅ WETH Minted!");
    console.log("📝 TX:", receipt.hash);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    console.log("📬 Recipient now has", ethers.formatEther(amount), "WETH on Xaheen");
  }

  async processPastEvents() {
    console.log("\n🔍 CHECKING FOR PAST EVENTS...\n");

    const currentBlock = await this.bscProvider.getBlockNumber();
    const fromBlock = currentBlock - 1000; // Check last 1000 blocks (~50 minutes on BSC)

    console.log("Scanning blocks:", fromBlock, "to", currentBlock);

    try {
      // Get BNB bridge events
      const bnbEvents = await this.bnbBridgeBSC.queryFilter(
        this.bnbBridgeBSC.filters.BridgeDeposit(),
        fromBlock,
        currentBlock
      );

      console.log("Found", bnbEvents.length, "BNB bridge event(s)");

      for (const event of bnbEvents) {
        const [user, recipient, amount, fee, nonce, timestamp] = event.args;
        if (!this.processedNonces.bnb.has(nonce.toString())) {
          await this.handleBNBDeposit(user, recipient, amount, fee, nonce, timestamp, { log: event });
        }
      }

      // Get USDT bridge events
      const usdtEvents = await this.usdtBridgeBSC.queryFilter(
        this.usdtBridgeBSC.filters.BridgeDeposit(),
        fromBlock,
        currentBlock
      );

      console.log("Found", usdtEvents.length, "USDT bridge event(s)");

      for (const event of usdtEvents) {
        const [user, recipient, amount, fee, nonce, timestamp] = event.args;
        if (!this.processedNonces.usdt.has(nonce.toString())) {
          await this.handleUSDTDeposit(user, recipient, amount, fee, nonce, timestamp, { log: event });
        }
      }

      // Get ETH bridge events
      const ethEvents = await this.ethBridgeBSC.queryFilter(
        this.ethBridgeBSC.filters.BridgeDeposit(),
        fromBlock,
        currentBlock
      );

      console.log("Found", ethEvents.length, "ETH bridge event(s)");

      for (const event of ethEvents) {
        const [user, recipient, amount, fee, nonce, timestamp] = event.args;
        if (!this.processedNonces.eth.has(nonce.toString())) {
          await this.handleETHDeposit(user, recipient, amount, fee, nonce, timestamp, { log: event });
        }
      }

    } catch (error) {
      console.error("❌ Error processing past events:", error.message);
    }
  }
}

// Main execution
async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                                                            ║");
  console.log("║         🌉 XAHEEN BRIDGE VALIDATOR SERVICE 🌉             ║");
  console.log("║                                                            ║");
  console.log("║  Monitors BSC bridges and mints tokens on Xaheen Chain   ║");
  console.log("║                                                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n");

  const validator = new BridgeValidator();

  await validator.initialize();
  await validator.processPastEvents();
  await validator.startListening();

  // Keep process running
  process.on('SIGINT', () => {
    console.log("\n\n⏹️  Shutting down validator service...");
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("\n❌ VALIDATOR SERVICE ERROR:");
  console.error(error);
  process.exit(1);
});
