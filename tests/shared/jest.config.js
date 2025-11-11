module.exports = {
  displayName: 'shared',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.test.ts'],
  rootDir: '.',
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@waterways/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    '<rootDir>/../../packages/shared/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        types: ['jest', 'node'],
      },
    },
  },
};
