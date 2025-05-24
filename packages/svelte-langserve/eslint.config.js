import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import globals from 'globals';

const gitignorePath = fileURLToPath(new URL('../../.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...eslintPluginSvelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: { 
				...globals.browser,
				...globals.node
			}
		},
		rules: {
			'no-undef': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/build/**',
			'**/.svelte-kit/**',
			'**/coverage/**'
		]
	}
);