import useMethods, { UseMethodsOptions } from './useMethods';
import { Middleware, AnyAction } from '../type';
declare function createUseMethods<Action extends AnyAction, State>(...middlewares: Middleware<Action, State>[]): typeof useMethods;
declare function createUseMethods<Action extends AnyAction, State>(useMethodsOptions: UseMethodsOptions<State, Action>, ...middlewares: Middleware<Action, State>[]): typeof useMethods;
export { createUseMethods };
export default createUseMethods;
