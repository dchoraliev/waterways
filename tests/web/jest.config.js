module.exports = {
  displayName: 'web',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/**/*.test.ts', '<rootDir>/**/*.test.tsx'],
  rootDir: '.',
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // REMOVED globals section, moved to transform because it is deprecated in ts-jest v29 
  // and caused issues with ESM modules
  
  moduleNameMapper: {
    '^./supabaseEnv$': '<rootDir>/../../apps/web/src/services/supabaseEnv.node.ts',
    '^@waterways/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@waterways/shared$': '<rootDir>/../../packages/shared/src',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
          module: 'ESNext',
        },
      },
    ],
  },
  
  setupFiles: [
    '<rootDir>/../setup.ts'
  ],
  
  collectCoverageFrom: [
    '<rootDir>/../../apps/web/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};