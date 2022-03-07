import React, { useEffect, useMemo } from 'react'
import { Key, Reducer, AnyAction, If, Promisify } from '../type'
import { isInternalAction } from '../utils'
import { defaultUseReducer } from './createUseReducer'
import usePrevious from './usePrevious'

// 外部 action
type DispatchAction = Omit<AnyAction, 'dispatch'>

declare function dispatchFunction(value: DispatchAction): Promisify<any>
declare function dispatchFunction(value: any): Promisify<any>

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
) => (action: MethodAction<P>) => Promisify<any>

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
> = (state: S, getState: () => S) => CreateMethodsReturn<S, MT, AT>

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

interface UseMethodsOptions<S, A extends AnyAction, L extends boolean = false> {
  enableLoading?: L
  reducerMapper?: (reducer: Reducer<S, A>) => Reducer<S, A>
  customUseReducer?: typeof defaultUseReducer
}

function isSimplyMethods<S extends Record<Key, any>>(
  val: ReturnType<CreateMethods<S>>
): val is MethodTree<S, Record<Key, (...args: any[]) => any>> {
  return !val.methods
}

const loadingType = Symbol('actionLoading')

function useMethods<
  S extends Record<Key, any>,
  CM extends CreateMethods<
    If<
      L,
      S & {
        actionLoading: {
          [key: Key]: boolean
        }
      },
      S
    >
  >,
  MT extends GetMethodTree<ReturnType<CM>>,
  AT extends GetActionTree<ReturnType<CM>>,
  L extends boolean,
  RS extends If<
    L,
    S & {
      actionLoading: {
        [K in keyof AT]: boolean
      }
    },
    S
  >
>(
  createMethods: CM,
  initialState: S,
  useMethodsOptions?: UseMethodsOptions<RS, AnyAction, L>
): [RS, WrappedMethods<MT, AT>] {
  const {
    enableLoading = false,
    customUseReducer = defaultUseReducer,
    reducerMapper = (v: Reducer<RS, AnyAction>) => v,
  } = useMethodsOptions || {}

  const createdMethods = useMemo(() => {
    const methods = createMethods(
      enableLoading
        ? { ...initialState, actionLoading: {} }
        : (initialState as RS),
      () =>
        enableLoading
          ? {
              ...initialState,
              actionLoading: {},
            }
          : (initialState as RS)
    )
    if (isSimplyMethods(methods)) {
      return {
        effects: {} as Partial<{
          [P in keyof S]: (
            dispatch: React.Dispatch<AnyAction>,
            newValue: S[P],
            oldValue: S[P]
          ) => void
        }>,
        actions: {} as AT,
        methods,
      }
    }
    return methods
  }, [createMethods, enableLoading, initialState])

  // action loading state
  const initialLoadingState = useMemo(() => {
    return Object.keys(createdMethods.actions || {}).reduce(
      (prev, next) => {
        prev[next as keyof AT] = false
        return prev
      },
      {} as {
        [K in keyof AT]: boolean
      }
    )
  }, [createdMethods.actions])

  // reducer 每次都运行 createMethods 拿到并传入最新的状态
  const reducer: Reducer<RS, AnyAction> = useMemo(
    () =>
      ({ reducerState, getState }, action) => {
        const currentCreatedMethods = createMethods(reducerState, getState)

        const { methods, actions } = !isSimplyMethods(currentCreatedMethods)
          ? currentCreatedMethods
          : {
              actions: {} as AT,
              methods: currentCreatedMethods,
            }

        if (enableLoading && action.type === loadingType) {
          const [type, status] = action.payload as [typeof loadingType, boolean]
          return {
            state: {
              ...reducerState,
              actionLoading: { ...reducerState.actionLoading, [type]: status },
            },
          }
        }

        if (actions?.[action.type]) {
          enableLoading &&
            action.dispatch({
              type: loadingType,
              payload: [action.type, true],
            })
          const res = actions[action.type](...(action.payload || []))({
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

          if (res instanceof Promise) {
            const handleResult = async () => {
              const value = await res
              enableLoading &&
                action.dispatch({
                  type: loadingType,
                  payload: [action.type, false],
                })
              return {
                result: value,
              }
            }

            return handleResult()
          }
          enableLoading &&
            action.dispatch({
              type: loadingType,
              payload: [action.type, false],
            })
          return {
            state: getState(),
            result: res,
          }
        }

        if (!methods[action.type]) {
          return {
            state: reducerState,
          }
        }
        const newState = methods[action.type](...(action.payload || []))
        return {
          state: newState,
        }
      },
    [createMethods, enableLoading]
  )

  const [state, dispatch, getAsyncState] = customUseReducer(
    reducerMapper(reducer),
    initialState,
    (arg) => {
      if (enableLoading) {
        return {
          ...arg,
          actionLoading: initialLoadingState,
        }
      }
      return arg
    }
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
      m.methods[type] = (...payload) => dispatch({ type, payload })
      m[type] = m.methods[type] as WrappedMethods<MT, AT>[keyof MT]
      return m
    }, currentWrappedMethods)

    actionsTypes.reduce((m, type: keyof AT) => {
      m.actions[type] = (...payload) => {
        enableLoading &&
          dispatch({
            type: loadingType,
            // set actionLoading state
            payload: [type, true],
          })
        const res = actions[type](...payload)({
          type,
          dispatch: (value, ...rest) => {
            if (isInternalAction(value)) {
              return dispatch(value)
            }
            return dispatch(value, ...rest)
          },
          payload,
        })
        const handleResult = async () => {
          await res
          dispatch({
            type: loadingType,
            dispatch,
            payload: [type, false],
          })
        }
        enableLoading && handleResult()

        return res
      }
      // 如果有相同的 type actions 会覆盖 methods
      m[type] = m.actions[type] as WrappedMethods<MT, AT>[keyof AT]
      return m
    }, currentWrappedMethods)

    return currentWrappedMethods
  }, [createdMethods, dispatch, enableLoading])

  useEffect(() => {
    const currentCreatedMethods = createMethods(state, getAsyncState)
    if (isSimplyMethods(currentCreatedMethods)) {
      return
    }
    const { effects } = currentCreatedMethods

    if (effects && state && prevState) {
      Object.keys(effects).forEach((prop: keyof typeof effects) => {
        if (state[prop] !== prevState[prop]) {
          effects[prop]?.(dispatch, state[prop], prevState[prop])
        }
      })
    }
  }, [state, dispatch, prevState, createMethods, getAsyncState])

  return [state, wrappedMethods]
}

export type {
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
