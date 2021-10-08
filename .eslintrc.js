const prettierConfig = require('./prettier.config')

module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'eslint-config-ali/react',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.tsx', '.ts', '.js', '.json'],
      },
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
        js: 'never',
      },
    ],
    'react/jsx-filename-extension': [
      'off',
      { extensions: ['.tsx', 'ts', '.jsx', 'js'] },
    ],
    'prettier/prettier': ['warn', prettierConfig],
    strict: 'off',
    'no-debugger': 'warn', // 调试
    'no-console': 'off', // 日志打印
    'react/prop-types': 'off', // react props声明检测
    // 'react-hooks/exhaustive-deps': 'off', // react-hooks必须声明依赖
    'no-nested-ternary': 'off', // 禁止嵌套三元表达式
    'react/no-array-index-key': 'off', // 数组不能用index相关为key
    'react/no-did-mount-set-state': 'off', // 禁止在didMount中使用setState
    'global-require': 'off', // 单独需要；必须使用来自文件系统的信息进行初始化的模块，或者仅在非常罕见的情况下使用模块，并且会导致大量的加载开销时关闭
    'require-yield': 'warn', // 单独需要；不允许generate函数中没有yield
    'no-useless-escape': 'off', // 单独需要； 禁止不必要的转义使用,
    'no-unused-vars': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-useless-constructor': 'off',
    '@typescript-eslint/no-empty-function': 'warn',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-param-reassign': 'off',
  },
  plugins: ['prettier', 'react', '@typescript-eslint'],
  globals: {
    walle: 'readable',
    React: 'readable',
    goldlog: 'readable',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // use @typescript-eslint/no-shadow
        'no-shadow': ['off'],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-var-requires': 'warn',
      },
    },
  ],
}
