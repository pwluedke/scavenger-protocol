import type { Config } from 'jest';

export default {
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.test.json' }],
  },
  testEnvironment: 'node',
} satisfies Config;
