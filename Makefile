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

.PHONY: install dev dev-api dev-web dev-ext build build-shared build-api build-web build-ext add-api add-web add-ext add-shared add-dev-api add-dev-web add-dev-ext lint clean typecheck help

help:
	@echo "Makefile commands:"
	@echo "  install           - Install all dependencies"
	@echo "  dev               - Start development for all apps"
	@echo "  dev-api           - Start development for API app"
	@echo "  dev-web           - Start development for Web app"
	@echo "  dev-ext           - Start development for Extension app"
	@echo "  build             - Build all apps"
	@echo "  build-shared     - Build shared package"
	@echo "  build-api        - Build API app"
	@echo "  build-web        - Build Web app"
	@echo "  build-ext        - Build Extension app"
	@echo "  add-api PKG=     - Add dependency to API app"
	@echo "  add-web PKG=     - Add dependency to Web app"
	@echo "  add-ext PKG=     - Add dependency to Extension app"
	@echo "  add-shared PKG=  - Add dependency to shared package"
	@echo "  add-dev-api PKG= - Add dev dependency to API app"
	@echo "  add-dev-web PKG= - Add dev dependency to Web app"
	@echo "  add-dev-ext PKG= - Add dev dependency to Extension app"
	@echo "  lint              - Lint all packages"
	@echo "  clean             - Clean all build artifacts and node_modules"
	@echo "  typecheck        - Typecheck all packages"