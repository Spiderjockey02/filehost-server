import tsPlugin from '@typescript-eslint/eslint-plugin';
import perfectionist from 'eslint-plugin-perfectionist';
import nextPlugin from '@next/eslint-plugin-next';
import tsParser from '@typescript-eslint/parser';

export default [
	{
		ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/src/types/generated/**'],
	},
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		plugins: {
			'@typescript-eslint': tsPlugin,
			'@next/next': nextPlugin,
			perfectionist,
		},
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 2021,
			sourceType: 'module',
			globals: {
				node: 'readonly',
			},
		},
		rules: {
			...nextPlugin.configs['core-web-vitals'].rules,
			'@typescript-eslint/no-unused-vars': ['error', {
				args: 'after-used',
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrors: 'all',
				caughtErrorsIgnorePattern: '^_',
				ignoreRestSiblings: true,
				destructuredArrayIgnorePattern: '^_',
			}],
			'perfectionist/sort-imports': [
				'error', { type: 'line-length', order: 'desc', groups: []	},
			],
			'perfectionist/sort-named-imports': [
				'error', { type: 'alphabetical', order: 'asc', ignoreCase: true },
			],
			'brace-style': ['error', '1tbs', { allowSingleLine: true }],
			'comma-dangle': ['error', 'always-multiline'],
			'comma-spacing': 'error',
			'comma-style': 'error',
			curly: ['error', 'multi-line', 'consistent'],
			'dot-location': ['error', 'property'],
			'handle-callback-err': 'off',
			indent: ['error', 'tab', { SwitchCase: 1 }],
			'max-nested-callbacks': ['error', { max: 6 }],
			'max-statements-per-line': ['error', { max: 2 }],
			'no-unused-vars': 'off',
			'no-console': 'off',
			'no-empty-function': 'error',
			'no-floating-decimal': 'error',
			'no-inline-comments': 'error',
			'no-lonely-if': 'error',
			'no-multi-spaces': 'error',
			'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],
			'no-shadow': ['error', { allow: ['err', 'resolve', 'reject'] }],
			'no-trailing-spaces': 'error',
			'no-var': 'error',
			'object-curly-spacing': ['error', 'always'],
			'prefer-const': 'error',
			quotes: ['error', 'single'],
			semi: ['error', 'always'],
			'space-before-blocks': 'error',
			'space-before-function-paren': [
				'error',
				{
					anonymous: 'never',
					named: 'never',
					asyncArrow: 'always',
				},
			],
			'space-in-parens': 'error',
			'space-infix-ops': 'error',
			'space-unary-ops': 'error',
			'spaced-comment': 'error',
			yoda: 'error',
		},
	},
];
