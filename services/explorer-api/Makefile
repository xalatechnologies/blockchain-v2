.PHONY: help install dev test lint build docker clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

test: ## Run tests
	npm test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-integration: ## Run integration tests
	npm run test:integration

lint: ## Run linter
	npm run lint

lint-fix: ## Fix linting issues
	npm run lint:fix

security: ## Run security audit
	npm run security:audit

coverage: ## Generate coverage report
	npm test -- --coverage

docs: ## Generate Swagger documentation
	npm run docs:generate

build: ## Build Docker image
	docker build -t norchain-api:latest .

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f api

health: ## Run health checks
	node scripts/health-check.js

test-api: ## Test API endpoints
	node scripts/test-api.js

clean: ## Clean build artifacts
	rm -rf node_modules coverage .nyc_output dist

all: install test lint security ## Run all checks
	@echo "✅ All checks passed!"

