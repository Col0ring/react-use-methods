import React, { Reducer, useEffect, useMemo, useReducer } from 'react'
import { Key } from '../type'
import { isInternalAction } from '../utils'
import createUseReducer from './createUseReducer'
import usePrevious from './usePrevious'

interface Action {
  type: Key
  // 内部 dispatch。需要带上 dispatch 参数
  dispatch: React.Dispatch<Action>
  payload?: any[]
  [props: string]: any
}

// 外部 action
type DispatchAction = Omit<Action, 'dispatch'>

declare function dispatchFunction(value: DispatchAction): void
declare function dispatchFunction(value: any): void

type DispatchFunction = typeof dispatchFunction

// TODO: correct key
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface MethodAction<P extends any[]> {
  type: Key
  // 用于中间件的操作
  dispatch: DispatchFunction
  payload: P
  [props: string]: any
}

type MethodFunction<S> = (...args: any[]) => S

type MethodTree<S, MT extends Record<Key, (...args: any[]) => any>> = {
  [K in keyof MT]: MethodFunction<S>
}

type ActionFunction<P extends any[] = any[]> = (
  ...args: P
) => (action: MethodAction<P>) => void

type ActionTree<AT extends Record<Key, (...args: any[]) => any>> = {
  [K in keyof AT]: ActionFunction
}

type CreateMethodsReturn<
  S extends Record<Key, any>,
  MT extends MethodTree<S, Record<Key, (...args: any[]) => any>>,
  AT extends ActionTree<Record<Key, (...args: any[]) => any>>
> =
  | MT
  | {
      methods: MT
      actions?: AT
      effects?: Partial<{
        [P in keyof S]: (
          dispatch: DispatchFunction,
          newValue: S[P],
          oldValue: S[P]
        ) => void
      }>
    }

type GetMethodTree<
  CMR extends CreateMethodsReturn<
    Record<Key, any>,
    Record<Key, (...args: any[]) => any>,
    Record<Key, (...args: any[]) => any>
  >
> = CMR extends CreateMethodsReturn<
  Record<Key, any>,
  infer MT,
  Record<Key, (...args: any[]) => any>
>
  ? MT
  : CMR

type GetActionTree<
  CMR extends CreateMethodsReturn<
    Record<Key, any>,
    Record<Key, (...args: any[]) => any>,
    Record<Key, (...args: any[]) => any>
  >
> = CMR extends CreateMethodsReturn<
  Record<Key, any>,
  Record<Key, (...args: any[]) => any>,
  infer AT
>
  ? AT
  : CMR

// 建议先看懂类型，从下面函数的泛型参数出发很容易就知道该函数的作用
type CreateMethods<
  S,
  MT extends MethodTree<S, Record<Key, (...args: any[]) => any>> = MethodTree<
    S,
    Record<Key, (...args: any[]) => any>
  >,
  AT extends ActionTree<Record<Key, (...args: any[]) => any>> = ActionTree<
    Record<Key, (...args: any[]) => any>
  >
> = (state: S) => CreateMethodsReturn<S, MT, AT>

type WrappedMethods<
  MT extends MethodTree<Record<Key, any>, Record<Key, (...args: any[]) => any>>,
  AT extends ActionTree<Record<Key, (...args: any[]) => any>>
> = {
  methods: {
    [K in keyof MT]: (...payload: Parameters<MT[K]>) => void
  }
  actions: {
    [K in keyof AT]: (...payload: Parameters<AT[K]>) => void
  }
} & {
  [K in keyof (MT & AT)]: (...payload: Parameters<(MT & AT)[K]>) => void
}

interface UseMethodsOptions<S, A> {
  reducerMapper?: (reducer: Reducer<S, A>) => Reducer<S, A>
  customUseReducer?: typeof useReducer
}

function isSimplyMethods<S extends Record<Key, any>>(
  val: ReturnType<CreateMethods<S>>
): val is MethodTree<S, Record<Key, (...args: any[]) => any>> {
  return !val.methods
}
const defaultUseReducer = createUseReducer()
function useMethods<
  S extends Record<Key, any>,
  CM extends CreateMethods<S>,
  MT extends GetMethodTree<ReturnType<CM>>,
  AT extends GetActionTree<ReturnType<CM>>
