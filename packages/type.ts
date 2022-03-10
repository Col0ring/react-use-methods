export type Key = PropertyKey
export type ResolvePromise<T> = T extends Promise<infer U> ? U : T
export type Promisify<T> = T | Promise<T>

export interface ReducerResult<S> {
  state?: S
  result?: any
}

export type Reducer<S, A extends AnyAction> = (
  prevState: { reducerState: S; getState: () => S },
  action: A & {
    dispatch: Dispatch<A>
  }
) => Promisify<ReducerResult<S>>

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
  <T extends A>(action: T): Promisify<any>
}
export interface Store<Action extends AnyAction, State> {
  getState: () => State
  dispatch: Dispatch<Action>
}

export type Middleware<Action extends AnyAction, State> = (
  store: Store<Action, State>
) => (next: Dispatch<Action>) => (action: Action) => any

export type IfBoolean<L extends any, Condition1, Condition2> = [
  boolean
] extends [L]
  ? Condition1
  : Condition2

export type If<L extends boolean, Condition1, Condition2> = [L] extends [true]
  ? Condition1
  : Condition2
