import React, { Reducer, useMemo, useReducer } from 'react'
import { resolvePromise } from '../utils'
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
  // 用于中间件的操作
  dispatch: React.Dispatch<any>
  payload: Parameters<M>
  [props: string]: any
}

type Method<K extends Key, M extends (...args: any[]) => any, S> = (
  ...args: any[]
) => S | Promise<S> | ((action: MethodAction<K, M>) => void)

type MethodTree<S, MT extends Record<Key, (...args: any[]) => any>> = {
  [K in keyof MT]: Method<K, MT[K], S>
}

type CreateMethodsReturn<S, MT> =
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

type GetMethodTree<
  CMR extends CreateMethodsReturn<
    Record<Key, any>,
    Record<Key, (...args: any[]) => any>
  >
> = CMR extends CreateMethodsReturn<Record<Key, any>, infer MT> ? MT : CMR

// 建议先看懂类型，从下面函数的泛型参数出发很容易就知道该函数的作用
type CreateMethods<
  S,
  MT extends MethodTree<S, Record<Key, (...args: any[]) => any>> = MethodTree<
    S,
    Record<Key, (...args: any[]) => any>
  >
> = (state: S) => CreateMethodsReturn<S, MT>

type WrappedMethods<
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

function useMethods<
  S extends Record<Key, any>,
  CM extends CreateMethods<S>,
  MT extends GetMethodTree<ReturnType<CM>>
>(
  createMethods: CM,
  initialState: S,
  useMethodsOptions?: UseMethodsOptions<S, Action<keyof MT, S>>
): [S, WrappedMethods<MT>] {
  const {
    customUseReducer = useReducer,
    reducerMapper = (v: Reducer<S, Action<keyof MT, S>>) => v,
  } = useMethodsOptions || {}
  // reducer 每次都运行 createMethods 拿到并传入最新的状态
  const reducer: Reducer<S, Action<keyof MT, S>> = useMemo(
    () => (reducerState, action) => {
      const oldReducerState = { ...reducerState }
      const createdMethods = createMethods(reducerState)
      const [methods, effects] = Array.isArray(createdMethods)
        ? createdMethods
        : [createdMethods]
      function callEffects(newState: S, oldState: S) {
        if (effects) {
          Object.keys(effects).forEach((prop: keyof typeof effects) => {
            if (newState[prop] !== oldState[prop]) {
              effects[prop]?.(
                (value: any) => {
                  action.dispatch?.({
                    ...value,
                    dispatch: action.dispatch,
                  })
                },
                newState[prop],
                oldState[prop]
              )
            }
          })
        }
      }
      if (action.resolvedState) {
        callEffects(action.resolvedState, oldReducerState)
        return action.resolvedState
      }

      const newState = methods[action.type](...(action.payload || []))
      if (newState instanceof Promise) {
        resolvePromise(newState).then((resolvedState) => {
          action.dispatch?.({
            ...action,
            resolvedState,
          })
        })
        return reducerState
      }

      if (typeof newState === 'function') {
        // 延迟执行
        Promise.resolve().then(() => {
          newState({
            ...action,
            dispatch: (value: any) => {
              action.dispatch?.({
                ...value,
                dispatch: action.dispatch,
              })
            },
          } as MethodAction<any, any>)
        })
        return reducerState
      }

      callEffects(newState, oldReducerState)
      return newState
    },
    [createMethods]
  )

  const [state, dispatch] = customUseReducer(
    reducerMapper(reducer),
    initialState
  )

  const wrappedMethods: WrappedMethods<MT> = useMemo(() => {
    const createdMethods = createMethods(initialState)
    const [methods] = Array.isArray(createdMethods)
      ? createdMethods
      : [createdMethods]
    // 每次调用时重新构成闭包，更新 state
    const actionTypes = Object.keys(methods)
    // 重新生成 methods
    return actionTypes.reduce((m, type) => {
      // type 是 M 的键之一，需要重新注解类型
      // eslint-disable-next-line no-param-reassign
      m[type as keyof MT] = (...payload) =>
        dispatch({ type: type as keyof MT, payload, dispatch })

      return m
    }, {} as WrappedMethods<MT>)
  }, [createMethods, initialState])

  return [state, wrappedMethods]
}

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
