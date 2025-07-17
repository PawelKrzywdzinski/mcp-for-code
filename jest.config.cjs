module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverage: false,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs'
      }
    }]
  },
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
};