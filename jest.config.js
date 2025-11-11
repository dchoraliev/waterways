module.exports = {
  projects: [
    '<rootDir>/tests/mobile/jest.config.js',
    '<rootDir>/tests/web/jest.config.js',
    '<rootDir>/tests/shared/jest.config.js',
  ],
  collectCoverageFrom: [
    'apps/**/*.{ts,tsx}',
    'packages/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
