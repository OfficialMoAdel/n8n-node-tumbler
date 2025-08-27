module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/__tests__'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    collectCoverageFrom: [
        'nodes/**/*.ts',
        'credentials/**/*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
    testTimeout: 30000,
};