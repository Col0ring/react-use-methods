import { produce, Draft } from 'immer'
export function combineReducers<State, Action>(
  reducer: (state: State, action: Action) => State
) {
  return (state: State, action: Action) => {
    return produce(state, (draft) => {
      return reducer(draft as State, action) as Draft<State>
    })
  }
}
