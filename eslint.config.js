// eslint.config.js
const { defineConfig } = require('eslint/config');
const globals = require('globals');
const { fixupPluginRules } = require('@eslint/compat');
const eslintPluginDiff = require('eslint-plugin-diff');

let stylistic;

const runESMImports = async () => {
  stylistic = await import('@stylistic/eslint-plugin').then((d) => d.default);
};

module.exports = runESMImports().then(() => defineConfig([
  // Global ignores - must be a standalone object with ONLY ignores
  {
    ignores: [
      '**/node_modules/**/*',
      '**/dist/**/*',
      '**/*.bru',
      'packages/coldbru-app/public/static/**/*',
      'packages/coldbru-app/.next/**/*',
      'packages/coldbru-electron/web/**/*'
    ]
  },
  {
    plugins: {
      'diff': fixupPluginRules(eslintPluginDiff),
      '@stylistic': stylistic
    },
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    files: [
      './eslint.config.js',
      'packages/coldbru-app/**/*.{js,jsx,ts}',
      'packages/coldbru-app/src/test-utils/mocks/codemirror.js',
      'packages/coldbru-electron/**/*.js'
    ],
    rules: {
      ...stylistic.configs.customize({
        indent: 2,
        quotes: 'single',
        semi: true,
        jsx: true
      }).rules,
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/curly-newline': ['error', {
        multiline: true,
        minElements: 2,
        consistent: true
      }],
      '@stylistic/function-paren-newline': ['off'],
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/arrow-spacing': ['error', { before: true, after: true }],
      '@stylistic/function-call-spacing': ['error', 'never'],
      '@stylistic/multiline-ternary': ['off'],
      '@stylistic/padding-line-between-statements': ['off'],
      '@stylistic/semi-style': ['error', 'last'],
      '@stylistic/max-len': ['off'],
      '@stylistic/jsx-one-expression-per-line': ['off'],
      '@stylistic/max-statements-per-line': ['off'],
      '@stylistic/no-mixed-operators': ['off']
    }
  },
  {
    files: ['packages/coldbru-app/**/*.{js,jsx,ts}'],
    ignores: ['**/*.config.js', '**/public/**/*'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        global: false,
        require: false,
        Buffer: false,
        process: false,
        ipcRenderer: false
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      'no-undef': 'error'
    }
  },
  {
    // It prevents lint errors when using CommonJS exports (module.exports) in Jest mocks.
    files: ['packages/coldbru-app/src/test-utils/mocks/codemirror.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      'no-undef': 'error'
    }
  },
  {
    // Storybook config files use CommonJS with __dirname and module.exports
    files: ['packages/coldbru-app/storybook/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-undef': 'error'
    }
  },
  {
    files: ['packages/coldbru-electron/**/*.js'],
    ignores: ['**/*.config.js', '**/web/**/*'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      'no-undef': 'error'
    }
  }
]));
