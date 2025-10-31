import { Wallet } from "ethers";
import * as fs from "fs";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function createKeystore() {
    let privateKey = process.env.MAIN_WALLET_PRIVATE_KEY;
    if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
    }
    const password = ""; // Empty password for development

    const wallet = new Wallet(privateKey);
    console.log("Creating keystore for address:", wallet.address);

    // Create keystore using ethers
    const keystore = await wallet.encrypt(password || "");

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', '000Z');
    const filename = `UTC--${timestamp}--${wallet.address.toLowerCase().slice(2)}`;

    // Save to data/keystore
    const keystorePath = `data/keystore/${filename}`;
    fs.writeFileSync(keystorePath, keystore);

    console.log("✅ Keystore created:", keystorePath);
    console.log("Address:", wallet.address);
    console.log("Password:", password || "(empty)");

    return {
        keystorePath,
        address: wallet.address,
        password
    };
}

createKeystore().catch(console.error);
