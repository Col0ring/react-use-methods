import useMethods from './useMethods'
import createUseReducer, { defaultUseReducer } from './createUseReducer'
import { Middleware, AnyAction } from '../type'

function createUseMethods<Action extends AnyAction, State>(
  ...middlewares: Middleware<Action, State>[]
) {
  const methodsReducer = createUseReducer(
    ...middlewares
  ) as typeof defaultUseReducer

  const useMethodsWrapper: typeof useMethods = (
    createMethods,
    initialState,
    useMethodsOptions
  ) =>
    useMethods(createMethods, initialState, {
      customUseReducer: methodsReducer,
      ...useMethodsOptions,
    })
  return useMethodsWrapper
}

export { createUseMethods }
export default createUseMethods
