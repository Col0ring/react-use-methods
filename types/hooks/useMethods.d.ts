import React, { Reducer, useReducer } from 'react'
import { Key } from '../type'

interface Action<T extends Key, S> {
  type: T
  payload: any[]
  resolvedState?: S
  dispatch?: React.Dispatch<Action<T, S>>
  [props: string]: any
}
interface MethodAction<T extends Key, M extends (...args: any[]) => any> {
  type: T
  dispatch: React.Dispatch<any>
  payload: Parameters<M>
  [props: string]: any
}
declare type Method<K extends Key, M extends (...args: any[]) => any, S> = (
  ...args: any[]
) => S | Promise<S> | ((action: MethodAction<K, M>) => void)
declare type MethodTree<S, MT extends Record<Key, (...args: any[]) => any>> = {
  [K in keyof MT]: Method<K, MT[K], S>
}
declare type CreateMethodsReturn<S, MT> =
  | MT
  | [
      methods: MT,
      effects?: Partial<
        {
          [P in keyof S]: (
            dispatch: React.Dispatch<any>,
            newValue: S[P],
            oldValue: S[P]
          ) => void
        }
      >
    ]
declare type GetMethodTree<
  CMR extends CreateMethodsReturn<
    Record<Key, any>,
    Record<Key, (...args: any[]) => any>
  >
> = CMR extends CreateMethodsReturn<Record<Key, any>, infer MT> ? MT : CMR
declare type CreateMethods<
  S,
  MT extends MethodTree<S, Record<Key, (...args: any[]) => any>> = MethodTree<
    S,
    Record<Key, (...args: any[]) => any>
  >
> = (state: S) => CreateMethodsReturn<S, MT>
declare type WrappedMethods<
  CMR extends CreateMethodsReturn<
    Record<Key, any>,
    Record<Key, (...args: any[]) => any>
  >,
  MT extends MethodTree<
    Record<Key, any>,
    Record<Key, (...args: any[]) => any>
  > = GetMethodTree<CMR>
> = {
  [K in keyof MT]: (...payload: Parameters<MT[K]>) => void
}
interface UseMethodsOptions<S, A> {
  reducerMapper?: (reducer: Reducer<S, A>) => Reducer<S, A>
  customUseReducer?: typeof useReducer
}
declare function useMethods<
  S extends Record<Key, any>,
  CM extends CreateMethods<S>,
  MT extends GetMethodTree<ReturnType<CM>>
>(
  createMethods: CM,
  initialState: S,
  useMethodsOptions?: UseMethodsOptions<S, Action<keyof MT, S>>
): [S, WrappedMethods<MT>]
export type {
  Action,
  MethodAction,
  CreateMethods,
  WrappedMethods,
  Method,
  MethodTree,
  UseMethodsOptions,
  GetMethodTree,
}
export { useMethods }
export default useMethods
