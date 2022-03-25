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

const reducers = ['immer']

const reducersOptions = reducers.reduce((options, reducer, i) => {
  options.push(
    {
      input: path.resolve(__dirname, `./packages/reducer-mapper/${reducer}.ts`),
      external,
      plugins: [
        json(),
        eslint({
          include: [
            path.resolve(__dirname, `./packages/reducer-mapper/${reducer}.ts`),
          ],
        }),
        typescript({
          tsconfig: path.resolve(__dirname, './tsconfig-reducer.json'),
        }),
        commonjs(),
        resolve({
          extensions,
        }),
        babel({
          extensions,
          exclude: /node_modules/,
          babelHelpers: 'runtime',
        }),
        terser(),
        ...(i === 0
          ? [
              del({
                targets: [path.resolve(__dirname, './reducer-mapper')],
              }),
            ]
          : []),
      ],
      output: [
        {
          file: `./reducer-mapper/${reducer}/index.esm.js`,
          format: 'esm',
        },
        {
          file: `./reducer-mapper/${reducer}/index.cjs.js`,
          format: 'cjs',
          exports: 'auto',
        },
      ],
    },
    // dts
    {
      input: path.resolve(__dirname, `./packages/reducer-mapper/${reducer}.ts`),
      external,
      output: [
        {
          file: `./reducer-mapper/${reducer}/index.d.ts`,
          format: 'es',
        },
      ],
      plugins: [dts()],
    }
  )
  return options
}, [] as RollupOptions[])

export default defineConfig(reducersOptions)
