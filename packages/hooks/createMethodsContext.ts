import React, { createContext, createElement, useContext, useMemo } from 'react'
import useMethods, {
  CreateMethods,
  WrappedMethods,
  MethodTree,
  GetMethodTree,
  ActionTree,
  GetActionTree,
  UseMethodsOptions,
} from './useMethods'
import { AnyAction, If, IfBoolean, Key } from '../type'
import { CreateUseMethodsReturn } from './createUseMethods'

type MethodsContextValue<
  S,
  MT extends MethodTree<S, Record<Key, (...args: any[]) => any>>,
  AT extends ActionTree<Record<Key, (...args: any[]) => any>>
> = [S, WrappedMethods<MT, AT>]

type GetLoadingState<T extends CreateUseMethodsReturn<boolean>> =
  T extends CreateUseMethodsReturn<infer L> ? IfBoolean<L, false, L> : never
interface CreateMethodsContextOptions<
  S extends Record<Key, any>,
  UM extends CreateUseMethodsReturn<boolean>,
  L extends boolean,
  N extends string
> {
  useMethodsOptions?: UseMethodsOptions<S, AnyAction, L>
  customUseMethods?: UM
  /**
   * @default methods
   */
  name?: N
}

function createMethodsContext<
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
  UM extends CreateUseMethodsReturn<boolean>,
  TL extends IfBoolean<L, GetLoadingState<UM>, L>,
  RS extends If<
    TL,
    S & {
      actionLoading: {
        [K in keyof AT]: boolean
      }
    },
    S
  >,
  N extends string = 'methods'
>(
  createMethods: CM,
  defaultInitialValue: S | (() => S),
  createMethodsContextOptions?: CreateMethodsContextOptions<RS, UM, L, N>
) {
  const {
    useMethodsOptions,
    customUseMethods,
    name = 'methods',
  } = createMethodsContextOptions || {}
  const useMethodsHook = customUseMethods || (useMethods as UM)
  const useMethodsHookOptions = useMethodsOptions

  const MethodsContext = createContext<MethodsContextValue<RS, MT, AT> | null>(
    null
  )
  const providerFactory = (
    props: React.ProviderProps<MethodsContextValue<RS, MT, AT>>,
    children: Parameters<typeof createElement>[2]
  ) => createElement(MethodsContext.Provider, props, children)

  const MethodsProvider: React.FC<{ initialValue?: S | (() => S) }> = ({
    children,
    initialValue,
  }) => {
    const stateAndMethods = useMethodsHook(
      createMethods,
      initialValue !== undefined ? initialValue : defaultInitialValue,
      useMethodsHookOptions
    )

    const memoContext = useMemo(
      () => ({ value: stateAndMethods }),
      [stateAndMethods]
    )
    return providerFactory(memoContext, children)
  }

  const withMethodsProvider = <P>(
    WrapperComponent: React.ElementType<P>,
    options?: { initialValue?: S }
  ) => {
    return function ProviderWrapper(props) {
      return createElement(
        MethodsProvider,
        options,
        createElement(WrapperComponent, props)
      )
    } as React.FC<P>
  }

  // like redux connect
  const connectMethodsContext = <P>(
    WrapperComponent: React.ElementType<P>,
    throwErrorIfNotInContext = true
  ) => {
    return function <
      M = {
        state: RS
        methods: WrappedMethods<MT, AT>
      }
    >(mapper?: (state: RS, methods: WrappedMethods<MT, AT>) => M) {
      return function ContextWrapper(props) {
        const [state, methods] =
          useMethodsContext(throwErrorIfNotInContext) ||
          ([{}, {}] as MethodsContextValue<RS, MT, AT>)

        const mapperProps = useMemo(
          () =>
            mapper?.(state, methods) || {
              state,
              methods,
            },
          [state, methods]
        )
        return createElement(WrapperComponent, {
          ...mapperProps,
          ...props,
        } as P & M)
      } as React.FC<Omit<P, keyof M>>
    }
  }

  function useMethodsContext<T extends boolean>(
    throwErrorIfNotInContext?: T
  ): [T] extends [false]
    ? MethodsContextValue<RS, MT, AT> | null
    : MethodsContextValue<RS, MT, AT> {
    const stateAndMethods = useContext(MethodsContext) as [T] extends [false]
      ? MethodsContextValue<RS, MT, AT> | null
      : MethodsContextValue<RS, MT, AT>
    if ((throwErrorIfNotInContext ?? true) && stateAndMethods === null) {
      throw new Error(
        `useMethodsContext must be used inside a MethodsProvider.`
      )
    }
    return stateAndMethods
  }

  const methodsName = name[0].toUpperCase() + name.slice(1)
  type MethodsName = Capitalize<N>
  type UseMethodsContext = `use${MethodsName}Context`
  type MethodsProvider = `${MethodsName}Provider`
  type WithMethodsProvider = `with${MethodsName}Provider`
  type ConnectMethodsContext = `connect${MethodsName}Context`
  type MethodsContext = `${MethodsName}Context`
  return {
    [`use${methodsName}Context`]: useMethodsContext,
    [`${methodsName}Provider`]: MethodsProvider,
    [`connect${methodsName}Context`]: connectMethodsContext,
    [`with${methodsName}Provider`]: withMethodsProvider,
    [`${methodsName}Context`]: MethodsContext,
  } as {
    [P in
      | UseMethodsContext
      | MethodsProvider
      | WithMethodsProvider
      | ConnectMethodsContext
      | MethodsContext]: P extends UseMethodsContext
      ? typeof useMethodsContext
      : P extends MethodsProvider
      ? typeof MethodsProvider
      : P extends WithMethodsProvider
      ? typeof withMethodsProvider
      : P extends MethodsContext
      ? typeof MethodsContext
      : P extends ConnectMethodsContext
      ? typeof connectMethodsContext
      : never
  }
}

export type { MethodsContextValue }
export { createMethodsContext }
export default createMethodsContext
