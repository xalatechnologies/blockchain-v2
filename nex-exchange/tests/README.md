# Testing Documentation

## Test Structure

```
tests/
├── performance/          # Performance/load tests (k6)
│   ├── load-test.js
│   └── README.md
├── security/             # Security tests
│   ├── security-audit.js
│   └── penetration-test.js
└── integration/         # Integration tests
    └── api.test.ts

src/__tests__/           # Unit tests (Jest)
├── components/          # Component tests
├── hooks/               # Hook tests
├── lib/                 # Utility tests
└── api/                 # API route tests

e2e/                     # E2E tests (Playwright)
└── *.spec.ts
```

## Running Tests

### Unit Tests
```bash
npm run test              # Run all unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:ci           # CI mode (no watch, coverage)
```

### Integration Tests
```bash
npm run test              # Included in Jest
```

### E2E Tests
```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Playwright UI mode
npm run test:e2e:debug    # Debug mode
```

### Performance Tests
```bash
npm run test:performance  # Run k6 load tests
```

### Security Tests
```bash
npm run test:security     # Run all security tests
```

### All Tests
```bash
npm run test:all          # Run everything
```

## Coverage Goals

- **100% coverage** for all code
- Branches: 100%
- Functions: 100%
- Lines: 100%
- Statements: 100%

## Test Types

### Unit Tests
- Test individual functions and components in isolation
- Mock external dependencies
- Fast execution
- High coverage

### Integration Tests
- Test API routes end-to-end
- Test component interactions
- Use real dependencies where possible

### E2E Tests
- Test complete user flows
- Test in real browser environment
- Test across different devices/browsers

### Performance Tests
- Load testing (gradual ramp-up)
- Stress testing (find limits)
- Spike testing (sudden traffic)

### Security Tests
- Penetration testing
- Vulnerability scanning
- Input validation testing
- Rate limiting verification

## Writing Tests

### Component Test Example
```typescript
import { render, screen } from "@testing-library/react";
import { Component } from "@/components/Component";

describe("Component", () => {
  it("should render correctly", () => {
    render(<Component />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Hook Test Example
```typescript
import { renderHook } from "@testing-library/react";
import { useHook } from "@/hooks/useHook";

describe("useHook", () => {
  it("should return expected value", () => {
    const { result } = renderHook(() => useHook());
    expect(result.current).toBeDefined();
  });
});
```

### API Test Example
```typescript
import { POST } from "@/app/api/endpoint/route";

describe("POST /api/endpoint", () => {
  it("should handle request", async () => {
    const request = new NextRequest("http://localhost/api/endpoint", {
      method: "POST",
      body: JSON.stringify({ data: "test" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

## CI/CD Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Before deployment

See `.github/workflows/ci.yml` for configuration.

