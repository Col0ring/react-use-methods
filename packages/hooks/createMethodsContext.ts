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

type CreateMethodsContextReturn<
  S,
  RS,
  MT extends MethodTree<RS, Record<Key, (...args: any[]) => any>>,
  AT extends ActionTree<Record<Key, (...args: any[]) => any>>
> = [
  useMethodsContext: () => MethodsContextValue<RS, MT, AT>,
  MethodsProvider: React.FC<{
    initialValue?: S | undefined
  }>,
  connect: <P>(WrapperComponent: React.ElementType<P>) => <
    M = {
      state: RS
      methods: WrappedMethods<MT, AT>
    }
  >(
    mapper?: ((state: RS, methods: WrappedMethods<MT, AT>) => M) | undefined
  ) => React.FC<Omit<P, keyof M>>,
  withProvider: <P>(
    WrapperComponent: React.ElementType<P>,
    options?:
      | {
          initialValue?: S | undefined
        }
      | undefined
  ) => React.FC<P>,
  context: React.Context<MethodsContextValue<RS, MT, AT> | null>
]

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
  >
>(
  createMethods: CM,
  defaultInitialValue: S,
  customUseMethods?: UM
): CreateMethodsContextReturn<S, RS, MT, AT>
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
  >
>(
  createMethods: CM,
  defaultInitialValue: S,
  useMethodsOptions?: UseMethodsOptions<RS, AnyAction, L>,
  customUseMethods?: UM
): CreateMethodsContextReturn<S, RS, MT, AT>
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
  >
>(
  createMethods: CM,
  defaultInitialValue: S,
  useMethodsOptions?: UseMethodsOptions<RS, AnyAction, L> | UM,
  customUseMethods?: UM
): CreateMethodsContextReturn<S, RS, MT, AT> {
  const useMethodsHook =
    typeof useMethodsOptions === 'function'
      ? useMethodsOptions
      : customUseMethods || (useMethods as UM)
  const useMethodsHookOptions =
    typeof useMethodsOptions === 'function' ? undefined : useMethodsOptions

  const context = createContext<MethodsContextValue<RS, MT, AT> | null>(null)
  const providerFactory = (
    props: React.ProviderProps<MethodsContextValue<RS, MT, AT>>,
    children: Parameters<typeof createElement>[2]
  ) => createElement(context.Provider, props, children)

  const MethodsProvider: React.FC<{ initialValue?: S }> = ({
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

  const withProvider = <P>(
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
  const connect = <P>(WrapperComponent: React.ElementType<P>) => {
    return function <
      M = {
        state: RS
        methods: WrappedMethods<MT, AT>
      }
    >(mapper?: (state: RS, methods: WrappedMethods<MT, AT>) => M) {
      return function ContextWrapper(props) {
        const [state, methods] = useMethodsContext()
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

  function useMethodsContext() {
    const stateAndMethods = useContext(context)
    if (stateAndMethods === null) {
      throw new Error(
        `useMethodsContext must be used inside a MethodsProvider.`
      )
    }
    return stateAndMethods
  }
  return [useMethodsContext, MethodsProvider, connect, withProvider, context]
}

export type { MethodsContextValue }
export { createMethodsContext }
export default createMethodsContext
