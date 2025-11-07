# Performance Testing

## Setup

Install k6:
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

## Running Tests

```bash
# Run load test
npm run test:performance

# Run with custom URL
BASE_URL=https://nex.norchain.org npm run test:performance
```

## Test Scenarios

1. **Load Test** (`load-test.js`)
   - Ramp up to 150 concurrent users
   - Test quote API endpoint
   - Test prices API endpoint
   - Measure response times and error rates

2. **Stress Test** (`stress-test.js`)
   - Test system limits
   - Find breaking points
   - Measure recovery time

3. **Spike Test** (`spike-test.js`)
   - Sudden traffic spikes
   - Test system resilience

## Metrics

- **Response Time**: p50, p95, p99 percentiles
- **Error Rate**: Percentage of failed requests
- **Throughput**: Requests per second
- **Concurrent Users**: Number of simultaneous users

## Thresholds

- 95% of requests should complete in < 500ms
- Error rate should be < 1%
- System should handle 150+ concurrent users

