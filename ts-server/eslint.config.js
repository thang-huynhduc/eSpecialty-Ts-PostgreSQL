// eslint.config.js
import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'

/** @type {import('eslint').Linter.Config[]} */
export default [
  // 1. Thay thế cho file .eslintignore cũ
  {
    ignores: ['dist', 'node_modules', 'coverage']
  },

  // 2. Cấu hình cho toàn bộ file code
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2020 },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' }
    }
  },

  // 3. Load các bộ luật chuẩn (Recommended)
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // 4. BỘ LUẬT RIÊNG CỦA ĐẠI CA (Đã map sang đây)
  {
    rules: {
      // Tắt rule js cũ để tránh xung đột với ts
      'no-unused-vars': 'off',
      'no-undef': 'off', // TS tự check cái này rồi nên tắt bên ESLint đi cho đỡ lỗi ảo

      // Rule của TS
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'no',

      // Các rules đại ca yêu cầu
      'no-useless-catch': 0,
      'no-console': 1,
      'no-extra-boolean-cast': 0,
      'no-lonely-if': 1,
      'no-trailing-spaces': 1,
      'no-multi-spaces': 1,
      'no-multiple-empty-lines': 1,
      'space-before-blocks': ['error', 'always'],
      'object-curly-spacing': [1, 'always'],
      'indent': ['warn', 2],
      'semi': [1, 'never'],
      'quotes': ['error', 'single'],
      'array-bracket-spacing': 1,
      'linebreak-style': 0,
      'no-unexpected-multiline': 'warn',
      'keyword-spacing': 1,
      'comma-dangle': 1,
      'comma-spacing': 1,
      'arrow-spacing': 1
    }
  }
]
