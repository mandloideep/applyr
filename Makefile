# Install all dependencies
install:
	pnpm install

# Development
dev:
	pnpm run --parallel --filter './apps/*' dev

dev-api:
	pnpm --filter @applyr/api dev

dev-web:
	pnpm --filter @applyr/web dev

dev-ext:
	pnpm --filter @applyr/extension dev

# Build
build:
	pnpm --filter @applyr/shared build
	pnpm --filter './apps/*' build

build-shared:
	pnpm --filter @applyr/shared build

build-api:
	pnpm --filter @applyr/api build

build-web:
	pnpm --filter @applyr/web build

build-ext:
	pnpm --filter @applyr/extension build

# Add dependencies (usage: make add-api PKG=express)
add-api:
	pnpm add $(PKG) --filter @applyr/api

add-web:
	pnpm add $(PKG) --filter @applyr/web

add-ext:
	pnpm add $(PKG) --filter @applyr/extension

add-shared:
	pnpm add $(PKG) --filter @applyr/shared

# Add dev dependencies (usage: make add-dev-api PKG=@types/express)
add-dev-api:
	pnpm add -D $(PKG) --filter @applyr/api

add-dev-web:
	pnpm add -D $(PKG) --filter @applyr/web

# Add to "Add dependencies" section:
add-ext:
	pnpm add $(PKG) --filter @applyr/extension

# Add to "Add dev dependencies" section:
add-dev-ext:
	pnpm add -D $(PKG) --filter @applyr/extension

lint:
	pnpm run --parallel --filter '*' lint

# Clean
clean:
	pnpm run --parallel --filter '*' clean
	rm -rf node_modules

# Typecheck
typecheck:
	pnpm run --parallel --filter '*' typecheck

# ===========================================
# Docker Compose Commands
# ===========================================

# Start all services (mongodb, backend, n8n, cloudflared)
up:
	docker compose up -d

# Start only development services (mongodb + backend)
up-dev:
	docker compose up -d mongodb backend

# Stop all services
down:
	docker compose down

# Rebuild and restart all services
rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

# Rebuild only backend
rebuild-api:
	docker compose build --no-cache backend
	docker compose up -d backend

# View logs for all services
logs:
	docker compose logs -f

# View logs for backend only
logs-api:
	docker compose logs -f backend

# Start only MongoDB
mongo:
	docker compose up -d mongodb

# Stop only MongoDB
mongo-stop:
	docker compose stop mongodb

# Clean MongoDB data (stop and delete volume)
mongo-clean:
	docker compose down -v mongodb
	@echo "MongoDB data volume deleted. Run 'make mongo' to start fresh."

# Shell into backend container
shell-api:
	docker exec -it applyr-backend sh

# Shell into MongoDB container
shell-mongo:
	docker exec -it applyr-mongo mongosh -u admin -p

.PHONY: install dev dev-api dev-web dev-ext build build-shared build-api build-web build-ext add-api add-web add-ext add-shared add-dev-api add-dev-web add-dev-ext lint clean typecheck up up-dev down rebuild rebuild-api logs logs-api mongo mongo-stop mongo-clean shell-api shell-mongo help

help:
	@echo "Makefile commands:"
	@echo ""
	@echo "Development:"
	@echo "  install           - Install all dependencies"
	@echo "  dev               - Start development for all apps"
	@echo "  dev-api           - Start development for API app (local, needs mongo running)"
	@echo "  dev-web           - Start development for Web app"
	@echo "  dev-ext           - Start development for Extension app"
	@echo ""
	@echo "Build:"
	@echo "  build             - Build all apps"
	@echo "  build-shared      - Build shared package"
	@echo "  build-api         - Build API app"
	@echo "  build-web         - Build Web app"
	@echo "  build-ext         - Build Extension app"
	@echo ""
	@echo "Dependencies:"
	@echo "  add-api PKG=      - Add dependency to API app"
	@echo "  add-web PKG=      - Add dependency to Web app"
	@echo "  add-ext PKG=      - Add dependency to Extension app"
	@echo "  add-shared PKG=   - Add dependency to shared package"
	@echo "  add-dev-api PKG=  - Add dev dependency to API app"
	@echo "  add-dev-web PKG=  - Add dev dependency to Web app"
	@echo "  add-dev-ext PKG=  - Add dev dependency to Extension app"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint              - Lint all packages"
	@echo "  typecheck         - Typecheck all packages"
	@echo "  clean             - Clean all build artifacts and node_modules"
	@echo ""
	@echo "Docker Compose:"
	@echo "  up                - Start all services (mongodb, backend, n8n)"
	@echo "  up-dev            - Start dev services (mongodb + backend)"
	@echo "  down              - Stop all services"
	@echo "  rebuild           - Rebuild and restart all services"
	@echo "  rebuild-api       - Rebuild and restart backend only"
	@echo "  logs              - View logs for all services"
	@echo "  logs-api          - View logs for backend only"
	@echo ""
	@echo "MongoDB:"
	@echo "  mongo             - Start only MongoDB"
	@echo "  mongo-stop        - Stop MongoDB"
	@echo "  mongo-clean       - Delete MongoDB data and start fresh"
	@echo "  shell-mongo       - Open MongoDB shell"
	@echo ""
	@echo "Containers:"
	@echo "  shell-api         - Shell into backend container"