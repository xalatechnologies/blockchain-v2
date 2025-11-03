#!/usr/bin/env python3
"""
Add liquidity to BTCBR/WNOR pair on Noor Chain DEX
"""

from web3 import Web3
import json
import time

# Configuration
RPC_URL = "http://3.91.50.187:8545"
PRIVATE_KEY = "0x681fda6ad9585ce9c27688eb60087ddaf4a90ca75f8f77b0f039bd5692ed2bd4"

# Load deployment info
with open('deployments/noor-dex-deployment.json') as f:
    deployment = json.load(f)

BTCBR_ADDRESS = deployment['contracts']['BTCBR']
WNOR_ADDRESS = deployment['contracts']['WNOR']
ROUTER_ADDRESS = deployment['contracts']['NoorSwapRouter']
PAIR_ADDRESS = deployment['pairs'][0]['address']

# Liquidity amounts
NOR_AMOUNT = Web3.to_wei(1000000, 'ether')  # 1M NOR
BTCBR_AMOUNT = Web3.to_wei(1000000000, 'ether')  # 1B BTCBR (initial ratio: 1 NOR = 1000 BTCBR)

# Connect
w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

print("═══════════════════════════════════════════════════════════════════════════")
print("         💧 NOOR CHAIN DEX - ADD LIQUIDITY 💧")
print("═══════════════════════════════════════════════════════════════════════════")
print()
print(f"👤 Account: {account.address}")
print(f"💰 NOR Balance: {w3.from_wei(w3.eth.get_balance(account.address), 'ether'):,.2f} NOR")
print()

# Load ABIs
erc20_abi = [
    {"constant": False, "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}], "name": "approve", "outputs": [{"name": "", "type": "bool"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "", "type": "uint256"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function"}
]

