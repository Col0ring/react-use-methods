import useMethods, {
  CreateMethods,
  GetActionTree,
  GetMethodTree,
  UseMethodsOptions,
  WrappedMethods,
} from './useMethods'
import createUseReducer, { defaultUseReducer } from './createUseReducer'
import { Middleware, AnyAction, Key, If, IfBoolean } from '../type'

export type CreateUseMethodsReturn<LL extends boolean> = <
  S extends Record<Key, any>,
  CM extends CreateMethods<
    If<
      TL,
      S & {
        actionLoading: {
          [key: Key]: boolean
        }
      },
      S
    >
  >,
  MT extends GetMethodTree<ReturnType<CM>>,
  AT extends GetActionTree<ReturnType<CM>>,
  L extends boolean,
  TL extends IfBoolean<L, IfBoolean<LL, false, LL>, L>,
  RS extends If<
    TL,
    S & {
      actionLoading: {
        [K in keyof AT]: boolean
      }
    },
    S
  >
>(
  createMethods: CM,
  initialState: S | (() => S),
  useMethodsOptions?: UseMethodsOptions<RS, AnyAction, L>
) => [RS, WrappedMethods<MT, AT>, () => RS]

function createUseMethods<Action extends AnyAction, State>(
  ...middlewares: Middleware<Action, State>[]
): CreateUseMethodsReturn<false>
function createUseMethods<Action extends AnyAction, State, LL extends boolean>(
  useMethodsOptions: UseMethodsOptions<State, Action, LL>,
  ...middlewares: Middleware<Action, State>[]
): CreateUseMethodsReturn<LL>
function createUseMethods<Action extends AnyAction, State, LL extends boolean>(
  ...args: [
    options: UseMethodsOptions<State, Action, LL> | Middleware<Action, State>,
    ...middlewares: Middleware<Action, State>[]
  ]
): CreateUseMethodsReturn<LL> {
  const [options, ...middlewares] = args
  const isOption = typeof options === 'object'
  const methodsReducer = createUseReducer(
    ...(isOption ? middlewares : (args as Middleware<Action, State>[]))
  ) as typeof defaultUseReducer

  const useMethodsWrapper: CreateUseMethodsReturn<LL> = (
    createMethods,
    initialState,
    useMethodsOptions
  ) =>
    (useMethods as CreateUseMethodsReturn<LL>)(createMethods, initialState, {
      customUseReducer: methodsReducer,
      ...(isOption ? (options as unknown as typeof useMethodsOptions) : {}),
      ...useMethodsOptions,
    })
  return useMethodsWrapper
}

export { createUseMethods }
export default createUseMethods
