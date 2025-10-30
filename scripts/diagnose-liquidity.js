import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("\n🔍 LIQUIDITY DIAGNOSIS");
    console.log("=".repeat(70));

    // Pair addresses
    const bnbBtcbrPair = "0x8f8671977908f8329aef73E71f1e6e7aCF9039de";
    const bnbXhnPair = "0x2F75c15a476Db2503F0c07A7469Af63Ba1F00F43";

    const wbnbAddress = "0xAE7501469a47e52ecbc57741dC810bA35F0b3E48";
    const btcbrAddress = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
    const xhnAddress = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";

    // Get contracts
    const WBNB = await ethers.getContractAt("WBNB", wbnbAddress);
    const BTCBR = await ethers.getContractAt("MintableBTCBR", btcbrAddress);
    const XHN = await ethers.getContractAt("XHN", xhnAddress);

    console.log("\n📊 BNB/BTCBR PAIR:", bnbBtcbrPair);

    const wbnbBal1 = await WBNB.balanceOf(bnbBtcbrPair);
    const btcbrBal1 = await BTCBR.balanceOf(bnbBtcbrPair);

    console.log("  WBNB:", ethers.formatEther(wbnbBal1));
    console.log("  BTCBR:", ethers.formatEther(btcbrBal1));
    console.log("  Is WBNB zero?", wbnbBal1 == 0n ? "❌ YES (PROBLEM!)" : "✅ No");
    console.log("  Is BTCBR zero?", btcbrBal1 == 0n ? "❌ YES (PROBLEM!)" : "✅ No");

    console.log("\n📊 BNB/XHN PAIR:", bnbXhnPair);

    const wbnbBal2 = await WBNB.balanceOf(bnbXhnPair);
    const xhnBal2 = await XHN.balanceOf(bnbXhnPair);

    console.log("  WBNB:", ethers.formatEther(wbnbBal2));
    console.log("  XHN:", ethers.formatEther(xhnBal2));
    console.log("  Is WBNB zero?", wbnbBal2 == 0n ? "❌ YES (PROBLEM!)" : "✅ No");
    console.log("  Is XHN zero?", xhnBal2 == 0n ? "❌ YES (PROBLEM!)" : "✅ No");

    console.log("\n💡 DIAGNOSIS:");

    if (wbnbBal1 == 0n || btcbrBal1 == 0n) {
        console.log("  ❌ BNB/BTCBR pair has ZERO liquidity!");
        console.log("  Problem: Liquidity was NOT actually added to this pair");
    } else {
        console.log("  ✅ BNB/BTCBR pair has liquidity");
    }

    if (wbnbBal2 == 0n || xhnBal2 == 0n) {
        console.log("  ❌ BNB/XHN pair has ZERO liquidity!");
        console.log("  Problem: Liquidity was NOT actually added to this pair");
    } else {
        console.log("  ✅ BNB/XHN pair has liquidity");
    }

    console.log("\n🔧 WHAT HAPPENED:");
    console.log("  The script said liquidity was added");
    console.log("  BUT the transactions may have failed silently");
    console.log("  OR the liquidity went to the wrong addresses");

    console.log("\n✅ SOLUTION:");
    console.log("  We need to add liquidity again");
    console.log("  This time we'll verify it actually went through");

    // Check deployer's WBNB balance
    const [deployer] = await ethers.getSigners();
    const deployerWbnb = await WBNB.balanceOf(deployer.address);
    const deployerBnb = await ethers.provider.getBalance(deployer.address);

    console.log("\n💰 YOUR CURRENT BALANCES:");
    console.log("  BNB:", ethers.formatEther(deployerBnb));
    console.log("  WBNB:", ethers.formatEther(deployerWbnb));
    console.log("  BTCBR:", ethers.formatEther(await BTCBR.balanceOf(deployer.address)));
    console.log("  XHN:", ethers.formatEther(await XHN.balanceOf(deployer.address)));

    if (deployerWbnb > 0n) {
        console.log("\n✅ You have WBNB that can be used for liquidity!");
        console.log("  We can add liquidity NOW with your WBNB");
    } else {
        console.log("\n⚠️  You have NO WBNB");
        console.log("  We need to wrap BNB first, then add liquidity");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