router_abi = [
    {"inputs": [{"internalType": "address", "name": "tokenA", "type": "address"}, {"internalType": "address", "name": "tokenB", "type": "address"}, {"internalType": "uint256", "name": "amountADesired", "type": "uint256"}, {"internalType": "uint256", "name": "amountBDesired", "type": "uint256"}, {"internalType": "uint256", "name": "amountAMin", "type": "uint256"}, {"internalType": "uint256", "name": "amountBMin", "type": "uint256"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "deadline", "type": "uint256"}], "name": "addLiquidity", "outputs": [{"internalType": "uint256", "name": "amountA", "type": "uint256"}, {"internalType": "uint256", "name": "amountB", "type": "uint256"}, {"internalType": "uint256", "name": "liquidity", "type": "uint256"}], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [], "name": "WETH", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"}
]

wnor_abi = [
    {"constant": False, "inputs": [], "name": "deposit", "outputs": [], "payable": True, "type": "function"},
    {"constant": True, "inputs": [{"name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "", "type": "uint256"}], "type": "function"},
    {"constant": False, "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}], "name": "approve", "outputs": [{"name": "", "type": "bool"}], "type": "function"}
]

btcbr = w3.eth.contract(address=BTCBR_ADDRESS, abi=erc20_abi)
wnor = w3.eth.contract(address=WNOR_ADDRESS, abi=wnor_abi)
router = w3.eth.contract(address=ROUTER_ADDRESS, abi=router_abi)

# Check balances
btcbr_balance = btcbr.functions.balanceOf(account.address).call()
print(f"💎 BTCBR Balance: {w3.from_wei(btcbr_balance, 'ether'):,.0f} BTCBR")
print()

# Step 1: Wrap NOR to WNOR
print("📦 Step 1: Wrapping NOR to WNOR...")
nonce = w3.eth.get_transaction_count(account.address)

deposit_tx = wnor.functions.deposit().build_transaction({
    'chainId': 65001,
    'gas': 100000,
    'gasPrice': w3.to_wei('10', 'gwei'),
    'nonce': nonce,
    'value': NOR_AMOUNT
})

signed_tx = w3.eth.account.sign_transaction(deposit_tx, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
print(f"   📝 Transaction: {tx_hash.hex()}")

receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
wnor_balance = wnor.functions.balanceOf(account.address).call()
print(f"   ✅ Wrapped {w3.from_wei(NOR_AMOUNT, 'ether'):,.0f} NOR → WNOR")
print(f"   💧 WNOR Balance: {w3.from_wei(wnor_balance, 'ether'):,.0f} WNOR")
print()

# Step 2: Approve BTCBR
print("📦 Step 2: Approving BTCBR...")
nonce = w3.eth.get_transaction_count(account.address)

approve_btcbr_tx = btcbr.functions.approve(ROUTER_ADDRESS, BTCBR_AMOUNT).build_transaction({
    'chainId': 65001,
    'gas': 100000,
    'gasPrice': w3.to_wei('10', 'gwei'),
    'nonce': nonce
})

signed_tx = w3.eth.account.sign_transaction(approve_btcbr_tx, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
print(f"   📝 Transaction: {tx_hash.hex()}")
w3.eth.wait_for_transaction_receipt(tx_hash)
print(f"   ✅ Approved {w3.from_wei(BTCBR_AMOUNT, 'ether'):,.0f} BTCBR")
print()

# Step 3: Approve WNOR
print("📦 Step 3: Approving WNOR...")
nonce = w3.eth.get_transaction_count(account.address)

approve_wnor_tx = wnor.functions.approve(ROUTER_ADDRESS, NOR_AMOUNT).build_transaction({
    'chainId': 65001,
    'gas': 100000,
    'gasPrice': w3.to_wei('10', 'gwei'),
    'nonce': nonce
})

signed_tx = w3.eth.account.sign_transaction(approve_wnor_tx, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
print(f"   📝 Transaction: {tx_hash.hex()}")
w3.eth.wait_for_transaction_receipt(tx_hash)
print(f"   ✅ Approved {w3.from_wei(NOR_AMOUNT, 'ether'):,.0f} WNOR")
print()

# Step 4: Add Liquidity
print("📦 Step 4: Adding liquidity to BTCBR/WNOR pair...")
nonce = w3.eth.get_transaction_count(account.address)
deadline = int(time.time()) + 3600  # 1 hour from now

add_liquidity_tx = router.functions.addLiquidity(
    BTCBR_ADDRESS,
    WNOR_ADDRESS,
    BTCBR_AMOUNT,
    NOR_AMOUNT,
    int(BTCBR_AMOUNT * 0.95),  # 5% slippage
    int(NOR_AMOUNT * 0.95),
    account.address,
    deadline
).build_transaction({
    'chainId': 65001,
    'gas': 500000,
    'gasPrice': w3.to_wei('10', 'gwei'),
    'nonce': nonce
})

signed_tx = w3.eth.account.sign_transaction(add_liquidity_tx, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
print(f"   📝 Transaction: {tx_hash.hex()}")

receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print(f"   ✅ Liquidity added successfully!")
print()

print("═══════════════════════════════════════════════════════════════════════════")
print("                      🎉 LIQUIDITY ADDED! 🎉")
print("═══════════════════════════════════════════════════════════════════════════")
print()
print("💧 Liquidity Pool: BTCBR/WNOR")
print(f"   BTCBR: {w3.from_wei(BTCBR_AMOUNT, 'ether'):,.0f} BTCBR")
print(f"   WNOR:  {w3.from_wei(NOR_AMOUNT, 'ether'):,.0f} WNOR")
print(f"   Pair:  {PAIR_ADDRESS}")
print()
print("📊 Initial Price:")
print(f"   1 NOR = {BTCBR_AMOUNT / NOR_AMOUNT:,.0f} BTCBR")
print(f"   1 BTCBR = {NOR_AMOUNT / BTCBR_AMOUNT:.6f} NOR")
print()
print("🎯 DEX is now ready for trading!")
print()
