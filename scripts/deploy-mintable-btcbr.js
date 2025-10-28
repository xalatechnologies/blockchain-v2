const { Web3 } = require("web3");
const solc = require("solc");
const fs = require("fs");
const path = require("path");

// Configuration
const RPC_URL = "http://3.91.50.187:8545";
const PRIVATE_KEY =
  "0x020b58bc93c4d0480b07d0d80c109ce092e7c665b5c73ef388f938544fe021e0";
const YOUR_WALLET = "0xdD779a290C937144F80Eb75b75d814c834536B1b";
const VALIDATOR_WALLET = "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD";

// 21 septillion total = 21,000,000,000,000,000,000,000,000 tokens
// 10.5 septillion each
const HALF_SUPPLY = "10500000000000000000000000000000000000000000"; // 10.5 septillion with 18 decimals

async function main() {
  console.log("=== Deploying Mintable BTCBR Contract ===\n");

  // Initialize Web3
  const web3 = new Web3(RPC_URL);
  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);

  console.log(`Deploying from: ${account.address}`);
  console.log(`Chain ID: ${await web3.eth.getChainId()}`);
  console.log(`Block: ${await web3.eth.getBlockNumber()}\n`);

  // Read and compile contract
  const contractPath = path.join(
    __dirname,
    "..",
    "contracts",
    "MintableBTCBR.sol"
  );
  const source = fs.readFileSync(contractPath, "utf8");

  console.log("Compiling contract...");
  const input = {
    language: "Solidity",
    sources: {
      "MintableBTCBR.sol": {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    output.errors.forEach((error) => {
      if (error.severity === "error") {
        console.error("Compilation error:", error.formattedMessage);
        process.exit(1);
      }
    });
  }

  const contract = output.contracts["MintableBTCBR.sol"]["MintableBTCBR"];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  console.log("✅ Contract compiled\n");

  // Deploy contract
  console.log("Deploying contract...");
  const deployContract = new web3.eth.Contract(abi);

  const deploy = deployContract.deploy({
    data: "0x" + bytecode,
  });

  const gas = await deploy.estimateGas({ from: account.address });
  const gasPrice = await web3.eth.getGasPrice();

  console.log(`Estimated gas: ${gas}`);
  console.log(`Gas price: ${gasPrice}\n`);

  const deployedContract = await deploy.send({
    from: account.address,
    gas: gas.toString(),
    gasPrice: gasPrice.toString(),
  });

  const contractAddress = deployedContract.options.address;
  console.log(`✅ Contract deployed at: ${contractAddress}\n`);

  // Mint tokens
  console.log("Minting tokens...\n");

  // Mint 10.5 septillion to your wallet
  console.log(`Minting ${HALF_SUPPLY} tokens to ${YOUR_WALLET}...`);
  const mint1 = await deployedContract.methods
    .mint(YOUR_WALLET, HALF_SUPPLY)
    .send({
      from: account.address,
      gas: 100000,
    });
  console.log(`✅ Minted to your wallet (tx: ${mint1.transactionHash})`);

  // Mint 10.5 septillion to validator wallet
  console.log(`Minting ${HALF_SUPPLY} tokens to ${VALIDATOR_WALLET}...`);
  const mint2 = await deployedContract.methods
    .mint(VALIDATOR_WALLET, HALF_SUPPLY)
    .send({
      from: account.address,
      gas: 100000,
    });
  console.log(`✅ Minted to validator wallet (tx: ${mint2.transactionHash})\n`);

  // Verify balances
  console.log("=== Verifying Balances ===\n");

  const yourBalance = await deployedContract.methods
    .balanceOf(YOUR_WALLET)
    .call();
  const validatorBalance = await deployedContract.methods
    .balanceOf(VALIDATOR_WALLET)
    .call();
  const totalSupply = await deployedContract.methods.totalSupply().call();

  console.log(
    `Your wallet balance: ${web3.utils.fromWei(yourBalance, "ether")} BTCBR`
  );
  console.log(
    `Validator balance: ${web3.utils.fromWei(validatorBalance, "ether")} BTCBR`
  );
  console.log(
    `Total supply: ${web3.utils.fromWei(totalSupply, "ether")} BTCBR\n`
  );

  // Summary
  console.log("=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log(`\n📋 Add to MetaMask:`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Symbol: BTCBR`);
  console.log(`Decimals: 18\n`);
  console.log(`✅ You have 10.5 septillion BTCBR tokens!`);
  console.log(`✅ Validator has 10.5 septillion BTCBR tokens!`);
  console.log("=".repeat(70));
}

main().catch(console.error);
