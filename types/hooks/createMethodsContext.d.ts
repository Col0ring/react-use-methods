import React from 'react'
import useMethods, {
  CreateMethods,
  WrappedMethods,
  MethodTree,
} from './useMethods'
import { Key } from '../type'
declare type MethodsContextValue<
  S,
  MT extends MethodTree<S, Record<Key, (...args: any[]) => any>>
> = [S, WrappedMethods<MT>]
declare const createMethodsContext: <
  S extends Record<Key, any>,
  CM extends CreateMethods<
    S,
    MethodTree<S, Record<Key, (...args: any[]) => any>>
  >,
  MT extends ReturnType<CM>
>(
  createMethods: CM,
  defaultInitialValue: S,
  customUseMethods?: typeof useMethods | undefined
) => readonly [
  () => MethodsContextValue<S, MT>,
  React.FC<{
    initialValue?: S | undefined
  }>,
  <P>(
    WrapperComponent: React.ElementType<P>,
    options?:
      | {
          initialValue?: S | undefined
        }
      | undefined
  ) => React.FC<P>,
  React.Context<MethodsContextValue<S, MT>>
]
export type { MethodsContextValue }
export { createMethodsContext }
export default createMethodsContext
