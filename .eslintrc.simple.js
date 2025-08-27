// Simplified ESLint config for CI/CD environments
module.exports = {
    env: {
        node: true,
        es2020: true,
        jest: true,
    },
    extends: [
        'eslint:recommended',
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    rules: {
        // Basic code quality rules
        'no-unused-vars': 'error',
        'no-console': 'warn',
        'prefer-const': 'error',
        'no-var': 'error',
        'eqeqeq': 'error',
        'curly': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-unused-expressions': 'error',
        'no-useless-call': 'error',
        'no-useless-concat': 'error',
        'no-useless-return': 'error',
        'radix': 'error',
        'yoda': 'error',
    },
    ignorePatterns: [
        'dist/',
        'node_modules/',
        'coverage/',
        '*.d.ts',
    ],
    overrides: [
        {
            files: ['**/*.test.js', '**/__tests__/**/*.js'],
            rules: {
                'no-console': 'off',
            }
        }
    ]
};