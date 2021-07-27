import React, { createContext, createElement, useContext, useMemo } from 'react'
import useMethods, {
  CreateMethods,
  WrappedMethods,
  MethodTree
} from './useMethods'
import { Key } from '../type'

type MethodsContextValue<
  S,
  MT extends MethodTree<S, Record<Key, (...args: any[]) => any>>
> = [S, WrappedMethods<MT>]

const createMethodsContext = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  S extends Record<Key, any>,
  CM extends CreateMethods<S>,
  MT extends ReturnType<CM>
>(
  createMethods: CM,
  defaultInitialValue: S,
  customUseMethods?: typeof useMethods
) => {
  const context = createContext<MethodsContextValue<S, MT>>([
    defaultInitialValue,
    {}
  ] as unknown as [S, WrappedMethods<MT>])
  const providerFactory = (
    props: React.ProviderProps<MethodsContextValue<S, MT>>,
    children: Parameters<typeof createElement>[2]
  ) => createElement(context.Provider, props, children)

  const MethodsProvider: React.FC<{ initialValue?: S }> = ({
    children,
    initialValue
  }) => {
    const stateAndMethods = (customUseMethods || useMethods)(
      createMethods,
      initialValue !== undefined ? initialValue : defaultInitialValue
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
      return React.createElement(
        MethodsProvider,
        options,
        React.createElement(WrapperComponent, props)
      )
    } as React.FC<P>
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

  return [useMethodsContext, MethodsProvider, withProvider, context] as const
}

export type { MethodsContextValue }
export { createMethodsContext }
export default createMethodsContext
