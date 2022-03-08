import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { act, renderHook } from '@testing-library/react-hooks'
import createMethodsContext from '../../packages/hooks/createMethodsContext'

describe('hook factory createMethodsContext', () => {
  interface State {
    sharedNumber: number
  }

  let initialState: State = {
    sharedNumber: 0,
  }

  beforeEach(() => {
    initialState = {
      sharedNumber: 0,
    }
  })

  const setUpContext = () => {
    return createMethodsContext(
      (state) => ({
        increment() {
          return { ...state, sharedNumber: state.sharedNumber + 1 }
        },
        decrement() {
          return { ...state, sharedNumber: state.sharedNumber - 1 }
        },
      }),
      initialState
    )
  }
  it('should create a hook , a provider and a provider HOC', () => {
    const [useSharedNumber, SharedNumberProvider, withSharedNumberProvider] =
      setUpContext()
    expect(useSharedNumber).toBeInstanceOf(Function)
    expect(SharedNumberProvider).toBeInstanceOf(Function)
    expect(withSharedNumberProvider).toBeInstanceOf(Function)
  })

  describe('when using created hook', () => {
    it('should throw out of a provider', () => {
      const [useSharedNumber] = setUpContext()
      const { result } = renderHook(() => useSharedNumber())
      expect(result.error).toEqual(
        new Error('useMethodsContext must be used inside a MethodsProvider.')
      )
    })

    const setUp = () => {
      const [useSharedNumber, SharedNumberProvider] = createMethodsContext(
        (state) => ({
          increment() {
            return { ...state, sharedNumber: state.sharedNumber + 1 }
          },
          decrement() {
            return { ...state, sharedNumber: state.sharedNumber - 1 }
          },
        }),
        initialState
      )
      const wrapper: React.FC = ({ children }) => (
        <SharedNumberProvider>{children}</SharedNumberProvider>
      )
      return renderHook(() => useSharedNumber(), { wrapper })
    }

    it('should init state and updater when use provider', () => {
      const { result } = setUp()
      const [{ sharedNumber }, sharedNumberMethods] = result.current

      expect(sharedNumber).toEqual(0)
      expect(sharedNumberMethods).toHaveProperty('increment')
      expect(sharedNumberMethods).toHaveProperty('decrement')
    })

    it('should init state and updater when use provider hoc', () => {
      const [useSharedNumber, , , withSharedNumberProvider] = setUpContext()
      const { result } = renderHook(() => useSharedNumber(), {
        wrapper: withSharedNumberProvider(
          ({ children }) => <div>{children}</div>,
          {
            initialValue: {
              sharedNumber: 10,
            },
          }
        ),
      })
      const [{ sharedNumber }, sharedNumberMethods] = result.current

      expect(sharedNumber).toEqual(10)
      expect(sharedNumberMethods).toHaveProperty('increment')
      expect(sharedNumberMethods).toHaveProperty('decrement')
    })

    it('should update the state', () => {
      const { result } = setUp()
      const [, sharedNumberMethods] = result.current

      act(() => {
        sharedNumberMethods.increment()
      })

      const [{ sharedNumber }] = result.current

      expect(sharedNumber).toEqual(1)
    })
  })

  describe('when using among multiple components', () => {
    const [useSharedNumber, SharedNumberProvider, connect] = setUpContext()

    const DisplayComponent = () => {
      const [{ sharedNumber }] = useSharedNumber()
      return <p>{sharedNumber}</p>
    }

    const UpdateComponent = () => {
      const [, sharedNumberMethods] = useSharedNumber()
      return (
        <button type="button" onClick={() => sharedNumberMethods.increment()}>
          INCREMENT
        </button>
      )
    }

    it('should be in sync when under the same provider', () => {
      const { baseElement, getByText } = render(
        <SharedNumberProvider>
          <DisplayComponent />
          <DisplayComponent />
          <UpdateComponent />
        </SharedNumberProvider>
      )

      expect(baseElement.innerHTML).toBe(
        '<div><p>0</p><p>0</p><button type="button">INCREMENT</button></div>'
      )

      fireEvent.click(getByText('INCREMENT'))

      expect(baseElement.innerHTML).toBe(
        '<div><p>1</p><p>1</p><button type="button">INCREMENT</button></div>'
      )
    })

    it('should be in update independently when under different providers', () => {
      const { baseElement, getByText } = render(
        <>
          <SharedNumberProvider>
            <DisplayComponent />
          </SharedNumberProvider>
          <SharedNumberProvider>
            <DisplayComponent />
            <UpdateComponent />
          </SharedNumberProvider>
        </>
      )

      expect(baseElement.innerHTML).toBe(
        '<div><p>0</p><p>0</p><button type="button">INCREMENT</button></div>'
      )

      fireEvent.click(getByText('INCREMENT'))

      expect(baseElement.innerHTML).toBe(
        '<div><p>0</p><p>1</p><button type="button">INCREMENT</button></div>'
      )
    })

    it('should inject state and methods when use connect', () => {
      type SharedNumberState = ReturnType<typeof useSharedNumber>[0]
      type SharedNumberMethods = ReturnType<typeof useSharedNumber>[1]
      interface InjectDisplayComponentProps {
        state: SharedNumberState
        methods: SharedNumberMethods
      }
      const InjectDisplayComponent = connect(
        ({ state }: InjectDisplayComponentProps) => {
          return <p>{state.sharedNumber}</p>
        }
      )()

      interface InjectUpdateComponentProps {
        increment: SharedNumberMethods['increment']
      }
      const InjectUpdateComponent = connect(
        ({ increment }: InjectUpdateComponentProps) => {
          return (
            <button type="button" onClick={() => increment()}>
              INCREMENT
            </button>
          )
        }
      )((_, { increment }) => ({ increment }))

      const { baseElement, getByText } = render(
        <>
          <SharedNumberProvider>
            <InjectDisplayComponent />
            <InjectUpdateComponent />
          </SharedNumberProvider>
        </>
      )

      expect(baseElement.innerHTML).toBe(
        '<div><p>0</p><button type="button">INCREMENT</button></div>'
      )

      fireEvent.click(getByText('INCREMENT'))

      expect(baseElement.innerHTML).toBe(
        '<div><p>1</p><button type="button">INCREMENT</button></div>'
      )
    })

    it('should not update component that do not use the state context', () => {
      let renderCount = 0
      const StaticComponent = () => {
        renderCount++
        return <p>static</p>
      }

      const { baseElement, getByText } = render(
        <>
          <SharedNumberProvider>
            <StaticComponent />
            <DisplayComponent />
            <UpdateComponent />
          </SharedNumberProvider>
        </>
      )

      expect(baseElement.innerHTML).toBe(
        '<div><p>static</p><p>0</p><button type="button">INCREMENT</button></div>'
      )

      fireEvent.click(getByText('INCREMENT'))

      expect(baseElement.innerHTML).toBe(
        '<div><p>static</p><p>1</p><button type="button">INCREMENT</button></div>'
      )

      expect(renderCount).toBe(1)
    })

    it('should override initialValue', () => {
      const { baseElement } = render(
        <>
          <SharedNumberProvider>
            <DisplayComponent />
          </SharedNumberProvider>
          <SharedNumberProvider initialValue={{ sharedNumber: 15 }}>
            <DisplayComponent />
          </SharedNumberProvider>
        </>
      )

      expect(baseElement.innerHTML).toBe('<div><p>0</p><p>15</p></div>')
    })
  })
})
