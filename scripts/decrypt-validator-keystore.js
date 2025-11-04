import { Wallet } from "ethers";
import fs from "fs";

/**
 * Decrypt validator keystore and extract private key
 */

const KEYSTORE_PASSWORD =
  "3d5679f1148d19b440646957f146176c063a645dd44fc1b8f759fe613eae8edd";

async function decryptKeystore(keystorePath, password) {
  console.log("📂 Reading keystore:", keystorePath);
  const keystoreJson = fs.readFileSync(keystorePath, "utf8");

  console.log("🔓 Decrypting keystore...");
  const wallet = await Wallet.fromEncryptedJson(keystoreJson, password);

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

async function main() {
  console.log(
    "═══════════════════════════════════════════════════════════════════════════"
  );
  console.log("         🔑 VALIDATOR KEYSTORE DECRYPTION 🔑");
  console.log(
    "═══════════════════════════════════════════════════════════════════════════"
  );
  console.log("");

  // Decrypt Validator 1 keystore
  console.log("🔐 Decrypting Validator 1...");
  const validator1 = await decryptKeystore(
    "data/validator-keystores-v2/validator-1-keystore.json",
    KEYSTORE_PASSWORD
  );

  console.log("   ✅ Address:", validator1.address);
  console.log("   🔑 Private Key:", validator1.privateKey);
  console.log("");

  // Save to .env format
  const envContent = `
# Nor Chain Configuration
PRIVATE_CHAIN_RPC=http://3.91.50.187:8545
CHAIN_ID=65001

# Your Wallet (User)
MAIN_WALLET=0xdD779a290C937144F80Eb75b75d814c834536B1b
MAIN_WALLET_PRIVATE_KEY=681fda6ad9585ce9c27688eb60087ddaf4a90ca75f8f77b0f039bd5692ed2bd4

# Validator 1 (Alternative Deployer)
VALIDATOR_1_ADDRESS=${validator1.address}
VALIDATOR_1_PRIVATE_KEY=${validator1.privateKey}

# Use this for deployment
PRIVATE_CHAIN_KEY=${validator1.privateKey}

# BTCBR Token
BTCBR_ADDRESS=0x0cF8e180350253271f4b917CcFb0aCCc4862F262
`.trim();

  fs.writeFileSync(".env.validator", envContent);
  console.log("💾 Validator credentials saved to .env.validator");
  console.log("");
  console.log(
    "═══════════════════════════════════════════════════════════════════════════"
  );
  console.log("                      ✅ DECRYPTION COMPLETE!");
  console.log(
    "═══════════════════════════════════════════════════════════════════════════"
  );
  console.log("");
  console.log("📋 Validator 1 Details:");
  console.log("   Address:", validator1.address);
  console.log("   Private Key:", validator1.privateKey);
  console.log("");
  console.log("💡 To use validator for deployment:");
  console.log("   cp .env.validator .env");
  console.log(
    "   npx hardhat run scripts/deploy-nor-ecosystem.js --network btcbr"
  );
  console.log("");
}

main().catch(console.error);
