const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');

/** @type {import('jest').Config} */
module.exports = {
  displayName: 'hype-e2e',
  rootDir: __dirname,
  roots: ['<rootDir>'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tier[1-4]/**/*.e2e.test.(ts|js)'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/helpers/', '<rootDir>/fixtures/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: [
    'node_modules',
    path.join(repoRoot, 'node_modules'),
    path.join(repoRoot, 'app/node_modules'),
    path.join(repoRoot, 'functions/node_modules'),
    path.join(repoRoot, 'admin/node_modules'),
  ],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/helpers/mocks/react-native.js',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: path.join(__dirname, 'tsconfig.e2e.json'),
        diagnostics: false,
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/helpers/jest.setup.ts'],
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  verbose: true,
};
