// Contract addresses (will be updated after deployment)
const CONTRACTS = {
    BSC_MAINNET: {
        chainId: 56,
        name: 'BSC Mainnet',
        rpcUrl: 'https://bsc-dataseed.binance.org',
        btcbrToken: '0x0cF8e180350253271f4b917CcFb0aCCc4862F262', // BTCBR on BSC
        bridge: 'UPDATE_AFTER_DEPLOYMENT', // BTCBRBridgeMainnet address
        explorer: 'https://bscscan.com'
    },
    XAHEEN_CHAIN: {
        chainId: 65001,
        name: 'Xaheen Chain',
        rpcUrl: 'https://rpc.xaheen.org',
        btcbrToken: '0x0cF8e180350253271f4b917CcFb0aCCc4862F262', // BTCBR on Xaheen
        bridge: 'UPDATE_AFTER_DEPLOYMENT', // BTCBRBridgePrivate address
        explorer: 'https://explorer.xaheen.org'
    }
};

// ERC20 ABI (minimal for balance and approve)
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_spender", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {"name": "_owner", "type": "address"},
            {"name": "_spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    }
];

// Bridge ABI (minimal for deposit)
const BRIDGE_ABI = [
    {
        "inputs": [
            {"name": "amount", "type": "uint256"}
        ],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// State
let web3 = null;
let userAddress = null;
let currentChainId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initializeEventListeners();
    checkWalletConnection();
    loadRecentTransfers();
});

// Initialize Event Listeners
function initializeEventListeners() {
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.getElementById('swapDirection').addEventListener('click', swapChains);
    document.getElementById('maxButton').addEventListener('click', setMaxAmount);
    document.getElementById('transferAmount').addEventListener('input', updateReceiveAmount);
    document.getElementById('fromChain').addEventListener('change', handleChainChange);
    document.getElementById('toChain').addEventListener('change', handleChainChange);
    document.getElementById('transferButton').addEventListener('click', executeTransfer);

    // Listen for MetaMask account/chain changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
    }
}

// Check if wallet is already connected
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
            userAddress = accounts[0];
            currentChainId = await web3.eth.getChainId();
            updateUIAfterConnection();
        }
    }
}

// Connect Wallet
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to use this bridge!');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }

    try {
        web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];
        currentChainId = await web3.eth.getChainId();

        updateUIAfterConnection();
        await loadBalances();
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
    }
}

// Update UI after wallet connection
function updateUIAfterConnection() {
    const walletStatus = document.getElementById('walletStatus');
    const walletAddress = document.getElementById('walletAddress');
    const currentNetwork = document.getElementById('currentNetwork');
    const transferButton = document.getElementById('transferButton');

    walletStatus.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
    walletAddress.textContent = `${userAddress.substring(0, 10)}...${userAddress.substring(34)}`;

    const network = getNetworkName(currentChainId);
    currentNetwork.textContent = network;
    currentNetwork.style.color = network.includes('Unknown') ? 'var(--error-color)' : 'var(--success-color)';

    transferButton.disabled = false;
    transferButton.textContent = 'Transfer';
}

// Get network name from chain ID
function getNetworkName(chainId) {
    const id = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
    switch (id) {
        case 56:
            return 'BSC Mainnet';
        case 65001:
            return 'Xaheen Chain';
        case 97:
            return 'BSC Testnet';
        default:
            return `Unknown (${id})`;
    }
}

// Load BTCBR balances
async function loadBalances() {
    if (!web3 || !userAddress) return;

    try {
        // Load BSC balance
        const bscBalance = await getBalanceForChain(CONTRACTS.BSC_MAINNET);
        document.getElementById('fromBalance').textContent = `${formatBalance(bscBalance)} BTCBR`;

        // Load Xaheen balance
        const xaheenBalance = await getBalanceForChain(CONTRACTS.XAHEEN_CHAIN);
        document.getElementById('toBalance').textContent = `${formatBalance(xaheenBalance)} BTCBR`;
    } catch (error) {
        console.error('Error loading balances:', error);
    }
}

// Get balance for specific chain
async function getBalanceForChain(chainConfig) {
    try {
        const provider = new Web3(chainConfig.rpcUrl);
        const tokenContract = new provider.eth.Contract(ERC20_ABI, chainConfig.btcbrToken);
        const balance = await tokenContract.methods.balanceOf(userAddress).call();
        return Web3.utils.fromWei(balance, 'ether');
    } catch (error) {
        console.error(`Error loading balance for ${chainConfig.name}:`, error);
        return '0';
    }
}