>(
  createMethods: CM,
  initialState: S,
  useMethodsOptions?: UseMethodsOptions<S, Action>
): [S, WrappedMethods<MT, AT>] {
  const {
    customUseReducer = defaultUseReducer as typeof useReducer,
    reducerMapper = (v: Reducer<S, Action>) => v,
  } = useMethodsOptions || {}

  const createdMethods = useMemo(() => {
    const methods = createMethods(initialState)
    if (isSimplyMethods(methods)) {
      return {
        effects: {} as Partial<{
          [P in keyof S]: (
            dispatch: React.Dispatch<Action>,
            newValue: S[P],
            oldValue: S[P]
          ) => void
        }>,
        actions: {} as AT,
        methods,
      }
    }
    return methods
  }, [createMethods, initialState])

  // reducer 每次都运行 createMethods 拿到并传入最新的状态
  const reducer: Reducer<S, Action> = useMemo(
    () =>
      ({ reducerState, getState }, action) => {
        const currentCreatedMethods = createMethods(reducerState)

        const { methods, actions } = !isSimplyMethods(currentCreatedMethods)
          ? currentCreatedMethods
          : {
              actions: {} as AT,
              methods: currentCreatedMethods,
            }

        if (actions?.[action.type]) {
          actions[action.type](...(action.payload || []))({
            ...action,
            dispatch: (value, ...rest) => {
              if (isInternalAction(value)) {
                return action.dispatch(value)
              }

              return action.dispatch(value, ...rest)
            },
            payload: action.payload || [],
            type: action.type,
          })
          return getState()
        }
        if (!methods[action.type]) {
          return reducerState
        }
        const newState = methods[action.type](...(action.payload || []))
        return newState
      },
    [createMethods]
  )

  const [state, dispatch] = customUseReducer(
    reducerMapper(reducer),
    initialState
  )

  const prevState = usePrevious(state)

  const wrappedMethods: WrappedMethods<MT, AT> = useMemo(() => {
    const methods = !isSimplyMethods(createdMethods)
      ? createdMethods.methods ?? {}
      : createdMethods
    const actions = !isSimplyMethods(createdMethods)
      ? createdMethods.actions ?? {}
      : {}
    // 每次调用时重新构成闭包，更新 state
    const methodsTypes = Object.keys(methods)
    const actionsTypes = Object.keys(actions)

    const currentWrappedMethods = {
      methods: {},
      actions: {},
    } as WrappedMethods<MT, AT>

    // 重新生成 methods
    methodsTypes.reduce((m, type: keyof MT) => {
      m.methods[type] = (...payload) => dispatch({ type, dispatch, payload })
      m[type] = m.methods[type] as WrappedMethods<MT, AT>[keyof MT]
      return m
    }, currentWrappedMethods)

    actionsTypes.reduce((m, type: keyof AT) => {
      m.actions[type] = (...payload) =>
        actions[type](...payload)({
          type,
          dispatch: (value, ...rest) => {
            if (isInternalAction(value)) {
              return dispatch(value)
            }
            return dispatch(value, ...rest)
          },
          payload,
        })
      // 如果有相同的 type actions 会覆盖 methods
      m[type] = m.actions[type] as WrappedMethods<MT, AT>[keyof AT]
      return m
    }, currentWrappedMethods)

    return currentWrappedMethods
  }, [createdMethods, dispatch])

  useEffect(() => {
    const { effects } = createdMethods
    if (effects && state && prevState) {
      Object.keys(effects).forEach((prop: keyof typeof effects) => {
        if (state[prop] !== prevState[prop]) {
          effects[prop]?.(
            dispatch as DispatchFunction,
            state[prop],
            prevState[prop]
          )
        }
      })
    }
  }, [state, dispatch, prevState, createdMethods])

  return [state, wrappedMethods]
}

export type {
  Action,
  MethodAction,
  ActionFunction,
  ActionTree,
  CreateMethods,
  WrappedMethods,
  MethodFunction,
  MethodTree,
  UseMethodsOptions,
  GetMethodTree,
  GetActionTree,
}
export { useMethods }
export default useMethods
