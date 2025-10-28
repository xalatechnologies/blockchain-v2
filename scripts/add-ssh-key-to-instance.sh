#!/bin/bash
# Add your btcbr-key public key to the EC2 instance
# This allows SSH access with your existing key

set -e

INSTANCE_ID="i-0f7452bba70ca5542"
KEY_FILE="$HOME/.ssh/btcbr-key.pem"

echo "========================================="
echo "Add SSH Key to EC2 Instance"
echo "========================================="

# Generate public key from private key
echo -e "\n1. Generating public key from btcbr-key.pem..."
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ Key file not found: $KEY_FILE"
    exit 1
fi

PUBLIC_KEY=$(ssh-keygen -y -f "$KEY_FILE")
echo "✅ Public key generated"

# Create user data script to add the key
echo -e "\n2. Creating setup script..."
USER_DATA=$(cat << 'EOF'
#!/bin/bash
# Add new SSH public key to ec2-user
echo "PUBLIC_KEY_PLACEHOLDER" >> /home/ec2-user/.ssh/authorized_keys
chmod 600 /home/ec2-user/.ssh/authorized_keys
chown ec2-user:ec2-user /home/ec2-user/.ssh/authorized_keys
EOF
)

USER_DATA="${USER_DATA//PUBLIC_KEY_PLACEHOLDER/$PUBLIC_KEY}"

# Use AWS Systems Manager Run Command
echo -e "\n3. Adding key via EC2 Instance Connect..."
echo "$PUBLIC_KEY" | aws ec2-instance-connect send-ssh-public-key \
    --instance-id "$INSTANCE_ID" \
    --availability-zone us-east-1a \
    --instance-os-user ec2-user \
    --ssh-public-key file:///dev/stdin 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Key added successfully (temporary - 60 seconds)"
    echo ""
    echo "Now run: ./scripts/fix-ssh-access.sh"
else
    echo "⚠️  EC2 Instance Connect failed"
    echo ""
    echo "Manual method:"
    echo "1. Use AWS Console to connect via Session Manager"
    echo "2. Run: echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys"
    echo "3. Then retry SSH connection"
fi
