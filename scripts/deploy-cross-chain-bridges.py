from web3 import Web3
import json
from datetime import datetime

# Network configurations
NOOR_CHAIN = {
    'rpc': 'http://3.91.50.187:8545',
    'chain_id': 65001,
    'name': 'Nor Chain'
}

# Note: These are placeholder RPCs - user needs to provide actual endpoints
EXTERNAL_CHAINS = {
    1: {'name': 'Ethereum Mainnet', 'rpc': 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'},
    56: {'name': 'BSC Mainnet', 'rpc': 'https://bsc-dataseed1.binance.org'},
    137: {'name': 'Polygon Mainnet', 'rpc': 'https://polygon-rpc.com'}
}

PRIVATE_KEY = "0x681fda6ad9585ce9c27688eb60087ddaf4a90ca75f8f77b0f039bd5692ed2bd4"

# Connect to Nor Chain
w3_nor = Web3(Web3.HTTPProvider(NOOR_CHAIN['rpc']))
account = w3_nor.eth.account.from_key(PRIVATE_KEY)

print(f"Deploying cross-chain bridges from {account.address}")
print(f"Balance: {w3_nor.from_wei(w3_nor.eth.get_balance(account.address), 'ether')} NOR\n")

# Load contract artifacts
def load_artifact(path):
    with open(path) as f:
        return json.load(f)

# Deploy wrapped tokens on Nor Chain
def deploy_on_nor(contract_name, *args):
    artifact = load_artifact(f'.build/artifacts/contracts/wrapped/{contract_name}.sol/{contract_name}.json')
    contract = w3_nor.eth.contract(abi=artifact['abi'], bytecode=artifact['bytecode'])
    
    tx = contract.constructor(*args).build_transaction({
        'chainId': NOOR_CHAIN['chain_id'],
        'gas': 5000000,
        'gasPrice': w3_nor.to_wei('10', 'gwei'),
        'nonce': w3_nor.eth.get_transaction_count(account.address)
    })
    
    signed = w3_nor.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3_nor.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3_nor.eth.wait_for_transaction_receipt(tx_hash)
    
    return receipt['contractAddress']

# Deploy bridge contract
def deploy_bridge(w3_instance, chain_id, required_sigs=2):
    artifact = load_artifact('.build/artifacts/contracts/bridges/production/CrossChainBridge.sol/CrossChainBridge.json')
    contract = w3_instance.eth.contract(abi=artifact['abi'], bytecode=artifact['bytecode'])
    
    tx = contract.constructor(required_sigs).build_transaction({
        'chainId': chain_id,
        'gas': 6000000,
        'gasPrice': w3_instance.to_wei('10', 'gwei'),
        'nonce': w3_instance.eth.get_transaction_count(account.address)
    })
    
    signed = w3_instance.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3_instance.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3_instance.eth.wait_for_transaction_receipt(tx_hash)
    
    return receipt['contractAddress']

print("=" * 80)
print("STEP 1: Deploy CrossChainBridge on Nor Chain")
print("=" * 80)

bridge_nor = deploy_bridge(w3_nor, NOOR_CHAIN['chain_id'])
print(f"✓ Nor Chain Bridge: {bridge_nor}")

print("\n" + "=" * 80)
print("STEP 2: Deploy Wrapped Tokens on External Chains")
print("=" * 80)
print("NOTE: This requires RPC access to Ethereum, BSC, and Polygon mainnet")
print("You need to provide API keys and deploy manually or update EXTERNAL_CHAINS config")
print("=" * 80)

# Placeholder addresses - these would be deployed on external chains
external_deployments = {
    'ethereum': {
        'chain_id': 1,
        'bridge': '0x0000000000000000000000000000000000000000',  # Deploy manually
        'wrapped_btcbr': '0x0000000000000000000000000000000000000000',
        'wrapped_nor': '0x0000000000000000000000000000000000000000',
        'wrapped_dirhamat': '0x0000000000000000000000000000000000000000'
    },
    'bsc': {
        'chain_id': 56,
        'bridge': '0x0000000000000000000000000000000000000000',  # Deploy manually
        'wrapped_btcbr': '0x0000000000000000000000000000000000000000',
        'wrapped_nor': '0x0000000000000000000000000000000000000000',
        'wrapped_dirhamat': '0x0000000000000000000000000000000000000000'
    },
    'polygon': {
        'chain_id': 137,
        'bridge': '0x0000000000000000000000000000000000000000',  # Deploy manually
        'wrapped_btcbr': '0x0000000000000000000000000000000000000000',
        'wrapped_nor': '0x0000000000000000000000000000000000000000',
        'wrapped_dirhamat': '0x0000000000000000000000000000000000000000'
    }
}

print("\nExternal chain deployment addresses (placeholders - deploy manually):")
for chain, addrs in external_deployments.items():
    print(f"\n{chain.upper()}:")
    for contract, addr in addrs.items():
        print(f"  {contract}: {addr}")

print("\n" + "=" * 80)
print("STEP 3: Configure Nor Chain Bridge")
print("=" * 80)

# Get deployed token addresses from previous deployments
with open('deployments/nor-dex-deployment.json') as f:
    dex_deployment = json.load(f)

with open('deployments/nor-dirhamat-deployment.json') as f:
    dirhamat_deployment = json.load(f)

BTCBR = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
WNOR = dex_deployment['contracts']['WNOR']
DIRHAMAT = dirhamat_deployment['stablecoin']['Dirhamat']

# Load bridge contract
bridge_artifact = load_artifact('.build/artifacts/contracts/bridges/production/CrossChainBridge.sol/CrossChainBridge.json')
bridge_contract = w3_nor.eth.contract(address=bridge_nor, abi=bridge_artifact['abi'])

# Add validator nodes (using the 3 validator addresses)
validators = [
    "0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C",  # Validator 1
    "0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788",  # Validator 2
    "0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B"   # Validator 3
]

print("\nAdding validators to bridge...")
for i, validator in enumerate(validators, 1):
    tx = bridge_contract.functions.addValidator(validator).build_transaction({
        'chainId': NOOR_CHAIN['chain_id'],
        'gas': 200000,
        'gasPrice': w3_nor.to_wei('10', 'gwei'),
        'nonce': w3_nor.eth.get_transaction_count(account.address)
    })
    
    signed = w3_nor.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3_nor.eth.send_raw_transaction(signed.raw_transaction)
    w3_nor.eth.wait_for_transaction_receipt(tx_hash)
    print(f"  ✓ Validator {i} added: {validator}")

# Add supported tokens
print("\nAdding supported tokens...")
tokens = [
    ('BTCBR', BTCBR),
    ('WNOR', WNOR),
    ('Dirhamat', DIRHAMAT)
]

for name, address in tokens:
    tx = bridge_contract.functions.addToken(address).build_transaction({
        'chainId': NOOR_CHAIN['chain_id'],
        'gas': 200000,
        'gasPrice': w3_nor.to_wei('10', 'gwei'),
        'nonce': w3_nor.eth.get_transaction_count(account.address)
    })
    
    signed = w3_nor.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3_nor.eth.send_raw_transaction(signed.raw_transaction)
    w3_nor.eth.wait_for_transaction_receipt(tx_hash)
    print(f"  ✓ {name} added: {address}")

# Add bridge connections (will need to update with actual addresses after external deployment)
print("\nAdding bridge connections...")
for chain, config in external_deployments.items():
    tx = bridge_contract.functions.addBridge(
        config['chain_id'],
        chain.capitalize(),
        config['bridge']  # Placeholder - update after deployment
    ).build_transaction({
        'chainId': NOOR_CHAIN['chain_id'],
        'gas': 300000,
        'gasPrice': w3_nor.to_wei('10', 'gwei'),
        'nonce': w3_nor.eth.get_transaction_count(account.address)
    })
    
    signed = w3_nor.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3_nor.eth.send_raw_transaction(signed.raw_transaction)
    w3_nor.eth.wait_for_transaction_receipt(tx_hash)
    print(f"  ✓ {chain.capitalize()} bridge added (Chain ID: {config['chain_id']})")

print("\n" + "=" * 80)
print("DEPLOYMENT SUMMARY")
print("=" * 80)

deployment_data = {
    'timestamp': datetime.utcnow().isoformat() + 'Z',
    'deployer': account.address,
    'nor_chain': {
        'chain_id': NOOR_CHAIN['chain_id'],
        'bridge': bridge_nor,
        'validators': validators,
        'supported_tokens': {
            'BTCBR': BTCBR,
            'WNOR': WNOR,
            'Dirhamat': DIRHAMAT
        }
    },
    'external_chains': external_deployments,
    'configuration': {
        'required_signatures': 2,
        'min_validators': 2
    },
    'instructions': {
        'ethereum': 'Deploy WrappedBTCBR, WrappedNOR, WrappedDirhamat, and CrossChainBridge on Ethereum mainnet',
        'bsc': 'Deploy WrappedBTCBR, WrappedNOR, WrappedDirhamat, and CrossChainBridge on BSC mainnet',
        'polygon': 'Deploy WrappedBTCBR, WrappedNOR, WrappedDirhamat, and CrossChainBridge on Polygon mainnet',
        'update_bridges': 'After deploying on external chains, call updateBridge() on Nor Chain bridge with actual addresses'
    }
}

with open('deployments/nor-cross-chain-bridges.json', 'w') as f:
    json.dump(deployment_data, f, indent=2)

print("\nNor Chain Bridge Configuration:")
print(f"  Bridge Contract: {bridge_nor}")
print(f"  Validators: {len(validators)}")
print(f"  Required Signatures: 2/3")
print(f"  Supported Tokens: BTCBR, WNOR, Dirhamat")
print(f"  Connected Chains: Ethereum (1), BSC (56), Polygon (137)")

print("\n✓ Deployment data saved to deployments/nor-cross-chain-bridges.json")

print("\n" + "=" * 80)
print("NEXT STEPS:")
print("=" * 80)
print("""
1. Deploy wrapped tokens on external chains:
   - Ethereum: WrappedBTCBR, WrappedNOR, WrappedDirhamat
   - BSC: WrappedBTCBR, WrappedNOR, WrappedDirhamat
   - Polygon: WrappedBTCBR, WrappedNOR, WrappedDirhamat

2. Deploy CrossChainBridge on each external chain

3. Update Nor Chain bridge with actual external addresses:
   bridge_contract.functions.updateBridge(chainId, newAddress)

4. Configure wrapped tokens to trust their respective bridges:
   wrappedToken.updateBridge(bridgeAddress)

5. Add initial bridge liquidity for seamless transfers

6. Test cross-chain transfers:
   - Lock BTCBR on Nor → Mint wBTCBR on Ethereum
   - Burn wBTCBR on Ethereum → Unlock BTCBR on Nor
""")

print("=" * 80)
print("Bridge deployment on Nor Chain completed!")
print("=" * 80)
