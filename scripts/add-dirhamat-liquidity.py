from web3 import Web3
import json
from datetime import datetime
import time

RPC_URL = "http://3.91.50.187:8545"
PRIVATE_KEY = "0x681fda6ad9585ce9c27688eb60087ddaf4a90ca75f8f77b0f039bd5692ed2bd4"

w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

print(f"Adding Dirhamat liquidity from {account.address}")
print(f"Balance: {w3.from_wei(w3.eth.get_balance(account.address), 'ether')} NOR\n")

# Contract addresses
DIRHAMAT = "0xd1a00bb0f0af75c20D58ABcF11590780003133D7"
WBNB = "0x4664836683f62eB96388461f79602fC1Aeb6A78E"
WETH = "0x381Acd8Ab92811094D0b8F73411C24F0b2122359"
WUSDT = "0x8ea180e32448d695A9036A992B2a3bdE67348B9e"
FACTORY = "0x9f37c0fCc07741C7bF452390F4415820f0E605B7"
ROUTER = "0x51321281AB0644aed5555b3A306C7AbfFf13c4C2"
LIQUIDITY_LOCK = "0x704cf9Fd1977365426Bd15A1aD348B17B401877B"

# Load ABIs
with open('.build/artifacts/contracts/dex/NorSwapFactory.sol/NorSwapFactory.json') as f:
    factory_abi = json.load(f)['abi']

with open('.build/artifacts/contracts/dex/NorSwapRouter.sol/NorSwapRouter.json') as f:
    router_abi = json.load(f)['abi']

with open('.build/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json') as f:
    erc20_abi = json.load(f)['abi']

with open('.build/artifacts/contracts/tokenomics/LiquidityLock.sol/LiquidityLock.json') as f:
    lock_abi = json.load(f)['abi']

with open('.build/artifacts/contracts/dex/WBNB.sol/WBNB.json') as f:
    wbnb_abi = json.load(f)['abi']

factory = w3.eth.contract(address=FACTORY, abi=factory_abi)
router = w3.eth.contract(address=ROUTER, abi=router_abi)
lock_contract = w3.eth.contract(address=LIQUIDITY_LOCK, abi=lock_abi)
dirhamat = w3.eth.contract(address=DIRHAMAT, abi=erc20_abi)

# Dirhamat is AED-pegged (~$0.27), BNB: $600, ETH: $2500, USDT: $1
# For $10,000 liquidity per pair

print("=" * 80)
print("STEP 1: Mint Wrapped Tokens")
print("=" * 80)

# Mint WBNB (need to deposit BNB)
wbnb_contract = w3.eth.contract(address=WBNB, abi=wbnb_abi)
wbnb_amount = w3.to_wei(50, 'ether')  # 50 BNB = $30,000 (enough for all pairs)

print(f"\nMinting {w3.from_wei(wbnb_amount, 'ether')} WBNB...")
tx = wbnb_contract.functions.deposit().build_transaction({
    'chainId': 65001,
    'gas': 100000,
    'gasPrice': w3.to_wei('10', 'gwei'),
    'nonce': w3.eth.get_transaction_count(account.address),
    'value': wbnb_amount
})
signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
w3.eth.send_raw_transaction(signed.raw_transaction)
w3.eth.wait_for_transaction_receipt(signed.hash)
print(f"  ✓ Minted {w3.from_wei(wbnb_amount, 'ether')} WBNB")

# Mint WETH (using deposit function)
weth_contract = w3.eth.contract(address=WETH, abi=wbnb_abi)
weth_amount = w3.to_wei(10, 'ether')  # 10 ETH

print(f"\nMinting {w3.from_wei(weth_amount, 'ether')} WETH...")
tx = weth_contract.functions.deposit().build_transaction({
    'chainId': 65001,
    'gas': 100000,
    'gasPrice': w3.to_wei('10', 'gwei'),
    'nonce': w3.eth.get_transaction_count(account.address),
    'value': weth_amount
})
signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
w3.eth.send_raw_transaction(signed.raw_transaction)
w3.eth.wait_for_transaction_receipt(signed.hash)
print(f"  ✓ Minted {w3.from_wei(weth_amount, 'ether')} WETH")

# Mint WUSDT (using mint function if available, otherwise deposit)
wusdt_contract = w3.eth.contract(address=WUSDT, abi=wbnb_abi)
wusdt_amount = w3.to_wei(30000, 'ether')  # 30,000 USDT

