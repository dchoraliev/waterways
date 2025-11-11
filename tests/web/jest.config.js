module.exports = {
  displayName: 'web',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/**/*.test.ts', '<rootDir>/**/*.test.tsx'],
  rootDir: '.',
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@waterways/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
        },
      },
    ],
  },
  collectCoverageFrom: [
    '<rootDir>/../../apps/web/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
