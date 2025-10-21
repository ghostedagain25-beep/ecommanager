// ESLint flat config for client (ESLint v9+)
import ts from 'typescript-eslint';
import react from 'eslint-plugin-react';

export default [
  // Only apply to TS/TSX source files
  ...ts.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.config.js',
      'vite.config.ts',
      'stylelint.config.js',
      'postcss.config.js',
      'tailwind.config.js',
    ],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: ts.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: false,
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
      },
    },
    plugins: { react },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];
