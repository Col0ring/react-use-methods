import { produce, Draft } from 'immer'
import type { Reducer, AnyAction } from '../type'
export function combineReducers<State, Action extends AnyAction>(
  reducer: Reducer<State, Action>
): Reducer<State, Action> {
  return ({ reducerState, getState }, action) => {
    return produce(reducerState, (draft) => {
      return reducer(
        {
          reducerState: draft as State,
          getState,
        },
        action
      ) as Draft<State>
    })
  }
}
