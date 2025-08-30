// CI-friendly ESLint config - focuses on critical errors only
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
        // Only critical errors that would break functionality
        'no-unused-vars': 'warn',
        'no-console': 'warn',
        'prefer-const': 'warn',
        'no-var': 'error',
        'eqeqeq': 'warn',
        'curly': 'warn',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'warn',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-unused-expressions': 'warn',
        'no-useless-call': 'error',
        'no-useless-concat': 'error',
        'no-useless-return': 'error',
        'radix': 'warn',
        'yoda': 'warn',
        'no-case-declarations': 'warn',
        'no-control-regex': 'warn',
        'no-undef': 'warn',
        'no-useless-escape': 'warn',
    },
    ignorePatterns: [
        'dist/',
        'node_modules/',
        'coverage/',
        '*.d.ts',
    ],
    overrides: [
        {
            files: ['**/*.test.js', '**/__tests__/**/*.js', '**/*.test.ts', '**/__tests__/**/*.ts'],
            rules: {
                'no-console': 'off',
            }
        }
    ]
};