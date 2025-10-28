#!/usr/bin/env bash
set -euo pipefail

############################################
#            EDIT THESE VALUES             #
############################################
# Chain/network identity
CHAIN_ID=1001
NETWORK_ID=1001
NODE_NAME="xaheen-bsc-validator-1"

# Data & runtime
DATA_DIR="/var/lib/bsc"
PASSWORD_FILE="$DATA_DIR/password.txt"   # passphrase for keystore account (non-empty!)

# RPC exposure (restrict in security groups!)
RPC_ADDR="0.0.0.0"
RPC_PORT=8545
WS_PORT=8546
P2P_PORT=30303

# BSC public RPC used to fetch mainnet BTCBR runtime bytecode
BSC_MAINNET_RPC="https://bsc-dataseed.binance.org/"

# BTCBR address to mirror in genesis (same as BSC mainnet)
BTCBR_ADDR="0x0cF8e180350253271f4b917CcFb0aCCc4862F262"

# Pre-fund an EOA for gas on your private chain (optional)
FUND_EOA="0x0000000000000000000000000000000000000000"  # set to your EOA if desired
FUND_BAL_HEX="0x3635c9adc5dea00000"  # 1000 BNB in wei

# Docker image
IMAGE="bnbchain/bsc:latest"

# Validator key source
#   If you already have a Geth keystore you'd like to reuse, set IMPORT_KEY=true and point to it.
IMPORT_KEY=false
KEYSTORE_SRC="/var/lib/geth/keystore/UTC--2025-01-01T00-00-00Z--youraddress"  # path on this server
EXISTING_KEY_PASSWORD="YOUR_EXISTING_KEY_PASSWORD"  # will be written to PASSWORD_FILE if importing

############################################
#         DO NOT EDIT BELOW THIS POINT     #
############################################

echo "==> 0) Stop geth / old services (ignore errors)"
sudo systemctl stop geth 2>/dev/null || true
sudo systemctl stop ethereum 2>/dev/null || true
sudo docker rm -f bsc 2>/dev/null || true

echo "==> 1) Back up old geth data (if present)"
sudo mkdir -p /var/backups
if [ -d "/var/lib/geth" ]; then
  sudo tar -C / -czf "/var/backups/geth-$(date +%F-%H%M).tgz" var/lib/geth || true
fi

echo "==> 2) Install Docker, jq, Python3 if missing"
if ! command -v docker >/dev/null; then curl -fsSL https://get.docker.com | sh; sudo usermod -aG docker "$USER"; fi
if ! command -v jq >/dev/null; then sudo apt-get update -y && sudo apt-get install -y jq; fi
if ! command -v python3 >/dev/null; then sudo apt-get update -y && sudo apt-get install -y python3; fi

echo "==> 3) Prepare data dir"
sudo mkdir -p "$DATA_DIR"
sudo chown -R "$USER":"$USER" "$DATA_DIR"

echo "==> 4) Create/prepare password file"
if [ ! -s "$PASSWORD_FILE" ]; then
  if [ "$IMPORT_KEY" = true ]; then
    echo -n "$EXISTING_KEY_PASSWORD" > "$PASSWORD_FILE"
  else
    # set a strong passphrase here or replace this line with a prompt
    echo "CHANGE_ME_STRONG_PASSWORD" > "$PASSWORD_FILE"
  fi
fi

echo "==> 5) Pull BSC node image"
docker pull "$IMAGE"

echo "==> 6) Manage validator account"
KEYSTORE_DIR="$DATA_DIR/keystore"
mkdir -p "$KEYSTORE_DIR"

if [ "$IMPORT_KEY" = true ]; then
  echo "   -> Importing existing keystore"
  if [ ! -f "$KEYSTORE_SRC" ]; then
    echo "Keystore file not found at $KEYSTORE_SRC"; exit 1
  fi
  cp "$KEYSTORE_SRC" "$KEYSTORE_DIR/"
  # Extract address from keystore filename
  VALIDATOR_ADDR="0x$(basename "$KEYSTORE_SRC" | awk -F'--' '{print $NF}')"
else
  echo "   -> Creating a new validator account"
  docker run --rm -v "$DATA_DIR:/bsc" "$IMAGE" \
    account new --datadir /bsc --password /bsc/$(basename "$PASSWORD_FILE")
  # Find the newest keystore file and derive address
  NEW_KEY=$(ls -t "$KEYSTORE_DIR"/UTC--* | head -n1)
  VALIDATOR_ADDR="0x$(basename "$NEW_KEY" | awk -F'--' '{print $NF}')"
fi
echo "   -> Validator address: $VALIDATOR_ADDR"

echo "==> 7) Build Parlia extraData from validator(s)"
python3 - "$VALIDATOR_ADDR" > "$DATA_DIR/make_extradata.py" <<'PY'
import sys, binascii
addr = sys.argv[1]
h = bytes.fromhex(addr[2:])
extra = b'\x00'*32 + h + b'\x00'*65
print("0x"+extra.hex())
PY
EXTRA_DATA=$(python3 "$DATA_DIR/make_extradata.py" "$VALIDATOR_ADDR")
echo "   -> extraData: $EXTRA_DATA"

