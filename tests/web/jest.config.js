module.exports = {
  displayName: 'web',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/**/*.test.ts', '<rootDir>/**/*.test.tsx'],
  rootDir: '.',
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
        module: 'ESNext',
      },
    },
  },
  moduleNameMapper: {
    '^./supabaseEnv$': '<rootDir>/../../apps/web/src/services/supabaseEnv.node.ts',
    '^@waterways/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@waterways/shared$': '<rootDir>/../../packages/shared/src',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {},
  setupFiles: ['<rootDir>/../setup.ts'],
  collectCoverageFrom: [
    '<rootDir>/../../apps/web/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
