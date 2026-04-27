export default {
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.test.json' }],
  },
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
  collectCoverageFrom: ['src/logic/**/*.ts'],
  coverageThreshold: {
    global: {
      statements: 80,
      lines: 80,
      functions: 80,
    },
  },
};
