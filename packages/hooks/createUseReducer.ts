import { MutableRefObject, useCallback, useEffect, useRef } from 'react'
import useForceUpdate from './useForceUpdate'
import {
  AnyAction,
  Middleware,
  Store,
  Dispatch,
  Reducer,
  ReducerAction,
  ReducerState,
} from '../type'

// 合并中间件
function composeMiddleware<Action extends AnyAction, State>(
  chain: Middleware<Action, State>[]
) {
  return (context: Store<Action, State>, dispatch: Dispatch<Action>) => {
    // 先后再前
    return chain.reduceRight((dispatchAction, middleware) => {
      return middleware(context)(dispatchAction)
    }, dispatch)
  }
}

const createUseReducer = <Action extends AnyAction, State>(
  ...middlewares: Middleware<Action, State>[]
) => {
  // 已经合并后的中间件
  const composedMiddleware = composeMiddleware(middlewares)

  // useReducer
  return function useReducer<R extends Reducer<any, any>, I>(
    reducer: R,
    initialState: I,
    initializer: (arg: I) => ReducerState<R> = (value) =>
      value as ReducerState<R>
  ): [ReducerState<R>, Dispatch<ReducerAction<R>>, () => ReducerState<R>] {
    const ref = useRef(initializer(initialState))
    const forceUpdate = useForceUpdate()
    // dispatch origin
    const dispatch = useCallback(
      <T extends Action>(action: T): T => {
        const actionWithDispatch = { ...action, dispatch: dispatchRef.current }
        // 改变 state
        ref.current = reducer(
          {
            reducerState: ref.current,
            getState: () => ref.current,
          },
          actionWithDispatch
        )
        forceUpdate()
        return actionWithDispatch
      },
      [reducer, forceUpdate]
    )

    // 真正的 dispatch 对象
    const dispatchRef: MutableRefObject<Dispatch<Action>> = useRef(
      // 向合并后的中间件传入参数
      composedMiddleware(
        {
          getState: () => ref.current,
          dispatch: (action) => dispatchRef.current(action),
        },
        dispatch
      )
    )

    const getAsyncState = useCallback(() => ref.current, [])

    useEffect(() => {
      // dispatch 更新时改变 dispatchRef
      dispatchRef.current = composedMiddleware(
        {
          getState: () => ref.current,
          dispatch: (action) => dispatchRef.current(action),
        },
        dispatch
      )
    }, [dispatch])
    return [ref.current, dispatchRef.current, getAsyncState]
  }
}

export const defaultUseReducer = createUseReducer()

export default createUseReducer
