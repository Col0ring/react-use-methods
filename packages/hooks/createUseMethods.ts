import { useReducer } from 'react'
import useMethods, { UseMethodsOptions } from './useMethods'
import createUseReducer from './createUseReducer'
import { Middleware, AnyAction } from '../type'

function createUseMethods<Action extends AnyAction, State>(
  ...middlewares: Middleware<Action, State>[]
): typeof useMethods
function createUseMethods<Action extends AnyAction, State>(
  useMethodsOptions: UseMethodsOptions<State, Action>,
  ...middlewares: Middleware<Action, State>[]
): typeof useMethods
function createUseMethods<Action extends AnyAction, State>(
  ...args: [
    options: UseMethodsOptions<State, Action> | Middleware<Action, State>,
    ...middlewares: Middleware<Action, State>[]
  ]
) {
  const [options, ...middlewares] = args
  const isOption = typeof options === 'object'
  const methodsReducer = createUseReducer(
    ...(isOption ? middlewares : (args as Middleware<Action, State>[]))
  ) as typeof useReducer

  const useMethodsWrapper: typeof useMethods = (
    createMethods,
    initialState,
    useMethodsOptions
  ) =>
    useMethods(createMethods, initialState, {
      customUseReducer: methodsReducer,
      ...(isOption ? (options as unknown as typeof useMethodsOptions) : {}),
      ...useMethodsOptions,
    })
  return useMethodsWrapper
}

export { createUseMethods }
export default createUseMethods
