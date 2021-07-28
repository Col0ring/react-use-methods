export declare type Key = string | number | symbol
export declare type ResolvePromise<T> = T extends Promise<infer U> ? U : T
export interface AnyAction<T = any> {
  type: T
  [extraProps: string]: any
}
export interface Dispatch<A extends AnyAction = AnyAction> {
  <T extends A>(action: T): T
}
export interface Store<Action extends AnyAction, State> {
  getState: () => State
  dispatch: Dispatch<Action>
}
export declare type Middleware<Action extends AnyAction, State> = (
  store: Store<Action, State>
) => (next: Dispatch<Action>) => (action: Action) => any
