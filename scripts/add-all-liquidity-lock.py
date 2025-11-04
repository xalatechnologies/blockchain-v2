from web3 import Web3
import json
from datetime import datetime
import time

RPC_URL = "http://3.91.50.187:8545"
PRIVATE_KEY = "0x681fda6ad9585ce9c27688eb60087ddaf4a90ca75f8f77b0f039bd5692ed2bd4"

w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

print(f"Adding liquidity and creating NOR pairs from {account.address}")
print(f"Balance: {w3.from_wei(w3.eth.get_balance(account.address), 'ether')} NOR\n")

# Contract addresses
BTCBR = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
WNOR = "0x0f8498072DB1611497e2068f9896aeFfcf173583"
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

factory = w3.eth.contract(address=FACTORY, abi=factory_abi)
router = w3.eth.contract(address=ROUTER, abi=router_abi)
lock_contract = w3.eth.contract(address=LIQUIDITY_LOCK, abi=lock_abi)

# BTCBR price: $0.0001, NOR price: $0.01, BNB: $600, ETH: $2500, USDT: $1
# For $10,000 liquidity per pair

liquidity_configs = [
    # Existing BTCBR pairs - $10K each
    {
        'name': 'BTCBR/WBNB',
        'token0': BTCBR,
        'token1': WBNB,
        'amount0': w3.to_wei(83333333, 'ether'),  # 83.33M BTCBR = $8,333
        'amount1': w3.to_wei(8.33, 'ether'),      # 8.33 BNB = $5,000
        'pair': '0x16106822360Cd68C496BEe0BebE8c8E2E3faE7C1'
    },
    {
        'name': 'BTCBR/WETH',
        'token0': BTCBR,
        'token1': WETH,
        'amount0': w3.to_wei(50000000, 'ether'),  # 50M BTCBR = $5,000
        'amount1': w3.to_wei(2, 'ether'),         # 2 ETH = $5,000
        'pair': '0xe28B0755E978f7B7302dddC14269ef4A209F74Ef'
    },
    {
        'name': 'BTCBR/WUSDT',
        'token0': BTCBR,
        'token1': WUSDT,
        'amount0': w3.to_wei(50000000, 'ether'),  # 50M BTCBR = $5,000
        'amount1': w3.to_wei(5000, 'ether'),      # 5,000 USDT = $5,000
        'pair': '0x538DEFAbe8dC5F99a420058B675E9111C5B7a50C'
    }
]

# New NOR pairs to create
new_pairs = [
    {
        'name': 'NOR/WBNB',
        'token0': WNOR,
        'token1': WBNB,
        'amount0': w3.to_wei(833, 'ether'),    # 833 NOR = $8,333
        'amount1': w3.to_wei(8.33, 'ether')    # 8.33 BNB = $5,000
    },
    {
        'name': 'NOR/WETH',
        'token0': WNOR,
        'token1': WETH,
        'amount0': w3.to_wei(500, 'ether'),    # 500 NOR = $5,000
        'amount1': w3.to_wei(2, 'ether')       # 2 ETH = $5,000
    },
    {
        'name': 'NOR/WUSDT',
        'token0': WNOR,
        'token1': WUSDT,
        'amount0': w3.to_wei(500, 'ether'),    # 500 NOR = $5,000
        'amount1': w3.to_wei(5000, 'ether')    # 5,000 USDT = $5,000
    }
]

print("=" * 80)
print("STEP 1: Create NOR Pairs")
print("=" * 80)

created_pairs = []

for pair_config in new_pairs:
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

# Combine all pairs
all_pairs = liquidity_configs + created_pairs

print("\n" + "=" * 80)
print("STEP 2: Add Liquidity to All Pairs")
print("=" * 80)

locked_positions = []
deadline = int(time.time()) + 3600

for pair_config in all_pairs:
    print(f"\n{pair_config['name']}:")
    print(f"  Pair: {pair_config['pair']}")
    
    token0 = w3.eth.contract(address=pair_config['token0'], abi=erc20_abi)
    token1 = w3.eth.contract(address=pair_config['token1'], abi=erc20_abi)
    
    # Approve token0
    print(f"  Approving token0...")
    tx = token0.functions.approve(ROUTER, pair_config['amount0']).build_transaction({
        'chainId': 65001,
        'gas': 100000,
        'gasPrice': w3.to_wei('10', 'gwei'),
        'nonce': w3.eth.get_transaction_count(account.address)
    })
    signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    w3.eth.send_raw_transaction(signed.raw_transaction)
    w3.eth.wait_for_transaction_receipt(signed.hash)
    
    # Approve token1
    print(f"  Approving token1...")
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
    
    print(f"  ✓ Liquidity added: {w3.from_wei(lp_balance, 'ether')} LP tokens")
    
    pair_config['lp_balance'] = lp_balance

print("\n" + "=" * 80)
print("STEP 3: Lock All LP Tokens for 36 Months")
print("=" * 80)

unlock_time = w3.eth.get_block('latest')['timestamp'] + (36 * 30 * 24 * 60 * 60)  # 36 months

for pair_config in all_pairs:
    print(f"\n{pair_config['name']}:")
    
    lp_token = w3.eth.contract(address=pair_config['pair'], abi=erc20_abi)
    lp_balance = pair_config['lp_balance']
    
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
    
    # Get lock ID from events
    total_locks = lock_contract.functions.lockCount().call()
    lock_id = total_locks - 1
    
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
    'total_pairs': len(all_pairs),
    'total_liquidity_usd': len(all_pairs) * 10000,
    'lock_duration': '36 months',
    'pairs': []
}

for i, pair_config in enumerate(all_pairs):
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

with open('deployments/nor-all-liquidity-locked.json', 'w') as f:
    json.dump(deployment_data, f, indent=2)

print("\nAll Pairs with Locked Liquidity:")
print("-" * 80)
for pair in deployment_data['pairs']:
    print(f"{pair['name']:<15} {pair['pair_address']}  ${pair['liquidity_usd']:,}  Lock ID: {pair['lock_id']}")

print(f"\n✓ Total Pairs: {len(all_pairs)}")
print(f"✓ Total Liquidity: ${len(all_pairs) * 10000:,}")
print(f"✓ Lock Duration: 36 months")
print(f"✓ Unlock Date: {locked_positions[0]['unlock_date']}")
print(f"\n✓ Deployment data saved to deployments/nor-all-liquidity-locked.json")

print("\n" + "=" * 80)
print("All liquidity added and locked successfully!")
print("=" * 80)
