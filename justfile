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

ci-local:
    @just _ensure-db
    @just build lint test typecheck
    @just _stop-db

# Starts the PostgreSQL container and waits for it to be ready
_ensure-db:
    docker compose up -d db
    @echo "Waiting for PostgreSQL..."
    @sh -c 'while ! docker compose exec -T db pg_isready -U postgres 2>/dev/null; do sleep 1; done'
    @echo "PostgreSQL is ready"
    -docker compose exec -T db psql -U postgres -c "CREATE DATABASE notes_api_test;" 2>/dev/null

# Stops the database container
_stop-db:
    docker compose rm -sf db

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
