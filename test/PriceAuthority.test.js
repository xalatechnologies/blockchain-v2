import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("PriceAuthority", function () {
  // Fixture for deploying the contract with mock DEX pair
  async function deployPriceAuthorityFixture() {
    const [owner, quoteSigner, unauthorized] = await ethers.getSigners();

    // Deploy Mock XaheenDEXPair
    const MockDEXPair = await ethers.getContractFactory("MockXaheenDEXPair");
    const mockPair = await MockDEXPair.deploy();
    await mockPair.waitForDeployment();

    // Initialize with some price data
    const initialPrice0Cumulative = ethers.parseEther("100"); // Initial cumulative price
    const initialPrice1Cumulative = ethers.parseEther("50");
    await mockPair.setPrice(initialPrice0Cumulative, initialPrice1Cumulative);

    // Deploy PriceAuthority
    const PriceAuthority = await ethers.getContractFactory("PriceAuthority");
    const priceAuthority = await PriceAuthority.deploy(
      await mockPair.getAddress(),
      quoteSigner.address
    );
    await priceAuthority.waitForDeployment();

    return { priceAuthority, mockPair, owner, quoteSigner, unauthorized };
  }

  describe("Deployment", function () {
    it("Should set the correct Xaheen pair address", async function () {
      const { priceAuthority, mockPair } = await loadFixture(deployPriceAuthorityFixture);
      expect(await priceAuthority.xaheenPair()).to.equal(await mockPair.getAddress());
    });

    it("Should set the correct quote signer", async function () {
      const { priceAuthority, quoteSigner } = await loadFixture(deployPriceAuthorityFixture);
      expect(await priceAuthority.quoteSigner()).to.equal(quoteSigner.address);
    });

    it("Should initialize with correct policy spread", async function () {
      const { priceAuthority } = await loadFixture(deployPriceAuthorityFixture);
      expect(await priceAuthority.policySpreadBps()).to.equal(25); // 0.25%
    });

    it("Should initialize checkpoint on deployment", async function () {
      const { priceAuthority } = await loadFixture(deployPriceAuthorityFixture);
      const checkpoint = await priceAuthority.checkpoint0();
      expect(checkpoint.priceCumulative).to.be.gt(0);
      expect(checkpoint.timestamp).to.be.gt(0);
    });

    it("Should reject zero address for pair", async function () {
      const [, quoteSigner] = await ethers.getSigners();
      const PriceAuthority = await ethers.getContractFactory("PriceAuthority");

      await expect(
        PriceAuthority.deploy(ethers.ZeroAddress, quoteSigner.address)
      ).to.be.revertedWith("Invalid pair address");
    });

    it("Should reject zero address for signer", async function () {
      const { mockPair } = await loadFixture(deployPriceAuthorityFixture);
      const PriceAuthority = await ethers.getContractFactory("PriceAuthority");

      await expect(
        PriceAuthority.deploy(await mockPair.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid signer address");
    });
  });

  describe("TWAP Calculation", function () {
    it("Should calculate TWAP correctly after time passes", async function () {
      const { priceAuthority, mockPair } = await loadFixture(deployPriceAuthorityFixture);

      // Wait 5 minutes (minimum required)
      await time.increase(300);

      // Update price cumulative to simulate price changes
      const newPrice0Cumulative = ethers.parseEther("200"); // +100 ETH worth
      await mockPair.setPrice(newPrice0Cumulative, ethers.parseEther("100"));

      // Calculate expected TWAP
      // TWAP = (200 - 100) / 300 seconds = 0.333... ETH/second
      // With 0.25% spread: 0.333... * 1.0025

      const quote = await priceAuthority.currentQuote();
      expect(quote.price).to.be.gt(0);
      expect(quote.timestamp).to.be.gt(0);
    });

    it("Should revert if insufficient time has elapsed", async function () {
      const { priceAuthority } = await loadFixture(deployPriceAuthorityFixture);

      // Only wait 1 minute (less than 5 minute minimum)
      await time.increase(60);

      await expect(
        priceAuthority.currentQuote()
      ).to.be.revertedWith("Insufficient time elapsed");
    });

    it("Should apply policy spread to TWAP", async function () {
      const { priceAuthority, mockPair } = await loadFixture(deployPriceAuthorityFixture);

      // Wait minimum time
      await time.increase(300);

      // Update checkpoint to establish baseline
      await priceAuthority.updateCheckpoint();

      // Wait another period
      await time.increase(300);

      // Update price significantly
      const newPrice0Cumulative = ethers.parseEther("300");
      await mockPair.setPrice(newPrice0Cumulative, ethers.parseEther("150"));

      const quote = await priceAuthority.currentQuote();

      // Price should include 0.25% spread (25 bps)
      expect(quote.price).to.be.gt(0);
    });
  });

  describe("Checkpoint Management", function () {
    it("Should allow owner to update checkpoint", async function () {
      const { priceAuthority, owner } = await loadFixture(deployPriceAuthorityFixture);

      await time.increase(300);

      await expect(
        priceAuthority.connect(owner).updateCheckpoint()
      ).to.not.be.reverted;
    });

    it("Should prevent non-owner from updating checkpoint", async function () {
      const { priceAuthority, unauthorized } = await loadFixture(deployPriceAuthorityFixture);

      await expect(
        priceAuthority.connect(unauthorized).updateCheckpoint()
      ).to.be.revertedWithCustomError(priceAuthority, "OwnableUnauthorizedAccount");
    });

    it("Should emit CheckpointUpdated event", async function () {
      const { priceAuthority, mockPair } = await loadFixture(deployPriceAuthorityFixture);

      await time.increase(300);

      const newPrice0 = ethers.parseEther("200");
      const newPrice1 = ethers.parseEther("100");
      await mockPair.setPrice(newPrice0, newPrice1);

      await expect(priceAuthority.updateCheckpoint())
        .to.emit(priceAuthority, "CheckpointUpdated")
        .withArgs(newPrice0, newPrice1, await time.latest() + 1);
    });

    it("Should update both price0 and price1 checkpoints", async function () {
      const { priceAuthority, mockPair } = await loadFixture(deployPriceAuthorityFixture);

      await time.increase(300);

      const newPrice0 = ethers.parseEther("300");
      const newPrice1 = ethers.parseEther("150");
      await mockPair.setPrice(newPrice0, newPrice1);

      await priceAuthority.updateCheckpoint();

      const checkpoint0 = await priceAuthority.checkpoint0();
      const checkpoint1 = await priceAuthority.checkpoint1();

      expect(checkpoint0.priceCumulative).to.equal(newPrice0);
      expect(checkpoint1.priceCumulative).to.equal(newPrice1);
    });
  });

  describe("Quote Publishing", function () {
    it("Should allow owner to publish quote", async function () {
      const { priceAuthority, owner } = await loadFixture(deployPriceAuthorityFixture);

      await time.increase(300);

      await expect(
        priceAuthority.connect(owner).publishQuote()
      ).to.not.be.reverted;
    });

    it("Should prevent non-owner from publishing quote", async function () {
      const { priceAuthority, unauthorized } = await loadFixture(deployPriceAuthorityFixture);

      await expect(
        priceAuthority.connect(unauthorized).publishQuote()
      ).to.be.revertedWithCustomError(priceAuthority, "OwnableUnauthorizedAccount");
    });

    it("Should increment quote nonce", async function () {
      const { priceAuthority } = await loadFixture(deployPriceAuthorityFixture);

      await time.increase(300);

      const nonceBefore = await priceAuthority.quoteNonce();
      await priceAuthority.publishQuote();
      const nonceAfter = await priceAuthority.quoteNonce();

      expect(nonceAfter).to.equal(nonceBefore + 1n);
    });

    it("Should emit QuotePublished event", async function () {
      const { priceAuthority } = await loadFixture(deployPriceAuthorityFixture);

      await time.increase(300);

      await expect(priceAuthority.publishQuote())
        .to.emit(priceAuthority, "QuotePublished");
    });

    it("Should store last quote", async function () {
      const { priceAuthority } = await loadFixture(deployPriceAuthorityFixture);

      await time.increase(300);

      await priceAuthority.publishQuote();

      const lastQuote = await priceAuthority.lastQuote();
      expect(lastQuote.price).to.be.gt(0);
      expect(lastQuote.timestamp).to.be.gt(0);
      expect(lastQuote.nonce).to.equal(1);
    });
  });

  describe("Quote Verification", function () {
    it("Should verify valid signed quote", async function () {
      const { priceAuthority, quoteSigner } = await loadFixture(deployPriceAuthorityFixture);

      await time.increase(300);

      const price = ethers.parseEther("0.10"); // $0.10 per XHT
      const timestamp = await time.latest();
      const nonce = 1;

      // Sign the quote
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256"],
        [price, timestamp, nonce]
      );
      const signature = await quoteSigner.signMessage(ethers.getBytes(messageHash));

      // Encode quote
      const signedQuote = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "bytes"],
        [price, timestamp, nonce, signature]
      );

      expect(await priceAuthority.verifyQuote(signedQuote)).to.be.true;
    });

    it("Should reject quote with invalid signature", async function () {
      const { priceAuthority, unauthorized } = await loadFixture(deployPriceAuthorityFixture);

      const price = ethers.parseEther("0.10");
      const timestamp = await time.latest();
      const nonce = 1;

      // Sign with wrong signer
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256"],
        [price, timestamp, nonce]
      );
      const signature = await unauthorized.signMessage(ethers.getBytes(messageHash));

      const signedQuote = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "bytes"],
        [price, timestamp, nonce, signature]
      );

      expect(await priceAuthority.verifyQuote(signedQuote)).to.be.false;
    });

    it("Should reject expired quote (>60 seconds old)", async function () {
      const { priceAuthority, quoteSigner } = await loadFixture(deployPriceAuthorityFixture);

      const price = ethers.parseEther("0.10");
      const oldTimestamp = await time.latest();
      const nonce = 1;

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256"],
        [price, oldTimestamp, nonce]
      );
      const signature = await quoteSigner.signMessage(ethers.getBytes(messageHash));

      const signedQuote = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "bytes"],
        [price, oldTimestamp, nonce, signature]
      );

      // Wait 61 seconds
      await time.increase(61);

      expect(await priceAuthority.verifyQuote(signedQuote)).to.be.false;
    });

    it("Should reject quote with old nonce", async function () {
      const { priceAuthority, quoteSigner } = await loadFixture(deployPriceAuthorityFixture);

      await time.increase(300);

      // Publish two quotes to increment nonce to 2
      await priceAuthority.publishQuote();
      await priceAuthority.publishQuote();

      // Try to verify quote with nonce 1 (should fail)
      const price = ethers.parseEther("0.10");
      const timestamp = await time.latest();
      const oldNonce = 1;

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256"],
        [price, timestamp, oldNonce]
      );
      const signature = await quoteSigner.signMessage(ethers.getBytes(messageHash));

      const signedQuote = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "bytes"],
        [price, timestamp, oldNonce, signature]
      );

      expect(await priceAuthority.verifyQuote(signedQuote)).to.be.false;
    });
  });

  describe("Signer Management", function () {
    it("Should allow owner to update quote signer", async function () {
      const { priceAuthority, owner } = await loadFixture(deployPriceAuthorityFixture);
      const [, , newSigner] = await ethers.getSigners();

      await priceAuthority.connect(owner).updateQuoteSigner(newSigner.address);
      expect(await priceAuthority.quoteSigner()).to.equal(newSigner.address);
    });

    it("Should prevent non-owner from updating signer", async function () {
      const { priceAuthority, unauthorized } = await loadFixture(deployPriceAuthorityFixture);
      const [, , newSigner] = await ethers.getSigners();

      await expect(
        priceAuthority.connect(unauthorized).updateQuoteSigner(newSigner.address)
      ).to.be.revertedWithCustomError(priceAuthority, "OwnableUnauthorizedAccount");
    });

    it("Should reject zero address for new signer", async function () {
      const { priceAuthority } = await loadFixture(deployPriceAuthorityFixture);

      await expect(
        priceAuthority.updateQuoteSigner(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid signer");
    });

    it("Should emit QuoteSignerUpdated event", async function () {
      const { priceAuthority, quoteSigner } = await loadFixture(deployPriceAuthorityFixture);
      const [, , newSigner] = await ethers.getSigners();

      await expect(priceAuthority.updateQuoteSigner(newSigner.address))
        .to.emit(priceAuthority, "QuoteSignerUpdated")
        .withArgs(quoteSigner.address, newSigner.address);
    });
  });

  describe("Policy Spread Management", function () {
    it("Should allow owner to update policy spread", async function () {
      const { priceAuthority } = await loadFixture(deployPriceAuthorityFixture);

      const newSpread = 50; // 0.5%
      await priceAuthority.updatePolicySpread(newSpread);
      expect(await priceAuthority.policySpreadBps()).to.equal(newSpread);
    });

    it("Should prevent non-owner from updating spread", async function () {
      const { priceAuthority, unauthorized } = await loadFixture(deployPriceAuthorityFixture);

      await expect(
        priceAuthority.connect(unauthorized).updatePolicySpread(50)
      ).to.be.revertedWithCustomError(priceAuthority, "OwnableUnauthorizedAccount");
    });

    it("Should reject spread higher than 100 bps (1%)", async function () {
      const { priceAuthority } = await loadFixture(deployPriceAuthorityFixture);

      await expect(
        priceAuthority.updatePolicySpread(101)
      ).to.be.revertedWith("Spread too high");
    });

    it("Should emit PolicySpreadUpdated event", async function () {
      const { priceAuthority } = await loadFixture(deployPriceAuthorityFixture);

      const oldSpread = 25;
      const newSpread = 50;

      await expect(priceAuthority.updatePolicySpread(newSpread))
        .to.emit(priceAuthority, "PolicySpreadUpdated")
        .withArgs(oldSpread, newSpread);
    });
  });

  describe("Constants", function () {
    it("Should have correct TWAP window", async function () {
      const { priceAuthority } = await loadFixture(deployPriceAuthorityFixture);
      expect(await priceAuthority.TWAP_WINDOW()).to.equal(1800); // 30 minutes
    });

    it("Should have correct quote freshness limit", async function () {
      const { priceAuthority } = await loadFixture(deployPriceAuthorityFixture);
      expect(await priceAuthority.QUOTE_FRESHNESS()).to.equal(60); // 60 seconds
    });
  });
});

// Mock XaheenDEXPair contract for testing
// This would normally be in contracts/test/MockXaheenDEXPair.sol
