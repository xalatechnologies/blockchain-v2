// NorSwap DEX Interface - Web3 Integration

const NOOR_CHAIN_ID = "0xFDD9"; // 65001 in hex
const RPC_URL = "http://3.91.50.187:8545";

// Contract addresses
const CONTRACTS = {
  ROUTER: "0x51321281AB0644aed5555b3A306C7AbfFf13c4C2",
  TOKENS: {
    DIRHAMAT: "0xd1a00bb0f0af75c20D58ABcF11590780003133D7",
    WETH: "0x381Acd8Ab92811094D0b8F73411C24F0b2122359",
    WUSDT: "0x8ea180e32448d695A9036A992B2a3bdE67348B9e",
    BTCBR: "0x1f4b942bBA4e923d4B663B3B4dfd6e27f3dea2c3",
    NOR: "0xCBE0EA61FDaB09CBd013C50CbF7c1dD969193c9b",
  },
};

// Minimal ABIs
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
];

const ROUTER_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForTokens",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

let web3;
let account;
let router;

// Connect wallet
async function connectWallet() {
  try {
    if (typeof window.ethereum === "undefined") {
      showStatus(
        "error",
        "MetaMask is not installed. Please install MetaMask to use NorSwap."
      );
      return;
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    account = accounts[0];

    // Initialize Web3
    web3 = new Web3(window.ethereum);

    // Check if connected to Nor Chain
    const chainId = await web3.eth.getChainId();
    if (chainId !== 65001) {
      await switchToNorChain();
    }

    // Initialize router contract
    router = new web3.eth.Contract(ROUTER_ABI, CONTRACTS.ROUTER);

    // Update UI
    document.getElementById(
      "walletStatus"
    ).innerHTML = `✅ Connected: ${account.substring(
      0,
      6
    )}...${account.substring(38)}`;
    document.getElementById("walletInfo").className = "wallet-info connected";
    document.getElementById("connectBtn").style.display = "none";
    document.getElementById("swapBtn").style.display = "block";

    showStatus("success", "Wallet connected successfully!");
    setTimeout(
      () => (document.getElementById("status").style.display = "none"),
      3000
    );

    // Load balances
    updateBalances();
  } catch (error) {
    showStatus("error", `Connection failed: ${error.message}`);
  }
}

// Switch to Nor Chain
async function switchToNorChain() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NOOR_CHAIN_ID }],
    });
  } catch (switchError) {
    // Chain not added, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: NOOR_CHAIN_ID,
            chainName: "Nor Chain",
            nativeCurrency: {
              name: "NOR",
              symbol: "NOR",
              decimals: 18,
            },
            rpcUrls: [RPC_URL],
            blockExplorerUrls: null,
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

// Update balances
async function updateBalances() {
  const tokenFrom = document.getElementById("tokenFrom").value;
  const tokenTo = document.getElementById("tokenTo").value;

  if (tokenFrom) {
    const balance = await getTokenBalance(CONTRACTS.TOKENS[tokenFrom]);
    document.getElementById(
      "balanceFrom"
    ).textContent = `Balance: ${balance} ${tokenFrom}`;
  }

  if (tokenTo) {
    const balance = await getTokenBalance(CONTRACTS.TOKENS[tokenTo]);
    document.getElementById(
      "balanceTo"
    ).textContent = `Balance: ${balance} ${tokenTo}`;
  }
}

// Get token balance
async function getTokenBalance(tokenAddress) {
  try {
    const token = new web3.eth.Contract(ERC20_ABI, tokenAddress);
    const balance = await token.methods.balanceOf(account).call();
    return (balance / 1e18).toFixed(4);
  } catch (error) {
    return "0.00";
  }
}

// Calculate output amount
async function calculateOutput() {
  const amountIn = document.getElementById("amountFrom").value;
  const tokenFrom = document.getElementById("tokenFrom").value;
  const tokenTo = document.getElementById("tokenTo").value;

  if (!amountIn || !tokenFrom || !tokenTo || tokenFrom === tokenTo) {
    document.getElementById("swapBtn").disabled = true;
    document.getElementById("swapBtn").textContent = "Enter Amount";
    document.getElementById("priceInfo").style.display = "none";
    return;
  }

  try {
    const amountInWei = web3.utils.toWei(amountIn, "ether");
    const path = [CONTRACTS.TOKENS[tokenFrom], CONTRACTS.TOKENS[tokenTo]];

    const amounts = await router.methods
      .getAmountsOut(amountInWei, path)
      .call();
    const amountOut = web3.utils.fromWei(amounts[1], "ether");

    document.getElementById("amountTo").value =
      parseFloat(amountOut).toFixed(6);

    // Update price info
    const rate = (parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6);
    document.getElementById(
      "exchangeRate"
    ).textContent = `1 ${tokenFrom} = ${rate} ${tokenTo}`;
    document.getElementById("priceImpact").textContent = "< 0.1%";
    document.getElementById("minReceived").textContent = `${(
      parseFloat(amountOut) * 0.995
    ).toFixed(6)} ${tokenTo}`;
    document.getElementById("priceInfo").style.display = "block";

    document.getElementById("swapBtn").disabled = false;
    document.getElementById(
      "swapBtn"
    ).textContent = `Swap ${tokenFrom} for ${tokenTo}`;
  } catch (error) {
    console.error("Calculation error:", error);
    document.getElementById("swapBtn").disabled = true;
    document.getElementById("swapBtn").textContent = "Insufficient Liquidity";
  }
}

// Execute swap
async function executeSwap() {
  const amountIn = document.getElementById("amountFrom").value;
  const tokenFrom = document.getElementById("tokenFrom").value;
  const tokenTo = document.getElementById("tokenTo").value;

  if (!amountIn || !tokenFrom || !tokenTo) return;

  try {
    showStatus("info", "Step 1/2: Approving tokens...");
    document.getElementById("swapBtn").disabled = true;

    // Approve tokens
    const tokenContract = new web3.eth.Contract(
      ERC20_ABI,
      CONTRACTS.TOKENS[tokenFrom]
    );
    const amountInWei = web3.utils.toWei(amountIn, "ether");

    await tokenContract.methods
      .approve(CONTRACTS.ROUTER, amountInWei)
      .send({ from: account });

    showStatus("info", "Step 2/2: Executing swap...");

    // Execute swap
    const path = [CONTRACTS.TOKENS[tokenFrom], CONTRACTS.TOKENS[tokenTo]];
    const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes

    const tx = await router.methods
      .swapExactTokensForTokens(
        amountInWei,
        0, // Min amount out (0.5% slippage already calculated)
        path,
        account,
        deadline
      )
      .send({ from: account, gas: 300000 });

    showStatus(
      "success",
      `✅ Swap successful! TX: ${tx.transactionHash.substring(0, 10)}...`
    );

    // Reset form and update balances
    document.getElementById("amountFrom").value = "";
    document.getElementById("amountTo").value = "";
    document.getElementById("swapBtn").disabled = true;
    document.getElementById("swapBtn").textContent = "Enter Amount";
    updateBalances();
  } catch (error) {
    showStatus("error", `Swap failed: ${error.message}`);
    document.getElementById("swapBtn").disabled = false;
  }
}

// Show status message
function showStatus(type, message) {
  const status = document.getElementById("status");
  status.className = `status ${type}`;
  status.textContent = message;
  status.style.display = "block";
}

// Event listeners
document.getElementById("tokenFrom").addEventListener("change", () => {
  updateBalances();
  calculateOutput();
});

document.getElementById("tokenTo").addEventListener("change", () => {
  updateBalances();
  calculateOutput();
});

document
  .getElementById("amountFrom")
  .addEventListener("input", calculateOutput);

// Auto-connect if already connected
window.addEventListener("load", async () => {
  if (typeof window.ethereum !== "undefined") {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      connectWallet();
    }
  }
});
