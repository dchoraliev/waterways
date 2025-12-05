module.exports = {
  displayName: 'mobile',
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/**/*.test.ts', '<rootDir>/**/*.test.tsx'],
  rootDir: '.',

  moduleNameMapper: {
    // mobile src alias
    '^@waterways/mobile/src/(.*)$': '<rootDir>/../../apps/mobile/src/$1',

    // shared src alias
    '^@waterways/shared/src/(.*)$': '<rootDir>/../../packages/shared/src/$1',

    // generic apps alias (if you need it)
    '^apps/(.*)$': '<rootDir>/../../apps/$1',
  },

  transform: {
    '^.+\\.(js|ts|tsx)$': [
      'babel-jest',
      {
        presets: ['babel-preset-expo'],
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    '<rootDir>/../../apps/mobile/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
      },
    },
  },
};
