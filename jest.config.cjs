module.exports = {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'backend.js',
    'src/**/*.js',
    '!src/**/*.test.js',
    '!node_modules/**',
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testTimeout: 60000, // 60s for API calls
};
