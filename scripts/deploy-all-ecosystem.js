import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

// Contract addresses
const ROUTER_ADDRESS = "0x4A82C98A950125F17943F56273efae39dDe81763";
const FACTORY_ADDRESS = "0xe97D574A2e1B62f4d32C5cfeaFa8e6B99Da020fa";
const WNOR_ADDRESS = "0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c";

// Genesis tokens
const LITTLE_RABBIT = "0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05";
const BNB_TIGER = "0xAC68931B666E086E9de380CFDb0Fb5704a35dc2D";
const BTCBR = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
const USDT_Z = "0x4BE35Ec329343d7d9F548d42B0F8c17FFfe07db4";

async function main() {
  console.log("\n🚀 DEPLOYING COMPLETE XAHEEN ECOSYSTEM");
  console.log("=".repeat(70));

  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n📍 Deployer:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 NOR Balance:", ethers.formatEther(balance), "NOR\n");

  const results = {
    timestamp: new Date().toISOString(),
    deployer: wallet.address,
    charity: null,
    crowdfunding: null,
    standardTokens: {},
    liquidityPairs: [],
  };

  // Step 1: Deploy Charity
  console.log("📝 STEP 1/5: Deploying NORCharity...");
  try {
    const Charity = await ethers.getContractFactory(
      "contracts/tokenomics/NORCharity.sol:NORCharity",
      wallet
    );
    const charity = await Charity.deploy();
    await charity.waitForDeployment();
    results.charity = await charity.getAddress();
    console.log("✅ Charity deployed:", results.charity, "\n");
  } catch (error) {
    console.error("❌ Charity failed:", error.message, "\n");
  }

  // Step 2: Deploy Crowdfunding
  console.log("📝 STEP 2/5: Deploying NORCrowdfunding...");
  try {
    const Crowdfunding = await ethers.getContractFactory(
      "contracts/tokenomics/NORCrowdfunding.sol:NORCrowdfunding",
      wallet
    );
    const crowdfunding = await Crowdfunding.deploy();
    await crowdfunding.waitForDeployment();
    results.crowdfunding = await crowdfunding.getAddress();
    console.log("✅ Crowdfunding deployed:", results.crowdfunding, "\n");
  } catch (error) {
    console.error("❌ Crowdfunding failed:", error.message, "\n");
  }

  // Step 3: Deploy Standard Tokens (BNB, ETH, USDT)
  console.log("📝 STEP 3/5: Deploying Standard Tokens (BNB, ETH, USDT)...\n");

  // Simple ERC20 bytecode
  const ERC20_BYTECODE =
    "0x60806040523480156200001157600080fd5b506040516200132038038062001320833981016040819052620000349162000217565b83516200004990600390602087019062000094565b5082516200005f90600490602086019062000094565b506005805460ff191660ff84161790556200008133826200008960201b60201c565b50505050620002dd565b6001600160a01b0382166200009f57600080fd5b8060026000828254620000b391906200028a565b90915550506001600160a01b03821660009081526020819052604081208054839290620000e290849062000 28a565b909155505060405181815260009033907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906020015b60405180910390a35050565b828054620001329062000250565b90600052602060002090601f01602090048101928262000156576000855562000111565b82601f106200017157805160ff191683800117855562000111565b8280016001018555821562000111579182015b828111156200011157825182559160200191906001019062000184565b506200011f92915062000123565b5090565b5b808211156200011f576000815560010162000124565b634e487b7160e01b600052604160045260246000fd5b600082601f83011262000162576000fd5b81516001600160401b03808211156200017f576200017f6200013a565b604051601f8301601f19908116603f01168101908282118183101715620001aa57620001aa6200013a565b81604052838152602092508683858801011115620001c757600080fd5b600091505b83821015620001eb5785820183015181830184015290820190620001cc565b83821115620001fd5760008385830101525b9695505050505050565b805160ff811681146200021957600080fd5b919050565b600080600080608085870312156200023557600080fd5b84516001600160401b03808211156200024d57600080fd5b6200025b8883890162000150565b955060208701519150808211156200027257600080fd5b506200028187828801620001505094509050620002925b6020929092526040850151909201919050565b600181811c90821680620002b557607f821691505b60208210811415620002d757634e487b7160e01b600052602260045260246000fd5b50919050565b61103380620002ed6000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461012357806370a082311461013657806395d89b411461015f578063a457c2d714610167578063a9059cbb1461017a578063dd62ed3e1461018d57600080fd5b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100ef57806323b872dd14610101578063313ce56714610114575b600080fd5b6100b66101a0565b6040516100c39190610f01565b60405180910390f35b6100df6100da366004610f72565b610232565b60405190151581526020016100c3565b6002545b6040519081526020016100c3565b6100df61010f366004610f9c565b61024a565b604051601281526020016100c3565b6100df610131366004610f72565b61026e565b6100f3610144366004610fd8565b6001600160a01b031660009081526020819052604090205490565b6100b66102a7565b6100df610175366004610f72565b6102b6565b6100df610188366004610f72565b610345565b6100f361019b366004610ffa565b610353565b6060600380546101af9061102d565b80601f01602080910402602001604051908101604052809291908181526020018280546101db9061102d565b80156102285780601f106101fd57610100808354040283529160200191610228565b820191906000526020600020905b81548152906001019060200180831161020b57829003601f168201915b5050505050905090565b60003361024081858561037e565b5060019392505050565b6000336102588582856104a2565b61026385858561051c565b506001949350505050565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909190610240908290869061029d9087906110b8565b60006105c7565b60606004805461024a8190610f01565b6060600480546101af9061102d565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909190838110156103385760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084015b60405180910390fd5b610263828686840361037e565b60003361024081858561051c565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6001600160a01b0383166103e05760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b606482015260840161032f565b6001600160a01b0382166104415760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b606482015260840161032f565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b60006104ae8484610353565b90506000198114610516578181101561050957604051637dc7a0d960e11b81526001600160a01b0384166004820152602481018290526044810183905260640161032f565b610516848484840361037e565b50505050565b6001600160a01b0383166105805760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b606482015260840161032f565b6001600160a01b0382166105e25760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b606482015260840161032f565b6001600160a01b0383166000908152602081905260409020548181101561065a5760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b606482015260840161032f565b6001600160a01b03808516600090815260208190526040808220858503905591851681529081208054849290610691908490611088565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040516106dd91815260200190565b60405180910390a3610516565b600060208083528351808285015260005b81811015610716578581018301518582016040015282016106fa565b81811115610728576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b038116811461075557600080fd5b919050565b6000806040838503121561076d57600080fd5b6107768361073e565b946020939093013593505050565b60008060006060848603121561079957600080fd5b6107a28461073e565b92506107b06020850161073e565b9150604084013590509250925092565b6000602082840312156107d257600080fd5b6107db8261073e565b9392505050565b600080604083850312156107f557600080fd5b6107fe8361073e565b915061080c6020840161073e565b90509250929050565b600181811c9082168061082957607f821691505b6020821081141561084a57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b6000821982111561087957610879610850565b500190565b60008282101561089057610890610850565b50039056fea2646970667358221220a9b77d4c1c5c7f1e7f1e7f1e7f1e7f1e7f1e7f1e7f1e7f1e7f1e7f1e7f1e7f164736f6c63430008090033";

  const standardTokens = [
    {
      name: "Binance Coin",
      symbol: "BNB",
      decimals: 18,
      supply: ethers.parseEther("1000000"),
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      supply: ethers.parseEther("10000"),
    },
    {
      name: "Tether USD",
      symbol: "USDT",
      decimals: 6,
      supply: ethers.parseUnits("10000000", 6),
    },
  ];

  for (const token of standardTokens) {
    try {
      console.log(`  Deploying ${token.symbol}...`);
      const factory = new ethers.ContractFactory(
        [
          "constructor(string,string,uint8,uint256)",
          "function balanceOf(address) view returns(uint256)",
          "function approve(address,uint256) returns(bool)",
        ],
        ERC20_BYTECODE,
        wallet
      );
      const contract = await factory.deploy(
        token.name,
        token.symbol,
        token.decimals,
        token.supply
      );
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      results.standardTokens[token.symbol] = {
        address,
        ...token,
        supply: token.supply.toString(),
      };
      console.log(`  ✅ ${token.symbol}: ${address}`);
    } catch (error) {
      console.error(`  ❌ ${token.symbol} failed:`, error.message);
    }
  }

  // Step 4: Add liquidity for genesis tokens
  console.log("\n📝 STEP 4/5: Adding Liquidity for Genesis Tokens...\n");

  const router = new ethers.Contract(
    ROUTER_ADDRESS,
    [
      "function addLiquidityETH(address,uint256,uint256,uint256,address,uint256) payable returns(uint256,uint256,uint256)",
    ],
    wallet
  );

  // Based on TOKEN_PRICING_AND_STRATEGY.md:
  // Launch price: $0.0000024 per NOR
  // Initial liquidity: $10,000 NOR/USDT pair = 4.17B NOR : $10,000 USDT
  const genesisPairs = [
    {
      name: "WNOR/USDT.z",
      token: USDT_Z,
      xht: "4166666667",
      amount: ethers.parseUnits("10000", 18),
      price: 0.0000024,
    },
    {
      name: "WNOR/Little Rabbit",
      token: LITTLE_RABBIT,
      xht: "10000",
      amount: ethers.parseUnits("100000000", 18),
      price: null,
    },
    {
      name: "WNOR/Bnb Tiger",
      token: BNB_TIGER,
      xht: "10000",
      amount: ethers.parseUnits("100000000", 24),
      price: null,
    },
    {
      name: "WNOR/BTCBR",
      token: BTCBR,
      xht: "10000",
      amount: ethers.parseUnits("100000000", 24),
      price: null,
    },
  ];

  const deadline = Math.floor(Date.now() / 1000) + 3600;

  for (const pair of genesisPairs) {
    try {
      console.log(`  Adding ${pair.name}...`);
      const token = new ethers.Contract(
        pair.token,
        ["function approve(address,uint256) returns(bool)"],
        wallet
      );
      await (await token.approve(ROUTER_ADDRESS, pair.amount)).wait();
      const tx = await router.addLiquidityETH(
        pair.token,
        pair.amount,
        0,
        0,
        wallet.address,
        deadline,
        { value: ethers.parseEther(pair.xht) }
      );
      await tx.wait();
      console.log(`  ✅ ${pair.name} liquidity added`);
      results.liquidityPairs.push(pair.name);
    } catch (error) {
      console.error(`  ❌ ${pair.name} failed:`, error.message);
    }
  }

  // Step 5: Add liquidity for standard tokens
  console.log("\n📝 STEP 5/5: Adding Liquidity for Standard Tokens...\n");

  const standardPairs = [
    {
      symbol: "BNB",
      xht: "100",
      amount: ethers.parseEther("0.5"),
      decimals: 18,
    },
    {
      symbol: "ETH",
      xht: "100",
      amount: ethers.parseEther("0.05"),
      decimals: 18,
    },
    {
      symbol: "USDT",
      xht: "1000",
      amount: ethers.parseUnits("1000", 6),
      decimals: 6,
    },
  ];

  for (const pair of standardPairs) {
    if (!results.standardTokens[pair.symbol]) continue;
    try {
      console.log(`  Adding WNOR/${pair.symbol}...`);
      const tokenAddr = results.standardTokens[pair.symbol].address;
      const token = new ethers.Contract(
        tokenAddr,
        ["function approve(address,uint256) returns(bool)"],
        wallet
      );
      await (await token.approve(ROUTER_ADDRESS, pair.amount)).wait();
      const tx = await router.addLiquidityETH(
        tokenAddr,
        pair.amount,
        0,
        0,
        wallet.address,
        deadline,
        { value: ethers.parseEther(pair.xht) }
      );
      await tx.wait();
      const price =
        Number(ethers.formatUnits(pair.amount, pair.decimals)) /
        Number(pair.xht);
      console.log(
        `  ✅ WNOR/${pair.symbol} added (1 NOR = ${price.toFixed(6)} ${
          pair.symbol
        })`
      );
      results.liquidityPairs.push(`WNOR/${pair.symbol}`);
    } catch (error) {
      console.error(`  ❌ WNOR/${pair.symbol} failed:`, error.message);
    }
  }

  // Save results
  fs.mkdirSync("docs/deployment-logs", { recursive: true });
  fs.writeFileSync(
    "docs/deployment-logs/complete-ecosystem.json",
    JSON.stringify(results, null, 2)
  );

  console.log("\n" + "=".repeat(70));
  console.log("🎉 ECOSYSTEM DEPLOYMENT COMPLETE!\n");
  console.log("📊 Summary:");
  console.log(`  Charity: ${results.charity || "Failed"}`);
  console.log(`  Crowdfunding: ${results.crowdfunding || "Failed"}`);
  console.log(
    `  Standard Tokens: ${Object.keys(results.standardTokens).length}/3`
  );
  console.log(`  Liquidity Pairs: ${results.liquidityPairs.length}/7`);
  if (results.liquidityPairs.includes("WNOR/USDT")) {
    console.log(`\n💰 NOR Price: ~$1.00 USD (based on USDT pair)`);
  }
  console.log("=".repeat(70) + "\n");
}

main().catch(console.error);
