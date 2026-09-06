import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import storybook from 'eslint-plugin-storybook';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/storybook-static/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      // Generated from the TypeScript token source. CI checks it is current
      // with `npm run tokens:check` rather than linting it.
      'packages/ui/src/styles/tokens.css',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      /*
       * The accessibility rules are errors, not warnings.
       *
       * They catch the static half of the problem: a label with no control, an
       * aria-* attribute that does not exist on that role, an interactive
       * element with no keyboard handler. axe catches the rendered half. A
       * warning here is a rule nobody will ever act on.
       */
      ...jsxA11y.flatConfigs.recommended.rules,

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  {
    // Stories and tests demonstrate and assert; console output and non-null
    // assertions are part of doing that clearly.
    // Stories and tests demonstrate and assert. The token scripts are CLIs
    // whose entire output is stdout, so console is the interface, not a leak.
    files: [
      '**/*.stories.tsx',
      '**/*.test.{ts,tsx}',
      'e2e/**/*.ts',
      'packages/ui/src/tokens/generate.ts',
      'packages/ui/src/tokens/contrast.ts',
    ],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  ...storybook.configs['flat/recommended'],

  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
);
