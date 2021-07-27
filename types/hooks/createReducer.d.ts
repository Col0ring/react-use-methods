import { AnyAction, Middleware, Dispatch } from '../type';
declare const createReducer: <Action extends AnyAction<any>, State>(...middlewares: Middleware<Action, State>[]) => (reducer: (state: State, action: Action) => State, initialState: State, initializer?: (value: State) => State) => [State, Dispatch<Action>];
export default createReducer;
