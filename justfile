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
