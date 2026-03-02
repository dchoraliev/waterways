# Waterways Testing

All tests are located in the `/tests` directory, organized by project:

## Directory Structure

```
tests/
├── mobile/     # Mobile app tests (React Native/Expo)
├── web/        # Web app tests (React)
└── shared/     # Shared package tests (Node)
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests for specific project
npm run test:mobile
npm run test:web
npm run test:shared

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Writing Tests

### Mobile Tests

Place mobile app tests in `tests/mobile/`. These use `jest-expo` preset and can test React Native components.

### Web Tests

Place web app tests in `tests/web/`. These use `jsdom` environment and can test React components.

### Shared Tests

Place shared package tests in `tests/shared/`. These use Node environment for testing utilities, schemas, and shared logic.

## Configuration

Each test directory has its own `jest.config.js`:

- `tests/mobile/jest.config.js` - Mobile configuration
- `tests/web/jest.config.js` - Web configuration
- `tests/shared/jest.config.js` - Shared configuration

The root `jest.config.js` orchestrates all test projects.