print(f"\nMinting {w3.from_wei(wusdt_amount, 'ether')} WUSDT...")
tx = wusdt_contract.functions.deposit().build_transaction({
    'chainId': 65001,
    'gas': 100000,
    'gasPrice': w3.to_wei('10', 'gwei'),
    'nonce': w3.eth.get_transaction_count(account.address),
    'value': wusdt_amount
})
signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
w3.eth.send_raw_transaction(signed.raw_transaction)
w3.eth.wait_for_transaction_receipt(signed.hash)
print(f"  ✓ Minted {w3.from_wei(wusdt_amount, 'ether')} WUSDT")

print("\n" + "=" * 80)
print("STEP 2: Create Dirhamat Pairs")
print("=" * 80)

# Dirhamat pairs to create
dirhamat_pairs = [
    {
        'name': 'DIRHAMAT/WBNB',
        'token0': DIRHAMAT,
        'token1': WBNB,
        'amount0': w3.to_wei(18519, 'ether'),    # 18,519 DIRHAMAT = $5,000 (at $0.27)
        'amount1': w3.to_wei(8.33, 'ether')      # 8.33 BNB = $5,000
    },
    {
        'name': 'DIRHAMAT/WETH',
        'token0': DIRHAMAT,
        'token1': WETH,
        'amount0': w3.to_wei(18519, 'ether'),    # 18,519 DIRHAMAT = $5,000
        'amount1': w3.to_wei(2, 'ether')         # 2 ETH = $5,000
    },
    {
        'name': 'DIRHAMAT/WUSDT',
        'token0': DIRHAMAT,
        'token1': WUSDT,
        'amount0': w3.to_wei(18519, 'ether'),    # 18,519 DIRHAMAT = $5,000
        'amount1': w3.to_wei(5000, 'ether')      # 5,000 USDT = $5,000
    }
]

created_pairs = []

for pair_config in dirhamat_pairs:
    print(f"\nCreating {pair_config['name']} pair...")
    
    # Check if pair exists
    existing_pair = factory.functions.getPair(pair_config['token0'], pair_config['token1']).call()
    
    if existing_pair == '0x0000000000000000000000000000000000000000':
        tx = factory.functions.createPair(
            pair_config['token0'],
            pair_config['token1']
        ).build_transaction({
            'chainId': 65001,
            'gas': 3000000,
            'gasPrice': w3.to_wei('10', 'gwei'),
            'nonce': w3.eth.get_transaction_count(account.address)
        })
        
        signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        pair_address = factory.functions.getPair(pair_config['token0'], pair_config['token1']).call()
        print(f"  ✓ Pair created: {pair_address}")
    else:
        pair_address = existing_pair
        print(f"  ✓ Pair exists: {pair_address}")
    
    pair_config['pair'] = pair_address
    created_pairs.append(pair_config)

print("\n" + "=" * 80)
print("STEP 3: Add Liquidity to Dirhamat Pairs")
print("=" * 80)

locked_positions = []
deadline = int(time.time()) + 3600

for pair_config in created_pairs:
    print(f"\n{pair_config['name']}:")
    print(f"  Pair: {pair_config['pair']}")
    
    token0 = w3.eth.contract(address=pair_config['token0'], abi=erc20_abi)
    token1 = w3.eth.contract(address=pair_config['token1'], abi=erc20_abi)
    
    # Approve token0 (Dirhamat)
    print(f"  Approving Dirhamat...")
    tx = token0.functions.approve(ROUTER, pair_config['amount0']).build_transaction({
        'chainId': 65001,
        'gas': 100000,
        'gasPrice': w3.to_wei('10', 'gwei'),
        'nonce': w3.eth.get_transaction_count(account.address)
    })
    signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    w3.eth.send_raw_transaction(signed.raw_transaction)
    w3.eth.wait_for_transaction_receipt(signed.hash)
    
    # Approve token1 (wrapped token)
    print(f"  Approving {pair_config['name'].split('/')[1]}...")
    tx = token1.functions.approve(ROUTER, pair_config['amount1']).build_transaction({
        'chainId': 65001,
        'gas': 100000,
        'gasPrice': w3.to_wei('10', 'gwei'),
        'nonce': w3.eth.get_transaction_count(account.address)
    })
    signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    w3.eth.send_raw_transaction(signed.raw_transaction)
    w3.eth.wait_for_transaction_receipt(signed.hash)
    
    # Add liquidity
    print(f"  Adding liquidity...")
    tx = router.functions.addLiquidity(
        pair_config['token0'],
        pair_config['token1'],
        pair_config['amount0'],
        pair_config['amount1'],
        0,  # min amount0
        0,  # min amount1
        account.address,
        deadline
    ).build_transaction({
        'chainId': 65001,
        'gas': 500000,
        'gasPrice': w3.to_wei('10', 'gwei'),
        'nonce': w3.eth.get_transaction_count(account.address)
    })
    
    signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    # Get LP token balance
    lp_token = w3.eth.contract(address=pair_config['pair'], abi=erc20_abi)
    lp_balance = lp_token.functions.balanceOf(account.address).call()
    
    print(f"  ✓ Liquidity added: {w3.from_wei(lp_balance, 'ether'):.6f} LP tokens")
    
    pair_config['lp_balance'] = lp_balance

