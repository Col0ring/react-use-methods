import { produce, Draft } from 'immer'
export function combineReducers<State, Action>(
  reducer: (
    state: {
      reducerState: State
      getState: () => State
    },
    action: Action
  ) => State
) {
  return (
    {
      reducerState,
      getState,
    }: {
      reducerState: State
      getState: () => State
    },
    action: Action
  ) => {
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
