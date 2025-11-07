# Nor Chain Explorer API v2

Production-ready REST API built with **NestJS**, **TypeScript**, and enterprise patterns.

## 🏗️ Architecture

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Authentication**: JWT + API Keys
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **Testing**: Jest

## ✨ Features

- ✅ **Type Safety** - Full TypeScript with strict mode
- ✅ **SOLID Principles** - Clean architecture
- ✅ **Repository Pattern** - Data access abstraction
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **API Key Support** - Alternative authentication
- ✅ **Redis Caching** - High-performance caching
- ✅ **Rate Limiting** - Built-in throttling
- ✅ **Input Validation** - DTOs with class-validator
- ✅ **Error Handling** - Global exception filters
- ✅ **Logging** - Structured logging with Winston
- ✅ **Health Checks** - Kubernetes-ready probes
- ✅ **Swagger Docs** - Auto-generated API docs

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run migration:run

# Start development server
npm run start:dev

# Access Swagger docs
open http://localhost:3000/api-docs
```

## 📁 Project Structure

```
src/
├── common/              # Shared utilities
│   ├── decorators/     # Custom decorators
│   ├── filters/        # Exception filters
│   ├── guards/          # Auth guards
│   ├── interceptors/   # Request/response interceptors
│   ├── interfaces/      # TypeScript interfaces
│   ├── pipes/           # Validation pipes
│   ├── repositories/    # Base repository
│   └── services/        # Shared services
├── config/              # Configuration
├── modules/             # Feature modules
│   ├── auth/           # Authentication
│   ├── account/        # Account operations
│   ├── transaction/    # Transactions
│   ├── block/          # Blocks
│   ├── token/          # Tokens
│   ├── contract/       # Contracts
│   ├── stats/           # Statistics
│   ├── health/          # Health checks
│   ├── indexer/         # Blockchain indexer
│   └── ledger/          # Ledger system
└── main.ts              # Application entry point
```

## 🔐 Authentication

### JWT Token

```bash
# Register
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "password123"
}

# Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Use token
Authorization: Bearer <token>
```

### API Key

```bash
# Create API key (requires JWT)
POST /api/v1/auth/api-keys
Authorization: Bearer <jwt-token>
{
  "name": "My API Key",
  "scopes": ["read", "write"]
}

# Use API key
X-API-Key: <api-key>
```

## 📚 API Documentation

Swagger UI available at: `http://localhost:3000/api-docs`

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🐳 Docker

```bash
docker-compose up -d
```

## 📝 Environment Variables

See `.env.example` for required variables.

## 🎯 SOLID Principles

- **S**ingle Responsibility - Each module has one responsibility
- **O**pen/Closed - Open for extension, closed for modification
- **L**iskov Substitution - Proper inheritance
- **I**nterface Segregation - Focused interfaces
- **D**ependency Inversion - Depend on abstractions

## 🔒 Security

- JWT authentication
- API key authentication
- Rate limiting
- Input validation
- SQL injection protection (TypeORM)
- XSS protection (Helmet)
- CORS configuration

## 📈 Performance

- Redis caching
- Database indexing
- Connection pooling
- Query optimization
- Response compression

---

**Built with ❤️ using NestJS and TypeScript**

