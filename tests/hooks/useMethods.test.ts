import { renderHook, act } from '@testing-library/react-hooks'
import useMethods from '../../packages/hooks/useMethods'

interface State {
  count: number
}
let initialState: State = {
  count: 10,
}

beforeEach(() => {
  initialState = {
    count: 10,
  }
  jest.useFakeTimers()
})

describe('hooks useMethods', () => {
  it('should have initialState value as the returned state value', () => {
    const createMethods = (state: State) => ({
      doStuff: () => state,
    })

    const { result } = renderHook(() => useMethods(createMethods, initialState))

    expect(result.current[0]).toEqual(initialState)
  })

  it('should return wrappedMethods object containing all the methods defined in createMethods', () => {
    const createMethods = (state: State) => ({
      reset() {
        return initialState
      },
      increment() {
        return { ...state, count: state.count + 1 }
      },
      decrement() {
        return { ...state, count: state.count - 1 }
      },
    })

    const { result } = renderHook(() => useMethods(createMethods, initialState))
    const keys = Object.keys(createMethods(initialState))
    for (const key of keys) {
      expect(result.current[1][key]).toBeDefined()
    }
  })

  it('should properly update the state based on the createMethods', async () => {
    const count = 10

    const { result } = renderHook(() =>
      useMethods(
        (state) => ({
          methods: {
            reset() {
              return initialState
            },
            decrement() {
              return { ...state, count: state.count - 1 }
            },
            increment() {
              return { ...state, count: state.count + 1 }
            },
          },
          actions: {
            midReset() {
              return async ({ dispatch }) => {
                setTimeout(() => {
                  dispatch({
                    type: 'reset',
                  })
                }, 1000)
              }
            },
          },
        }),
        initialState
      )
    )

    await act(async () => {
      result.current[1].increment()
    })

    expect(result.current[0].count).toBe(count + 1)

    act(() => {
      result.current[1].decrement()
    })
    expect(result.current[0].count).toBe(count)

    act(() => {
      result.current[1].decrement()
    })
    expect(result.current[0].count).toBe(count - 1)

    act(() => {
      result.current[1].reset()
    })
    expect(result.current[0].count).toBe(count)

    act(() => {
      result.current[1].increment()
    })

    await act(async () => {
      result.current[1].midReset()
    })

    act(() => {
      jest.runAllTimers()
    })

    expect(result.current[0].count).toBe(count)
  })

  it('should return loading state when set enableLoading true', async () => {
    const { result } = renderHook(() =>
      useMethods(
        (state) => ({
          methods: {
            reset() {
              return { ...state, ...initialState }
            },
            decrement() {
              return { ...state, count: state.count - 1 }
            },
            increment() {
              return { ...state, count: state.count + 1 }
            },
          },
          actions: {
            midReset() {
              return async ({ dispatch }) => {
                setTimeout(() => {
                  dispatch({
                    type: 'reset',
                  })
                }, 1000)
              }
            },
          },
        }),
        initialState,
        {
          enableLoading: true,
        }
      )
    )

    expect(result.current[0].actionLoading).toEqual({
      midReset: false,
    })
  })

  it('should properly update the loading state based on the createMethods', async () => {
    await act(async () => {
      function wait(ms: number) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms)
        })
      }
      const { result } = renderHook(() =>
        useMethods(
          (state) => ({
            methods: {
              reset() {
                return { ...state, ...initialState }
              },
              decrement() {
                return { ...state, count: state.count - 1 }
              },
              increment() {
                return { ...state, count: state.count + 1 }
              },
            },
            actions: {
              midReset() {
                return async ({ dispatch }) => {
                  await wait(200)
                  setTimeout(() => {
                    dispatch({
                      type: 'reset',
                    })
                  }, 1000)
                }
              },
            },
          }),
          initialState,
          {
            enableLoading: true,
          }
        )
      )

      expect(result.current[0].actionLoading).toEqual({
        midReset: false,
      })
      let res: any
      await act(async () => {
        res = result.current[1].midReset()
      })

      expect(result.current[0].actionLoading).toEqual({
        midReset: true,
      })

      act(() => {
        jest.runAllTimers()
      })
      await res
      expect(result.current[0].actionLoading).toEqual({
        midReset: false,
      })
    })
  })

  it('should have effects for value changed', async () => {
    const count = 10
    const { result } = renderHook(() =>
      useMethods(
        (state) => ({
          methods: {
            reset() {
              return initialState
            },
            increment() {
              return { ...state, count: state.count + 1 }
            },
            decrement() {
              return { ...state, count: state.count - 1 }
            },
          },
          effects: {
            count(dispatch, newValue) {
              if (newValue > 10) {
                dispatch({
                  type: 'reset',
                })
              }
            },
          },
        }),
        initialState
      )
    )

    act(() => {
      result.current[1].increment()
    })
    expect(result.current[0].count).toBe(count)

    act(() => {
      result.current[1].decrement()
    })
    expect(result.current[0].count).toBe(count - 1)

    act(() => {
      result.current[1].decrement()
    })
    expect(result.current[0].count).toBe(count - 2)

    act(() => {
      result.current[1].increment()
    })
    expect(result.current[0].count).toBe(count - 1)
  })
})
