#!/bin/bash

##############################################################################
# Nor Chain - Provision 4 Additional Validators (4-7)
#
# This script provisions 4 new EC2 t3.large instances across multiple regions
# for validators 4-7 as part of the 7-validator setup
##############################################################################

set -e  # Exit on error

echo "🚀 PROVISIONING XAHEEN CHAIN VALIDATORS 4-7"
echo "========================================================================"

# Configuration
INSTANCE_TYPE="t3.large"
AMI_ID="ami-0453ec754f44f9a4a"  # Amazon Linux 2023 (us-east-1)
KEY_NAME="bsc-validator-key"
SECURITY_GROUP="xaheen-validators"

# Validator configurations (validator:region:name:ami)
VALIDATOR_4="us-west-2:xaheen-validator-4:ami-0c65adc9a5c1b5d7c"
VALIDATOR_5="us-west-2:xaheen-validator-5:ami-0c65adc9a5c1b5d7c"
VALIDATOR_6="eu-west-1:xaheen-validator-6:ami-0d71ea30463e0ff8d"
VALIDATOR_7="ap-southeast-1:xaheen-validator-7:ami-0609186b60570e9c9"

# User data script for validator setup
USER_DATA=$(cat <<'EOF'
#!/bin/bash
# Update system
yum update -y
yum install -y docker git jq

# Start Docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Create validator directory
mkdir -p /home/ec2-user/validator
chown ec2-user:ec2-user /home/ec2-user/validator

# Pull BSC Docker image
docker pull dysnix/bsc:latest

echo "✅ Validator node initialized"
EOF
)

# Function to create security group in region
create_security_group() {
    local region=$1

    echo "Creating security group in $region..." >&2

    # Check if security group exists
    local sg_id=$(aws ec2 describe-security-groups \
        --region $region \
        --filters "Name=group-name,Values=$SECURITY_GROUP" \
        --query "SecurityGroups[0].GroupId" \
        --output text 2>/dev/null)

    if [ "$sg_id" == "None" ] || [ -z "$sg_id" ]; then
        # Create security group
        sg_id=$(aws ec2 create-security-group \
            --region $region \
            --group-name $SECURITY_GROUP \
            --description "Nor Chain Validators" \
            --query 'GroupId' \
            --output text)

        # Add ingress rules
        aws ec2 authorize-security-group-ingress \
            --region $region \
            --group-id $sg_id \
            --ip-permissions \
                IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges='[{CidrIp=0.0.0.0/0}]' \
                IpProtocol=tcp,FromPort=30303,ToPort=30303,IpRanges='[{CidrIp=0.0.0.0/0}]' \
                IpProtocol=udp,FromPort=30303,ToPort=30303,IpRanges='[{CidrIp=0.0.0.0/0}]' \
                IpProtocol=tcp,FromPort=8545,ToPort=8546,IpRanges='[{CidrIp=0.0.0.0/0}]' \
            >&2 2>/dev/null

        echo "✅ Security group created: $sg_id" >&2
    else
        echo "✅ Security group already exists: $sg_id" >&2
    fi

    echo $sg_id
}

# Function to launch instance
launch_instance() {
    local validator_num=$1
    local region=$2
    local name=$3
    local ami=$4

    echo ""
    echo "📦 Launching Validator $validator_num in $region..."

    # Create security group
    SG_ID=$(create_security_group $region)

    # Use provided AMI
    AMI=$ami

    # Launch instance
    INSTANCE_ID=$(aws ec2 run-instances \
        --region $region \
        --image-id $AMI \
        --instance-type $INSTANCE_TYPE \
        --key-name $KEY_NAME \
        --security-group-ids $SG_ID \
        --user-data "$USER_DATA" \
        --block-device-mappings '[{
            "DeviceName": "/dev/xvda",
            "Ebs": {
                "VolumeSize": 100,
                "VolumeType": "gp3",
                "DeleteOnTermination": false
            }
        }]' \
        --tag-specifications "ResourceType=instance,Tags=[
            {Key=Name,Value=$name},
            {Key=Validator,Value=$validator_num},
            {Key=Project,Value=NorChain}
        ]" \
        --iam-instance-profile Name=NorChainBackupRole \
        --query 'Instances[0].InstanceId' \
        --output text)

    echo "✅ Instance launched: $INSTANCE_ID"

    # Wait for instance to be running
    echo "⏳ Waiting for instance to be running..."
    aws ec2 wait instance-running --region $region --instance-ids $INSTANCE_ID

    # Get public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --region $region \
        --instance-ids $INSTANCE_ID \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)

    echo "✅ Validator $validator_num ready at $PUBLIC_IP"

    # Save to file
    echo "{\"validator\": $validator_num, \"region\": \"$region\", \"instance_id\": \"$INSTANCE_ID\", \"public_ip\": \"$PUBLIC_IP\"}" >> /tmp/validators-provisioned.json
}

# Create output file
echo "[]" > /tmp/validators-provisioned.json

# Launch all validators
for validator_num in 4 5 6 7; do
    eval "config=\$VALIDATOR_$validator_num"
    IFS=':' read -r region name ami <<< "$config"
    launch_instance $validator_num $region $name $ami
done

# Summary
echo ""
echo "========================================================================"
echo "✅ ALL 4 VALIDATORS PROVISIONED SUCCESSFULLY"
echo "========================================================================"
echo ""

# Parse and display results
cat /tmp/validators-provisioned.json | jq -s '.' | jq -r '.[] | "Validator \(.validator): \(.public_ip) (\(.region)) - \(.instance_id)"'

echo ""
echo "📋 Next Steps:"
echo "1. Upload genesis v2 to each validator"
echo "2. Upload validator keystores to each validator"
echo "3. Initialize validators with genesis"
echo "4. Start all 7 validators simultaneously"
echo ""
echo "💾 Validator info saved to: /tmp/validators-provisioned.json"
echo ""
echo "💰 Monthly Cost:"
echo "  - 4 new validators @ \$110/month each = \$440/month"
echo "  - Total (with existing 3) = \$770/month"
echo "========================================================================"
