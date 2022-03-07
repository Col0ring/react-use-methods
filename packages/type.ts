export type Key = PropertyKey
export type ResolvePromise<T> = T extends Promise<infer U> ? U : T

export type Reducer<S, A extends AnyAction> = (
  prevState: { reducerState: S; getState: () => S },
  action: A & {
    dispatch: Dispatch<A>
  }
) => S
export type ReducerState<R extends Reducer<any, any>> = R extends Reducer<
  infer S,
  any
>
  ? S
  : never

export type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<
  any,
  infer A
>
  ? A
  : never
export interface AnyAction {
  type: Key
  payload?: any[]
  [extraProps: Key]: any
}

export interface Dispatch<A extends AnyAction = AnyAction> {
  <T extends A>(action: T): T
}
export interface Store<Action extends AnyAction, State> {
  getState: () => State
  dispatch: Dispatch<Action>
}

export type Middleware<Action extends AnyAction, State> = (
  store: Store<Action, State>
) => (next: Dispatch<Action>) => (action: Action) => any

export type If<L extends boolean, Condition1, Condition2> = [L] extends [true]
  ? Condition1
  : Condition2
