module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
    ],
    rules: {
        // Basic ESLint rules
        'no-unused-vars': 'off',
        'no-console': 'warn',
        'prefer-const': 'error',
        'no-var': 'error',

        // TypeScript rules (basic ones that don't require full @typescript-eslint/recommended)
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/prefer-as-const': 'error',
    },
    env: {
        node: true,
        es2020: true,
        jest: true,
    },
    ignorePatterns: [
        'dist/',
        'node_modules/',
        'coverage/',
        '*.js',
        '!.eslintrc.js',
        '!jest.config.js',
        '!gulpfile.js'
    ],
    overrides: [
        {
            files: ['**/*.ts'],
            rules: {
                // TypeScript-specific rules for .ts files
                '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            }
        },
        {
            files: ['**/*.test.ts', '**/__tests__/**/*.ts'],
            rules: {
                // Relaxed rules for test files
                '@typescript-eslint/no-explicit-any': 'off',
                'no-console': 'off',
            }
        }
    ]
};