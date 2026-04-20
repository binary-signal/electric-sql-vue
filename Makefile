.PHONY: help install dev build test lint format format-check clean pack publish
.DEFAULT_GOAL := help

help: ## Show this help message
	@printf '\nUsage: make [target]\n\n'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@printf '\n'

install: ## Install dependencies
	pnpm install

dev: ## Start playground dev server
	pnpm dev

build: ## Build library (ESM + CJS + types)
	pnpm build

test: ## Run tests
	pnpm vitest run

lint: ## Lint source with oxlint
	pnpm lint

format: ## Format code with oxfmt
	pnpm fmt

format-check: ## Check formatting without writing
	pnpm fmt:check

clean: ## Remove dist and node_modules
	rm -rf dist node_modules

pack: ## Preview package contents (dry run)
	pnpm pack --dry-run

publish: ## Publish to npm with provenance
	pnpm publish --provenance