// Format balance for display
function formatBalance(balance) {
    const num = parseFloat(balance);
    if (num === 0) return '0.00';
    if (num < 0.01) return '< 0.01';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Swap chain direction
function swapChains() {
    const fromChain = document.getElementById('fromChain');
    const toChain = document.getElementById('toChain');

    const temp = fromChain.value;
    fromChain.value = toChain.value;
    toChain.value = temp;

    handleChainChange();
}

// Handle chain change
function handleChainChange() {
    const fromChainId = parseInt(document.getElementById('fromChain').value);
    const toChainId = parseInt(document.getElementById('toChain').value);

    // Update fee based on direction
    const feeElement = document.getElementById('bridgeFee');
    const feePercentElement = document.getElementById('summaryFeePercent');

    if (fromChainId === 56 && toChainId === 65001) {
        feeElement.textContent = '0.1%';
        feePercentElement.textContent = '0.1%';
    } else if (fromChainId === 65001 && toChainId === 56) {
        feeElement.textContent = '0.2%';
        feePercentElement.textContent = '0.2%';
    }

    updateReceiveAmount();
    loadBalances();
}

// Set max amount
async function setMaxAmount() {
    const fromChainId = parseInt(document.getElementById('fromChain').value);
    const chainConfig = fromChainId === 56 ? CONTRACTS.BSC_MAINNET : CONTRACTS.XAHEEN_CHAIN;

    const balance = await getBalanceForChain(chainConfig);
    const maxAmount = Math.min(parseFloat(balance), 100000); // Max transfer limit

    document.getElementById('transferAmount').value = maxAmount;
    updateReceiveAmount();
}

// Update receive amount when input changes
function updateReceiveAmount() {
    const amount = parseFloat(document.getElementById('transferAmount').value) || 0;
    const fromChainId = parseInt(document.getElementById('fromChain').value);
    const toChainId = parseInt(document.getElementById('toChain').value);

    // Calculate fee
    let feePercent = 0.001; // 0.1% default
    if (fromChainId === 65001 && toChainId === 56) {
        feePercent = 0.002; // 0.2% for Xaheen -> BSC
    }

    const fee = amount * feePercent;
    const receiveAmount = amount - fee;

    // Update UI
    document.getElementById('receiveAmount').textContent = `${formatBalance(receiveAmount)} BTCBR`;

    if (amount > 0) {
        document.getElementById('summaryAmount').textContent = `${formatBalance(amount)} BTCBR`;
        document.getElementById('summaryFee').textContent = `${formatBalance(fee)} BTCBR`;
        document.getElementById('summaryReceive').textContent = `${formatBalance(receiveAmount)} BTCBR`;
        document.getElementById('transferSummary').style.display = 'block';
    } else {
        document.getElementById('transferSummary').style.display = 'none';
    }
}

// Execute transfer
async function executeTransfer() {
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const fromChainId = parseInt(document.getElementById('fromChain').value);
    const toChainId = parseInt(document.getElementById('toChain').value);

    // Validation
    if (!amount || amount < 100) {
        alert('Minimum transfer amount is 100 BTCBR');
        return;
    }

    if (amount > 100000) {
        alert('Maximum transfer amount is 100,000 BTCBR');
        return;
    }

    if (fromChainId === toChainId) {
        alert('Please select different chains for transfer');
        return;
    }

    // Check if on correct chain
    if (currentChainId !== fromChainId) {
        await switchChain(fromChainId);
        return;
    }

    try {
        showTransactionStatus('⏳', 'Preparing transfer...', 'Please confirm in MetaMask');
        updateProgress(10);

        const chainConfig = fromChainId === 56 ? CONTRACTS.BSC_MAINNET : CONTRACTS.XAHEEN_CHAIN;
        const amountWei = Web3.utils.toWei(amount.toString(), 'ether');

        // Step 1: Approve tokens
        const tokenContract = new web3.eth.Contract(ERC20_ABI, chainConfig.btcbrToken);
        const allowance = await tokenContract.methods.allowance(userAddress, chainConfig.bridge).call();

        if (Web3.utils.toBN(allowance).lt(Web3.utils.toBN(amountWei))) {
            showTransactionStatus('⏳', 'Approving BTCBR...', 'Confirm approval transaction');
            updateProgress(30);

            await tokenContract.methods.approve(chainConfig.bridge, amountWei).send({
                from: userAddress
            });
        }

        // Step 2: Deposit to bridge
        showTransactionStatus('⏳', 'Transferring...', 'Confirm bridge transaction');
        updateProgress(60);

        const bridgeContract = new web3.eth.Contract(BRIDGE_ABI, chainConfig.bridge);
        const tx = await bridgeContract.methods.deposit(amountWei).send({
            from: userAddress
        });

        showTransactionStatus('✅', 'Transfer Initiated!', `TX: ${tx.transactionHash.substring(0, 20)}...`);
        updateProgress(100);

        // Save to recent transfers
        saveTransfer({
            amount,
            from: getNetworkName(fromChainId),
            to: getNetworkName(toChainId),
            txHash: tx.transactionHash,
            timestamp: Date.now(),
            status: 'pending'
        });

        loadRecentTransfers();

        setTimeout(() => {
            hideTransactionStatus();
            document.getElementById('transferAmount').value = '';
            updateReceiveAmount();
            loadBalances();
        }, 3000);

    } catch (error) {
        console.error('Transfer error:', error);
        showTransactionStatus('❌', 'Transfer Failed', error.message || 'Transaction rejected');
        setTimeout(hideTransactionStatus, 5000);
    }
}

// Switch chain
async function switchChain(chainId) {
    const chainConfig = chainId === 56 ? CONTRACTS.BSC_MAINNET : CONTRACTS.XAHEEN_CHAIN;

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: Web3.utils.toHex(chainId) }],
        });
    } catch (error) {
        // Chain not added to MetaMask
        if (error.code === 4902 && chainId === 65001) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: Web3.utils.toHex(chainId),
                        chainName: chainConfig.name,
                        nativeCurrency: {
                            name: 'XHT',
                            symbol: 'XHT',
                            decimals: 18
                        },
                        rpcUrls: [chainConfig.rpcUrl],
                        blockExplorerUrls: [chainConfig.explorer]
                    }]
                });
            } catch (addError) {
                console.error('Error adding chain:', addError);
                alert('Failed to add Xaheen Chain to MetaMask');
            }
        } else {
            console.error('Error switching chain:', error);
        }
    }
}

