module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  plugins: ['react', '@typescript-eslint', 'jsx-a11y', 'security'],
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // Security rules
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'warn',
    'security/detect-buffer-noassert': 'error',
    'security/detect-eval-with-expression': 'error',
    
    // React rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // We're using TypeScript
    
    // TypeScript rules
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_', 
      'varsIgnorePattern': '^_' 
    }],
    
    // General rules
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        // Relax rules for test files
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    },
    {
      files: ['scripts/**/*.js'],
      rules: {
        // Node.js scripts have different requirements
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ]
};
