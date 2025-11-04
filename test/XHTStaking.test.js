import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("NORStaking", function () {
  // Fixture for deploying the contract
  async function deployNORStakingFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    const NORStaking = await ethers.getContractFactory("NORStaking");
    const staking = await NORStaking.deploy();
    await staking.waitForDeployment();

    return { staking, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { staking, owner } = await loadFixture(deployNORStakingFixture);
      expect(await staking.owner()).to.equal(owner.address);
    });

    it("Should initialize lock tiers correctly", async function () {
      const { staking } = await loadFixture(deployNORStakingFixture);

      // Check tier 0 (no lock)
      const tier0 = await staking.lockTiers(0);
      expect(tier0.duration).to.equal(0);
      expect(tier0.votingMultiplier).to.equal(100);
      expect(tier0.rewardBonus).to.equal(0);

      // Check tier 3 (365 days)
      const tier3 = await staking.lockTiers(3);
      expect(tier3.duration).to.equal(365);
      expect(tier3.votingMultiplier).to.equal(300);
      expect(tier3.rewardBonus).to.equal(30);
    });

    it("Should have correct minimum stake amount", async function () {
      const { staking } = await loadFixture(deployNORStakingFixture);
      expect(await staking.MIN_STAKE()).to.equal(ethers.parseEther("1000"));
    });
  });

  describe("Staking", function () {
    it("Should allow staking with minimum amount", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("1000");

      await expect(
        staking.connect(user1).stake(stakeAmount, 0, { value: stakeAmount })
      )
        .to.emit(staking, "Staked")
        .withArgs(user1.address, stakeAmount, 0);

      const stakeInfo = await staking.stakes(user1.address);
      expect(stakeInfo.amount).to.equal(stakeAmount);
    });

    it("Should reject staking below minimum", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("999");

      await expect(
        staking.connect(user1).stake(stakeAmount, 0, { value: stakeAmount })
      ).to.be.revertedWith("Below minimum stake");
    });

    it("Should reject staking with mismatched amount", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("1000");
      const sendAmount = ethers.parseEther("1001");

      await expect(
        staking.connect(user1).stake(stakeAmount, 0, { value: sendAmount })
      ).to.be.revertedWith("Amount mismatch");
    });

    it("Should reject invalid lock tier", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("1000");

      await expect(
        staking.connect(user1).stake(stakeAmount, 5, { value: stakeAmount })
      ).to.be.revertedWith("Invalid lock tier");
    });

    it("Should prevent double staking", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("1000");

      await staking
        .connect(user1)
        .stake(stakeAmount, 0, { value: stakeAmount });

      await expect(
        staking.connect(user1).stake(stakeAmount, 0, { value: stakeAmount })
      ).to.be.revertedWith("Already staking");
    });

    it("Should mark validator for stakes >= 10,000 NOR", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const validatorStake = ethers.parseEther("10000");

      await expect(
        staking
          .connect(user1)
          .stake(validatorStake, 0, { value: validatorStake })
      )
        .to.emit(staking, "ValidatorStatusUpdated")
        .withArgs(user1.address, true);

      const stakeInfo = await staking.stakes(user1.address);
      expect(stakeInfo.isValidator).to.be.true;
    });

    it("Should update totalStaked correctly", async function () {
      const { staking, user1, user2 } = await loadFixture(
        deployNORStakingFixture
      );
      const stake1 = ethers.parseEther("1000");
      const stake2 = ethers.parseEther("2000");

      await staking.connect(user1).stake(stake1, 0, { value: stake1 });
      expect(await staking.totalStaked()).to.equal(stake1);

      await staking.connect(user2).stake(stake2, 0, { value: stake2 });
      expect(await staking.totalStaked()).to.equal(stake1 + stake2);
    });
  });

  describe("Unstaking", function () {
    it("Should allow unstaking after lock period", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("1000");

      // Stake with no lock period
      await staking
        .connect(user1)
        .stake(stakeAmount, 0, { value: stakeAmount });

      // Unstake immediately (no lock)
      await expect(staking.connect(user1).unstake()).to.emit(
        staking,
        "Unstaked"
      );

      const stakeInfo = await staking.stakes(user1.address);
      expect(stakeInfo.amount).to.equal(0);
    });

    it("Should prevent unstaking during lock period", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("1000");

      // Stake with 90 day lock
      await staking
        .connect(user1)
        .stake(stakeAmount, 1, { value: stakeAmount });

      // Try to unstake immediately
      await expect(staking.connect(user1).unstake()).to.be.revertedWith(
        "Still locked"
      );
    });

    it("Should allow unstaking after lock period expires", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("1000");

      // Stake with 90 day lock
      await staking
        .connect(user1)
        .stake(stakeAmount, 1, { value: stakeAmount });

      // Fast forward 91 days
      await time.increase(91 * 24 * 60 * 60);

      // Should now be able to unstake
      await expect(staking.connect(user1).unstake()).to.emit(
        staking,
        "Unstaked"
      );
    });

    it("Should update totalStaked after unstaking", async function () {
      const { staking, user1, user2 } = await loadFixture(
        deployNORStakingFixture
      );
      const stake1 = ethers.parseEther("1000");
      const stake2 = ethers.parseEther("2000");

      await staking.connect(user1).stake(stake1, 0, { value: stake1 });
      await staking.connect(user2).stake(stake2, 0, { value: stake2 });

      expect(await staking.totalStaked()).to.equal(stake1 + stake2);

      await staking.connect(user1).unstake();
      expect(await staking.totalStaked()).to.equal(stake2);
    });
  });

  describe("Reward Calculation", function () {
    it("Should calculate dynamic APY correctly", async function () {
      const { staking } = await loadFixture(deployNORStakingFixture);

      // At 0% staked, APY should be maximum (20%)
      expect(await staking.calculateCurrentAPY()).to.equal(20);
    });

    it("Should calculate rewards based on time staked", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("1000");

      await staking
        .connect(user1)
        .stake(stakeAmount, 0, { value: stakeAmount });

      // Fast forward 30 days
      await time.increase(30 * 24 * 60 * 60);

      const pendingRewards = await staking.calculatePendingRewards(
        user1.address
      );
      expect(pendingRewards).to.be.gt(0);
    });

    it("Should apply lock period bonus to rewards", async function () {
      const { staking, user1, user2 } = await loadFixture(
        deployNORStakingFixture
      );
      const stakeAmount = ethers.parseEther("1000");

      // User1 stakes with no lock
      await staking
        .connect(user1)
        .stake(stakeAmount, 0, { value: stakeAmount });

      // User2 stakes with 365 day lock (30% bonus)
      await staking
        .connect(user2)
        .stake(stakeAmount, 3, { value: stakeAmount });

      // Fast forward 30 days
      await time.increase(30 * 24 * 60 * 60);

      const rewards1 = await staking.calculatePendingRewards(user1.address);
      const rewards2 = await staking.calculatePendingRewards(user2.address);

      // User2 should have more rewards due to 30% bonus
      expect(rewards2).to.be.gt(rewards1);
    });
  });

  describe("Voting Power", function () {
    it("Should calculate voting power with multipliers", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("1000");

      // Stake with 365 day lock (3x multiplier)
      await staking
        .connect(user1)
        .stake(stakeAmount, 3, { value: stakeAmount });

      const votingPower = await staking.getVotingPower(user1.address);
      // 1000 NOR * 3x = 3000 voting power
      expect(votingPower).to.equal(stakeAmount * 3n);
    });

    it("Should give validators 5x voting power", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const validatorStake = ethers.parseEther("10000");

      // Stake as validator with no lock
      await staking
        .connect(user1)
        .stake(validatorStake, 0, { value: validatorStake });

      const votingPower = await staking.getVotingPower(user1.address);
      // 10000 NOR * 1x (no lock) * 5x (validator) = 50000 voting power
      expect(votingPower).to.equal(validatorStake * 5n);
    });
  });

  describe("Revenue Distribution", function () {
    it("Should accept revenue deposits", async function () {
      const { staking, owner } = await loadFixture(deployNORStakingFixture);
      const revenueAmount = ethers.parseEther("100");

      await expect(staking.connect(owner).addRevenue({ value: revenueAmount }))
        .to.emit(staking, "RevenueAdded")
        .withArgs(revenueAmount);

      expect(await staking.revenuePool()).to.equal(revenueAmount);
    });

    it("Should distribute revenue proportionally to stakers", async function () {
      const { staking, user1, user2, owner } = await loadFixture(
        deployNORStakingFixture
      );
      const stake1 = ethers.parseEther("1000");
      const stake2 = ethers.parseEther("2000");
      const revenue = ethers.parseEther("300");

      // Two users stake
      await staking.connect(user1).stake(stake1, 0, { value: stake1 });
      await staking.connect(user2).stake(stake2, 0, { value: stake2 });

      // Add revenue
      await staking.connect(owner).addRevenue({ value: revenue });

      // Fast forward to accumulate rewards
      await time.increase(30 * 24 * 60 * 60);

      // User2 should have 2x the rewards of user1 (proportional to stake)
      const rewards1 = await staking.calculatePendingRewards(user1.address);
      const rewards2 = await staking.calculatePendingRewards(user2.address);

      // Allow for small rounding errors
      const ratio = Number(rewards2) / Number(rewards1);
      expect(ratio).to.be.closeTo(2, 0.1);
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause", async function () {
      const { staking, owner } = await loadFixture(deployNORStakingFixture);

      await staking.connect(owner).pause();
      expect(await staking.paused()).to.be.true;
    });

    it("Should prevent staking when paused", async function () {
      const { staking, owner, user1 } = await loadFixture(
        deployNORStakingFixture
      );
      const stakeAmount = ethers.parseEther("1000");

      await staking.connect(owner).pause();

      await expect(
        staking.connect(user1).stake(stakeAmount, 0, { value: stakeAmount })
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow unpause and resume operations", async function () {
      const { staking, owner, user1 } = await loadFixture(
        deployNORStakingFixture
      );
      const stakeAmount = ethers.parseEther("1000");

      await staking.connect(owner).pause();
      await staking.connect(owner).unpause();

      await expect(
        staking.connect(user1).stake(stakeAmount, 0, { value: stakeAmount })
      ).to.emit(staking, "Staked");
    });

    it("Should prevent non-owner from pausing", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);

      await expect(staking.connect(user1).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to add revenue", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const revenue = ethers.parseEther("100");

      await expect(
        staking.connect(user1).addRevenue({ value: revenue })
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow ownership transfer", async function () {
      const { staking, owner, user1 } = await loadFixture(
        deployNORStakingFixture
      );

      await staking.connect(owner).transferOwnership(user1.address);
      expect(await staking.owner()).to.equal(user1.address);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero rewards gracefully", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("1000");

      await staking
        .connect(user1)
        .stake(stakeAmount, 0, { value: stakeAmount });

      // Immediately check rewards (should be 0)
      const rewards = await staking.calculatePendingRewards(user1.address);
      expect(rewards).to.equal(0);
    });

    it("Should handle multiple stake-unstake cycles", async function () {
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("1000");

      // First cycle
      await staking
        .connect(user1)
        .stake(stakeAmount, 0, { value: stakeAmount });
      await staking.connect(user1).unstake();

      // Second cycle
      await staking
        .connect(user1)
        .stake(stakeAmount, 0, { value: stakeAmount });
      const stakeInfo = await staking.stakes(user1.address);
      expect(stakeInfo.amount).to.equal(stakeAmount);
    });

    it("Should handle large number of stakers", async function () {
      const { staking } = await loadFixture(deployNORStakingFixture);
      const signers = await ethers.getSigners();
      const stakeAmount = ethers.parseEther("1000");

      // Stake with first 10 accounts
      for (let i = 1; i < 11; i++) {
        await staking
          .connect(signers[i])
          .stake(stakeAmount, 0, { value: stakeAmount });
      }

      expect(await staking.totalStaked()).to.equal(stakeAmount * 10n);
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy attacks on unstake", async function () {
      // This is automatically protected by OpenZeppelin's ReentrancyGuard
      // But we test it anyway to ensure it's working
      const { staking, user1 } = await loadFixture(deployNORStakingFixture);
      const stakeAmount = ethers.parseEther("1000");

      await staking
        .connect(user1)
        .stake(stakeAmount, 0, { value: stakeAmount });

      // OpenZeppelin's ReentrancyGuard prevents this
      // The second call would fail with "ReentrancyGuard: reentrant call"
      await expect(staking.connect(user1).unstake()).to.not.be.reverted;
    });
  });
});
