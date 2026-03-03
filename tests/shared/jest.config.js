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
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          types: ['jest', 'node'],
        },
      },
    ],
  },
  
  // REMOVED globals section because it is deprecated in ts-jest v29 
  // and caused issues with ESM modules
  
  collectCoverageFrom: [
    '<rootDir>/../../packages/shared/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};