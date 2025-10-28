#!/bin/bash

# AWS Deployment Script for BSC Validator Node
set -euo pipefail

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Default values
AWS_REGION=${AWS_REGION:-"us-east-1"}
AWS_INSTANCE_TYPE=${AWS_INSTANCE_TYPE:-"t3.large"}
AWS_VOLUME_SIZE=${AWS_VOLUME_SIZE:-"100"}
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

# Launch EC2 instance
echo "==> Launching EC2 instance"
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ami-0abcdef1234567890 \  # Amazon Linux 2 AMI - you may need to update this
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
    sudo yum install -y docker git
    sudo usermod -a -G docker ec2-user
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo chmod +x setup.sh migrate-to-bsc.sh
    ./setup.sh
EOF

echo "==> Deployment complete!"
echo "Instance IP: $INSTANCE_IP"
echo "Key file: ${KEY_PAIR_NAME}.pem"
echo "To connect to the instance: ssh -i ${KEY_PAIR_NAME}.pem ec2-user@$INSTANCE_IP"