echo "==> 8) Fetch BTCBR runtime bytecode from BNB mainnet"
REQ='{"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["'"$BTCBR_ADDR"'","latest"]}'
BTCBR_CODE=$(curl -s -H "Content-Type: application/json" -d "$REQ" "$BSC_MAINNET_RPC" | jq -r .result)
if [ -z "$BTCBR_CODE" ] || [ "$BTCBR_CODE" = "0x" ] || [ "$BTCBR_CODE" = "null" ]; then
  echo "Failed to fetch bytecode from $BSC_MAINNET_RPC for $BTCBR_ADDR"; exit 1
fi
echo "   -> Got runtime bytecode (length: ${#BTCBR_CODE} chars)"

echo "==> 9) Compose genesis.json (Parlia + mirrored BTCBR contract)"
cat > "$DATA_DIR/genesis.template.json" <<'JSON'
{
  "config": {
    "chainId": __CHAIN_ID__,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip150Hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "muirGlacierBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "parlia": { "period": 3, "epoch": 200 }
  },
  "nonce": "0x0",
  "timestamp": "0x0",
  "extraData": "__EXTRA_DATA__",
  "gasLimit": "0x1c9c380",
  "difficulty": "0x1",
  "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "alloc": {
    "__FUND_EOA__": { "balance": "__FUND_BAL_HEX__" },
    "__BTCBR_ADDR__": {
      "balance": "0x0",
      "code": "__BTCBR_CODE__",
      "storage": {}
    }
  },
  "number": "0x0",
  "gasUsed": "0x0",
  "parentHash":"0x0000000000000000000000000000000000000000000000000000000000000000"
}
JSON

sed -e "s/__CHAIN_ID__/$CHAIN_ID/g" \
    -e "s#__EXTRA_DATA__#$EXTRA_DATA#g" \
    -e "s#__FUND_EOA__#${FUND_EOA}#g" \
    -e "s#__FUND_BAL_HEX__#${FUND_BAL_HEX}#g" \
    -e "s#__BTCBR_ADDR__#${BTCBR_ADDR}#g" \
    -e "s#__BTCBR_CODE__#${BTCBR_CODE}#g" \
    "$DATA_DIR/genesis.template.json" > "$DATA_DIR/genesis.json"

jq . "$DATA_DIR/genesis.json" >/dev/null || { echo "Invalid genesis.json"; exit 1; }

echo "==> 10) Initialize the BSC datadir with genesis"
docker run --rm -v "$DATA_DIR:/bsc" "$IMAGE" \
  --datadir /bsc init /bsc/genesis.json

echo "==> 11) Static nodes (empty for now; add peers later)"
echo "[]" > "$DATA_DIR/static-nodes.json"

echo "==> 12) Start BSC validator node (mining enabled)"
docker run -d --name bsc --restart unless-stopped \
  -v "$DATA_DIR:/bsc" \
  -p $RPC_PORT:8545 -p $WS_PORT:8546 -p $P2P_PORT:30303 \
  "$IMAGE" \
  --datadir /bsc \
  --networkid $NETWORK_ID \
  --port 30303 \
  --syncmode full \
  --http --http.addr $RPC_ADDR --http.port 8545 --http.corsdomain="*" \
  --http.api "eth,net,web3,personal,txpool,parlia" \
  --ws --ws.addr 0.0.0.0 --ws.port 8546 --ws.api "eth,net,web3,txpool,parlia" \
  --mine \
  --miner.etherbase $VALIDATOR_ADDR \
  --unlock $VALIDATOR_ADDR \
  --password /bsc/$(basename "$PASSWORD_FILE") \
  --allow-insecure-unlock \
  --miner.gaslimit 30000000 \
  --miner.gasprice 1000000000 \
  --txpool.globalslots 4096 \
  --lightkdf \
  --verbosity 3 \
  --identity "$NODE_NAME"

echo "==> 13) Security reminders"
echo "    - Restrict RPC/WS to trusted IPs in AWS Security Groups or set RPC_ADDR=127.0.0.1"
echo "    - Keep keystore + password protected; consider moving to a Safe/HSM for production."
echo "    - This genesis bakes your validator set; adding validators later requires a new genesis (or a validator set contract)."

echo "==> 14) Health checks"
echo "    - Logs: docker logs -f bsc"
echo "    - Code at BTCBR addr (private chain): curl -s -H 'Content-Type: application/json' \\
             -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getCode\",\"params\":[\"$BTCBR_ADDR\",\"latest\"]}' \\
             http://localhost:$RPC_PORT | jq -r .result"
echo "    - Latest block: curl -s -H 'Content-Type: application/json' \\
             -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_blockNumber\",\"params\":[]}' \\
             http://localhost:$RPC_PORT | jq -r .result"

echo "==> DONE. Your private BNB (Parlia) chain is live with BTCBR mirrored at $BTCBR_ADDR."