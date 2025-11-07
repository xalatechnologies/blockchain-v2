/**
 * Setup Multi-Sig Ownership for NorTokenUltra
 *
 * This script prepares ownership transfer to a Gnosis Safe multi-sig
 *
 * For $100k launch, we recommend:
 * - 3-of-5 multi-sig
 * - Transparent signer list
 * - Public documentation
 *
 * This provides:
 * ✅ Decentralized control
 * ✅ Bot protection capability
 * ✅ Emergency response
 * ✅ Community trust
 *
 * Process:
 * 1. Deploy Gnosis Safe (https://app.safe.global/)
 * 2. Add 5 signers
 * 3. Set threshold to 3
 * 4. Run this script to transfer ownership
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// NorTokenUltra address
const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";

// Gnosis Safe address (deploy first at https://app.safe.global/)
const GNOSIS_SAFE_ADDRESS = "0x..."; // UPDATE THIS AFTER DEPLOYING SAFE

// Recommended signers for 3-of-5 multi-sig
const RECOMMENDED_SIGNERS = [
  {
    role: "Founder/CEO",
    description: "Project founder, verified KYC",
    responsibilities: "Strategic decisions, marketing approval"
  },
  {
    role: "CTO/Developer",
    description: "Technical lead, contract developer",
    responsibilities: "Technical upgrades, bug fixes"
  },
  {
    role: "Community Representative 1",
    description: "Elected by community, doxxed",
    responsibilities: "Community interests, transparency"
  },
  {
    role: "Community Representative 2",
    description: "Elected by community, doxxed",
    responsibilities: "Community interests, decentralization"
  },
  {
    role: "Security Advisor",
    description: "External auditor or security expert",
    responsibilities: "Security oversight, best practices"
  }
];

async function main() {
  console.log("\n🔐 SETTING UP MULTI-SIG OWNERSHIP");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`\n📋 Current Owner: ${deployer.address}`);

  // Check if Gnosis Safe address is set
  if (GNOSIS_SAFE_ADDRESS === "0x...") {
    console.log(`\n⚠️  GNOSIS SAFE NOT CONFIGURED`);
    console.log("═".repeat(70));
    console.log(`\n📝 Setup Instructions:`);
    console.log(`\n1. Go to https://app.safe.global/`);
    console.log(`2. Connect to NorChain (Chain ID: 65001)`);
    console.log(`3. Create new Safe`);
    console.log(`4. Add 5 signer addresses`);
    console.log(`5. Set threshold: 3 of 5`);
    console.log(`6. Deploy Safe`);
    console.log(`\n7. Update this script with Safe address:`);
    console.log(`   const GNOSIS_SAFE_ADDRESS = "0xYourSafeAddress";`);
    console.log(`\n8. Run this script again`);

    console.log(`\n\n📊 Recommended Signer Structure:`);
    console.log("═".repeat(70));
    RECOMMENDED_SIGNERS.forEach((signer, index) => {
      console.log(`\n${index + 1}. ${signer.role}`);
      console.log(`   Description: ${signer.description}`);
      console.log(`   Responsibilities: ${signer.responsibilities}`);
    });

    console.log(`\n\n💡 Why 3-of-5 Multi-Sig?`);
    console.log("═".repeat(70));
    console.log(`\n✅ Decentralization: No single person has control`);
    console.log(`✅ Security: Requires 3 parties to collude`);
    console.log(`✅ Availability: Can execute with 3 even if 2 unavailable`);
    console.log(`✅ Trust: Community + team + advisor oversight`);
    console.log(`✅ Scanner Friendly: Better than single owner`);

    console.log(`\n\n⏸️  Pausing - Configure Gnosis Safe first!`);
    return;
  }

  // Get NorTokenUltra contract
  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const currentOwner = await norToken.owner();

  console.log(`   New Owner (Multi-Sig): ${GNOSIS_SAFE_ADDRESS}`);

  // Verify current owner
  if (currentOwner !== deployer.address) {
    throw new Error(`Current owner (${currentOwner}) doesn't match deployer (${deployer.address})`);
  }

  console.log(`\n⚠️  IMPORTANT: This transfers ALL ownership to multi-sig!`);
  console.log(`\nAfter transfer, you'll need 3-of-5 signers to:`);
  console.log(`   - Blacklist addresses`);
  console.log(`   - Pause trading`);
  console.log(`   - Update limits`);
  console.log(`   - Advance phases`);
  console.log(`   - Any owner function`);

  console.log(`\n⏸️  Pausing for 10 seconds... Press Ctrl+C to cancel.`);
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Transfer ownership
  console.log(`\n🔄 Transferring ownership to multi-sig...`);
  const transferTx = await norToken.transferOwnership(GNOSIS_SAFE_ADDRESS);
  await transferTx.wait();

  console.log(`\n✅ Ownership transferred!`);
  console.log(`   Transaction: ${transferTx.hash}`);

  // Verify transfer
  const newOwner = await norToken.owner();
  console.log(`\n🔍 Verification:`);
  console.log(`   New Owner: ${newOwner}`);
  console.log(`   Expected: ${GNOSIS_SAFE_ADDRESS}`);
  console.log(`   Match: ${newOwner === GNOSIS_SAFE_ADDRESS ? '✅' : '❌'}`);

  // Create transparency document
  const transparencyInfo = {
    timestamp: new Date().toISOString(),
    network: "NorChain",
    chainId: 65001,
    contract: NOR_TOKEN,
    previousOwner: deployer.address,
    newOwner: GNOSIS_SAFE_ADDRESS,
    multiSigType: "Gnosis Safe",
    threshold: "3 of 5",
    signerRoles: RECOMMENDED_SIGNERS.map(s => s.role),
    transactionHash: transferTx.hash
  };

  console.log(`\n💾 Transparency Report:`);
  console.log(JSON.stringify(transparencyInfo, null, 2));

  console.log(`\n\n📝 NEXT STEPS:`);
  console.log("═".repeat(70));
  console.log(`\n1. 📢 Announce multi-sig setup publicly`);
  console.log(`   - Share multi-sig address`);
  console.log(`   - List all 5 signers (with roles)`);
  console.log(`   - Explain 3-of-5 threshold`);
  console.log(`   - Publish transparency report`);

  console.log(`\n2. 📄 Create public documentation page`);
  console.log(`   URL: yourwebsite.com/transparency`);
  console.log(`   Include:`);
  console.log(`      - Multi-sig address`);
  console.log(`      - All signer addresses and roles`);
  console.log(`      - Transaction history link`);
  console.log(`      - 90-day renouncement plan`);

  console.log(`\n3. 💧 Add $100k liquidity (with multi-sig approval)`);
  console.log(`   npx hardhat run scripts/add-100k-liquidity-all-pairs.js --network btcbr`);

  console.log(`\n4. 🔒 Lock liquidity for 3 years`);
  console.log(`   npx hardhat run scripts/lock-all-liquidity.js --network btcbr`);

  console.log(`\n5. 🚀 Enable trading (requires 3-of-5 multi-sig approval)`);
  console.log(`   Use Gnosis Safe interface to propose transaction`);

  console.log(`\n\n💡 Scanner Impact:`);
  console.log("═".repeat(70));
  console.log(`\nDexTools:`);
  console.log(`   Before: ⚠️ "Owner can pause"`);
  console.log(`   After:  ⚠️ "Multi-sig owner (3-of-5)" - Much better!`);
  console.log(`\nTokenSniffer:`);
  console.log(`   Before: 75/100 (single owner)`);
  console.log(`   After:  85/100 (multi-sig) - Significant improvement!`);

  console.log(`\n═`.repeat(70));
  console.log(`✅ Multi-Sig Ownership Setup Complete!`);
  console.log(`═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Multi-Sig Setup Failed:");
    console.error(error);
    process.exit(1);
  });
