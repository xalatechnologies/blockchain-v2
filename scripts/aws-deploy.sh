#!/bin/bash

# AWS Deployment Script for BSC Validator Node
set -euo pipefail

# Environment variables
VALIDATOR_ADDRESS="0x81bDAf1ac2094D5133937B3361A38a4976E55acc"
CHAIN_ID="885824"
NETWORK_ID="885824"
RPC_ADDR="0.0.0.0"
RPC_PORT="8545"
WS_PORT="8546"
P2P_PORT="30303"
BSC_MAINNET_RPC="https://bsc-dataseed.binance.org/"
BTCBR_ADDR="0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
FUND_EOA="0x81bDAf1ac2094D5133937B3361A38a4976E55acc"
FUND_BAL_HEX="0x3635c9adc5dea00000"
AWS_REGION="us-east-1"
AWS_INSTANCE_TYPE="t3.large"
AWS_VOLUME_SIZE="100"
KEY_PAIR_NAME="bsc-validator-key"
SECURITY_GROUP_NAME="bsc-validator-sg"
INSTANCE_NAME="bsc-validator-node"

echo "==> Deploying BSC Validator Node to AWS"

# Create key pair if it doesn't exist
echo "==> Creating key pair: $KEY_PAIR_NAME"
if ! aws ec2 describe-key-pairs --key-names "$KEY_PAIR_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
    aws ec2 create-key-pair --key-name "$KEY_PAIR_NAME" --region "$AWS_REGION" --query 'KeyMaterial' --output text > "${KEY_PAIR_NAME}.pem"
    chmod 400 "${KEY_PAIR_NAME}.pem"
    echo "Created key pair and saved private key to ${KEY_PAIR_NAME}.pem"
else
    echo "Key pair $KEY_PAIR_NAME already exists"
fi

# Create security group if it doesn't exist
echo "==> Creating security group: $SECURITY_GROUP_NAME"
if ! aws ec2 describe-security-groups --group-names "$SECURITY_GROUP_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
    SECURITY_GROUP_ID=$(aws ec2 create-security-group --group-name "$SECURITY_GROUP_NAME" --description "Security group for BSC validator node" --region "$AWS_REGION" --query 'GroupId' --output text)
    
    # Add rules to security group
    aws ec2 authorize-security-group-ingress --group-id "$SECURITY_GROUP_ID" --protocol tcp --port 22 --cidr "0.0.0.0/0" --region "$AWS_REGION"
    aws ec2 authorize-security-group-ingress --group-id "$SECURITY_GROUP_ID" --protocol tcp --port 8545 --cidr "0.0.0.0/0" --region "$AWS_REGION"
    aws ec2 authorize-security-group-ingress --group-id "$SECURITY_GROUP_ID" --protocol tcp --port 8546 --cidr "0.0.0.0/0" --region "$AWS_REGION"
    aws ec2 authorize-security-group-ingress --group-id "$SECURITY_GROUP_ID" --protocol tcp --port 30303 --cidr "0.0.0.0/0" --region "$AWS_REGION"
    aws ec2 authorize-security-group-ingress --group-id "$SECURITY_GROUP_ID" --protocol udp --port 30303 --cidr "0.0.0.0/0" --region "$AWS_REGION"
    
    echo "Created security group $SECURITY_GROUP_NAME with ID: $SECURITY_GROUP_ID"
else
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names "$SECURITY_GROUP_NAME" --region "$AWS_REGION" --query 'SecurityGroups[0].GroupId' --output text)
    echo "Using existing security group $SECURITY_GROUP_NAME with ID: $SECURITY_GROUP_ID"
fi

# Get the latest Amazon Linux 2 AMI ID
echo "==> Getting latest Amazon Linux 2 AMI ID"
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" \
    --query 'Images | sort_by(@, &CreationDate)[-1].ImageId' \
    --output text \
    --region "$AWS_REGION")

echo "Using AMI ID: $AMI_ID"

# Launch EC2 instance
echo "==> Launching EC2 instance"
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --count 1 \
    --instance-type "$AWS_INSTANCE_TYPE" \
    --key-name "$KEY_PAIR_NAME" \
    --security-group-ids "$SECURITY_GROUP_ID" \
    --block-device-mappings "[{\"DeviceName\":\"/dev/sdf\",\"Ebs\":{\"VolumeSize\":$AWS_VOLUME_SIZE,\"VolumeType\":\"gp2\"}}]" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --region "$AWS_REGION" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "Launched EC2 instance with ID: $INSTANCE_ID"

# Wait for instance to be running
echo "==> Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"

# Get instance public IP
INSTANCE_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --region "$AWS_REGION" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "Instance is running with public IP: $INSTANCE_IP"

# Wait a bit for SSH to be available
sleep 30

# Copy files to instance
echo "==> Copying files to instance"
scp -i "${KEY_PAIR_NAME}.pem" -o StrictHostKeyChecking=no -r . ec2-user@"$INSTANCE_IP":~/blockchain-v2

# SSH into instance and run setup
echo "==> Running setup on instance"
ssh -i "${KEY_PAIR_NAME}.pem" -o StrictHostKeyChecking=no ec2-user@"$INSTANCE_IP" << 'EOF'
    cd ~/blockchain-v2
    sudo yum update -y
    sudo yum install -y docker git python3-pip
    sudo pip3 install ansible
    sudo usermod -a -G docker ec2-user
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo chmod +x setup.sh migrate-to-bsc.sh scripts/*.sh
    ./setup.sh
    
    # Install required packages for Ansible
    sudo yum install -y jq curl
    
    # Test Ansible connectivity
    cd ~/blockchain-v2/infrastructure/ansible
    ansible all -m ping
EOF

echo "==> Deployment complete!"
echo "Instance IP: $INSTANCE_IP"
echo "Key file: ${KEY_PAIR_NAME}.pem"
echo "To connect to the instance: ssh -i ${KEY_PAIR_NAME}.pem ec2-user@$INSTANCE_IP"