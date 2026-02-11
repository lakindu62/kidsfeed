import prettier from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        node: true,
        es2021: true,
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      eqeqeq: 'error',
      curly: 'error',
    },
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '.env',
      '.env.*',
      'logs/',
      '*.log',
      'npm-debug.log*',
      'package-lock.json',
      'yarn.lock',
      '.cache/',
      '.eslintcache',
      'tmp/',
      'temp/',
      '.DS_Store',
      'Thumbs.db',
    ],
  },
];
