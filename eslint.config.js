import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    // Aplica esta configuración a todos los archivos TypeScript
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Activa las reglas recomendadas de TypeScript
      ...tsPlugin.configs.recommended.rules,
      // Añade tus reglas personalizadas aquí
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Desactiva las reglas de ESLint que entren en conflicto con Prettier
  eslintConfigPrettier,
];

