module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    '@vue/eslint-config-typescript',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
  },
  rules: {
    // ── TypeScript ──
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',

    // ── JavaScript 通用 ──
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'eqeqeq': ['warn', 'always'],
    'curly': ['warn', 'multi-line'],
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-unused-expressions': ['warn', { allowShortCircuit: true, allowTernary: true }],

    // ── Vue Template ──
    'vue/multi-word-component-names': 'off',
    'vue/component-name-in-template-casing': ['warn', 'PascalCase', { registeredComponentsOnly: true }],
    'vue/attribute-hyphenation': ['warn', 'always', { ignore: [] }],
    'vue/no-unused-refs': 'warn',
  },
  overrides: [
    {
      files: ['*.config.js', '*.config.ts', '*.config.cjs'],
      env: { node: true },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['scripts/**'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['src/api/generated/**', 'src/api/index-generated.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['tests/**', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
}
