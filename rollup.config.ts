import { defineConfig, RollupOptions } from 'rollup'
import babel from '@rollup/plugin-babel'
import dts from 'rollup-plugin-dts'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import path from 'path'
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import json from '@rollup/plugin-json'
import eslint from 'rollup-plugin-eslint2'
import del from 'rollup-plugin-delete'
import pkg from './package.json'

const extensions = ['.ts', '.js', '.json']
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
].filter((f) => f !== 'tslib')

export default defineConfig([
  {
    input: path.resolve(__dirname, './packages/index.ts'),
    external,
    plugins: [
      json(),
      commonjs(),
      resolve({
        extensions,
      }),
      eslint({
        include: [path.resolve(__dirname, './packages/**')],
      }),
      babel({
        extensions,
        exclude: /node_modules/,
        babelHelpers: 'runtime',
      }),
      terser(),
      typescript({
        tsconfig: path.resolve(__dirname, './tsconfig-package.json'),
      }),
      // 删除目录
      del({
        targets: [path.resolve(__dirname, './dist')],
      }),
    ],
    output: [
      {
        file: pkg.module,
        format: 'esm',
      },
      {
        file: pkg.main,
        format: 'cjs',
        exports: 'auto',
      },
    ],
  },
  // dts
  {
    input: path.resolve(__dirname, './packages/index.ts'),
    external,
    output: [
      {
        file: pkg.typings,
        format: 'es',
      },
    ],
    plugins: [dts()],
  },
] as RollupOptions[])
