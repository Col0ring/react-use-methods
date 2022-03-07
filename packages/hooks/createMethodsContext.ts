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
import { AnyAction, If, Key } from '../type'

type MethodsContextValue<
  S,
  MT extends MethodTree<S, Record<Key, (...args: any[]) => any>>,
  AT extends ActionTree<Record<Key, (...args: any[]) => any>>
> = [S, WrappedMethods<MT, AT>]

const createMethodsContext = <
  S extends Record<Key, any>,
  CM extends CreateMethods<
    If<
      L,
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
  RS extends If<
    L,
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
  customUseMethods?: typeof useMethods
) => {
  const context = createContext<MethodsContextValue<RS, MT, AT> | null>(null)
  const providerFactory = (
    props: React.ProviderProps<MethodsContextValue<RS, MT, AT>>,
    children: Parameters<typeof createElement>[2]
  ) => createElement(context.Provider, props, children)

  const MethodsProvider: React.FC<{ initialValue?: S }> = ({
    children,
    initialValue,
  }) => {
    const stateAndMethods = (customUseMethods || useMethods)(
      createMethods,
      initialValue !== undefined ? initialValue : defaultInitialValue,
      useMethodsOptions
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

  return [
    useMethodsContext,
    MethodsProvider,
    connect,
    withProvider,
    context,
  ] as const
}

export type { MethodsContextValue }
export { createMethodsContext }
export default createMethodsContext
