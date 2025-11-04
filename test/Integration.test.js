import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

/**
 * Integration Tests for Cross-Chain DEX
 *
 * Tests complete trade flows from spoke to hub settlement
 */
describe("Cross-Chain DEX Integration Tests", function () {
  // Fixture: Deploy entire system (hub + spoke)
  async function deployFullSystemFixture() {
    const [owner, quoteSigner, relayer, trader, validator] =
      await ethers.getSigners();

    // ========== DEPLOY HUB CONTRACTS (Nor Chain) ==========

    // 1. Deploy Mock DEX Pair
    const MockDEXPair = await ethers.getContractFactory("MockNorDEXPair");
    const mockPair = await MockDEXPair.deploy();
    await mockPair.waitForDeployment();

    // Initialize with price: 1 NOR = $0.10
    await mockPair.setPrice(
      ethers.parseEther("100"),
      ethers.parseEther("1000")
    );

    // 2. Deploy PriceAuthority
    const PriceAuthority = await ethers.getContractFactory("PriceAuthority");
    const priceAuthority = await PriceAuthority.deploy(
      await mockPair.getAddress(),
      quoteSigner.address
    );
    await priceAuthority.waitForDeployment();

    // 3. Deploy Mock NOR Token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const xhtToken = await MockERC20.deploy("Nor Token", "NOR", 18);
    await xhtToken.waitForDeployment();

    // Mint initial supply
    await xhtToken.mint(owner.address, ethers.parseEther("1000000")); // 1M NOR

    // 4. Deploy SupplyController
    const SupplyController = await ethers.getContractFactory(
      "SupplyController"
    );
    const supplyController = await SupplyController.deploy(
      await xhtToken.getAddress(),
      owner.address // Treasury
    );
    await supplyController.waitForDeployment();

    // Grant minter role to supply controller
    const MINTER_ROLE = await xhtToken.MINTER_ROLE();
    await xhtToken.grantRole(MINTER_ROLE, await supplyController.getAddress());

    // 5. Deploy SettlementHub
    const SettlementHub = await ethers.getContractFactory("SettlementHub");
    const settlementHub = await SettlementHub.deploy(
      await supplyController.getAddress(),
      await priceAuthority.getAddress(),
      relayer.address
    );
    await settlementHub.waitForDeployment();

    // Grant operator role to settlement hub
    const OPERATOR_ROLE = await supplyController.OPERATOR_ROLE();
    await supplyController.grantRole(
      OPERATOR_ROLE,
      await settlementHub.getAddress()
    );

    // Configure BSC chain (testnet chainId 97)
    await supplyController.addChain(
      97, // BSC Testnet
      ethers.parseEther("50000"), // $50K daily limit
      300 // 3% inventory cap
    );

    // ========== DEPLOY SPOKE CONTRACTS (BSC Testnet) ==========

    // 6. Deploy Mock USDT (for payments)
    const usdt = await MockERC20.deploy("Tether USD", "USDT", 6);
    await usdt.waitForDeployment();
    await usdt.mint(trader.address, 100000e6); // 100K USDT to trader

    // 7. Deploy Wrapped NOR on spoke
    const wrappedNOR = await MockERC20.deploy("Wrapped NOR", "WNOR", 18);
    await wrappedNOR.waitForDeployment();

    // 8. Deploy SettlementInbox
    const SettlementInbox = await ethers.getContractFactory("SettlementInbox");
    const settlementInbox = await SettlementInbox.deploy(
      ethers.ZeroAddress // Temporary, will update
    );
    await settlementInbox.waitForDeployment();

    // 9. Deploy Mock DEX Router (for public LP)
    const MockDEXRouter = await ethers.getContractFactory("MockDEXRouter");
    const mockDEXRouter = await MockDEXRouter.deploy();
    await mockDEXRouter.waitForDeployment();

    // 10. Deploy NorRouter
    const NorRouter = await ethers.getContractFactory("NorRouter");
    const xaheenRouter = await NorRouter.deploy(
      await wrappedNOR.getAddress(),
      await settlementInbox.getAddress(),
      quoteSigner.address,
      await mockDEXRouter.getAddress()
    );
    await xaheenRouter.waitForDeployment();

    // Update settlement inbox with router address
    await settlementInbox.updateRouter(await xaheenRouter.getAddress());

    // Add USDT as payment token
    await xaheenRouter.addPaymentToken(await usdt.getAddress());

    // Replenish hot inventory (10K NOR)
    await wrappedNOR.mint(owner.address, ethers.parseEther("10000"));
    await wrappedNOR.approve(
      await xaheenRouter.getAddress(),
      ethers.parseEther("10000")
    );
    await xaheenRouter.replenishInventory(ethers.parseEther("10000"));

    return {
      // Hub
      priceAuthority,
      supplyController,
      settlementHub,
      xhtToken,
      mockPair,
      // Spoke
      xaheenRouter,
      settlementInbox,
      wrappedNOR,
      usdt,
      mockDEXRouter,
      // Signers
      owner,
      quoteSigner,
      relayer,
      trader,
      validator,
    };
  }

  // ========== SCENARIO 1: HAPPY PATH TRADE ==========

  describe("Scenario 1: Happy Path - Buy NOR", function () {
    it("Should complete full trade flow from spoke to hub settlement", async function () {
      const {
        priceAuthority,
        supplyController,
        settlementHub,
        xaheenRouter,
        settlementInbox,
        wrappedNOR,
        usdt,
        quoteSigner,
        relayer,
        trader,
      } = await loadFixture(deployFullSystemFixture);

      console.log("\n📊 Scenario 1: Happy Path Trade");
      console.log("===============================");

      // Step 1: Get current quote from PriceAuthority
      await time.increase(300); // Wait 5 minutes
      const [price, timestamp] = await priceAuthority.currentQuote();
      console.log(`1. Price quote: $${ethers.formatEther(price)}`);

      // Step 2: Sign the quote
      const nonce = 1;
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256"],
        [price, timestamp, nonce]
      );
      const signature = await quoteSigner.signMessage(
        ethers.getBytes(messageHash)
      );
      const signedQuote = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "bytes"],
        [price, timestamp, nonce, signature]
      );

      // Step 3: Trader approves USDT
      const usdtAmount = 1000e6; // 1000 USDT
      await usdt
        .connect(trader)
        .approve(await xaheenRouter.getAddress(), usdtAmount);
      console.log(`2. Trader approved ${usdtAmount / 1e6} USDT`);

      // Step 4: Execute buyNOR on spoke
      const minNOROut = ethers.parseEther("9900"); // Expect ~10,000 NOR (1% slippage)
      const deadline = (await time.latest()) + 300; // 5 minutes

      const balanceBefore = await wrappedNOR.balanceOf(trader.address);

      await xaheenRouter
        .connect(trader)
        .buyNOR(
          await usdt.getAddress(),
          usdtAmount,
          minNOROut,
          signedQuote,
          deadline
        );

      const balanceAfter = await wrappedNOR.balanceOf(trader.address);
      const xhtReceived = balanceAfter - balanceBefore;
      console.log(
        `3. Trade executed: Received ${ethers.formatEther(xhtReceived)} NOR`
      );

      // Step 5: Verify Fill event emitted
      const events = await settlementInbox.queryFilter("Fill");
      expect(events.length).to.equal(1);

      const fillEvent = events[0];
      const [
        fillId,
        traderAddr,
        xhtDelta,
        cashDelta,
        fillNonce,
        fillTimestamp,
      ] = fillEvent.args;
      console.log(`4. Fill event emitted: ${fillId}`);
      console.log(`   NOR Delta: ${ethers.formatEther(xhtDelta)}`);
      console.log(`   Cash Delta: ${cashDelta / 1e6} USDT`);

      // Step 6: Relayer forwards receipt to SettlementHub
      const receipt = {
        fillId,
        chainId: 97, // BSC Testnet
        trader: traderAddr,
        xhtDelta,
        proceeds: ethers.parseEther((cashDelta / 1e6).toString()), // Convert to 18 decimals
        timestamp: fillTimestamp,
        nonce: fillNonce,
        signature: "0x", // Placeholder
        signedQuote,
      };

      // Sign receipt with relayer
      const receiptHash = ethers.solidityPackedKeccak256(
        [
          "bytes32",
          "uint64",
          "address",
          "int256",
          "uint256",
          "uint256",
          "uint256",
        ],
        [
          fillId,
          97,
          traderAddr,
          xhtDelta,
          receipt.proceeds,
          fillTimestamp,
          fillNonce,
        ]
      );
      const receiptSignature = await relayer.signMessage(
        ethers.getBytes(receiptHash)
      );
      receipt.signature = receiptSignature;

      await settlementHub.connect(relayer).acknowledgeFill(receipt);
      console.log(`5. Receipt forwarded to SettlementHub`);

      // Step 7: Verify settlement processed
      const isProcessed = await settlementHub.isFillProcessed(fillId);
      expect(isProcessed).to.be.true;
      console.log(`6. Fill processed on hub: ${isProcessed}`);

      // Step 8: Check inventory updated on hub
      const [balance] = await supplyController.getChainInventory(97);
      console.log(
        `7. Updated spoke inventory: ${ethers.formatEther(balance)} NOR`
      );

      console.log("\n✅ Happy path test passed!");
    });
  });

  // ========== SCENARIO 2: EXPIRED QUOTE ==========

  describe("Scenario 2: Expired Quote Protection", function () {
    it("Should reject trade with expired quote (>60s)", async function () {
      const { priceAuthority, xaheenRouter, usdt, quoteSigner, trader } =
        await loadFixture(deployFullSystemFixture);

      console.log("\n⏰ Scenario 2: Expired Quote");
      console.log("============================");

      // Step 1: Get quote
      await time.increase(300);
      const [price, timestamp] = await priceAuthority.currentQuote();

      // Step 2: Sign quote
      const nonce = 1;
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256"],
        [price, timestamp, nonce]
      );
      const signature = await quoteSigner.signMessage(
        ethers.getBytes(messageHash)
      );
      const signedQuote = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "bytes"],
        [price, timestamp, nonce, signature]
      );

      // Step 3: Wait 61 seconds (expire quote)
      await time.increase(61);
      console.log("1. Quote expired after 61 seconds");

      // Step 4: Approve USDT
      await usdt
        .connect(trader)
        .approve(await xaheenRouter.getAddress(), 1000e6);

      // Step 5: Attempt trade with expired quote
      const minNOROut = ethers.parseEther("9900");
      const deadline = (await time.latest()) + 300;

      await expect(
        xaheenRouter
          .connect(trader)
          .buyNOR(
            await usdt.getAddress(),
            1000e6,
            minNOROut,
            signedQuote,
            deadline
          )
      ).to.be.revertedWith("Quote expired");

      console.log("2. Trade rejected: Quote expired ✅");
      console.log("\n✅ Expired quote protection working!");
    });
  });

  // ========== SCENARIO 3: INVENTORY CAP ENFORCEMENT ==========

  describe("Scenario 3: Inventory Cap Protection", function () {
    it("Should reject topup exceeding 3% cap", async function () {
      const { supplyController, xhtToken } = await loadFixture(
        deployFullSystemFixture
      );

      console.log("\n🚧 Scenario 3: Inventory Cap");
      console.log("===========================");

      // Step 1: Check current cap
      const totalSupply = await xhtToken.totalSupply();
      const maxAllowed = (totalSupply * 300n) / 10000n; // 3%
      console.log(`1. Total supply: ${ethers.formatEther(totalSupply)} NOR`);
      console.log(`2. Max allowed (3%): ${ethers.formatEther(maxAllowed)} NOR`);

      // Step 2: Try to topup beyond cap
      const excessAmount = maxAllowed + ethers.parseEther("1000");

      await expect(
        supplyController.authorizeTopup(97, excessAmount)
      ).to.be.revertedWith("Exceeds inventory cap");

      console.log("3. Topup rejected: Exceeds cap ✅");
      console.log("\n✅ Inventory cap protection working!");
    });
  });

  // ========== SCENARIO 4: CIRCUIT BREAKER ==========

  describe("Scenario 4: Circuit Breaker on Price Deviation", function () {
    it("Should auto-pause on >3% price deviation", async function () {
      const { settlementHub, priceAuthority, quoteSigner, relayer } =
        await loadFixture(deployFullSystemFixture);

      console.log("\n🛑 Scenario 4: Circuit Breaker");
      console.log("==============================");

      // Step 1: Get normal price
      await time.increase(300);
      const [normalPrice] = await priceAuthority.currentQuote();
      console.log(`1. Normal price: $${ethers.formatEther(normalPrice)}`);

      // Step 2: Create manipulated quote (5% higher)
      const manipulatedPrice = (normalPrice * 105n) / 100n;
      console.log(
        `2. Manipulated price: $${ethers.formatEther(manipulatedPrice)} (+5%)`
      );

      // Step 3: Create fake receipt with manipulated price
      const fillId = ethers.randomBytes(32);
      const timestamp = await time.latest();
      const nonce = 1;

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256"],
        [manipulatedPrice, timestamp, nonce]
      );
      const signature = await quoteSigner.signMessage(
        ethers.getBytes(messageHash)
      );
      const signedQuote = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "bytes"],
        [manipulatedPrice, timestamp, nonce, signature]
      );

      const receipt = {
        fillId,
        chainId: 97,
        trader: relayer.address,
        xhtDelta: ethers.parseEther("1000"),
        proceeds: ethers.parseEther("105"), // $105 for 1000 NOR = $0.105/NOR
        timestamp,
        nonce: 1,
        signature: "0x",
        signedQuote,
      };

      // Sign receipt
      const receiptHash = ethers.solidityPackedKeccak256(
        [
          "bytes32",
          "uint64",
          "address",
          "int256",
          "uint256",
          "uint256",
          "uint256",
        ],
        [
          fillId,
          97,
          relayer.address,
          receipt.xhtDelta,
          receipt.proceeds,
          timestamp,
          1,
        ]
      );
      receipt.signature = await relayer.signMessage(
        ethers.getBytes(receiptHash)
      );

      // Step 4: Attempt to process receipt (should trigger circuit breaker)
      await expect(
        settlementHub.connect(relayer).acknowledgeFill(receipt)
      ).to.be.revertedWith("Price deviation too high");

      console.log("3. Receipt rejected: Price deviation >3% ✅");

      // Step 5: Verify chain auto-paused
      const isPaused = await settlementHub.chainPaused(97);
      expect(isPaused).to.be.true;
      console.log(`4. Chain auto-paused: ${isPaused} ✅`);

      console.log("\n✅ Circuit breaker working!");
    });
  });

  // ========== SCENARIO 5: REPLAY ATTACK PREVENTION ==========

  describe("Scenario 5: Replay Attack Prevention", function () {
    it("Should reject receipt with duplicate fillId", async function () {
      const { settlementHub, priceAuthority, quoteSigner, relayer } =
        await loadFixture(deployFullSystemFixture);

      console.log("\n🔒 Scenario 5: Replay Attack");
      console.log("===========================");

      // Step 1: Create valid receipt
      await time.increase(300);
      const [price, timestamp] = await priceAuthority.currentQuote();

      const fillId = ethers.randomBytes(32);
      const nonce = 1;

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256"],
        [price, timestamp, nonce]
      );
      const signature = await quoteSigner.signMessage(
        ethers.getBytes(messageHash)
      );
      const signedQuote = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "bytes"],
        [price, timestamp, nonce, signature]
      );

      const receipt = {
        fillId,
        chainId: 97,
        trader: relayer.address,
        xhtDelta: ethers.parseEther("100"),
        proceeds: ethers.parseEther("10"),
        timestamp,
        nonce: 1,
        signature: "0x",
        signedQuote,
      };

      const receiptHash = ethers.solidityPackedKeccak256(
        [
          "bytes32",
          "uint64",
          "address",
          "int256",
          "uint256",
          "uint256",
          "uint256",
        ],
        [
          fillId,
          97,
          relayer.address,
          receipt.xhtDelta,
          receipt.proceeds,
          timestamp,
          1,
        ]
      );
      receipt.signature = await relayer.signMessage(
        ethers.getBytes(receiptHash)
      );

      // Step 2: Submit first time (should succeed)
      await settlementHub.connect(relayer).acknowledgeFill(receipt);
      console.log("1. First submission: Success ✅");

      // Step 3: Try to replay (should fail)
      await expect(
        settlementHub.connect(relayer).acknowledgeFill(receipt)
      ).to.be.revertedWith("Fill already processed");

      console.log("2. Replay attempt: Rejected ✅");
      console.log("\n✅ Replay attack prevention working!");
    });
  });
});

// ========== MOCK CONTRACTS ==========

// Mock ERC20 Token
// Create this in contracts/test/MockERC20.sol