// Transaction status UI
function showTransactionStatus(icon, text, details) {
    const statusDiv = document.getElementById('transactionStatus');
    document.getElementById('statusIcon').textContent = icon;
    document.getElementById('statusText').textContent = text;
    document.getElementById('statusDetails').textContent = details;
    statusDiv.style.display = 'block';
}

function hideTransactionStatus() {
    document.getElementById('transactionStatus').style.display = 'none';
    updateProgress(0);
}

function updateProgress(percent) {
    document.getElementById('progressFill').style.width = `${percent}%`;
}

// Save transfer to localStorage
function saveTransfer(transfer) {
    const transfers = JSON.parse(localStorage.getItem('bridgeTransfers') || '[]');
    transfers.unshift(transfer);
    localStorage.setItem('bridgeTransfers', JSON.stringify(transfers.slice(0, 10))); // Keep last 10
}

// Load recent transfers
function loadRecentTransfers() {
    const transfers = JSON.parse(localStorage.getItem('bridgeTransfers') || '[]');
    const transfersList = document.getElementById('transfersList');

    if (transfers.length === 0) {
        transfersList.innerHTML = '<div class="no-transfers"><p>No recent transfers</p></div>';
        return;
    }

    transfersList.innerHTML = transfers.map(t => `
        <div class="transfer-item">
            <div class="transfer-info">
                <div class="transfer-amount">${formatBalance(t.amount)} BTCBR</div>
                <div class="transfer-route">${t.from} → ${t.to}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                    ${new Date(t.timestamp).toLocaleString()}
                </div>
            </div>
            <span class="transfer-status ${t.status}">${t.status}</span>
        </div>
    `).join('');
}

// Handle MetaMask events
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        userAddress = null;
        document.getElementById('walletStatus').textContent = 'Connect Wallet';
        document.getElementById('walletAddress').textContent = '-';
        document.getElementById('transferButton').disabled = true;
    } else {
        userAddress = accounts[0];
        updateUIAfterConnection();
        loadBalances();
    }
}

function handleChainChanged(chainId) {
    window.location.reload();
}
