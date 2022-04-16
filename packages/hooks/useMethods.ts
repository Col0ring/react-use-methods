import { useEffect, useMemo } from 'react'
import { Key, Reducer, AnyAction, Promisify, If } from '../type'
import { isInternalAction } from '../utils'
import { defaultUseReducer } from './createUseReducer'
import usePrevious from './usePrevious'

declare function dispatchFunction(value: AnyAction): Promisify<any>
declare function dispatchFunction(value: any): Promisify<any>

type DispatchFunction = typeof dispatchFunction

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
  AT extends ActionTree<Record<Key, (...args: any[]) => any>>,
  M = {
    [K in keyof MT]: (...payload: Parameters<MT[K]>) => ReturnType<MT[K]>
  },
  A = {
    [K in keyof AT]: (
      ...payload: Parameters<AT[K]>
    ) => ReturnType<ReturnType<AT[K]>>
  }
> = {
  methods: M
  actions: A
} & M &
  A

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
  initialStateProp: S | (() => S),
  useMethodsOptions?: UseMethodsOptions<RS, AnyAction, L>
): [RS, WrappedMethods<MT, AT>, () => RS] {
  const {
    enableLoading = false,
    customUseReducer = defaultUseReducer,
    reducerMapper = (v: Reducer<RS, AnyAction>) => v,
  } = useMethodsOptions || {}
  const initialState = useMemo(
    () =>
      typeof initialStateProp === 'function'
        ? (initialStateProp as () => S)()
        : initialStateProp,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  // action loading state
  const initialLoadingState = useMemo(() => {
    // no emit
    const { actions } = createMethods(
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

    return Object.keys(actions || {}).reduce(
      (prev, next) => {
        prev[next as keyof AT] = false
        return prev
      },
      {} as {
        [K in keyof AT]: boolean
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          result: newState,
        }
      },
    [createMethods, enableLoading]
  )

  const mapperReducer = useMemo(
    () => reducerMapper(reducer),
    [reducerMapper, reducer]
  )

  const [state, dispatch, getAsyncState] = customUseReducer(
    mapperReducer,
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

  const { actions, methods, effects } = useMemo(
    () => createMethods(state, getAsyncState),
    [createMethods, getAsyncState, state]
  )

  const wrappedMethods: WrappedMethods<MT, AT> = useMemo(() => {
    // 每次调用时重新构成闭包，更新 state
    const methodsTypes = Object.keys(methods)
    const actionsTypes = Object.keys(actions || {})

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
        const res = (actions as AT)[type](...payload)({
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
  }, [methods, actions, dispatch, enableLoading])

  useEffect(() => {
    if (!effects) {
      return
    }

    if (effects && state && prevState) {
      Object.keys(effects).forEach((prop: keyof RS) => {
        if (state[prop] !== prevState[prop]) {
          // eslint-disable-next-line @typescript-eslint/no-extra-semi
          ;(
            effects as Partial<{
              [P in keyof RS]: (
                dispatch: DispatchFunction,
                newValue: RS[P],
                oldValue: RS[P]
              ) => void
            }>
          )[prop]?.(dispatch, state[prop], prevState[prop])
        }
      })
    }
  }, [state, dispatch, prevState, createMethods, getAsyncState, effects])

  return [state, wrappedMethods, getAsyncState]
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
