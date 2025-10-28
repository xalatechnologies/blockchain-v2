# Manual BTCBR Balance Fix Deployment

## Step 1: Upload Genesis File to Server

```bash
# From your local machine
scp data/genesis-btcbr-fixed.json ubuntu@3.91.50.187:~/bsc-production/config/genesis.json
```

## Step 2: SSH to Server

```bash
ssh ubuntu@3.91.50.187
```

## Step 3: Stop All Validators

```bash
cd ~/bsc-production
docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3
docker rm bsc-validator-1 bsc-validator-2 bsc-validator-3
```

## Step 4: Delete Old Blockchain Data

```bash
cd ~/bsc-production
rm -rf validator-1/geth validator-2/geth validator-3/geth
```

## Step 5: Reinitialize Validators

```bash
cd ~/bsc-production

# Initialize validator 1
docker run --rm -v $(pwd)/validator-1:/bsc -v $(pwd)/config/genesis.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json

# Initialize validator 2
docker run --rm -v $(pwd)/validator-2:/bsc -v $(pwd)/config/genesis.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json

# Initialize validator 3
docker run --rm -v $(pwd)/validator-3:/bsc -v $(pwd)/config/genesis.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json
```

## Step 6: Start Validator 1

```bash
cd ~/bsc-production

docker run -d \
  --name bsc-validator-1 \
  --network host \
  -v $(pwd)/validator-1:/bsc \
  -v $(pwd)/validator-1/password.txt:/password.txt \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 885824 \
  --syncmode full \
  --gcmode archive \
  --http \
  --http.addr 0.0.0.0 \
  --http.port 8545 \
  --http.api eth,net,web3,txpool \
  --http.corsdomain "*" \
  --http.vhosts "*" \
  --ws \
  --ws.addr 0.0.0.0 \
  --ws.port 8546 \
  --ws.origins "*" \
  --port 30303 \
  --password /password.txt \
  --unlock 0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD \
  --mine \
  --miner.etherbase 0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD \
  --allow-insecure-unlock \
  --maxpeers 25
```

## Step 7: Wait and Get Enode from Validator 1

```bash
sleep 5
docker logs bsc-validator-1 2>&1 | grep "enode://"
```

## Step 8: Start Validators 2 and 3

```bash
cd ~/bsc-production

# Start validator 2
docker run -d \
  --name bsc-validator-2 \
  --network host \
  -v $(pwd)/validator-2:/bsc \
  -v $(pwd)/validator-2/password.txt:/password.txt \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 885824 \
  --port 30304 \
  --unlock 0xfd634d55ce9b99058dc06cdda1f866b39579a9f3 \
  --mine \
  --miner.etherbase 0xfd634d55ce9b99058dc06cdda1f866b39579a9f3 \
  --allow-insecure-unlock \
  --maxpeers 25

# Start validator 3
docker run -d \
  --name bsc-validator-3 \
  --network host \
  -v $(pwd)/validator-3:/bsc \
  -v $(pwd)/validator-3/password.txt:/password.txt \
  dysnix/bsc \
  --datadir /bsc \
  --networkid 885824 \
  --port 30305 \
  --unlock 0xb753b892551d1c374fda6fd7f6e9b787688c4ea5 \
  --mine \
  --miner.etherbase 0xb753b892551d1c374fda6fd7f6e9b787688c4ea5 \
  --allow-insecure-unlock \
  --maxpeers 25
```

## Step 9: Get All Enode Addresses

```bash
sleep 10

echo "=== Validator 1 Enode ==="
docker logs bsc-validator-1 2>&1 | grep "enode://" | head -1

echo "=== Validator 2 Enode ==="
docker logs bsc-validator-2 2>&1 | grep "enode://" | head -1

echo "=== Validator 3 Enode ==="
docker logs bsc-validator-3 2>&1 | grep "enode://" | head -1
```

## Step 10: Create Static-Nodes.json Files

```bash
cd ~/bsc-production

# Extract enodes (replace the @IP with @127.0.0.1)
ENODE1=$(docker logs bsc-validator-1 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/')
ENODE2=$(docker logs bsc-validator-2 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/')
ENODE3=$(docker logs bsc-validator-3 2>&1 | grep "enode://" | head -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@[^@]*@/@127.0.0.1:/')

# Create static-nodes.json for each validator
echo "[\"$ENODE2\", \"$ENODE3\"]" > validator-1/static-nodes.json
echo "[\"$ENODE1\", \"$ENODE3\"]" > validator-2/static-nodes.json
echo "[\"$ENODE1\", \"$ENODE2\"]" > validator-3/static-nodes.json
```

## Step 11: Restart Validators

```bash
docker restart bsc-validator-1 bsc-validator-2 bsc-validator-3
```

## Step 12: Wait and Verify

```bash
sleep 15

# Check block number
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check peer count
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# Check your BTCBR balance
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x0cF8e180350253271f4b917CcFb0aCCc4862F262","data":"0x70a08231000000000000000000000000dD779a290C937144F80Eb75b75d814c834536B1b"},"latest"],"id":1}'
```

## Expected Result

Your balance should now show:
```
0x000000000000000000000000000001b69b4ba630f34e79880701d5e000000000
```

Which equals: **10,500,000,000,000,000,000,000,000,000,000,000,000,000 BTCBR** (10.5 septillion)
