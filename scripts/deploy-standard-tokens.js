import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
import fs from "fs";

dotenvConfig();

const ROUTER_ADDRESS = "0x4A82C98A950125F17943F56273efae39dDe81763";
const FACTORY_ADDRESS = "0xe97D574A2e1B62f4d32C5cfeaFa8e6B99Da020fa";
const WNOR_ADDRESS = "0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c";

async function main() {
  console.log("\n🪙  DEPLOYING STANDARD TOKENS (BNB, ETH, USDT)");
  console.log(
    "======================================================================\n"
  );

  const [deployer] = await ethers.getSigners();
  console.log(`📍 Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 NOR Balance: ${ethers.formatEther(balance)} NOR\n`);

  const deploymentResults = {
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    tokens: {},
    liquidityPairs: [],
  };

  // ERC20 Token ABI for deployment
  const tokenArtifact = {
    abi: [
      "constructor(string name, string symbol, uint8 decimals, uint256 initialSupply)",
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address, uint256) returns (bool)",
      "function approve(address, uint256) returns (bool)",
      "function transferFrom(address, address, uint256) returns (bool)",
    ],
    bytecode:
      "0x60806040523480156200001157600080fd5b5060405162000d0938038062000d09833981016040819052620000349162000217565b83516200004990600390602087019062000094565b5082516200005f90600490602086019062000094565b506005805460ff191660ff841617905562000081336200008a60201b60201c565b505050620002dd565b3390565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b828054620000a290620002a0565b90600052602060002090601f016020900481019282620000c6576000855562000111565b82601f10620000e157805160ff191683800117855562000111565b8280016001018555821562000111579182015b8281111562000111578251825591602001919060010190620000f4565b506200011f92915062000123565b5090565b5b808211156200011f576000815560010162000124565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200016257600080fd5b81516001600160401b03808211156200017f576200017f6200013a565b604051601f8301601f19908116603f01168101908282118183101715620001aa57620001aa6200013a565b81604052838152602092508683858801011115620001c757600080fd5b600091505b83821015620001eb5785820183015181830184015290820190620001cc565b83821115620001fd5760008385830101525b9695505050505050565b805160ff811681146200021957600080fd5b919050565b600080600080608085870312156200023557600080fd5b84516001600160401b03808211156200024d57600080fd5b6200025b8883890162000150565b955060208701519150808211156200027257600080fd5b5062000281878288016200015050565b9350506200029260408601620002075b60ff92909216919091526060850151909201919050565b600181811c90821680620002b557607f821691505b60208210811415620002d757634e487b7160e01b600052602260045260246000fd5b50919050565b610a1c80620002ed6000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461012357806370a082311461013657806395d89b411461015f578063a457c2d714610167578063a9059cbb1461017a578063dd62ed3e1461018d57600080fd5b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100ef57806323b872dd14610101578063313ce56714610114575b600080fd5b6100b66101a0565b6040516100c39190610877565b60405180910390f35b6100df6100da3660046108e8565b610232565b60405190151581526020016100c3565b6002545b6040519081526020016100c3565b6100df61010f366004610912565b61024a565b604051601281526020016100c3565b6100df6101313660046108e8565b61026e565b6100f361014436600461094e565b6001600160a01b031660009081526020819052604090205490565b6100b66102a7565b6100df6101753660046108e8565b6102b6565b6100df6101883660046108e8565b610345565b6100f361019b366004610970565b610353565b6060600380546101af906109a3565b80601f01602080910402602001604051908101604052809291908181526020018280546101db906109a3565b80156102285780601f106101fd57610100808354040283529160200191610228565b820191906000526020600020905b81548152906001019060200180831161020b57829003601f168201915b5050505050905090565b60003361024081858561037e565b5060019392505050565b6000336102588582856104a2565b61026385858561051c565b506001949350505050565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909190610240908290869061029d9087906109de565b60405180939291906109f6565b60606004805461024a8190610874565b6060600480546101af906109a3565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909190838110156103385760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084015b60405180910390fd5b610263828686840361037e565b60003361024081858561051c565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6001600160a01b0383166103e05760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b606482015260840161032f565b6001600160a01b0382166104415760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b606482015260840161032f565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b60006104ae8484610353565b90506000198114610516578181101561050957604051637dc7a0d960e11b81526001600160a01b0384166004820152602481018290526044810183905260640161032f565b610516848484840361037e565b50505050565b6001600160a01b0383166105805760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b606482015260840161032f565b6001600160a01b0382166105e25760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b606482015260840161032f565b6001600160a01b0383166000908152602081905260409020548181101561065a5760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b606482015260840161032f565b6001600160a01b03808516600090815260208190526040808220858503905591851681529081208054849290610691908490610a17565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040516106dd91815260200190565b60405180910390a3610516565b600060208083528351808285015260005b81811015610716578581018301518582016040015282016106fa565b81811115610728576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b038116811461075557600080fd5b919050565b6000806040838503121561076d57600080fd5b6107768361073e565b946020939093013593505050565b60008060006060848603121561079957600080fd5b6107a28461073e565b92506107b06020850161073e565b9150604084013590509250925092565b6000602082840312156107d257600080fd5b6107db8261073e565b9392505050565b600080604083850312156107f557600080fd5b6107fe8361073e565b915061080c6020840161073e565b90509250929050565b600181811c9082168061082957607f821691505b6020821081141561084a57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b6000821982111561087957610879610850565b500190565b60008282101561089057610890610850565b50039056fea2646970667358221220d8378feed1a5d9b8e4b0d3b3f3f3b7b3b7b3b7b3b7b3b7b3b7b3b7b3b7b3b7b364736f6c63430008090033",
  };

  // Standard tokens to deploy
  const tokens = [
    {
      name: "Binance Coin",
      symbol: "BNB",
      decimals: 18,
      initialSupply: ethers.parseEther("1000000"), // 1M BNB
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      initialSupply: ethers.parseEther("10000"), // 10K ETH
    },
    {
      name: "Tether USD",
      symbol: "USDT",
      decimals: 6,
      initialSupply: ethers.parseUnits("10000000", 6), // 10M USDT
    },
  ];

  // Step 1: Deploy tokens
  console.log("📝 STEP 1/2: Deploying Standard Tokens...\n");
  for (const tokenSpec of tokens) {
    try {
      console.log(`  Deploying ${tokenSpec.name} (${tokenSpec.symbol})...`);

      const TokenFactory = new ethers.ContractFactory(
        tokenArtifact.abi,
        tokenArtifact.bytecode,
        deployer
      );

      const token = await TokenFactory.deploy(
        tokenSpec.name,
        tokenSpec.symbol,
        tokenSpec.decimals,
        tokenSpec.initialSupply
      );
      await token.waitForDeployment();
      const tokenAddress = await token.getAddress();

      deploymentResults.tokens[tokenSpec.symbol] = {
        address: tokenAddress,
        name: tokenSpec.name,
        symbol: tokenSpec.symbol,
        decimals: tokenSpec.decimals,
        initialSupply: tokenSpec.initialSupply.toString(),
      };

      console.log(`  ✅ ${tokenSpec.symbol} deployed: ${tokenAddress}\n`);
    } catch (error) {
      console.error(
        `  ❌ Failed to deploy ${tokenSpec.symbol}: ${error.message}\n`
      );
    }
  }

  // Step 2: Add liquidity pairs
  console.log("\n📝 STEP 2/2: Adding Liquidity for Standard Token Pairs...\n");

  const router = await ethers.getContractAt("NorDEXRouter", ROUTER_ADDRESS);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  const liquidityPairs = [
    {
      symbol: "BNB",
      xhtAmount: ethers.parseEther("100"), // 100 NOR
      tokenAmount: ethers.parseEther("0.5"), // 0.5 BNB (makes 1 BNB = 200 NOR)
      decimals: 18,
    },
    {
      symbol: "ETH",
      xhtAmount: ethers.parseEther("100"), // 100 NOR
      tokenAmount: ethers.parseEther("0.05"), // 0.05 ETH (makes 1 ETH = 2000 NOR)
      decimals: 18,
    },
    {
      symbol: "USDT",
      xhtAmount: ethers.parseEther("1000"), // 1000 NOR
      tokenAmount: ethers.parseUnits("1000", 6), // 1000 USDT (makes 1 NOR = 1 USDT)
      decimals: 6,
    },
  ];

  for (const pair of liquidityPairs) {
    if (!deploymentResults.tokens[pair.symbol]) {
      console.log(`  ⏭️  Skipping ${pair.symbol} (not deployed)\n`);
      continue;
    }

    console.log(`  Adding liquidity for WNOR/${pair.symbol}...`);
    try {
      const tokenAddress = deploymentResults.tokens[pair.symbol].address;
      const token = await ethers.getContractAt("IERC20", tokenAddress);

      // Approve token
      console.log(`    Approving ${pair.symbol}...`);
      const approveTx = await token.approve(ROUTER_ADDRESS, pair.tokenAmount);
      await approveTx.wait();
      console.log(`    ✅ Token approved`);

      // Add liquidity
      console.log(
        `    Adding liquidity with ${ethers.formatEther(pair.xhtAmount)} NOR...`
      );
      const liquidityTx = await router.addLiquidityETH(
        tokenAddress,
        pair.tokenAmount,
        0,
        0,
        deployer.address,
        deadline,
        { value: pair.xhtAmount }
      );
      const receipt = await liquidityTx.wait();
      console.log(`    ✅ Liquidity added! TX: ${receipt.hash}`);

      // Get pair address
      const factory = await ethers.getContractAt(
        "IUniswapV2Factory",
        FACTORY_ADDRESS
      );
      const pairAddress = await factory.getPair(WNOR_ADDRESS, tokenAddress);
      console.log(`    📍 Pair address: ${pairAddress}`);

      // Calculate price
      const tokenDecimals = pair.decimals;
      const price =
        Number(ethers.formatUnits(pair.tokenAmount, tokenDecimals)) /
        Number(ethers.formatEther(pair.xhtAmount));
      console.log(`    💰 Price: 1 NOR = ${price.toFixed(6)} ${pair.symbol}\n`);

      deploymentResults.liquidityPairs.push({
        name: `WNOR/${pair.symbol}`,
        pairAddress,
        tokenAddress,
        xhtAmount: ethers.formatEther(pair.xhtAmount),
        tokenAmount: ethers.formatUnits(pair.tokenAmount, tokenDecimals),
        price,
        txHash: receipt.hash,
      });
    } catch (error) {
      console.error(
        `    ❌ Failed to add liquidity for ${pair.symbol}: ${error.message}\n`
      );
    }
  }

  // Save deployment results
  const outputPath = "docs/deployment-logs/standard-tokens-deployment.json";
  fs.mkdirSync("docs/deployment-logs", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(deploymentResults, null, 2));
  console.log(`💾 Deployment results saved to: ${outputPath}\n`);

  // Summary
  console.log(
    "======================================================================"
  );
  console.log("🎉 STANDARD TOKENS DEPLOYMENT COMPLETE!\n");
  console.log("🪙  DEPLOYED TOKENS:");
  Object.keys(deploymentResults.tokens).forEach((symbol) => {
    console.log(`  ${symbol}: ${deploymentResults.tokens[symbol].address}`);
  });
  console.log(
    `\n💧 LIQUIDITY PAIRS CREATED: ${deploymentResults.liquidityPairs.length}/3`
  );
  deploymentResults.liquidityPairs.forEach((pair, index) => {
    console.log(`  ${index + 1}. ${pair.name}`);
    console.log(`     Pair: ${pair.pairAddress}`);
    console.log(
      `     Price: 1 NOR = ${pair.price.toFixed(6)} ${pair.name.split("/")[1]}`
    );
  });
  console.log(
    "\n======================================================================\n"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
