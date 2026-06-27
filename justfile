default: dev

dev:
    npm run dev

start:
    npm run start

build:
    npm run build

test:
    npm run test

test-watch:
    npm run test:watch

lint:
    npm run lint

typecheck:
    npm run typecheck

ci:
    dagger call ci --source=.

ci-local: build lint test typecheck

# Docker

docker-up:
    docker compose up --build -d

docker-down:
    docker compose down

docker-logs:
    docker compose logs -f

docker-ps:
    docker compose ps

docker-db:
    docker compose exec db psql -U postgres notes_api

# Start everything (PostgreSQL + API) in background
up: docker-up

# Stop everything
down: docker-down
