module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/lib/', '/dist/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