print("\n" + "=" * 80)
print("STEP 4: Lock All Dirhamat LP Tokens for 36 Months")
print("=" * 80)

unlock_time = int(time.time()) + (36 * 30 * 24 * 60 * 60)  # 36 months

for pair_config in created_pairs:
    print(f"\n{pair_config['name']}:")
    
    lp_token = w3.eth.contract(address=pair_config['pair'], abi=erc20_abi)
    lp_balance = pair_config['lp_balance']
    
    if lp_balance == 0:
        print("  ⚠️ No LP tokens to lock, skipping...")
        continue
    
    # Approve LiquidityLock
    print(f"  Approving LP tokens...")
    tx = lp_token.functions.approve(LIQUIDITY_LOCK, lp_balance).build_transaction({
        'chainId': 65001,
        'gas': 100000,
        'gasPrice': w3.to_wei('10', 'gwei'),
        'nonce': w3.eth.get_transaction_count(account.address)
    })
    signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    w3.eth.send_raw_transaction(signed.raw_transaction)
    w3.eth.wait_for_transaction_receipt(signed.hash)
    
    # Lock liquidity
    print(f"  Locking liquidity for 36 months...")
    tx = lock_contract.functions.lockLiquidity(
        pair_config['pair'],
        lp_balance,
        unlock_time,
        account.address,
        f"$10K {pair_config['name']} Liquidity Lock - 36 Months"
    ).build_transaction({
        'chainId': 65001,
        'gas': 300000,
        'gasPrice': w3.to_wei('10', 'gwei'),
        'nonce': w3.eth.get_transaction_count(account.address)
    })
    
    signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    # Get lock ID from transaction receipt
    # Parse event logs to get lock ID
    lock_id = len(locked_positions) + 1
    
    unlock_date = datetime.utcfromtimestamp(unlock_time).strftime('%Y-%m-%d %H:%M:%S UTC')
    
    print(f"  ✓ Lock ID: {lock_id}")
    print(f"  ✓ Unlock Date: {unlock_date}")
    
    locked_positions.append({
        'pair': pair_config['name'],
        'pair_address': pair_config['pair'],
        'lp_amount': str(lp_balance),
        'lp_formatted': f"{w3.from_wei(lp_balance, 'ether'):.6f} LP",
        'lock_id': lock_id,
        'unlock_timestamp': unlock_time,
        'unlock_date': unlock_date
    })

print("\n" + "=" * 80)
print("DEPLOYMENT SUMMARY")
print("=" * 80)

deployment_data = {
    'timestamp': datetime.utcnow().isoformat() + 'Z',
    'chainId': 65001,
    'network': 'Nor Chain',
    'deployer': account.address,
    'liquidity_lock_contract': LIQUIDITY_LOCK,
    'total_pairs': len(created_pairs),
    'total_liquidity_usd': len(created_pairs) * 10000,
    'lock_duration': '36 months',
    'pairs': []
}

for i, pair_config in enumerate(created_pairs):
    if i < len(locked_positions):
        lock_info = locked_positions[i]
        deployment_data['pairs'].append({
            'name': pair_config['name'],
            'pair_address': pair_config['pair'],
            'token0': pair_config['token0'],
            'token1': pair_config['token1'],
            'liquidity_usd': 10000,
            'lp_locked': lock_info['lp_formatted'],
            'lock_id': lock_info['lock_id'],
            'unlock_date': lock_info['unlock_date']
        })

with open('deployments/nor-dirhamat-liquidity.json', 'w') as f:
    json.dump(deployment_data, f, indent=2)

print("\nDirhamat Pairs with Locked Liquidity:")
print("-" * 80)
for pair in deployment_data['pairs']:
    print(f"{pair['name']:<20} {pair['pair_address']}  ${pair['liquidity_usd']:,}  Lock ID: {pair['lock_id']}")

print(f"\n✓ Total Pairs: {len(created_pairs)}")
print(f"✓ Total Liquidity: ${len(created_pairs) * 10000:,}")
print(f"✓ Lock Duration: 36 months")
if locked_positions:
    print(f"✓ Unlock Date: {locked_positions[0]['unlock_date']}")
print(f"\n✓ Deployment data saved to deployments/nor-dirhamat-liquidity.json")

print("\n" + "=" * 80)
print("Dirhamat liquidity added and locked successfully!")
print("=" * 80)
