#!/bin/bash
# Create Xaheen Chain Genesis with generated validator

set -e

VALIDATOR_ADDR="0x45eD1E009fa564553E234318768c29EdaE98EF44"
DEPLOYER_ADDR="0xdD779a290C937144F80Eb75b75d814c834536B1b"

# Remove 0x and lowercase
VALIDATOR_CLEAN=$(echo "$VALIDATOR_ADDR" | sed 's/0x//' | tr '[:upper:]' '[:lower:]')

# Parlia extraData: 32 bytes vanity + validator address (20 bytes) + 65 bytes seal
VANITY="0000000000000000000000000000000000000000000000000000000000000000"
SEAL="0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
EXTRA_DATA="0x${VANITY}${VALIDATOR_CLEAN}${SEAL}"

echo "Creating Xaheen Chain Genesis..."
echo "Validator: $VALIDATOR_ADDR"
echo "Deployer: $DEPLOYER_ADDR"
echo "ExtraData: $EXTRA_DATA"

cat > data/genesis-xaheen-working.json <<EOF
{
  "config": {
    "chainId": 65001,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "muirGlacierBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "arrowGlacierBlock": 0,
    "grayGlacierBlock": 0,
    "mergeNetsplitBlock": 0,
    "shanghaiBlock": 0,
    "cancunBlock": 0,
    "eulerBlock": 0,
    "gibbsBlock": 0,
    "brunoBlock": 0,
    "mirrorSyncBlock": 0,
    "parlia": {
      "period": 3,
      "epoch": 30000
    }
  },
  "nonce": "0x0",
  "timestamp": "0x0",
  "extraData": "$EXTRA_DATA",
  "gasLimit": "0x1c9c380",
  "difficulty": "0x1",
  "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "alloc": {
    "$DEPLOYER_ADDR": {
      "balance": "0x43dacaf91c1a84ff08000000"
    },
    "$VALIDATOR_ADDR": {
      "balance": "0x3635c9adc5dea00000"
    }
  },
  "number": "0x0",
  "gasUsed": "0x0",
  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
EOF

echo "✅ Genesis created: data/genesis-xaheen-working.json"
echo "Chain ID: 65001"
echo "Deployer balance: 21 billion XHT"
echo "Validator balance: 1,000 XHT"
