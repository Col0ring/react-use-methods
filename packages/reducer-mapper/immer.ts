import produce, { Draft } from 'immer'
import type { Reducer, AnyAction, Promisify, ReducerResult } from '../type'
export function combineReducers<State, Action extends AnyAction>(
  reducer: Reducer<State, Action>
): Reducer<State, Action> {
  return ({ reducerState, getState }, action) => {
    let result: any
    let isState = false
    let promiseReducerResult: Promise<ReducerResult<State>> | undefined
    let newState = produce(reducerState, (draft) => {
      const reducerResult = reducer(
        {
          reducerState: draft as State,
          getState,
        },
        action
      ) as Draft<Promisify<ReducerResult<State>>>
      if (reducerResult instanceof Promise) {
        promiseReducerResult = reducerResult
        return
      }
      result = reducerResult.result
      if (result === reducerResult.state) {
        isState = true
      }
      return reducerResult.state
    })

    if (promiseReducerResult) {
      return promiseReducerResult.then(({ result: res }) => {
        return {
          result: res,
        }
      })
    }

    return {
      state: newState,
      result: isState ? newState : result,
    }
  }
}
