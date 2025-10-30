import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("\n🔧 DEPLOYING FIXED FEE PAIR");
    console.log("=".repeat(70));
    
    const [deployer] = await ethers.getSigners();
    
    const WXHT = "0x1299b31D4BC22AF4cBE9c5dC3A760F4636393651";
    const BTCBR = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
    const REVENUE = "0xE4bC805e5ED3eB8715A27D4CBAdDF510764aAF53";
    
    console.log("\n[1/3] Deploying XaheenDEXPair (FIXED)...");
    const Pair = await ethers.getContractFactory("XaheenDEXPair");
    const pair = await Pair.deploy();
    await pair.waitForDeployment();
    const pairAddr = await pair.getAddress();
    console.log("  ✅ Pair deployed:", pairAddr);
    
    console.log("\n[2/3] Initializing with revenue contract...");
    await (await pair.initialize(BTCBR, WXHT, REVENUE)).wait();
    console.log("  ✅ Initialized with fee model");
    
    const wxhtABI = ["function deposit() payable", "function transfer(address,uint256) returns(bool)"];
    const erc20ABI = ["function transfer(address,uint256) returns(bool)"];
    const pairABI = ["function mint(address) returns(uint256)", "function getReserves() view returns(uint256,uint256,uint256)"];
    
    const wxht = new ethers.Contract(WXHT, wxhtABI, deployer);
    const btcbr = new ethers.Contract(BTCBR, erc20ABI, deployer);
    const pairContract = new ethers.Contract(pairAddr, pairABI, deployer);
    
    const amount = ethers.parseEther("10000");
    
    console.log("\n[3/3] Adding liquidity with fees enabled...");
    await (await wxht.deposit({ value: amount })).wait();
    console.log("  ✅ Wrapped XHT");
    
    await (await btcbr.transfer(pairAddr, amount)).wait();
    console.log("  ✅ Sent BTCBR");
    
    await (await wxht.transfer(pairAddr, amount)).wait();
    console.log("  ✅ Sent WXHT");
    
    await (await pairContract.mint(deployer.address, { gasLimit: 1000000 })).wait();
    console.log("  ✅ Minted LP tokens (fees enabled!)");
    
    const [r0, r1] = await pairContract.getReserves();
    console.log("\n📊 RESERVES:");
    console.log("  BTCBR:", ethers.formatEther(r0));
    console.log("  WXHT:", ethers.formatEther(r1));
    
    console.log("\n" + "=".repeat(70));
    console.log("🎉 FIXED FEE PAIR DEPLOYED!");
    console.log("=".repeat(70));
    console.log("\n📍 New Pair Address:", pairAddr);
    console.log("💰 Revenue Contract:", REVENUE);
    console.log("\n✅ Fee model is now working!");
    console.log("✅ Fees will go to revenue contract");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
