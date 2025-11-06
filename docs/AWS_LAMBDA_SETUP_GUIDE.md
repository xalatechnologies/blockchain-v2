# AWS Lambda Setup Guide - NOR Price Monitoring

**Cost**: ~$0.50/month
**Setup Time**: 30 minutes
**Reliability**: ⭐⭐⭐⭐

---

## 🎯 WHAT YOU'LL GET

- ✅ Automated price monitoring every hour
- ✅ Checks BSC vs NorChain prices
- ✅ Alerts when rebalancing needed (>10% deviation)
- ✅ Logs all price checks
- ✅ Manual trigger endpoint available
- ✅ Costs < $1/month

---

## 📋 PREREQUISITES

1. **AWS Account** (free tier eligible)
   - Sign up: https://aws.amazon.com/free

2. **AWS CLI** (optional but recommended)
   ```bash
   brew install awscli  # macOS
   # OR
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

3. **Serverless Framework**
   ```bash
   npm install -g serverless
   ```

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### Step 1: Configure AWS Credentials

```bash
# Get your AWS Access Key & Secret from AWS Console
# IAM -> Users -> Your User -> Security Credentials -> Create Access Key

serverless config credentials \
  --provider aws \
  --key YOUR_ACCESS_KEY \
  --secret YOUR_SECRET_KEY
```

**Alternative** (AWS CLI):
```bash
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)
```

---

### Step 2: Test Locally (Optional)

```bash
# Install dev dependencies
npm install --save-dev serverless-offline

# Run locally
serverless offline

# Test function
curl http://localhost:3000/check-price
```

---

### Step 3: Deploy to AWS

```bash
# Deploy everything
serverless deploy

# Output will show:
# ✓ Service deployed to stack nor-price-monitor-prod
# endpoint: GET - https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/check-price
# functions:
#   priceMonitor: nor-price-monitor-prod-priceMonitor
#   manualCheck: nor-price-monitor-prod-manualCheck
```

**That's it!** Your bot is now running in the cloud! 🎉

---

### Step 4: Verify Deployment

```bash
# Check logs
serverless logs -f priceMonitor -t

# Manual trigger
serverless invoke -f priceMonitor

# Or via HTTP
curl https://YOUR_API_ENDPOINT/check-price
```

---

## 📊 MONITORING & MANAGEMENT

### View Logs

```bash
# Real-time logs
serverless logs -f priceMonitor --tail

# Last 1000 lines
serverless logs -f priceMonitor --startTime 1h
```

### Check Function Status

```bash
# List all functions
serverless info

# Check metrics
serverless metrics
```

### Manual Price Check

```bash
# Trigger immediately
serverless invoke -f priceMonitor

# Or via HTTP endpoint
curl https://YOUR_ENDPOINT/check-price
```

---

## 💰 COST BREAKDOWN

**Free Tier** (First 12 months):
- 1 million requests/month: FREE
- 400,000 GB-seconds compute: FREE

**After Free Tier**:
- Requests: $0.20 per 1M requests
- Compute: $0.0000166667 per GB-second

**Your Usage**:
- 720 checks/month (hourly)
- ~2 seconds per check
- 256MB memory

**Monthly Cost**: ~$0.12-0.50

**Total First Year**: ~$0 (free tier)
**After Year 1**: ~$6/year

---

## 🔒 SECURITY BEST PRACTICES

### 1. Environment Variables

Never commit private keys! Use AWS Systems Manager:

```bash
# Store private key in AWS Parameter Store
aws ssm put-parameter \
  --name /nor-monitor/private-key \
  --value "YOUR_PRIVATE_KEY" \
  --type SecureString

# Update serverless.yml
environment:
  MAIN_WALLET_PRIVATE_KEY: ${ssm:/nor-monitor/private-key}
```

### 2. IAM Permissions

Create minimal IAM role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. API Gateway Auth

Add API key requirement:
```yaml
# serverless.yml
functions:
  manualCheck:
    events:
      - http:
          path: check-price
          method: get
          private: true  # Requires API key
```

---

## 🔧 TROUBLESHOOTING

### Issue: "Cannot find module 'ethers'"

**Fix**: Ensure ethers is in dependencies (not devDependencies)
```bash
npm install ethers --save
```

### Issue: Lambda timeout

**Fix**: Increase timeout in serverless.yml
```yaml
provider:
  timeout: 120  # 2 minutes
```

### Issue: RPC connection fails

**Fix**: Check if RPC URLs are accessible from AWS
```bash
# Test from AWS Lambda environment
serverless invoke -f priceMonitor --log
```

### Issue: High costs

**Fix**: Check invocation frequency
```bash
# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=nor-price-monitor-prod-priceMonitor \
  --start-time 2025-11-01T00:00:00Z \
  --end-time 2025-11-06T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

---

## 📈 SCALING UP

### Add Alerting (SNS)

```yaml
# serverless.yml
functions:
  priceMonitor:
    events:
      - schedule:
          rate: rate(1 hour)
    destinations:
      onFailure: arn:aws:sns:us-east-1:123456789:alerts

resources:
  Resources:
    AlertTopic:
      Type: AWS::SNS::Topic
      Properties:
        DisplayName: NOR Price Alerts
        Subscription:
          - Endpoint: your-email@example.com
            Protocol: email
```

### Add DynamoDB for History

```yaml
resources:
  Resources:
    PriceHistoryTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: nor-price-history
        AttributeDefinitions:
          - AttributeName: timestamp
            AttributeType: N
        KeySchema:
          - AttributeName: timestamp
            KeyType: HASH
        BillingMode: PAY_PER_REQUEST
```

---

## 🎯 ALTERNATIVE: ONE-CLICK DEPLOY

### AWS SAM Template

```bash
# Install SAM CLI
brew install aws-sam-cli

# Deploy with one command
sam deploy --guided
```

### Terraform (Infrastructure as Code)

```hcl
# main.tf
resource "aws_lambda_function" "price_monitor" {
  filename      = "lambda.zip"
  function_name = "nor-price-monitor"
  role          = aws_iam_role.lambda_role.arn
  handler       = "scripts/lambda-handler.handler"
  runtime       = "nodejs20.x"
}
```

---

## 📋 DEPLOYMENT CHECKLIST

Before deploying:
- [ ] AWS account created
- [ ] AWS CLI configured
- [ ] Serverless framework installed
- [ ] Private key secured (not in code)
- [ ] RPC URLs tested
- [ ] Free tier limits checked

After deploying:
- [ ] Function logs checked
- [ ] Manual test successful
- [ ] Scheduled execution working
- [ ] Alerts configured (optional)
- [ ] Cost monitoring set up

---

## 🚀 DEPLOY NOW

```bash
# Quick deploy
serverless deploy

# Watch it work
serverless logs -f priceMonitor --tail
```

**Estimated deployment time**: 2-3 minutes

**Cost**: $0 (free tier) or < $1/month

**Maintenance**: Zero (serverless!)

---

## 📞 SUPPORT

**Serverless Framework**: https://www.serverless.com/framework/docs
**AWS Lambda**: https://docs.aws.amazon.com/lambda
**Community**: https://forum.serverless.com

---

**Ready to deploy? Run `serverless deploy` now!** 🚀
